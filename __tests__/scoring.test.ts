/**
 * Unit tests for the Safety Score Algorithm
 *
 * Tests cover:
 * - Perfect driving scenarios
 * - Various distraction types and severities
 * - Penalty calculations
 * - Edge cases
 * - Score smoothing
 */

import {
  calculateSafetyScore,
  calculateScoreFromTicks,
  computeSessionMetrics,
  ScoreSmoothing,
  clamp,
  SEVERITY_WEIGHTS,
  TelemetryTick,
  SessionMetrics,
} from '../src/utils/scoring';
import { segmentEvents, countEvents } from '../src/utils/eventSegmentation';
import type { DistractionReason } from '../src/types';

// ============================================
// Test Helpers
// ============================================

/**
 * Creates an array of attentive telemetry ticks.
 */
function createAttentiveTicks(count: number, startTime?: Date): TelemetryTick[] {
  const start = startTime || new Date('2025-01-01T00:00:00Z');
  const ticks: TelemetryTick[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(start.getTime() + i * 1000);
    ticks.push({
      timestamp: timestamp.toISOString(),
      state: 'ATTENTIVE',
      reason: 'NONE',
      confidence: 1.0,
    });
  }

  return ticks;
}

/**
 * Creates an array of distracted telemetry ticks.
 */
function createDistractedTicks(
  count: number,
  reason: DistractionReason,
  confidence: number,
  startTime?: Date
): TelemetryTick[] {
  const start = startTime || new Date('2025-01-01T00:00:00Z');
  const ticks: TelemetryTick[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(start.getTime() + i * 1000);
    ticks.push({
      timestamp: timestamp.toISOString(),
      state: 'DISTRACTED',
      reason,
      confidence,
    });
  }

  return ticks;
}

/**
 * Helper to calculate score directly from ticks for convenience.
 */
function calculateScore(ticks: TelemetryTick[]): number {
  const events = segmentEvents(ticks);
  return calculateScoreFromTicks(ticks, events.length);
}

// ============================================
// Clamp Function Tests
// ============================================

describe('clamp', () => {
  it('should return value when within bounds', () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(0, 0, 100)).toBe(0);
    expect(clamp(100, 0, 100)).toBe(100);
  });

  it('should return min when value is below min', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(-1, 0, 100)).toBe(0);
  });

  it('should return max when value is above max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(101, 0, 100)).toBe(100);
  });
});

// ============================================
// Session Metrics Tests
// ============================================

describe('computeSessionMetrics', () => {
  it('should correctly count attentive and distracted seconds', () => {
    const ticks = [
      ...createAttentiveTicks(60),
      ...createDistractedTicks(20, 'PHONE', 0.9, new Date('2025-01-01T00:01:00Z')),
    ];

    const metrics = computeSessionMetrics(ticks, 1);

    expect(metrics.totalSeconds).toBe(80);
    expect(metrics.attentiveSeconds).toBe(60);
    expect(metrics.distractedSeconds).toBe(20);
  });

  it('should correctly track reason-specific seconds', () => {
    const ticks = [
      ...createDistractedTicks(10, 'PHONE', 0.9),
      ...createDistractedTicks(15, 'DROWSY', 0.85, new Date('2025-01-01T00:00:10Z')),
      ...createDistractedTicks(5, 'LOOKING_AWAY', 0.8, new Date('2025-01-01T00:00:25Z')),
    ];

    const metrics = computeSessionMetrics(ticks, 3);

    expect(metrics.phoneSeconds).toBe(10);
    expect(metrics.drowsySeconds).toBe(15);
    expect(metrics.headDownSeconds).toBe(5);
    expect(metrics.reasonBreakdown.PHONE).toBe(10);
    expect(metrics.reasonBreakdown.DROWSY).toBe(15);
    expect(metrics.reasonBreakdown.LOOKING_AWAY).toBe(5);
  });

  it('should calculate weighted distraction correctly', () => {
    const ticks = createDistractedTicks(10, 'PHONE', 0.9);
    const metrics = computeSessionMetrics(ticks, 1);

    // PHONE weight is 3.5, confidence is 0.9
    // Expected: 10 * 3.5 * 0.9 = 31.5
    expect(metrics.weightedDistracted).toBeCloseTo(31.5, 2);
  });

  it('should handle empty ticks array', () => {
    const metrics = computeSessionMetrics([], 0);

    expect(metrics.totalSeconds).toBe(0);
    expect(metrics.attentiveSeconds).toBe(0);
    expect(metrics.distractedSeconds).toBe(0);
  });
});

// ============================================
// Safety Score Algorithm Tests
// ============================================

describe('Safety Score Algorithm', () => {
  it('should return 100 for perfect driving (all attentive)', () => {
    const ticks = createAttentiveTicks(300); // 5 minutes
    const score = calculateScore(ticks);
    expect(score).toBe(100);
  });

  it('should penalize phone use heavily', () => {
    const ticks = [
      ...createAttentiveTicks(270),
      ...createDistractedTicks(30, 'PHONE', 0.95, new Date('2025-01-01T00:04:30Z')),
    ];
    const score = calculateScore(ticks);
    // 10% phone time with high confidence should result in notable penalty
    expect(score).toBeLessThan(85);
  });

  it('should penalize drowsiness more than looking away', () => {
    const ticksDrowsy = [
      ...createAttentiveTicks(280),
      ...createDistractedTicks(20, 'DROWSY', 0.9, new Date('2025-01-01T00:04:40Z')),
    ];
    const ticksLooking = [
      ...createAttentiveTicks(280),
      ...createDistractedTicks(20, 'LOOKING_AWAY', 0.9, new Date('2025-01-01T00:04:40Z')),
    ];

    const scoreDrowsy = calculateScore(ticksDrowsy);
    const scoreLooking = calculateScore(ticksLooking);

    expect(scoreDrowsy).toBeLessThan(scoreLooking);
  });

  it('should penalize frequent short distractions more than one long', () => {
    // 4 events, 20s total distracted
    const frequentShort: TelemetryTick[] = [];
    let time = new Date('2025-01-01T00:00:00Z');

    // Event 1: 10s attentive, then 5s distracted
    frequentShort.push(...createAttentiveTicks(10, time));
    time = new Date(time.getTime() + 10000);
    frequentShort.push(...createDistractedTicks(5, 'PHONE', 0.9, time));
    time = new Date(time.getTime() + 5000);

    // Event 2: 10s attentive, then 5s distracted
    frequentShort.push(...createAttentiveTicks(10, time));
    time = new Date(time.getTime() + 10000);
    frequentShort.push(...createDistractedTicks(5, 'PHONE', 0.9, time));
    time = new Date(time.getTime() + 5000);

    // Event 3: 10s attentive, then 5s distracted
    frequentShort.push(...createAttentiveTicks(10, time));
    time = new Date(time.getTime() + 10000);
    frequentShort.push(...createDistractedTicks(5, 'PHONE', 0.9, time));
    time = new Date(time.getTime() + 5000);

    // Event 4: 10s attentive, then 5s distracted
    frequentShort.push(...createAttentiveTicks(10, time));
    time = new Date(time.getTime() + 10000);
    frequentShort.push(...createDistractedTicks(5, 'PHONE', 0.9, time));

    // 1 event, 20s total distracted
    const oneLong = [
      ...createAttentiveTicks(40),
      ...createDistractedTicks(20, 'PHONE', 0.9, new Date('2025-01-01T00:00:40Z')),
    ];

    const scoreFrequent = calculateScore(frequentShort);
    const scoreLong = calculateScore(oneLong);

    expect(scoreFrequent).toBeLessThan(scoreLong);
  });

  it('should handle short sessions (< 30 seconds)', () => {
    const ticks = createAttentiveTicks(15);
    const score = calculateScore(ticks);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should return very low score for extremely dangerous driving', () => {
    // Session with continuous severe distractions
    const ticks = [
      ...createDistractedTicks(60, 'EYES_CLOSED', 1.0),
      ...createDistractedTicks(60, 'PHONE', 1.0, new Date('2025-01-01T00:01:00Z')),
    ];
    const events = segmentEvents(ticks);
    const score = calculateScoreFromTicks(ticks, events.length);

    // Score should be very low for this extreme case (continuous severe distractions)
    expect(score).toBeLessThanOrEqual(20);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should handle mixed distraction types correctly', () => {
    const ticks = [
      ...createAttentiveTicks(180),
      ...createDistractedTicks(10, 'PHONE', 0.9, new Date('2025-01-01T00:03:00Z')),
      ...createAttentiveTicks(30, new Date('2025-01-01T00:03:10Z')),
      ...createDistractedTicks(5, 'DROWSY', 0.85, new Date('2025-01-01T00:03:40Z')),
      ...createAttentiveTicks(50, new Date('2025-01-01T00:03:45Z')),
      ...createDistractedTicks(5, 'LOOKING_AWAY', 0.8, new Date('2025-01-01T00:04:35Z')),
    ];

    const score = calculateScore(ticks);

    // Score should be moderate due to mixed distractions
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(95);
  });
});

// ============================================
// Penalty Component Tests
// ============================================

describe('Penalty Components', () => {
  it('should apply severe penalties for continuous eyes closed', () => {
    // All distracted with highest severity (EYES_CLOSED = 4.5 weight)
    const ticks = createDistractedTicks(300, 'EYES_CLOSED', 1.0);
    const metrics = computeSessionMetrics(ticks, 1);
    const score = calculateSafetyScore(metrics);

    // EYES_CLOSED triggers both risk rate penalty AND drowsiness penalty
    // Score should be very low but algorithm has bounds
    expect(score).toBeLessThanOrEqual(35);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should apply phone penalty correctly', () => {
    // 15% phone time should trigger full phone penalty
    const ticks = [
      ...createAttentiveTicks(85),
      ...createDistractedTicks(15, 'PHONE', 1.0, new Date('2025-01-01T00:01:25Z')),
    ];
    const events = segmentEvents(ticks);
    const metrics = computeSessionMetrics(ticks, events.length);
    const score = calculateSafetyScore(metrics);

    // Should have significant phone penalty (15 pts)
    expect(score).toBeLessThan(85);
  });

  it('should apply drowsiness penalty correctly', () => {
    // 8% drowsy time should trigger full drowsiness penalty
    const ticks = [
      ...createAttentiveTicks(92),
      ...createDistractedTicks(8, 'DROWSY', 1.0, new Date('2025-01-01T00:01:32Z')),
    ];
    const events = segmentEvents(ticks);
    const metrics = computeSessionMetrics(ticks, events.length);
    const score = calculateSafetyScore(metrics);

    // Should have significant drowsiness penalty (20 pts)
    expect(score).toBeLessThan(80);
  });
});

// ============================================
// Score Smoothing Tests
// ============================================

describe('ScoreSmoothing', () => {
  it('should start at 100', () => {
    const smoother = new ScoreSmoothing();
    expect(smoother.current).toBe(100);
  });

  it('should smooth score transitions', () => {
    const smoother = new ScoreSmoothing();

    // First update to 50
    const first = smoother.update(50);
    expect(first).toBeLessThan(100);
    expect(first).toBeGreaterThan(50);

    // Multiple updates should converge toward target
    let score = first;
    for (let i = 0; i < 10; i++) {
      score = smoother.update(50);
    }
    // After 10 iterations at ALPHA=0.15, should be closer to 50
    expect(score).toBeLessThan(first);
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('should reset to 100', () => {
    const smoother = new ScoreSmoothing();
    smoother.update(50);
    smoother.update(30);

    smoother.reset();

    expect(smoother.current).toBe(100);
  });

  it('should allow setting a specific value', () => {
    const smoother = new ScoreSmoothing();
    smoother.set(75);

    expect(smoother.current).toBe(75);
  });

  it('should clamp set values to valid range', () => {
    const smoother = new ScoreSmoothing();

    smoother.set(-10);
    expect(smoother.current).toBe(0);

    smoother.set(150);
    expect(smoother.current).toBe(100);
  });

  it('should round smoothed scores', () => {
    const smoother = new ScoreSmoothing();
    const result = smoother.update(50);

    expect(Number.isInteger(result)).toBe(true);
  });
});

// ============================================
// Severity Weights Tests
// ============================================

describe('SEVERITY_WEIGHTS', () => {
  it('should have correct weights for all distraction types', () => {
    expect(SEVERITY_WEIGHTS.PHONE).toBe(3.5);
    expect(SEVERITY_WEIGHTS.DROWSY).toBe(4.0);
    expect(SEVERITY_WEIGHTS.EYES_CLOSED).toBe(4.5);
    expect(SEVERITY_WEIGHTS.HEAD_DOWN).toBe(2.5);
    expect(SEVERITY_WEIGHTS.LOOKING_AWAY).toBe(2.0);
    expect(SEVERITY_WEIGHTS.OTHER).toBe(1.5);
    expect(SEVERITY_WEIGHTS.NONE).toBe(1.0);
  });

  it('should rank EYES_CLOSED as most severe', () => {
    const maxWeight = Math.max(...Object.values(SEVERITY_WEIGHTS));
    expect(SEVERITY_WEIGHTS.EYES_CLOSED).toBe(maxWeight);
  });
});

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
  it('should handle single tick session', () => {
    const ticks = createAttentiveTicks(1);
    const score = calculateScore(ticks);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle all distracted session', () => {
    const ticks = createDistractedTicks(60, 'PHONE', 0.9);
    const score = calculateScore(ticks);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeLessThan(50); // Should be very low
  });

  it('should handle zero confidence distractions', () => {
    const ticks = [
      ...createAttentiveTicks(50),
      ...createDistractedTicks(10, 'PHONE', 0, new Date('2025-01-01T00:00:50Z')),
    ];
    const score = calculateScore(ticks);

    // Zero confidence reduces weighted impact but still counts as distraction time
    // Phone penalty is based on phoneSeconds/T regardless of confidence
    expect(score).toBeGreaterThan(70);
  });

  it('should handle variable confidence correctly', () => {
    const highConf = [
      ...createAttentiveTicks(90),
      ...createDistractedTicks(10, 'PHONE', 1.0, new Date('2025-01-01T00:01:30Z')),
    ];

    const lowConf = [
      ...createAttentiveTicks(90),
      ...createDistractedTicks(10, 'PHONE', 0.3, new Date('2025-01-01T00:01:30Z')),
    ];

    const scoreHigh = calculateScore(highConf);
    const scoreLow = calculateScore(lowConf);

    // Higher confidence should result in lower score
    expect(scoreHigh).toBeLessThan(scoreLow);
  });
});
