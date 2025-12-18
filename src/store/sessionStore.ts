import { create } from 'zustand';
import type { DistractionReason } from '../types';

// ============================================
// Session Types
// ============================================

export interface CurrentSession {
  id: string;
  vehicleId: string;
  startTime: string;
  isActive: boolean;
  liveScore: number;
  smoothedScore: number;
  distractedSeconds: number;
  attentiveSeconds: number;
  eventsCount: number;
  currentState: 'ATTENTIVE' | 'DISTRACTED';
  currentReason: DistractionReason;
}

export interface TodaySummary {
  totalDrives: number;
  totalDrivingSeconds: number;
  totalDistractedSeconds: number;
  averageScore: number;
  eventsPerMinute: number;
  topDistractionReason: DistractionReason;
}

export interface WeeklySummary {
  averageScore: number;
  totalDrivingSeconds: number;
  totalSessions: number;
  trendData: Array<{
    date: string;
    score: number;
  }>;
}

export interface SessionState {
  // Current active session
  currentSession: CurrentSession | null;

  // Device connection status
  deviceConnected: boolean;

  // Summary data
  todaySummary: TodaySummary | null;
  weeklySummary: WeeklySummary | null;

  // Loading states
  isStartingSession: boolean;
  isEndingSession: boolean;
  isLoadingSummaries: boolean;

  // Error state
  error: string | null;

  // Firebase subscription cleanup function
  _unsubscribe: (() => void) | null;

  // Actions
  setDeviceConnected: (connected: boolean) => void;
  startSession: (vehicleId: string) => Promise<string>;
  endSession: () => Promise<void>;
  updateLiveScore: (score: number, smoothedScore: number) => void;
  updateSessionMetrics: (metrics: Partial<CurrentSession>) => void;
  subscribeToLiveUpdates: (sessionId: string) => void;
  unsubscribeFromLiveUpdates: () => void;
  fetchTodaySummary: () => Promise<void>;
  fetchWeeklySummary: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  currentSession: null,
  deviceConnected: false,
  todaySummary: null,
  weeklySummary: null,
  isStartingSession: false,
  isEndingSession: false,
  isLoadingSummaries: false,
  error: null,
  _unsubscribe: null,
};

// ============================================
// Session Store
// ============================================

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  setDeviceConnected: (connected: boolean) => {
    set({ deviceConnected: connected });
  },

  startSession: async (vehicleId: string): Promise<string> => {
    set({ isStartingSession: true, error: null });

    try {
      // Import dynamically to avoid circular dependencies
      const { supabaseMutations } = await import('../services/supabase/mutations');

      // Create session in Supabase
      const session = await supabaseMutations.startSession(vehicleId);

      const newSession: CurrentSession = {
        id: session.id,
        vehicleId,
        startTime: new Date().toISOString(),
        isActive: true,
        liveScore: 100,
        smoothedScore: 100,
        distractedSeconds: 0,
        attentiveSeconds: 0,
        eventsCount: 0,
        currentState: 'ATTENTIVE',
        currentReason: 'NONE',
      };

      set({
        currentSession: newSession,
        isStartingSession: false,
      });

      // Subscribe to live updates
      get().subscribeToLiveUpdates(session.id);

      return session.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      set({
        isStartingSession: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  endSession: async (): Promise<void> => {
    const { currentSession, unsubscribeFromLiveUpdates } = get();

    if (!currentSession) {
      return;
    }

    set({ isEndingSession: true, error: null });

    try {
      // Unsubscribe from live updates first
      unsubscribeFromLiveUpdates();

      // Import dynamically to avoid circular dependencies
      const { supabaseMutations } = await import('../services/supabase/mutations');

      // End session in Supabase (triggers Cloud Function for final score calculation)
      await supabaseMutations.endSession(currentSession.id);

      set({
        currentSession: null,
        isEndingSession: false,
      });

      // Refresh summaries after ending session
      get().fetchTodaySummary();
      get().fetchWeeklySummary();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to end session';
      set({
        isEndingSession: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  updateLiveScore: (score: number, smoothedScore: number) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({
      currentSession: {
        ...currentSession,
        liveScore: score,
        smoothedScore,
      },
    });
  },

  updateSessionMetrics: (metrics: Partial<CurrentSession>) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({
      currentSession: {
        ...currentSession,
        ...metrics,
      },
    });
  },

  subscribeToLiveUpdates: (sessionId: string) => {
    // Clean up any existing subscription
    get().unsubscribeFromLiveUpdates();

    // Import dynamically to avoid circular dependencies
    import('../services/firebase/realtime').then(({ firebaseRealtimeService }) => {
      const unsubscribe = firebaseRealtimeService.subscribeToSession(
        sessionId,
        (data) => {
          if (data) {
            get().updateSessionMetrics({
              liveScore: data.currentScore ?? 100,
              distractedSeconds: data.distractedSeconds ?? 0,
              attentiveSeconds: data.attentiveSeconds ?? 0,
              eventsCount: data.eventsCount ?? 0,
              currentState: data.currentState ?? 'ATTENTIVE',
              currentReason: data.currentReason ?? 'NONE',
            });
          }
        }
      );

      set({ _unsubscribe: unsubscribe });
    }).catch((error) => {
      console.error('Failed to subscribe to live updates:', error);
    });
  },

  unsubscribeFromLiveUpdates: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) {
      _unsubscribe();
      set({ _unsubscribe: null });
    }
  },

  fetchTodaySummary: async () => {
    set({ isLoadingSummaries: true });

    try {
      const { supabaseQueries } = await import('../services/supabase/queries');
      const summary = await supabaseQueries.getTodaySummary();

      set({
        todaySummary: summary,
        isLoadingSummaries: false,
      });
    } catch (error) {
      console.error('Failed to fetch today summary:', error);
      set({ isLoadingSummaries: false });
    }
  },

  fetchWeeklySummary: async () => {
    set({ isLoadingSummaries: true });

    try {
      const { supabaseQueries } = await import('../services/supabase/queries');
      const summary = await supabaseQueries.getWeeklySummary();

      set({
        weeklySummary: summary,
        isLoadingSummaries: false,
      });
    } catch (error) {
      console.error('Failed to fetch weekly summary:', error);
      set({ isLoadingSummaries: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    get().unsubscribeFromLiveUpdates();
    set(initialState);
  },
}));

// ============================================
// Selectors
// ============================================

export const selectCurrentSession = (state: SessionState) => state.currentSession;
export const selectIsSessionActive = (state: SessionState) => state.currentSession?.isActive ?? false;
export const selectDeviceConnected = (state: SessionState) => state.deviceConnected;
export const selectTodaySummary = (state: SessionState) => state.todaySummary;
export const selectWeeklySummary = (state: SessionState) => state.weeklySummary;
export const selectSessionLoading = (state: SessionState) =>
  state.isStartingSession || state.isEndingSession;
