/**
 * Event Segmentation Module
 *
 * This module segments continuous telemetry data into distinct distraction events.
 * An event is defined as a contiguous period where the driver is distracted,
 * with gaps of more than 2 seconds triggering a new event.
 */

import type { DistractionReason } from '../types';
import type { TelemetryTick } from './scoring';

// ============================================
// Type Definitions
// ============================================

/**
 * Represents a single distraction event (contiguous period of distraction).
 */
export interface DistractionEvent {
  /** ISO 8601 timestamp when the event started */
  startTime: string;
  /** ISO 8601 timestamp when the event ended */
  endTime: string;
  /** Duration in seconds (at 1Hz, equals number of ticks) */
  durationSeconds: number;
  /** Most frequent distraction reason during the event */
  dominantReason: DistractionReason;
  /** Average confidence across all ticks in the event */
  averageConfidence: number;
  /** Raw telemetry ticks that make up this event (for detailed analysis) */
  ticks: TelemetryTick[];
}

// ============================================
// Constants
// ============================================

/**
 * Maximum gap (in milliseconds) between consecutive distracted ticks
 * before they're considered separate events.
 * 2000ms = 2 seconds
 */
const MAX_GAP_MS = 2000;

// ============================================
// Event Creation
// ============================================

/**
 * Creates a DistractionEvent from an array of consecutive distracted ticks.
 *
 * @param ticks - Array of consecutive distracted ticks forming an event
 * @returns A structured DistractionEvent object
 */
export function createEvent(ticks: TelemetryTick[]): DistractionEvent {
  if (ticks.length === 0) {
    throw new Error('Cannot create event from empty ticks array');
  }

  // Count occurrences of each reason to find the dominant one
  const reasonCounts: Partial<Record<DistractionReason, number>> = {};
  let totalConfidence = 0;

  for (const tick of ticks) {
    reasonCounts[tick.reason] = (reasonCounts[tick.reason] || 0) + 1;
    totalConfidence += tick.confidence;
  }

  // Find the dominant reason (most frequent)
  let dominantReason: DistractionReason = ticks[0].reason;
  let maxCount = 0;

  for (const [reason, count] of Object.entries(reasonCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantReason = reason as DistractionReason;
    }
  }

  return {
    startTime: ticks[0].timestamp,
    endTime: ticks[ticks.length - 1].timestamp,
    durationSeconds: ticks.length, // 1Hz = 1 tick per second
    dominantReason,
    averageConfidence: totalConfidence / ticks.length,
    ticks,
  };
}

// ============================================
// Event Segmentation
// ============================================

/**
 * Segments telemetry ticks into distinct distraction events.
 *
 * Rules for segmentation:
 * 1. An event starts when state transitions to DISTRACTED
 * 2. An event ends when state transitions to ATTENTIVE
 * 3. A gap of > 2 seconds between consecutive DISTRACTED ticks starts a new event
 *
 * @param ticks - Array of telemetry ticks (should be time-ordered)
 * @returns Array of segmented distraction events
 */
export function segmentEvents(ticks: TelemetryTick[]): DistractionEvent[] {
  const events: DistractionEvent[] = [];
  let currentEventTicks: TelemetryTick[] = [];
  let lastTickTime: Date | null = null;

  for (const tick of ticks) {
    const tickTime = new Date(tick.timestamp);

    if (tick.state === 'DISTRACTED') {
      // Check if we should start a new event
      const shouldStartNew =
        currentEventTicks.length === 0 ||
        !lastTickTime ||
        (tickTime.getTime() - lastTickTime.getTime()) > MAX_GAP_MS;

      if (shouldStartNew) {
        // Save previous event if it exists
        if (currentEventTicks.length > 0) {
          events.push(createEvent(currentEventTicks));
        }
        // Start a new event
        currentEventTicks = [tick];
      } else {
        // Continue current event
        currentEventTicks.push(tick);
      }
    } else {
      // ATTENTIVE - end current event if it exists
      if (currentEventTicks.length > 0) {
        events.push(createEvent(currentEventTicks));
        currentEventTicks = [];
      }
    }

    lastTickTime = tickTime;
  }

  // Handle last event (if session ends while distracted)
  if (currentEventTicks.length > 0) {
    events.push(createEvent(currentEventTicks));
  }

  return events;
}

/**
 * Counts the number of distraction events in a tick array.
 * This is a convenience function that runs segmentation and returns just the count.
 *
 * @param ticks - Array of telemetry ticks
 * @returns Number of distinct distraction events
 */
export function countEvents(ticks: TelemetryTick[]): number {
  return segmentEvents(ticks).length;
}

// ============================================
// Event Analysis Utilities
// ============================================

/**
 * Filters events by minimum duration.
 * Useful for ignoring very brief distractions (e.g., < 2 seconds).
 *
 * @param events - Array of distraction events
 * @param minDurationSeconds - Minimum duration to include
 * @returns Filtered array of events
 */
export function filterByMinDuration(
  events: DistractionEvent[],
  minDurationSeconds: number
): DistractionEvent[] {
  return events.filter(e => e.durationSeconds >= minDurationSeconds);
}

/**
 * Filters events by reason.
 * Useful for analyzing specific types of distractions.
 *
 * @param events - Array of distraction events
 * @param reason - Distraction reason to filter by
 * @returns Filtered array of events
 */
export function filterByReason(
  events: DistractionEvent[],
  reason: DistractionReason
): DistractionEvent[] {
  return events.filter(e => e.dominantReason === reason);
}

/**
 * Gets the total duration of all events.
 *
 * @param events - Array of distraction events
 * @returns Total seconds across all events
 */
export function getTotalEventDuration(events: DistractionEvent[]): number {
  return events.reduce((sum, event) => sum + event.durationSeconds, 0);
}

/**
 * Gets the longest event in an array.
 *
 * @param events - Array of distraction events
 * @returns The longest event, or null if array is empty
 */
export function getLongestEvent(events: DistractionEvent[]): DistractionEvent | null {
  if (events.length === 0) return null;

  return events.reduce((longest, event) =>
    event.durationSeconds > longest.durationSeconds ? event : longest
  );
}

/**
 * Groups events by their dominant reason.
 *
 * @param events - Array of distraction events
 * @returns Map of reason to events with that reason
 */
export function groupEventsByReason(
  events: DistractionEvent[]
): Map<DistractionReason, DistractionEvent[]> {
  const groups = new Map<DistractionReason, DistractionEvent[]>();

  for (const event of events) {
    const existing = groups.get(event.dominantReason) || [];
    existing.push(event);
    groups.set(event.dominantReason, existing);
  }

  return groups;
}

/**
 * Calculates statistics about event distribution.
 *
 * @param events - Array of distraction events
 * @returns Object with event statistics
 */
export function getEventStatistics(events: DistractionEvent[]): {
  count: number;
  totalDuration: number;
  averageDuration: number;
  longestDuration: number;
  shortestDuration: number;
  averageConfidence: number;
} {
  if (events.length === 0) {
    return {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      longestDuration: 0,
      shortestDuration: 0,
      averageConfidence: 0,
    };
  }

  const durations = events.map(e => e.durationSeconds);
  const confidences = events.map(e => e.averageConfidence);

  return {
    count: events.length,
    totalDuration: durations.reduce((a, b) => a + b, 0),
    averageDuration: durations.reduce((a, b) => a + b, 0) / events.length,
    longestDuration: Math.max(...durations),
    shortestDuration: Math.min(...durations),
    averageConfidence: confidences.reduce((a, b) => a + b, 0) / events.length,
  };
}
