/**
 * Telemetry Ingestion Cloud Function
 * Receives telemetry data from Raspberry Pi devices and processes it
 *
 * This function:
 * 1. Validates device API key
 * 2. Inserts telemetry into Supabase
 * 3. Updates Firebase Realtime DB for live updates
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Supabase client (use service role key for backend)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Firebase Realtime Database
const database = admin.database();

// Types
interface TelemetryPayload {
  device_id: string;
  session_id: string;
  timestamp: string;
  state: 'ATTENTIVE' | 'DISTRACTED';
  reason: string;
  confidence: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface BatchTelemetryPayload {
  device_id: string;
  session_id: string;
  events: Array<{
    timestamp: string;
    state: 'ATTENTIVE' | 'DISTRACTED';
    reason: string;
    confidence: number;
  }>;
}

/**
 * Validate device API key
 */
async function validateDeviceKey(
  apiKey: string | undefined,
  deviceId: string
): Promise<boolean> {
  if (!apiKey) return false;

  try {
    // Hash the API key for comparison
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data, error } = await supabase
      .from('devices')
      .select('id, is_active')
      .eq('device_id', deviceId)
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (error || !data) return false;

    return data.is_active === true;
  } catch {
    return false;
  }
}

/**
 * Update live session data in Firebase Realtime DB
 */
async function updateLiveSession(
  sessionId: string,
  state: 'ATTENTIVE' | 'DISTRACTED',
  reason: string
): Promise<void> {
  const sessionRef = database.ref(`sessions/${sessionId}`);
  const currentData = (await sessionRef.once('value')).val() || {};

  const isDistracted = state === 'DISTRACTED';
  const now = new Date().toISOString();

  const updatedData = {
    ...currentData,
    lastUpdate: now,
    currentState: state,
    currentReason: reason,
    distractedSeconds: isDistracted
      ? (currentData.distractedSeconds || 0) + 1
      : currentData.distractedSeconds || 0,
    attentiveSeconds: !isDistracted
      ? (currentData.attentiveSeconds || 0) + 1
      : currentData.attentiveSeconds || 0,
    eventsCount: isDistracted
      ? (currentData.eventsCount || 0) + 1
      : currentData.eventsCount || 0,
  };

  // Calculate running score (simplified)
  const totalSeconds = updatedData.distractedSeconds + updatedData.attentiveSeconds;
  if (totalSeconds > 0) {
    const attentiveRatio = updatedData.attentiveSeconds / totalSeconds;
    updatedData.currentScore = Math.round(attentiveRatio * 100);
  }

  await sessionRef.update(updatedData);
}

/**
 * Single telemetry event ingestion endpoint
 */
export const ingestTelemetry = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Device-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = req.headers['x-device-api-key'] as string | undefined;
  const payload: TelemetryPayload = req.body;

  // Validate required fields
  if (!payload.device_id || !payload.session_id || !payload.timestamp || !payload.state) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Validate device API key
  const isValid = await validateDeviceKey(apiKey, payload.device_id);
  if (!isValid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Insert telemetry event into Supabase
    const { error: insertError } = await supabase
      .from('telemetry_events')
      .insert({
        session_id: payload.session_id,
        timestamp: payload.timestamp,
        state: payload.state,
        reason: payload.reason || 'NONE',
        confidence: payload.confidence || 0,
      });

    if (insertError) {
      throw insertError;
    }

    // Update Firebase Realtime DB for live updates
    await updateLiveSession(payload.session_id, payload.state, payload.reason || 'NONE');

    // Update device last seen
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_id', payload.device_id);

    res.status(200).json({
      success: true,
      session_id: payload.session_id,
    });
  } catch (error) {
    console.error('Telemetry ingestion error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Batch telemetry ingestion endpoint
 * More efficient for Raspberry Pi to send multiple events at once
 */
export const ingestTelemetryBatch = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Device-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = req.headers['x-device-api-key'] as string | undefined;
  const payload: BatchTelemetryPayload = req.body;

  // Validate required fields
  if (!payload.device_id || !payload.session_id || !payload.events?.length) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Validate device API key
  const isValid = await validateDeviceKey(apiKey, payload.device_id);
  if (!isValid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Prepare batch insert data
    const telemetryEvents = payload.events.map((event) => ({
      session_id: payload.session_id,
      timestamp: event.timestamp,
      state: event.state,
      reason: event.reason || 'NONE',
      confidence: event.confidence || 0,
    }));

    // Batch insert telemetry events into Supabase
    const { error: insertError } = await supabase
      .from('telemetry_events')
      .insert(telemetryEvents);

    if (insertError) {
      throw insertError;
    }

    // Update Firebase with the latest event
    const latestEvent = payload.events[payload.events.length - 1];
    await updateLiveSession(
      payload.session_id,
      latestEvent.state,
      latestEvent.reason || 'NONE'
    );

    // Update device last seen
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_id', payload.device_id);

    res.status(200).json({
      success: true,
      session_id: payload.session_id,
      processedCount: payload.events.length,
    });
  } catch (error) {
    console.error('Batch telemetry ingestion error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
