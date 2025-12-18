/**
 * Unit tests for Event Segmentation
 *
 * Tests cover:
 * - Basic event creation
 * - Event segmentation rules
 * - Gap detection (>2 seconds)
 * - Dominant reason detection
 * - Utility functions
 */

import {
  segmentEvents,
  createEvent,
  countEvents,
  filterByMinDuration,
  filterByReason,
  getTotalEventDuration,
  getLongestEvent,
  groupEventsByReason,
  getEventStatistics,
  DistractionEvent,
} from '../src/utils/eventSegmentation';
import type { TelemetryTick } from '../src/utils/scoring';
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

// ============================================
// createEvent Tests
// ============================================

describe('createEvent', () => {
  it('should create an event from distracted ticks', () => {
    const ticks = createDistractedTicks(10, 'PHONE', 0.9);
    const event = createEvent(ticks);

    expect(event.startTime).toBe(ticks[0].timestamp);
    expect(event.endTime).toBe(ticks[ticks.length - 1].timestamp);
    expect(event.durationSeconds).toBe(10);
    expect(event.dominantReason).toBe('PHONE');
    expect(event.averageConfidence).toBeCloseTo(0.9);
    expect(event.ticks).toHaveLength(10);
  });

  it('should throw error for empty ticks array', () => {
    expect(() => createEvent([])).toThrow('Cannot create event from empty ticks array');
  });

  it('should calculate average confidence correctly', () => {
    const ticks: TelemetryTick[] = [
      { timestamp: '2025-01-01T00:00:00Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.8 },
      { timestamp: '2025-01-01T00:00:01Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:02Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 1.0 },
    ];

    const event = createEvent(ticks);

    // (0.8 + 0.9 + 1.0) / 3 = 0.9
    expect(event.averageConfidence).toBeCloseTo(0.9);
  });
});

// ============================================
// segmentEvents Tests
// ============================================

describe('Event Segmentation', () => {
  it('should create one event for contiguous distracted ticks', () => {
    const ticks = [
      ...createAttentiveTicks(10),
      ...createDistractedTicks(15, 'PHONE', 0.9, new Date('2025-01-01T00:00:10Z')),
      ...createAttentiveTicks(10, new Date('2025-01-01T00:00:25Z')),
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    expect(events[0].durationSeconds).toBe(15);
    expect(events[0].dominantReason).toBe('PHONE');
  });

  it('should create separate events for gaps > 2 seconds', () => {
    const ticks: TelemetryTick[] = [
      { timestamp: '2025-01-01T00:00:00Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:01Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      // 4 second gap (from 00:01 to 00:05)
      { timestamp: '2025-01-01T00:00:05Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(2);
    expect(events[0].durationSeconds).toBe(2);
    expect(events[1].durationSeconds).toBe(1);
  });

  it('should NOT create separate events for gaps <= 2 seconds', () => {
    const ticks: TelemetryTick[] = [
      { timestamp: '2025-01-01T00:00:00Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:01Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      // 2 second gap (exactly at threshold - should NOT split)
      { timestamp: '2025-01-01T00:00:03Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    expect(events[0].durationSeconds).toBe(3);
  });

  it('should identify dominant reason correctly', () => {
    const ticks: TelemetryTick[] = [
      { timestamp: '2025-01-01T00:00:00Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:01Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:02Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:03Z', state: 'DISTRACTED', reason: 'LOOKING_AWAY', confidence: 0.8 },
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    expect(events[0].dominantReason).toBe('PHONE');
  });

  it('should handle attentive-only session (no events)', () => {
    const ticks = createAttentiveTicks(60);
    const events = segmentEvents(ticks);

    expect(events).toHaveLength(0);
  });

  it('should handle session ending while distracted', () => {
    const ticks = [
      ...createAttentiveTicks(30),
      ...createDistractedTicks(15, 'DROWSY', 0.85, new Date('2025-01-01T00:00:30Z')),
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    expect(events[0].durationSeconds).toBe(15);
    expect(events[0].dominantReason).toBe('DROWSY');
  });

  it('should handle session starting while distracted', () => {
    const ticks = [
      ...createDistractedTicks(20, 'PHONE', 0.9),
      ...createAttentiveTicks(40, new Date('2025-01-01T00:00:20Z')),
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    expect(events[0].durationSeconds).toBe(20);
  });

  it('should handle multiple separate events', () => {
    const ticks = [
      ...createAttentiveTicks(10),
      ...createDistractedTicks(5, 'PHONE', 0.9, new Date('2025-01-01T00:00:10Z')),
      ...createAttentiveTicks(10, new Date('2025-01-01T00:00:15Z')),
      ...createDistractedTicks(8, 'DROWSY', 0.85, new Date('2025-01-01T00:00:25Z')),
      ...createAttentiveTicks(10, new Date('2025-01-01T00:00:33Z')),
      ...createDistractedTicks(3, 'LOOKING_AWAY', 0.8, new Date('2025-01-01T00:00:43Z')),
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(3);
    expect(events[0].durationSeconds).toBe(5);
    expect(events[0].dominantReason).toBe('PHONE');
    expect(events[1].durationSeconds).toBe(8);
    expect(events[1].dominantReason).toBe('DROWSY');
    expect(events[2].durationSeconds).toBe(3);
    expect(events[2].dominantReason).toBe('LOOKING_AWAY');
  });

  it('should handle empty ticks array', () => {
    const events = segmentEvents([]);
    expect(events).toHaveLength(0);
  });

  it('should handle alternating states', () => {
    const ticks: TelemetryTick[] = [];
    let time = new Date('2025-01-01T00:00:00Z');

    // Alternating: D, A, D, A, D, A (creates 3 events with 1 tick each)
    for (let i = 0; i < 6; i++) {
      ticks.push({
        timestamp: time.toISOString(),
        state: i % 2 === 0 ? 'DISTRACTED' : 'ATTENTIVE',
        reason: i % 2 === 0 ? 'PHONE' : 'NONE',
        confidence: 0.9,
      });
      time = new Date(time.getTime() + 1000);
    }

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(3);
    events.forEach(event => {
      expect(event.durationSeconds).toBe(1);
    });
  });
});

// ============================================
// countEvents Tests
// ============================================

describe('countEvents', () => {
  it('should return 0 for attentive-only session', () => {
    const ticks = createAttentiveTicks(60);
    expect(countEvents(ticks)).toBe(0);
  });

  it('should count events correctly', () => {
    const ticks = [
      ...createDistractedTicks(5, 'PHONE', 0.9),
      ...createAttentiveTicks(10, new Date('2025-01-01T00:00:05Z')),
      ...createDistractedTicks(5, 'DROWSY', 0.85, new Date('2025-01-01T00:00:15Z')),
    ];

    expect(countEvents(ticks)).toBe(2);
  });
});

// ============================================
// filterByMinDuration Tests
// ============================================

describe('filterByMinDuration', () => {
  it('should filter events by minimum duration', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(2, 'PHONE', 0.9)),
      createEvent(createDistractedTicks(5, 'DROWSY', 0.85, new Date('2025-01-01T00:00:05Z'))),
      createEvent(createDistractedTicks(10, 'LOOKING_AWAY', 0.8, new Date('2025-01-01T00:00:15Z'))),
    ];

    const filtered = filterByMinDuration(events, 5);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].durationSeconds).toBe(5);
    expect(filtered[1].durationSeconds).toBe(10);
  });

  it('should return all events if minDuration is 0', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(1, 'PHONE', 0.9)),
      createEvent(createDistractedTicks(2, 'DROWSY', 0.85, new Date('2025-01-01T00:00:05Z'))),
    ];

    const filtered = filterByMinDuration(events, 0);
    expect(filtered).toHaveLength(2);
  });
});

// ============================================
// filterByReason Tests
// ============================================

describe('filterByReason', () => {
  it('should filter events by reason', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(5, 'PHONE', 0.9)),
      createEvent(createDistractedTicks(5, 'DROWSY', 0.85, new Date('2025-01-01T00:00:10Z'))),
      createEvent(createDistractedTicks(5, 'PHONE', 0.9, new Date('2025-01-01T00:00:20Z'))),
    ];

    const phoneEvents = filterByReason(events, 'PHONE');

    expect(phoneEvents).toHaveLength(2);
    phoneEvents.forEach(e => expect(e.dominantReason).toBe('PHONE'));
  });

  it('should return empty array if no events match', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(5, 'PHONE', 0.9)),
    ];

    const drowsyEvents = filterByReason(events, 'DROWSY');
    expect(drowsyEvents).toHaveLength(0);
  });
});

// ============================================
// getTotalEventDuration Tests
// ============================================

describe('getTotalEventDuration', () => {
  it('should calculate total duration correctly', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(5, 'PHONE', 0.9)),
      createEvent(createDistractedTicks(10, 'DROWSY', 0.85, new Date('2025-01-01T00:00:10Z'))),
      createEvent(createDistractedTicks(3, 'LOOKING_AWAY', 0.8, new Date('2025-01-01T00:00:25Z'))),
    ];

    const total = getTotalEventDuration(events);
    expect(total).toBe(18);
  });

  it('should return 0 for empty array', () => {
    expect(getTotalEventDuration([])).toBe(0);
  });
});

// ============================================
// getLongestEvent Tests
// ============================================

describe('getLongestEvent', () => {
  it('should return the longest event', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(5, 'PHONE', 0.9)),
      createEvent(createDistractedTicks(15, 'DROWSY', 0.85, new Date('2025-01-01T00:00:10Z'))),
      createEvent(createDistractedTicks(8, 'LOOKING_AWAY', 0.8, new Date('2025-01-01T00:00:30Z'))),
    ];

    const longest = getLongestEvent(events);

    expect(longest).not.toBeNull();
    expect(longest!.durationSeconds).toBe(15);
    expect(longest!.dominantReason).toBe('DROWSY');
  });

  it('should return null for empty array', () => {
    expect(getLongestEvent([])).toBeNull();
  });
});

// ============================================
// groupEventsByReason Tests
// ============================================

describe('groupEventsByReason', () => {
  it('should group events by dominant reason', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(5, 'PHONE', 0.9)),
      createEvent(createDistractedTicks(5, 'DROWSY', 0.85, new Date('2025-01-01T00:00:10Z'))),
      createEvent(createDistractedTicks(5, 'PHONE', 0.9, new Date('2025-01-01T00:00:20Z'))),
      createEvent(createDistractedTicks(5, 'DROWSY', 0.85, new Date('2025-01-01T00:00:30Z'))),
      createEvent(createDistractedTicks(5, 'LOOKING_AWAY', 0.8, new Date('2025-01-01T00:00:40Z'))),
    ];

    const groups = groupEventsByReason(events);

    expect(groups.get('PHONE')).toHaveLength(2);
    expect(groups.get('DROWSY')).toHaveLength(2);
    expect(groups.get('LOOKING_AWAY')).toHaveLength(1);
  });

  it('should return empty map for empty array', () => {
    const groups = groupEventsByReason([]);
    expect(groups.size).toBe(0);
  });
});

// ============================================
// getEventStatistics Tests
// ============================================

describe('getEventStatistics', () => {
  it('should calculate statistics correctly', () => {
    const events: DistractionEvent[] = [
      createEvent(createDistractedTicks(5, 'PHONE', 0.8)),
      createEvent(createDistractedTicks(10, 'DROWSY', 0.9, new Date('2025-01-01T00:00:10Z'))),
      createEvent(createDistractedTicks(15, 'LOOKING_AWAY', 1.0, new Date('2025-01-01T00:00:25Z'))),
    ];

    const stats = getEventStatistics(events);

    expect(stats.count).toBe(3);
    expect(stats.totalDuration).toBe(30);
    expect(stats.averageDuration).toBe(10);
    expect(stats.longestDuration).toBe(15);
    expect(stats.shortestDuration).toBe(5);
    expect(stats.averageConfidence).toBeCloseTo(0.9);
  });

  it('should return zeros for empty array', () => {
    const stats = getEventStatistics([]);

    expect(stats.count).toBe(0);
    expect(stats.totalDuration).toBe(0);
    expect(stats.averageDuration).toBe(0);
    expect(stats.longestDuration).toBe(0);
    expect(stats.shortestDuration).toBe(0);
    expect(stats.averageConfidence).toBe(0);
  });
});

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
  it('should handle single tick event', () => {
    const ticks: TelemetryTick[] = [
      { timestamp: '2025-01-01T00:00:00Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    expect(events[0].durationSeconds).toBe(1);
  });

  it('should handle all same reason', () => {
    const ticks = createDistractedTicks(100, 'DROWSY', 0.95);
    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    expect(events[0].dominantReason).toBe('DROWSY');
    expect(events[0].durationSeconds).toBe(100);
  });

  it('should handle varying confidence levels', () => {
    const ticks: TelemetryTick[] = [
      { timestamp: '2025-01-01T00:00:00Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.5 },
      { timestamp: '2025-01-01T00:00:01Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.7 },
      { timestamp: '2025-01-01T00:00:02Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:03Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 1.0 },
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    // Average: (0.5 + 0.7 + 0.9 + 1.0) / 4 = 0.775
    expect(events[0].averageConfidence).toBeCloseTo(0.775);
  });

  it('should handle mixed reasons in single event (tie-breaker)', () => {
    const ticks: TelemetryTick[] = [
      { timestamp: '2025-01-01T00:00:00Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:01Z', state: 'DISTRACTED', reason: 'PHONE', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:02Z', state: 'DISTRACTED', reason: 'DROWSY', confidence: 0.9 },
      { timestamp: '2025-01-01T00:00:03Z', state: 'DISTRACTED', reason: 'DROWSY', confidence: 0.9 },
    ];

    const events = segmentEvents(ticks);

    expect(events).toHaveLength(1);
    // Both PHONE and DROWSY have 2 counts - first one wins
    expect(['PHONE', 'DROWSY']).toContain(events[0].dominantReason);
  });
});
