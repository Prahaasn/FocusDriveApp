/**
 * Score Calculation Cloud Function
 * Calculates safety scores for completed driving sessions
 *
 * This function:
 * 1. Fetches all telemetry events for a session
 * 2. Segments distraction events
 * 3. Calculates the final safety score
 * 4. Updates the session in Supabase
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface TelemetryEvent {
  id: string;
  session_id: string;
  timestamp: string;
  state: 'ATTENTIVE' | 'DISTRACTED';
  reason: string;
  confidence: number;
}

interface DistractionEvent {
  startTime: string;
  endTime: string;
  durationSeconds: number;
  dominantReason: string;
  averageConfidence: number;
}

interface ScoreResult {
  finalScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  distractedSeconds: number;
  attentiveSeconds: number;
  distractionEventsCount: number;
  distractionsPerMinute: number;
  reasonBreakdown: Record<string, number>;
}

// Scoring weights
const SCORE_WEIGHTS = {
  PHONE: 15,        // Highest penalty - phone use while driving
  EYES_CLOSED: 12,  // Very dangerous - drowsy driving
  DROWSY: 10,       // High penalty - drowsiness
  HEAD_DOWN: 8,     // Medium-high penalty
  LOOKING_AWAY: 5,  // Medium penalty
  OTHER: 3,         // Base penalty
};

/**
 * Segment continuous distraction events from telemetry
 */
function segmentDistractionEvents(telemetry: TelemetryEvent[]): DistractionEvent[] {
  if (telemetry.length === 0) return [];

  const events: DistractionEvent[] = [];
  let currentEvent: {
    startTime: string;
    reasons: string[];
    confidences: number[];
  } | null = null;

  // Sort by timestamp
  const sorted = [...telemetry].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];

    if (item.state === 'DISTRACTED') {
      if (!currentEvent) {
        // Start new distraction event
        currentEvent = {
          startTime: item.timestamp,
          reasons: [item.reason],
          confidences: [item.confidence],
        };
      } else {
        // Continue current event
        currentEvent.reasons.push(item.reason);
        currentEvent.confidences.push(item.confidence);
      }
    } else if (currentEvent) {
      // End current distraction event
      const endTime = item.timestamp;
      const startMs = new Date(currentEvent.startTime).getTime();
      const endMs = new Date(endTime).getTime();
      const durationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

      // Find dominant reason
      const reasonCounts: Record<string, number> = {};
      currentEvent.reasons.forEach((r) => {
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      });
      const dominantReason = Object.entries(reasonCounts).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      // Calculate average confidence
      const avgConfidence =
        currentEvent.confidences.reduce((a, b) => a + b, 0) /
        currentEvent.confidences.length;

      events.push({
        startTime: currentEvent.startTime,
        endTime,
        durationSeconds,
        dominantReason,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
      });

      currentEvent = null;
    }
  }

  // Handle case where session ends while distracted
  if (currentEvent && sorted.length > 0) {
    const lastItem = sorted[sorted.length - 1];
    const startMs = new Date(currentEvent.startTime).getTime();
    const endMs = new Date(lastItem.timestamp).getTime();
    const durationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

    const reasonCounts: Record<string, number> = {};
    currentEvent.reasons.forEach((r) => {
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    });
    const dominantReason = Object.entries(reasonCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    const avgConfidence =
      currentEvent.confidences.reduce((a, b) => a + b, 0) /
      currentEvent.confidences.length;

    events.push({
      startTime: currentEvent.startTime,
      endTime: lastItem.timestamp,
      durationSeconds,
      dominantReason,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
    });
  }

  return events;
}

/**
 * Calculate safety score from telemetry data
 */
function calculateSafetyScore(
  telemetry: TelemetryEvent[],
  durationSeconds: number
): ScoreResult {
  if (telemetry.length === 0 || durationSeconds === 0) {
    return {
      finalScore: 100,
      riskLevel: 'low',
      distractedSeconds: 0,
      attentiveSeconds: durationSeconds,
      distractionEventsCount: 0,
      distractionsPerMinute: 0,
      reasonBreakdown: {},
    };
  }

  // Count states and reasons
  let distractedCount = 0;
  let attentiveCount = 0;
  const reasonBreakdown: Record<string, number> = {};

  telemetry.forEach((event) => {
    if (event.state === 'DISTRACTED') {
      distractedCount++;
      reasonBreakdown[event.reason] = (reasonBreakdown[event.reason] || 0) + 1;
    } else {
      attentiveCount++;
    }
  });

  // Estimate seconds based on event count (assuming 1 event per second)
  const distractedSeconds = distractedCount;
  const attentiveSeconds = attentiveCount;

  // Segment distraction events
  const distractionEvents = segmentDistractionEvents(telemetry);

  // Calculate base score (percentage of time attentive)
  const totalTime = distractedSeconds + attentiveSeconds;
  const attentiveRatio = totalTime > 0 ? attentiveSeconds / totalTime : 1;
  let baseScore = Math.round(attentiveRatio * 100);

  // Apply weighted penalties for each reason
  Object.entries(reasonBreakdown).forEach(([reason, count]) => {
    const weight = SCORE_WEIGHTS[reason as keyof typeof SCORE_WEIGHTS] || 3;
    const penalty = Math.min(count * weight * 0.1, 30); // Cap penalty at 30 points per reason
    baseScore -= penalty;
  });

  // Apply frequency penalty (more frequent distractions are worse)
  const durationMinutes = durationSeconds / 60;
  const distractionsPerMinute =
    durationMinutes > 0 ? distractionEvents.length / durationMinutes : 0;

  if (distractionsPerMinute > 2) {
    baseScore -= 10; // High frequency penalty
  } else if (distractionsPerMinute > 1) {
    baseScore -= 5; // Medium frequency penalty
  }

  // Ensure score is between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (finalScore >= 80) {
    riskLevel = 'low';
  } else if (finalScore >= 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    finalScore,
    riskLevel,
    distractedSeconds,
    attentiveSeconds,
    distractionEventsCount: distractionEvents.length,
    distractionsPerMinute: Math.round(distractionsPerMinute * 100) / 100,
    reasonBreakdown,
  };
}

/**
 * HTTP endpoint to calculate session score
 */
export const calculateSessionScore = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to calculate scores'
    );
  }

  const { session_id } = data;

  if (!session_id) {
    throw new functions.https.HttpsError('invalid-argument', 'session_id is required');
  }

  try {
    // Fetch session to verify ownership and get duration
    const { data: session, error: sessionError } = await supabase
      .from('driving_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    // Verify the user owns this session
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', context.auth.uid)
      .single();

    if (!user || session.user_id !== user.id) {
      throw new functions.https.HttpsError('permission-denied', 'Not your session');
    }

    // Fetch all telemetry for this session
    const { data: telemetry, error: telemetryError } = await supabase
      .from('telemetry_events')
      .select('*')
      .eq('session_id', session_id)
      .order('timestamp', { ascending: true });

    if (telemetryError) {
      throw telemetryError;
    }

    if (!telemetry || telemetry.length === 0) {
      throw new functions.https.HttpsError('not-found', 'No telemetry data found');
    }

    // Calculate score
    const durationSeconds = session.duration_seconds || 0;
    const scoreResult = calculateSafetyScore(telemetry, durationSeconds);

    // Segment and save distraction events
    const distractionEvents = segmentDistractionEvents(telemetry);

    if (distractionEvents.length > 0) {
      const eventsToInsert = distractionEvents.map((e) => ({
        session_id,
        start_time: e.startTime,
        end_time: e.endTime,
        duration_seconds: e.durationSeconds,
        dominant_reason: e.dominantReason,
        average_confidence: e.averageConfidence,
      }));

      await supabase.from('distraction_events').insert(eventsToInsert);
    }

    // Update session with calculated score
    const { error: updateError } = await supabase
      .from('driving_sessions')
      .update({
        safety_score: scoreResult.finalScore,
        risk_level: scoreResult.riskLevel,
        total_distracted_seconds: scoreResult.distractedSeconds,
        total_attentive_seconds: scoreResult.attentiveSeconds,
        distraction_events_count: scoreResult.distractionEventsCount,
        distractions_per_minute: scoreResult.distractionsPerMinute,
        reason_breakdown: scoreResult.reasonBreakdown,
      })
      .eq('id', session_id);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      score: scoreResult.finalScore,
      riskLevel: scoreResult.riskLevel,
    };
  } catch (error) {
    console.error('Score calculation error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Score calculation failed');
  }
});

/**
 * HTTP trigger endpoint for external calls
 */
export const calculateScoreHttp = functions.https.onRequest(async (req, res) => {
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

  const { sessionId } = req.body;

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  try {
    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('driving_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Fetch telemetry
    const { data: telemetry } = await supabase
      .from('telemetry_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (!telemetry || telemetry.length === 0) {
      res.status(404).json({ error: 'No telemetry data' });
      return;
    }

    // Calculate score
    const durationSeconds = session.duration_seconds || 0;
    const scoreResult = calculateSafetyScore(telemetry, durationSeconds);

    // Segment and save distraction events
    const distractionEvents = segmentDistractionEvents(telemetry);

    if (distractionEvents.length > 0) {
      const eventsToInsert = distractionEvents.map((e) => ({
        session_id: sessionId,
        start_time: e.startTime,
        end_time: e.endTime,
        duration_seconds: e.durationSeconds,
        dominant_reason: e.dominantReason,
        average_confidence: e.averageConfidence,
      }));

      await supabase.from('distraction_events').insert(eventsToInsert);
    }

    // Update session
    await supabase
      .from('driving_sessions')
      .update({
        safety_score: scoreResult.finalScore,
        risk_level: scoreResult.riskLevel,
        total_distracted_seconds: scoreResult.distractedSeconds,
        total_attentive_seconds: scoreResult.attentiveSeconds,
        distraction_events_count: scoreResult.distractionEventsCount,
        distractions_per_minute: scoreResult.distractionsPerMinute,
        reason_breakdown: scoreResult.reasonBreakdown,
      })
      .eq('id', sessionId);

    res.status(200).json({
      success: true,
      score: scoreResult.finalScore,
      riskLevel: scoreResult.riskLevel,
    });
  } catch (error) {
    console.error('Score calculation error:', error);
    res.status(500).json({ error: 'Score calculation failed' });
  }
});
