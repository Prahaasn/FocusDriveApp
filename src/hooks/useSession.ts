import { useCallback, useEffect, useMemo } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useRealtimeScore, useSessionDuration, useEventsPerMinute } from './useRealtimeScore';
import { formatDuration } from '../utils/formatting';
import { getRiskLevel, getRiskLevelText, getRiskColor } from '../constants/colors';

// ============================================
// useSession Hook
// ============================================

/**
 * Main hook for managing driving sessions
 * Combines session store with real-time updates and computed values
 */
export const useSession = () => {
  const {
    currentSession,
    deviceConnected,
    todaySummary,
    weeklySummary,
    isStartingSession,
    isEndingSession,
    isLoadingSummaries,
    error,
    startSession,
    endSession,
    setDeviceConnected,
    fetchTodaySummary,
    fetchWeeklySummary,
    clearError,
  } = useSessionStore();

  // Real-time score updates
  const realtimeData = useRealtimeScore(currentSession?.id ?? null);

  // Session duration tracking
  const durationSeconds = useSessionDuration(
    currentSession?.startTime ?? null,
    currentSession?.isActive ?? false
  );

  // Calculate events per minute
  const eventsPerMinute = useEventsPerMinute(
    realtimeData.eventsCount,
    durationSeconds
  );

  // Computed session values
  const sessionData = useMemo(() => {
    if (!currentSession) {
      return null;
    }

    const score = realtimeData.smoothedScore;
    const riskLevel = getRiskLevel(score);

    return {
      id: currentSession.id,
      startTime: currentSession.startTime,
      isActive: currentSession.isActive,
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      liveScore: realtimeData.liveScore,
      smoothedScore: score,
      riskLevel,
      riskLevelText: getRiskLevelText(riskLevel),
      riskColor: getRiskColor(score),
      distractedSeconds: realtimeData.distractedSeconds,
      distractedFormatted: formatDuration(realtimeData.distractedSeconds),
      attentiveSeconds: realtimeData.attentiveSeconds,
      eventsCount: realtimeData.eventsCount,
      eventsPerMinute,
      currentState: realtimeData.currentState,
      currentReason: realtimeData.currentReason,
      isConnected: realtimeData.isConnected,
    };
  }, [currentSession, realtimeData, durationSeconds, eventsPerMinute]);

  // Computed today summary values
  const todayData = useMemo(() => {
    if (!todaySummary) {
      return {
        totalDrives: 0,
        totalDrivingFormatted: '0m',
        totalDistractedFormatted: '0s',
        averageScore: 100,
        eventsPerMinute: 0,
        topDistractionReason: 'NONE' as const,
      };
    }

    return {
      totalDrives: todaySummary.totalDrives,
      totalDrivingFormatted: formatDuration(todaySummary.totalDrivingSeconds),
      totalDistractedFormatted: formatDuration(todaySummary.totalDistractedSeconds),
      averageScore: todaySummary.averageScore,
      eventsPerMinute: todaySummary.eventsPerMinute,
      topDistractionReason: todaySummary.topDistractionReason,
    };
  }, [todaySummary]);

  // Computed weekly summary values
  const weeklyData = useMemo(() => {
    if (!weeklySummary) {
      return {
        averageScore: 100,
        totalDrivingFormatted: '0h',
        totalSessions: 0,
        trendData: [],
      };
    }

    return {
      averageScore: weeklySummary.averageScore,
      totalDrivingFormatted: formatDuration(weeklySummary.totalDrivingSeconds),
      totalSessions: weeklySummary.totalSessions,
      trendData: weeklySummary.trendData,
    };
  }, [weeklySummary]);

  // Action handlers
  const handleStartSession = useCallback(async (vehicleId: string) => {
    try {
      await startSession(vehicleId);
    } catch (err) {
      // Error is handled by store
      console.error('Failed to start session:', err);
    }
  }, [startSession]);

  const handleEndSession = useCallback(async () => {
    try {
      await endSession();
    } catch (err) {
      // Error is handled by store
      console.error('Failed to end session:', err);
    }
  }, [endSession]);

  // Fetch summaries on mount
  useEffect(() => {
    fetchTodaySummary();
    fetchWeeklySummary();
  }, [fetchTodaySummary, fetchWeeklySummary]);

  return {
    // Session state
    currentSession: sessionData,
    isSessionActive: currentSession?.isActive ?? false,

    // Device state
    deviceConnected,
    setDeviceConnected,

    // Summary data
    todaySummary: todayData,
    weeklySummary: weeklyData,

    // Loading states
    isStartingSession,
    isEndingSession,
    isLoadingSummaries,
    isLoading: isStartingSession || isEndingSession,

    // Error handling
    error,
    clearError,

    // Actions
    startSession: handleStartSession,
    endSession: handleEndSession,
    refreshSummaries: () => {
      fetchTodaySummary();
      fetchWeeklySummary();
    },
  };
};

// ============================================
// useSessionControls Hook
// ============================================

/**
 * Lightweight hook for just session control actions
 * Use when you don't need all the computed values
 */
export const useSessionControls = () => {
  const {
    currentSession,
    isStartingSession,
    isEndingSession,
    startSession,
    endSession,
    error,
    clearError,
  } = useSessionStore();

  return {
    isSessionActive: currentSession?.isActive ?? false,
    isStartingSession,
    isEndingSession,
    isLoading: isStartingSession || isEndingSession,
    startSession,
    endSession,
    error,
    clearError,
  };
};

// ============================================
// useTodaySummary Hook
// ============================================

/**
 * Hook for just today's summary data
 */
export const useTodaySummary = () => {
  const { todaySummary, isLoadingSummaries, fetchTodaySummary } = useSessionStore();

  useEffect(() => {
    fetchTodaySummary();
  }, [fetchTodaySummary]);

  return {
    summary: todaySummary,
    isLoading: isLoadingSummaries,
    refresh: fetchTodaySummary,
  };
};

// ============================================
// useWeeklySummary Hook
// ============================================

/**
 * Hook for just weekly summary data
 */
export const useWeeklySummary = () => {
  const { weeklySummary, isLoadingSummaries, fetchWeeklySummary } = useSessionStore();

  useEffect(() => {
    fetchWeeklySummary();
  }, [fetchWeeklySummary]);

  return {
    summary: weeklySummary,
    isLoading: isLoadingSummaries,
    refresh: fetchWeeklySummary,
  };
};

export default useSession;
