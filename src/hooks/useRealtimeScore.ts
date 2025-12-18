import { useState, useEffect, useRef, useCallback } from 'react';
import type { DistractionReason, DriverState } from '../types';

// ============================================
// Score Smoothing Class
// ============================================

/**
 * Exponential moving average for smooth score transitions
 * This will be replaced by AGENT_7's ScoreSmoothing class when available
 */
class ScoreSmoothing {
  private smoothedValue: number;
  private alpha: number;

  constructor(initialValue: number = 100, smoothingFactor: number = 0.15) {
    this.smoothedValue = initialValue;
    this.alpha = smoothingFactor;
  }

  update(newValue: number): number {
    // Exponential moving average: smoothed = alpha * new + (1 - alpha) * old
    this.smoothedValue = this.alpha * newValue + (1 - this.alpha) * this.smoothedValue;
    return Math.round(this.smoothedValue);
  }

  reset(value: number = 100): void {
    this.smoothedValue = value;
  }

  getValue(): number {
    return Math.round(this.smoothedValue);
  }
}

// ============================================
// Real-time Score Data Interface
// ============================================

export interface RealtimeScoreData {
  liveScore: number;
  smoothedScore: number;
  distractedSeconds: number;
  attentiveSeconds: number;
  eventsCount: number;
  currentState: DriverState;
  currentReason: DistractionReason;
  isConnected: boolean;
  lastUpdate: Date | null;
}

// ============================================
// useRealtimeScore Hook
// ============================================

/**
 * Hook for subscribing to real-time score updates from Firebase
 * Provides smoothed score values for smooth UI animations
 */
export const useRealtimeScore = (sessionId: string | null) => {
  const [data, setData] = useState<RealtimeScoreData>({
    liveScore: 100,
    smoothedScore: 100,
    distractedSeconds: 0,
    attentiveSeconds: 0,
    eventsCount: 0,
    currentState: 'ATTENTIVE',
    currentReason: 'NONE',
    isConnected: false,
    lastUpdate: null,
  });

  const smootherRef = useRef<ScoreSmoothing>(new ScoreSmoothing());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Reset smoother when session changes
  useEffect(() => {
    smootherRef.current.reset(100);
    setData({
      liveScore: 100,
      smoothedScore: 100,
      distractedSeconds: 0,
      attentiveSeconds: 0,
      eventsCount: 0,
      currentState: 'ATTENTIVE',
      currentReason: 'NONE',
      isConnected: false,
      lastUpdate: null,
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setData((prev) => ({ ...prev, isConnected: false }));
      return;
    }

    let isMounted = true;

    const subscribe = async () => {
      try {
        const { firebaseRealtimeService } = await import('../services/firebase/realtime');

        unsubscribeRef.current = firebaseRealtimeService.subscribeToSession(
          sessionId,
          (realtimeData) => {
            if (!isMounted) return;

            if (realtimeData) {
              const rawScore = realtimeData.currentScore ?? 100;
              const smoothedScore = smootherRef.current.update(rawScore);

              setData({
                liveScore: rawScore,
                smoothedScore,
                distractedSeconds: realtimeData.distractedSeconds ?? 0,
                attentiveSeconds: realtimeData.attentiveSeconds ?? 0,
                eventsCount: realtimeData.eventsCount ?? 0,
                currentState: realtimeData.currentState ?? 'ATTENTIVE',
                currentReason: realtimeData.currentReason ?? 'NONE',
                isConnected: true,
                lastUpdate: new Date(),
              });
            }
          }
        );
      } catch (error) {
        console.error('Failed to subscribe to realtime updates:', error);
        if (isMounted) {
          setData((prev) => ({ ...prev, isConnected: false }));
        }
      }
    };

    subscribe();

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [sessionId]);

  // Callback to manually update score (for testing or offline mode)
  const updateScore = useCallback((score: number) => {
    const smoothedScore = smootherRef.current.update(score);
    setData((prev) => ({
      ...prev,
      liveScore: score,
      smoothedScore,
      lastUpdate: new Date(),
    }));
  }, []);

  return {
    ...data,
    updateScore,
  };
};

// ============================================
// useSessionDuration Hook
// ============================================

/**
 * Hook for tracking live session duration
 * Updates every second while session is active
 */
export const useSessionDuration = (startTime: string | null, isActive: boolean) => {
  const [durationSeconds, setDurationSeconds] = useState(0);

  useEffect(() => {
    if (!startTime || !isActive) {
      setDurationSeconds(0);
      return;
    }

    const startDate = new Date(startTime).getTime();

    const updateDuration = () => {
      const now = Date.now();
      const seconds = Math.floor((now - startDate) / 1000);
      setDurationSeconds(Math.max(0, seconds));
    };

    // Initial update
    updateDuration();

    // Update every second
    const intervalId = setInterval(updateDuration, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [startTime, isActive]);

  return durationSeconds;
};

// ============================================
// useEventsPerMinute Hook
// ============================================

/**
 * Hook for calculating real-time events per minute
 */
export const useEventsPerMinute = (eventsCount: number, durationSeconds: number) => {
  if (durationSeconds < 60) {
    // Not enough time for meaningful calculation
    return 0;
  }

  const durationMinutes = durationSeconds / 60;
  return Math.round((eventsCount / durationMinutes) * 10) / 10;
};

export default useRealtimeScore;
