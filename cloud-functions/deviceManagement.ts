/**
 * Device Management Cloud Function
 * Handles Raspberry Pi device registration, heartbeats, and commands
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Firebase Realtime Database
const database = admin.database();

// Types
interface DeviceRegistrationPayload {
  deviceId: string;
  vehicleId: string;
  firmwareVersion: string;
}

interface HeartbeatPayload {
  deviceId: string;
  batteryLevel?: number;
  firmwareVersion?: string;
  currentSessionId?: string;
}

interface DeviceCommand {
  command: 'START_SESSION' | 'STOP_SESSION' | 'CALIBRATE' | 'RESTART';
  params?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Generate a secure API key for the device
 */
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash an API key for storage
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Verify Firebase Auth token from request
 */
async function verifyAuthToken(
  authHeader: string | undefined
): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
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
    const apiKeyHash = hashApiKey(apiKey);

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
 * Register a new Raspberry Pi device
 */
export const registerDevice = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Verify user authentication
  const firebaseUid = await verifyAuthToken(req.headers.authorization);
  if (!firebaseUid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const payload: DeviceRegistrationPayload = req.body;

  if (!payload.deviceId || !payload.vehicleId) {
    res.status(400).json({ error: 'deviceId and vehicleId are required' });
    return;
  }

  try {
    // Verify vehicle belongs to user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, user_id')
      .eq('id', payload.vehicleId)
      .single();

    if (!vehicle || vehicle.user_id !== user.id) {
      res.status(403).json({ error: 'Vehicle does not belong to user' });
      return;
    }

    // Check if device already exists
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id')
      .eq('device_id', payload.deviceId)
      .single();

    if (existingDevice) {
      res.status(409).json({ error: 'Device already registered' });
      return;
    }

    // Generate API key
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    // Register device in Supabase
    const { data: device, error: insertError } = await supabase
      .from('devices')
      .insert({
        device_id: payload.deviceId,
        vehicle_id: payload.vehicleId,
        api_key_hash: apiKeyHash,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Update vehicle with device ID
    await supabase
      .from('vehicles')
      .update({ device_id: payload.deviceId })
      .eq('id', payload.vehicleId);

    // Initialize device status in Firebase
    await database.ref(`devices/${payload.deviceId}`).set({
      deviceId: payload.deviceId,
      online: false,
      lastSeen: new Date().toISOString(),
      firmwareVersion: payload.firmwareVersion,
    });

    res.status(201).json({
      success: true,
      deviceId: payload.deviceId,
      apiKey, // Only returned once during registration!
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Device heartbeat endpoint
 */
export const deviceHeartbeat = functions.https.onRequest(async (req, res) => {
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
  const payload: HeartbeatPayload = req.body;

  if (!payload.deviceId) {
    res.status(400).json({ error: 'deviceId is required' });
    return;
  }

  // Validate API key
  const isValid = await validateDeviceKey(apiKey, payload.deviceId);
  if (!isValid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const now = new Date().toISOString();

    // Update device status in Supabase
    await supabase
      .from('devices')
      .update({ last_seen: now })
      .eq('device_id', payload.deviceId);

    // Update device status in Firebase
    const deviceRef = database.ref(`devices/${payload.deviceId}`);
    await deviceRef.update({
      online: true,
      lastSeen: now,
      batteryLevel: payload.batteryLevel,
      firmwareVersion: payload.firmwareVersion,
      currentSessionId: payload.currentSessionId || null,
    });

    // Set offline on disconnect
    await deviceRef.child('online').onDisconnect().set(false);
    await deviceRef.child('lastSeen').onDisconnect().set(admin.database.ServerValue.TIMESTAMP);

    // Check for pending commands
    const commandsRef = database.ref(`device-commands/${payload.deviceId}`);
    const commandsSnapshot = await commandsRef.once('value');
    const pendingCommands: string[] = [];

    if (commandsSnapshot.exists()) {
      const commands = commandsSnapshot.val();
      Object.entries(commands).forEach(([key, command]) => {
        pendingCommands.push(JSON.stringify(command));
      });
      // Clear processed commands
      await commandsRef.remove();
    }

    res.status(200).json({
      success: true,
      serverTime: now,
      commands: pendingCommands,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

/**
 * Send command to device
 */
export const sendDeviceCommand = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Verify user authentication
  const firebaseUid = await verifyAuthToken(req.headers.authorization);
  if (!firebaseUid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { deviceId } = req.params;
  const { command, params } = req.body;

  if (!deviceId || !command) {
    res.status(400).json({ error: 'deviceId and command are required' });
    return;
  }

  // Validate command type
  const validCommands = ['START_SESSION', 'STOP_SESSION', 'CALIBRATE', 'RESTART'];
  if (!validCommands.includes(command)) {
    res.status(400).json({ error: 'Invalid command' });
    return;
  }

  try {
    // Verify user owns the device
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check device ownership through vehicle
    const { data: device } = await supabase
      .from('devices')
      .select('id, vehicle_id')
      .eq('device_id', deviceId)
      .single();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('user_id')
      .eq('id', device.vehicle_id)
      .single();

    if (!vehicle || vehicle.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized for this device' });
      return;
    }

    // Queue command for device
    const commandRef = database.ref(`device-commands/${deviceId}`).push();
    const deviceCommand: DeviceCommand = {
      command,
      params,
      createdAt: new Date().toISOString(),
    };

    await commandRef.set(deviceCommand);

    res.status(200).json({
      success: true,
      commandId: commandRef.key,
    });
  } catch (error) {
    console.error('Send command error:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

/**
 * Get device status
 */
export const getDeviceStatus = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Verify user authentication
  const firebaseUid = await verifyAuthToken(req.headers.authorization);
  if (!firebaseUid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const deviceId = req.path.split('/').pop();

  if (!deviceId) {
    res.status(400).json({ error: 'deviceId is required' });
    return;
  }

  try {
    // Get device status from Firebase
    const deviceRef = database.ref(`devices/${deviceId}`);
    const snapshot = await deviceRef.once('value');

    if (!snapshot.exists()) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const status = snapshot.val();

    res.status(200).json({
      online: status.online || false,
      lastSeen: status.lastSeen,
      batteryLevel: status.batteryLevel,
      firmwareVersion: status.firmwareVersion,
      currentSessionId: status.currentSessionId,
    });
  } catch (error) {
    console.error('Get device status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * Deactivate a device
 */
export const deactivateDevice = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Verify user authentication
  const firebaseUid = await verifyAuthToken(req.headers.authorization);
  if (!firebaseUid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const deviceId = req.path.split('/').pop();

  if (!deviceId) {
    res.status(400).json({ error: 'deviceId is required' });
    return;
  }

  try {
    // Verify ownership
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { data: device } = await supabase
      .from('devices')
      .select('id, vehicle_id')
      .eq('device_id', deviceId)
      .single();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('user_id')
      .eq('id', device.vehicle_id)
      .single();

    if (!vehicle || vehicle.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // Deactivate in Supabase
    await supabase
      .from('devices')
      .update({ is_active: false })
      .eq('device_id', deviceId);

    // Remove from vehicle
    await supabase
      .from('vehicles')
      .update({ device_id: null })
      .eq('id', device.vehicle_id);

    // Remove from Firebase
    await database.ref(`devices/${deviceId}`).remove();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Deactivate device error:', error);
    res.status(500).json({ error: 'Failed to deactivate device' });
  }
});
