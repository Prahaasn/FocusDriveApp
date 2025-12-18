/**
 * Supabase Database Mutations
 * All INSERT/UPDATE/DELETE operations for modifying PostgreSQL data
 */

import { supabase, Database } from './client';
import { DistractionReason } from '@/types';

// Type aliases
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];
type SessionUpdate = Database['public']['Tables']['driving_sessions']['Update'];
type DistractionEventInsert = Database['public']['Tables']['distraction_events']['Insert'];

// Location type for start/end locations
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

// Session score data from scoring algorithm
export interface SessionScoreData {
  safetyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalDistractedSeconds: number;
  totalAttentiveSeconds: number;
  distractionEventsCount: number;
  distractionsPerMinute: number;
  reasonBreakdown: Record<DistractionReason, number>;
}

// Distraction event data for batch insert
export interface DistractionEventData {
  startTime: string;
  endTime: string;
  durationSeconds: number;
  dominantReason: DistractionReason;
  averageConfidence: number;
}

class SupabaseMutations {
  /**
   * Create a new user profile (called after Firebase signup)
   */
  async createUserProfile(
    firebaseUid: string,
    email: string,
    fullName: string,
    profilePhotoUrl?: string
  ) {
    const insertData: UserInsert = {
      firebase_uid: firebaseUid,
      email,
      full_name: fullName,
      profile_photo_url: profilePhotoUrl || null,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      profilePhotoUrl: data.profile_photo_url || undefined,
      createdAt: data.created_at,
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: {
      email?: string;
      fullName?: string;
      profilePhotoUrl?: string | null;
    }
  ) {
    const updateData: UserUpdate = {};

    if (updates.email !== undefined) {
      updateData.email = updates.email;
    }
    if (updates.fullName !== undefined) {
      updateData.full_name = updates.fullName;
    }
    if (updates.profilePhotoUrl !== undefined) {
      updateData.profile_photo_url = updates.profilePhotoUrl;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      profilePhotoUrl: data.profile_photo_url || undefined,
      createdAt: data.created_at,
    };
  }

  /**
   * Delete user profile (for account deletion)
   */
  async deleteUserProfile(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Add a new vehicle
   */
  async addVehicle(
    userId: string,
    vehicle: {
      make: string;
      model: string;
      year: number;
      licensePlate: string;
      deviceId?: string;
    }
  ) {
    const insertData: VehicleInsert = {
      user_id: userId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.licensePlate,
      device_id: vehicle.deviceId || null,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate,
      deviceId: data.device_id || '',
    };
  }

  /**
   * Update vehicle details
   */
  async updateVehicle(
    vehicleId: string,
    updates: {
      make?: string;
      model?: string;
      year?: number;
      licensePlate?: string;
      deviceId?: string | null;
    }
  ) {
    const updateData: VehicleUpdate = {};

    if (updates.make !== undefined) updateData.make = updates.make;
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.licensePlate !== undefined) updateData.license_plate = updates.licensePlate;
    if (updates.deviceId !== undefined) updateData.device_id = updates.deviceId;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate,
      deviceId: data.device_id || '',
    };
  }

  /**
   * Deactivate a vehicle (soft delete)
   */
  async deactivateVehicle(vehicleId: string) {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('id', vehicleId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Register a new device for a vehicle
   */
  async registerDevice(
    deviceId: string,
    vehicleId: string,
    apiKeyHash: string
  ) {
    const { data, error } = await supabase
      .from('devices')
      .insert({
        device_id: deviceId,
        vehicle_id: vehicleId,
        api_key_hash: apiKeyHash,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Also update vehicle with device ID
    await supabase
      .from('vehicles')
      .update({ device_id: deviceId })
      .eq('id', vehicleId);

    return {
      id: data.id,
      deviceId: data.device_id,
      vehicleId: data.vehicle_id,
    };
  }

  /**
   * Deactivate a device
   */
  async deactivateDevice(deviceId: string) {
    const { error } = await supabase
      .from('devices')
      .update({ is_active: false })
      .eq('device_id', deviceId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Start a new driving session
   */
  async startSession(
    userId: string,
    vehicleId: string,
    startLocation?: GeoLocation
  ) {
    const { data, error } = await supabase
      .from('driving_sessions')
      .insert({
        user_id: userId,
        vehicle_id: vehicleId,
        start_time: new Date().toISOString(),
        start_location: startLocation || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      startTime: data.start_time,
    };
  }

  /**
   * End a driving session
   */
  async endSession(sessionId: string, endLocation?: GeoLocation) {
    const endTime = new Date().toISOString();

    // First get the session to calculate duration
    const { data: session, error: fetchError } = await supabase
      .from('driving_sessions')
      .select('start_time')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;

    const startTime = new Date(session.start_time);
    const durationSeconds = Math.round((new Date().getTime() - startTime.getTime()) / 1000);

    const { data, error } = await supabase
      .from('driving_sessions')
      .update({
        end_time: endTime,
        duration_seconds: durationSeconds,
        end_location: endLocation || null,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      endTime: data.end_time,
      durationSeconds: data.duration_seconds,
    };
  }

  /**
   * Update session with calculated scores (called by Cloud Functions)
   */
  async updateSessionScore(sessionId: string, scoreData: SessionScoreData) {
    const updateData: SessionUpdate = {
      safety_score: scoreData.safetyScore,
      risk_level: scoreData.riskLevel,
      total_distracted_seconds: scoreData.totalDistractedSeconds,
      total_attentive_seconds: scoreData.totalAttentiveSeconds,
      distraction_events_count: scoreData.distractionEventsCount,
      distractions_per_minute: scoreData.distractionsPerMinute,
      reason_breakdown: scoreData.reasonBreakdown,
    };

    const { data, error } = await supabase
      .from('driving_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      safetyScore: data.safety_score,
      riskLevel: data.risk_level,
    };
  }

  /**
   * Insert distraction events for a session (batch insert)
   */
  async insertDistractionEvents(
    sessionId: string,
    events: DistractionEventData[]
  ) {
    if (events.length === 0) return { count: 0 };

    const insertData: DistractionEventInsert[] = events.map((event) => ({
      session_id: sessionId,
      start_time: event.startTime,
      end_time: event.endTime,
      duration_seconds: event.durationSeconds,
      dominant_reason: event.dominantReason,
      average_confidence: event.averageConfidence,
    }));

    const { data, error } = await supabase
      .from('distraction_events')
      .insert(insertData)
      .select();

    if (error) throw error;

    return { count: data?.length || 0 };
  }

  /**
   * Insert a single telemetry event (for real-time tracking)
   */
  async insertTelemetryEvent(
    sessionId: string,
    event: {
      timestamp: string;
      state: 'ATTENTIVE' | 'DISTRACTED';
      reason: DistractionReason;
      confidence: number;
    }
  ) {
    const { error } = await supabase
      .from('telemetry_events')
      .insert({
        session_id: sessionId,
        timestamp: event.timestamp,
        state: event.state,
        reason: event.reason,
        confidence: event.confidence,
      });

    if (error) throw error;

    return { success: true };
  }

  /**
   * Insert multiple telemetry events (batch insert)
   */
  async insertTelemetryEventsBatch(
    sessionId: string,
    events: Array<{
      timestamp: string;
      state: 'ATTENTIVE' | 'DISTRACTED';
      reason: DistractionReason;
      confidence: number;
    }>
  ) {
    if (events.length === 0) return { count: 0 };

    const insertData = events.map((event) => ({
      session_id: sessionId,
      timestamp: event.timestamp,
      state: event.state,
      reason: event.reason,
      confidence: event.confidence,
    }));

    const { data, error } = await supabase
      .from('telemetry_events')
      .insert(insertData)
      .select();

    if (error) throw error;

    return { count: data?.length || 0 };
  }

  /**
   * Delete old telemetry events (cleanup job)
   * Keeps only last 30 days of telemetry data
   */
  async cleanupOldTelemetry() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('telemetry_events')
      .delete()
      .lt('timestamp', thirtyDaysAgo.toISOString());

    if (error) throw error;

    return { success: true };
  }

  /**
   * Update device last seen timestamp
   */
  async updateDeviceLastSeen(deviceId: string) {
    const { error } = await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_id', deviceId);

    if (error) throw error;

    return { success: true };
  }
}

// Export singleton instance
export const supabaseMutations = new SupabaseMutations();
