/**
 * Safety Score Calculation Module
 *
 * This module implements the core safety scoring algorithm for driver monitoring.
 * It processes 1Hz telemetry data and computes a deterministic safety score (0-100).
 */

import type { DistractionReason, TelemetryEvent } from '../types';

// ============================================
// Constants
// ============================================

/**
 * Severity weights for different distraction types.
 * Higher weights indicate more dangerous distractions.
 */
export const SEVERITY_WEIGHTS: Record<DistractionReason, number> = {
  PHONE: 3.5,        // Phone use is highly dangerous
  DROWSY: 4.0,       // Drowsiness indicates impaired reaction time
  EYES_CLOSED: 4.5,  // Eyes closed is extremely dangerous
  HEAD_DOWN: 2.5,    // Looking down reduces situational awareness
  LOOKING_AWAY: 2.0, // Looking away is less severe but still risky
  OTHER: 1.5,        // Unknown distractions get moderate weight
  NONE: 1.0,         // Base weight for generic distraction
};

// ============================================
// Type Definitions
// ============================================

/**
 * Aggregated metrics for a driving session used in score calculation.
 */
export interface SessionMetrics {
  /** Total session duration in seconds (T) */
  totalSeconds: number;
  /** Total distracted time in seconds (D) */
  distractedSeconds: number;
  /** Total attentive time in seconds (A) */
  attentiveSeconds: number;
  /** Number of distinct distraction events (E) */
  eventsCount: number;
  /** Weighted distracted time: sum of (weight * confidence) for each distracted tick (WD) */
  weightedDistracted: number;
  /** Phone-related distraction seconds (R_phone) */
  phoneSeconds: number;
  /** Drowsiness-related seconds: DROWSY + EYES_CLOSED (R_drowsy) */
  drowsySeconds: number;
  /** Head position-related seconds: HEAD_DOWN + LOOKING_AWAY (R_head) */
  headDownSeconds: number;
  /** Detailed breakdown of seconds per distraction reason */
  reasonBreakdown: Record<DistractionReason, number>;
}

/**
 * Telemetry tick type matching the 1Hz data from the ML model.
 */
export interface TelemetryTick {
  timestamp: string;
  state: 'ATTENTIVE' | 'DISTRACTED';
  reason: DistractionReason;
  confidence: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Clamps a value between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Creates an empty reason breakdown object initialized to zero.
 */
function createEmptyReasonBreakdown(): Record<DistractionReason, number> {
  return {
    PHONE: 0,
    EYES_CLOSED: 0,
    DROWSY: 0,
    HEAD_DOWN: 0,
    LOOKING_AWAY: 0,
    OTHER: 0,
    NONE: 0,
  };
}

// ============================================
// Metrics Computation
// ============================================

/**
 * Computes session metrics from an array of telemetry ticks.
 * Each tick represents 1 second of data (1Hz sampling rate).
 *
 * @param ticks - Array of telemetry data points
 * @param eventsCount - Number of distinct distraction events (from segmentation)
 * @returns Computed session metrics for score calculation
 */
export function computeSessionMetrics(
  ticks: TelemetryTick[],
  eventsCount: number
): SessionMetrics {
  const metrics: SessionMetrics = {
    totalSeconds: ticks.length,
    distractedSeconds: 0,
    attentiveSeconds: 0,
    eventsCount,
    weightedDistracted: 0,
    phoneSeconds: 0,
    drowsySeconds: 0,
    headDownSeconds: 0,
    reasonBreakdown: createEmptyReasonBreakdown(),
  };

  for (const tick of ticks) {
    if (tick.state === 'DISTRACTED') {
      metrics.distractedSeconds++;

      // Compute weighted distraction: severity weight * confidence
      const weight = SEVERITY_WEIGHTS[tick.reason] ?? SEVERITY_WEIGHTS.OTHER;
      metrics.weightedDistracted += weight * tick.confidence;

      // Track reason-specific seconds
      metrics.reasonBreakdown[tick.reason]++;

      // Aggregate into category buckets
      if (tick.reason === 'PHONE') {
        metrics.phoneSeconds++;
      } else if (tick.reason === 'DROWSY' || tick.reason === 'EYES_CLOSED') {
        metrics.drowsySeconds++;
      } else if (tick.reason === 'HEAD_DOWN' || tick.reason === 'LOOKING_AWAY') {
        metrics.headDownSeconds++;
      }
    } else {
      metrics.attentiveSeconds++;
    }
  }

  return metrics;
}

// ============================================
// Score Calculation
// ============================================

/**
 * Calculates the safety score from session metrics.
 *
 * The score is computed using four penalty components:
 * 1. Risk Rate Penalty (45 pts max) - Based on weighted distraction rate
 * 2. Event Frequency Penalty (25 pts max) - Based on events per minute
 * 3. Phone Penalty (15 pts max) - Specific penalty for phone use
 * 4. Drowsiness Penalty (20 pts max) - Specific penalty for drowsiness/eyes closed
 *
 * Final score = 100 - (penalty1 + penalty2 + penalty3 + penalty4)
 *
 * @param metrics - Computed session metrics
 * @returns Safety score from 0 (worst) to 100 (perfect)
 */
export function calculateSafetyScore(metrics: SessionMetrics): number {
  const { totalSeconds, eventsCount, weightedDistracted, phoneSeconds, drowsySeconds } = metrics;

  // Prevent division by zero - use at least 1 second
  const T = Math.max(totalSeconds, 1);

  // Normalized risk rate: weighted distraction per second
  // Higher risk rate means more severe/frequent distractions
  const riskRate = weightedDistracted / T;

  // Event frequency: events per minute
  // More frequent events indicate less sustained attention
  const eventRate = eventsCount / Math.max(T / 60, 0.0001);

  // Penalty 1: Risk rate penalty (0-45 points)
  // Reaches max at riskRate of 2.0 (e.g., continuous severe distraction)
  const penalty1 = 45 * clamp(riskRate / 2.0, 0, 1);

  // Penalty 2: Event frequency penalty (0-25 points)
  // Reaches max at 4 events per minute
  const penalty2 = 25 * clamp(eventRate / 4.0, 0, 1);

  // Penalty 3: Phone-specific penalty (0-15 points)
  // Reaches max when phone use is 15% of total time
  const phoneRate = phoneSeconds / T;
  const penalty3 = 15 * clamp(phoneRate / 0.15, 0, 1);

  // Penalty 4: Drowsiness penalty (0-20 points)
  // Reaches max when drowsiness is 8% of total time
  const drowsyRate = drowsySeconds / T;
  const penalty4 = 20 * clamp(drowsyRate / 0.08, 0, 1);

  // Calculate final score
  const rawScore = 100 - (penalty1 + penalty2 + penalty3 + penalty4);

  // Round and clamp to valid range
  return Math.round(clamp(rawScore, 0, 100));
}

/**
 * Convenience function to calculate score directly from telemetry ticks.
 * This handles both metrics computation and score calculation.
 *
 * @param ticks - Array of telemetry data points
 * @param eventsCount - Number of distinct distraction events
 * @returns Safety score from 0 to 100
 */
export function calculateScoreFromTicks(
  ticks: TelemetryTick[],
  eventsCount: number
): number {
  const metrics = computeSessionMetrics(ticks, eventsCount);
  return calculateSafetyScore(metrics);
}

// ============================================
// Real-time Score Smoothing
// ============================================

/**
 * Exponential Moving Average (EMA) smoother for real-time score display.
 *
 * This class provides smooth score transitions for the UI by applying
 * EMA filtering to raw score updates. This prevents jarring score jumps
 * while still responding to significant changes.
 *
 * The smoothing formula: smoothed = α * raw + (1 - α) * previous
 * where α (ALPHA) controls responsiveness (higher = more responsive)
 */
export class ScoreSmoothing {
  /** Smoothing factor: 0.15 provides good balance between responsiveness and stability */
  private readonly ALPHA = 0.15;

  /** Current smoothed score value */
  private smoothedScore = 100;

  /**
   * Updates the smoothed score with a new raw score value.
   *
   * @param rawScore - The new raw score to incorporate
   * @returns The updated smoothed score
   */
  update(rawScore: number): number {
    this.smoothedScore = Math.round(
      this.ALPHA * rawScore + (1 - this.ALPHA) * this.smoothedScore
    );
    return this.smoothedScore;
  }

  /**
   * Gets the current smoothed score without updating.
   */
  get current(): number {
    return this.smoothedScore;
  }

  /**
   * Resets the smoothed score to the initial value (100).
   * Call this when starting a new session.
   */
  reset(): void {
    this.smoothedScore = 100;
  }

  /**
   * Sets the smoothed score to a specific value.
   * Useful for initializing with a known starting score.
   *
   * @param score - The score to set
   */
  set(score: number): void {
    this.smoothedScore = Math.round(clamp(score, 0, 100));
  }
}
