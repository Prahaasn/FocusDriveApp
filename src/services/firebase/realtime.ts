/**
 * Firebase Realtime Database Service
 * Handles real-time data subscriptions for live session updates and device status
 */

import {
  ref,
  onValue,
  set,
  update,
  remove,
  get,
  off,
  DataSnapshot,
  DatabaseReference,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { getFirebaseDatabase } from './config';
import { DistractionReason, DriverState } from '@/types';

// Types for real-time data
export interface LiveSessionData {
  sessionId: string;
  status: 'active' | 'ended';
  currentScore: number;
  distractedSeconds: number;
  attentiveSeconds: number;
  eventsCount: number;
  currentState: DriverState;
  currentReason: DistractionReason;
  lastUpdate: string;
  startTime: string;
}

export interface DeviceStatus {
  deviceId: string;
  online: boolean;
  lastSeen: string;
  currentSessionId?: string;
  batteryLevel?: number;
  firmwareVersion?: string;
}

export interface RealtimeEvent {
  timestamp: string;
  state: DriverState;
  reason: DistractionReason;
  confidence: number;
}

class FirebaseRealtimeService {
  private db = getFirebaseDatabase();
  private activeListeners: Map<string, DatabaseReference> = new Map();

  /**
   * Subscribe to live session updates
   */
  subscribeToSession(
    sessionId: string,
    callback: (data: LiveSessionData | null) => void
  ): () => void {
    const sessionRef = ref(this.db, `sessions/${sessionId}`);

    const unsubscribe = onValue(
      sessionRef,
      (snapshot: DataSnapshot) => {
        callback(snapshot.val() as LiveSessionData | null);
      },
      (error) => {
        console.error('Session subscription error:', error);
        callback(null);
      }
    );

    // Store reference for cleanup
    this.activeListeners.set(`session-${sessionId}`, sessionRef);

    // Return unsubscribe function
    return () => {
      off(sessionRef);
      this.activeListeners.delete(`session-${sessionId}`);
    };
  }

  /**
   * Subscribe to device status updates
   */
  subscribeToDevice(
    deviceId: string,
    callback: (data: DeviceStatus | null) => void
  ): () => void {
    const deviceRef = ref(this.db, `devices/${deviceId}`);

    const unsubscribe = onValue(
      deviceRef,
      (snapshot: DataSnapshot) => {
        callback(snapshot.val() as DeviceStatus | null);
      },
      (error) => {
        console.error('Device subscription error:', error);
        callback(null);
      }
    );

    // Store reference for cleanup
    this.activeListeners.set(`device-${deviceId}`, deviceRef);

    return () => {
      off(deviceRef);
      this.activeListeners.delete(`device-${deviceId}`);
    };
  }

  /**
   * Subscribe to real-time telemetry events for a session
   */
  subscribeToSessionEvents(
    sessionId: string,
    callback: (events: RealtimeEvent[]) => void
  ): () => void {
    const eventsRef = ref(this.db, `session-events/${sessionId}`);

    const unsubscribe = onValue(
      eventsRef,
      (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          const events = Object.values(data) as RealtimeEvent[];
          callback(events.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ));
        } else {
          callback([]);
        }
      },
      (error) => {
        console.error('Session events subscription error:', error);
        callback([]);
      }
    );

    this.activeListeners.set(`events-${sessionId}`, eventsRef);

    return () => {
      off(eventsRef);
      this.activeListeners.delete(`events-${sessionId}`);
    };
  }

  /**
   * Get current session data (one-time fetch)
   */
  async getSessionData(sessionId: string): Promise<LiveSessionData | null> {
    try {
      const sessionRef = ref(this.db, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      return snapshot.val() as LiveSessionData | null;
    } catch (error) {
      console.error('Error fetching session data:', error);
      return null;
    }
  }

  /**
   * Get device status (one-time fetch)
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const deviceRef = ref(this.db, `devices/${deviceId}`);
      const snapshot = await get(deviceRef);
      return snapshot.val() as DeviceStatus | null;
    } catch (error) {
      console.error('Error fetching device status:', error);
      return null;
    }
  }

  /**
   * Initialize a new live session
   */
  async initializeSession(sessionId: string, userId: string): Promise<void> {
    const sessionRef = ref(this.db, `sessions/${sessionId}`);

    const initialData: LiveSessionData = {
      sessionId,
      status: 'active',
      currentScore: 100,
      distractedSeconds: 0,
      attentiveSeconds: 0,
      eventsCount: 0,
      currentState: 'ATTENTIVE',
      currentReason: 'NONE',
      lastUpdate: new Date().toISOString(),
      startTime: new Date().toISOString(),
    };

    await set(sessionRef, initialData);

    // Also store user-session mapping
    const userSessionRef = ref(this.db, `user-sessions/${userId}/active`);
    await set(userSessionRef, sessionId);
  }

  /**
   * Update session data (typically called by Cloud Functions)
   */
  async updateSessionData(
    sessionId: string,
    data: Partial<LiveSessionData>
  ): Promise<void> {
    const sessionRef = ref(this.db, `sessions/${sessionId}`);

    await update(sessionRef, {
      ...data,
      lastUpdate: new Date().toISOString(),
    });
  }

  /**
   * End a live session
   */
  async endSession(sessionId: string, userId: string): Promise<void> {
    const sessionRef = ref(this.db, `sessions/${sessionId}`);

    await update(sessionRef, {
      status: 'ended',
      lastUpdate: new Date().toISOString(),
    });

    // Remove user-session mapping
    const userSessionRef = ref(this.db, `user-sessions/${userId}/active`);
    await remove(userSessionRef);
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(
    deviceId: string,
    data: Partial<DeviceStatus>
  ): Promise<void> {
    const deviceRef = ref(this.db, `devices/${deviceId}`);

    await update(deviceRef, {
      ...data,
      lastSeen: new Date().toISOString(),
    });
  }

  /**
   * Set device online status with disconnect handling
   */
  async setDeviceOnline(deviceId: string): Promise<void> {
    const deviceRef = ref(this.db, `devices/${deviceId}`);

    // Set device as online
    await update(deviceRef, {
      online: true,
      lastSeen: new Date().toISOString(),
    });

    // Set up disconnect handler to mark device offline
    const disconnectRef = onDisconnect(deviceRef);
    await disconnectRef.update({
      online: false,
      lastSeen: serverTimestamp(),
    });
  }

  /**
   * Set device offline
   */
  async setDeviceOffline(deviceId: string): Promise<void> {
    const deviceRef = ref(this.db, `devices/${deviceId}`);

    await update(deviceRef, {
      online: false,
      lastSeen: new Date().toISOString(),
    });
  }

  /**
   * Get user's active session ID
   */
  async getUserActiveSession(userId: string): Promise<string | null> {
    try {
      const userSessionRef = ref(this.db, `user-sessions/${userId}/active`);
      const snapshot = await get(userSessionRef);
      return snapshot.val() as string | null;
    } catch (error) {
      console.error('Error fetching user active session:', error);
      return null;
    }
  }

  /**
   * Subscribe to user's active session changes
   */
  subscribeToUserActiveSession(
    userId: string,
    callback: (sessionId: string | null) => void
  ): () => void {
    const userSessionRef = ref(this.db, `user-sessions/${userId}/active`);

    const unsubscribe = onValue(
      userSessionRef,
      (snapshot: DataSnapshot) => {
        callback(snapshot.val() as string | null);
      },
      (error) => {
        console.error('User session subscription error:', error);
        callback(null);
      }
    );

    this.activeListeners.set(`user-session-${userId}`, userSessionRef);

    return () => {
      off(userSessionRef);
      this.activeListeners.delete(`user-session-${userId}`);
    };
  }

  /**
   * Clean up all active listeners
   */
  cleanup(): void {
    this.activeListeners.forEach((dbRef, key) => {
      off(dbRef);
    });
    this.activeListeners.clear();
  }
}

// Export singleton instance
export const firebaseRealtimeService = new FirebaseRealtimeService();
