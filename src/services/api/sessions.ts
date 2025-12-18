/**
 * Sessions API Service
 * High-level service that coordinates Firebase Realtime DB, Supabase, and API calls
 * for managing driving sessions
 */

import { firebaseRealtimeService, LiveSessionData } from '../firebase/realtime';
import { supabaseQueries } from '../supabase/queries';
import { supabaseMutations, GeoLocation, SessionScoreData } from '../supabase/mutations';
import { telemetryApiService } from './telemetry';
import { DrivingSession, SessionSummary, DistractionEvent } from '@/types';

// Session state for UI
export interface ActiveSessionState {
  sessionId: string;
  isActive: boolean;
  startTime: string;
  currentScore: number;
  distractedSeconds: number;
  attentiveSeconds: number;
  eventsCount: number;
  currentState: 'ATTENTIVE' | 'DISTRACTED';
}

// Session start result
export interface SessionStartResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

// Session end result
export interface SessionEndResult {
  success: boolean;
  session?: DrivingSession;
  error?: string;
}

class SessionsApiService {
  private activeSessionUnsubscribe: (() => void) | null = null;

  /**
   * Start a new driving session
   */
  async startSession(
    userId: string,
    vehicleId: string,
    startLocation?: GeoLocation
  ): Promise<SessionStartResult> {
    try {
      // 1. Create session in Supabase
      const session = await supabaseMutations.startSession(
        userId,
        vehicleId,
        startLocation
      );

      // 2. Initialize session in Firebase Realtime DB for live updates
      await firebaseRealtimeService.initializeSession(session.id, userId);

      // 3. Notify device to start recording (if connected)
      const vehicle = await supabaseQueries.getVehicle(vehicleId);
      if (vehicle?.deviceId) {
        await telemetryApiService.sendDeviceCommand(
          vehicle.deviceId,
          'START_SESSION',
          { sessionId: session.id }
        );
      }

      return {
        success: true,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Error starting session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start session',
      };
    }
  }

  /**
   * End an active driving session
   */
  async endSession(
    sessionId: string,
    userId: string,
    endLocation?: GeoLocation
  ): Promise<SessionEndResult> {
    try {
      // 1. End session in Firebase Realtime DB
      await firebaseRealtimeService.endSession(sessionId, userId);

      // 2. Update session in Supabase with end time
      await supabaseMutations.endSession(sessionId, endLocation);

      // 3. Trigger score calculation
      await telemetryApiService.calculateSessionScore(sessionId);

      // 4. Notify device to stop recording
      const session = await supabaseQueries.getSessionDetails(sessionId);
      if (session) {
        const vehicle = await supabaseQueries.getVehicle(session.vehicleId);
        if (vehicle?.deviceId) {
          await telemetryApiService.sendDeviceCommand(
            vehicle.deviceId,
            'STOP_SESSION',
            { sessionId }
          );
        }
      }

      // 5. Fetch and return the completed session
      const completedSession = await supabaseQueries.getSessionDetails(sessionId);

      return {
        success: true,
        session: completedSession || undefined,
      };
    } catch (error) {
      console.error('Error ending session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end session',
      };
    }
  }

  /**
   * Subscribe to live session updates
   */
  subscribeToActiveSession(
    sessionId: string,
    callback: (state: ActiveSessionState | null) => void
  ): () => void {
    // Clean up any existing subscription
    if (this.activeSessionUnsubscribe) {
      this.activeSessionUnsubscribe();
    }

    const unsubscribe = firebaseRealtimeService.subscribeToSession(
      sessionId,
      (data: LiveSessionData | null) => {
        if (!data) {
          callback(null);
          return;
        }

        callback({
          sessionId: data.sessionId,
          isActive: data.status === 'active',
          startTime: data.startTime,
          currentScore: data.currentScore,
          distractedSeconds: data.distractedSeconds,
          attentiveSeconds: data.attentiveSeconds,
          eventsCount: data.eventsCount,
          currentState: data.currentState,
        });
      }
    );

    this.activeSessionUnsubscribe = unsubscribe;
    return unsubscribe;
  }

  /**
   * Get user's currently active session (if any)
   */
  async getActiveSession(userId: string): Promise<ActiveSessionState | null> {
    try {
      // Check Firebase for active session
      const activeSessionId = await firebaseRealtimeService.getUserActiveSession(userId);

      if (!activeSessionId) {
        return null;
      }

      const sessionData = await firebaseRealtimeService.getSessionData(activeSessionId);

      if (!sessionData || sessionData.status !== 'active') {
        return null;
      }

      return {
        sessionId: sessionData.sessionId,
        isActive: true,
        startTime: sessionData.startTime,
        currentScore: sessionData.currentScore,
        distractedSeconds: sessionData.distractedSeconds,
        attentiveSeconds: sessionData.attentiveSeconds,
        eventsCount: sessionData.eventsCount,
        currentState: sessionData.currentState,
      };
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  /**
   * Get session history with pagination
   */
  async getSessionHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<DrivingSession[]> {
    try {
      return await supabaseQueries.getDrivingSessions(userId, {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        startDate: options?.startDate,
        endDate: options?.endDate,
      });
    } catch (error) {
      console.error('Error fetching session history:', error);
      return [];
    }
  }

  /**
   * Get session details by ID
   */
  async getSessionDetails(sessionId: string): Promise<DrivingSession | null> {
    try {
      return await supabaseQueries.getSessionDetails(sessionId);
    } catch (error) {
      console.error('Error fetching session details:', error);
      return null;
    }
  }

  /**
   * Get distraction events for a session
   */
  async getSessionEvents(sessionId: string): Promise<DistractionEvent[]> {
    try {
      return await supabaseQueries.getSessionEvents(sessionId);
    } catch (error) {
      console.error('Error fetching session events:', error);
      return [];
    }
  }

  /**
   * Get recent session summaries for dashboard
   */
  async getRecentSessions(
    userId: string,
    limit: number = 5
  ): Promise<SessionSummary[]> {
    try {
      return await supabaseQueries.getSessionSummaries(userId, limit);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
  }

  /**
   * Get today's driving summary
   */
  async getTodaySummary(userId: string) {
    try {
      return await supabaseQueries.getTodaySummary(userId);
    } catch (error) {
      console.error('Error fetching today summary:', error);
      return {
        sessionsCount: 0,
        totalDriveTimeSeconds: 0,
        avgScore: 0,
        totalDistractedSeconds: 0,
      };
    }
  }

  /**
   * Get weekly driving summary
   */
  async getWeeklySummary(userId: string) {
    try {
      return await supabaseQueries.getWeeklySummary(userId);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      return {
        sessions: [],
        dailyScores: [],
        totalSessions: 0,
        avgScore: 0,
      };
    }
  }

  /**
   * Get monthly trend data for charts
   */
  async getMonthlyTrend(userId: string) {
    try {
      return await supabaseQueries.getMonthlyTrend(userId);
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
      return [];
    }
  }

  /**
   * Get lifetime statistics
   */
  async getLifetimeStats(userId: string) {
    try {
      return await supabaseQueries.getLifetimeStats(userId);
    } catch (error) {
      console.error('Error fetching lifetime stats:', error);
      return {
        totalSessions: 0,
        totalDrivingHours: 0,
        averageSafetyScore: 0,
        totalDistractions: 0,
        mostCommonDistraction: 'NONE' as const,
      };
    }
  }

  /**
   * Update session with calculated score data
   * Called by Cloud Function after score calculation
   */
  async updateSessionScore(
    sessionId: string,
    scoreData: SessionScoreData
  ): Promise<boolean> {
    try {
      await supabaseMutations.updateSessionScore(sessionId, scoreData);
      return true;
    } catch (error) {
      console.error('Error updating session score:', error);
      return false;
    }
  }

  /**
   * Clean up active subscriptions
   */
  cleanup(): void {
    if (this.activeSessionUnsubscribe) {
      this.activeSessionUnsubscribe();
      this.activeSessionUnsubscribe = null;
    }
    firebaseRealtimeService.cleanup();
  }
}

// Export singleton instance
export const sessionsApiService = new SessionsApiService();
