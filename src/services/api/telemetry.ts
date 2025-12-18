/**
 * Telemetry API Service
 * Handles communication with the Raspberry Pi device for telemetry data
 */

import { firebaseAuthService } from '../firebase/auth';
import { DistractionReason, DriverState, TelemetryEvent } from '@/types';

// API base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Request/Response types
export interface TelemetryPayload {
  deviceId: string;
  sessionId: string;
  timestamp: string;
  state: DriverState;
  reason: DistractionReason;
  confidence: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TelemetryBatchPayload {
  deviceId: string;
  sessionId: string;
  events: Array<{
    timestamp: string;
    state: DriverState;
    reason: DistractionReason;
    confidence: number;
  }>;
}

export interface TelemetryResponse {
  success: boolean;
  sessionId: string;
  processedCount?: number;
  error?: string;
}

export interface DeviceRegistrationPayload {
  deviceId: string;
  vehicleId: string;
  firmwareVersion: string;
}

export interface DeviceRegistrationResponse {
  success: boolean;
  apiKey: string;
  deviceId: string;
  error?: string;
}

export interface DeviceHeartbeatPayload {
  deviceId: string;
  batteryLevel?: number;
  firmwareVersion?: string;
  currentSessionId?: string;
}

export interface DeviceHeartbeatResponse {
  success: boolean;
  serverTime: string;
  commands?: string[];
}

class TelemetryApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL || '';
  }

  /**
   * Get authorization headers for API requests
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await firebaseAuthService.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Send a single telemetry event from Raspberry Pi
   * Called by the Raspberry Pi device
   */
  async sendTelemetryEvent(
    payload: TelemetryPayload,
    apiKey: string
  ): Promise<TelemetryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/telemetry/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telemetry submission failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending telemetry:', error);
      return {
        success: false,
        sessionId: payload.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a batch of telemetry events
   * More efficient for Raspberry Pi to batch events
   */
  async sendTelemetryBatch(
    payload: TelemetryBatchPayload,
    apiKey: string
  ): Promise<TelemetryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/telemetry/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Batch telemetry submission failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending telemetry batch:', error);
      return {
        success: false,
        sessionId: payload.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Register a new Raspberry Pi device
   * Called from the mobile app during device setup
   */
  async registerDevice(
    payload: DeviceRegistrationPayload
  ): Promise<DeviceRegistrationResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/devices/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Device registration failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering device:', error);
      return {
        success: false,
        apiKey: '',
        deviceId: payload.deviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send device heartbeat
   * Called periodically by the Raspberry Pi to indicate it's online
   */
  async sendHeartbeat(
    payload: DeviceHeartbeatPayload,
    apiKey: string
  ): Promise<DeviceHeartbeatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Heartbeat failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      return {
        success: false,
        serverTime: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch recent telemetry events for a session
   * Called from the mobile app to display real-time data
   */
  async getSessionTelemetry(
    sessionId: string,
    limit: number = 100
  ): Promise<TelemetryEvent[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseUrl}/telemetry/session/${sessionId}?limit=${limit}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch session telemetry');
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching session telemetry:', error);
      return [];
    }
  }

  /**
   * Trigger score calculation for a completed session
   * Called when a session ends
   */
  async calculateSessionScore(sessionId: string): Promise<{
    success: boolean;
    score?: number;
    error?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/telemetry/calculate-score`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Score calculation failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating session score:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get device status from the backend
   */
  async getDeviceStatus(deviceId: string): Promise<{
    online: boolean;
    lastSeen: string | null;
    batteryLevel?: number;
    firmwareVersion?: string;
  } | null> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/status`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch device status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching device status:', error);
      return null;
    }
  }

  /**
   * Send command to device (e.g., start/stop session)
   */
  async sendDeviceCommand(
    deviceId: string,
    command: 'START_SESSION' | 'STOP_SESSION' | 'CALIBRATE' | 'RESTART',
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/command`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command, params }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Command failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending device command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const telemetryApiService = new TelemetryApiService();
