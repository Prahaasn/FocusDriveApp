/**
 * Supabase Database Queries
 * All SELECT queries for fetching data from PostgreSQL
 */

import { supabase, Database } from './client';
import {
  DrivingSession,
  Vehicle,
  User,
  DistractionEvent,
  SessionSummary,
  TrendData,
  DistractionReason,
} from '@/types';

// Type aliases for database rows
type UserRow = Database['public']['Tables']['users']['Row'];
type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type SessionRow = Database['public']['Tables']['driving_sessions']['Row'];
type DistractionEventRow = Database['public']['Tables']['distraction_events']['Row'];

// Query result types
export interface TodaySummary {
  sessionsCount: number;
  totalDriveTimeSeconds: number;
  avgScore: number;
  totalDistractedSeconds: number;
}

export interface WeeklySummary {
  sessions: DrivingSession[];
  dailyScores: Array<{ day: string; avgScore: number; sessionsCount: number }>;
  totalSessions: number;
  avgScore: number;
}

export interface SessionFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

class SupabaseQueries {
  /**
   * Get user profile by Firebase UID
   */
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapUserRow(data);
  }

  /**
   * Get user profile by Supabase ID
   */
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapUserRow(data);
  }

  /**
   * Get user's vehicles
   */
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapVehicleRow);
  }

  /**
   * Get a single vehicle by ID
   */
  async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapVehicleRow(data);
  }

  /**
   * Get driving sessions with optional filters
   */
  async getDrivingSessions(
    userId: string,
    filters?: SessionFilters
  ): Promise<DrivingSession[]> {
    let query = supabase
      .from('driving_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate);
    }

    if (filters?.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(this.mapSessionRow);
  }

  /**
   * Get a single session with full details
   */
  async getSessionDetails(sessionId: string): Promise<DrivingSession | null> {
    const { data, error } = await supabase
      .from('driving_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapSessionRow(data);
  }

  /**
   * Get distraction events for a session
   */
  async getSessionEvents(sessionId: string): Promise<DistractionEvent[]> {
    const { data, error } = await supabase
      .from('distraction_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapDistractionEventRow);
  }

  /**
   * Get today's driving summary
   */
  async getTodaySummary(userId: string): Promise<TodaySummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();

    const { data, error } = await supabase
      .from('driving_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', todayStart)
      .lt('start_time', todayEnd);

    if (error) throw error;

    const sessions = data || [];

    if (sessions.length === 0) {
      return {
        sessionsCount: 0,
        totalDriveTimeSeconds: 0,
        avgScore: 0,
        totalDistractedSeconds: 0,
      };
    }

    const totalDriveTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const totalScore = sessions.reduce((sum, s) => sum + (s.safety_score || 0), 0);
    const totalDistracted = sessions.reduce((sum, s) => sum + (s.total_distracted_seconds || 0), 0);

    return {
      sessionsCount: sessions.length,
      totalDriveTimeSeconds: totalDriveTime,
      avgScore: Math.round(totalScore / sessions.length),
      totalDistractedSeconds: totalDistracted,
    };
  }

  /**
   * Get weekly driving summary with daily breakdown
   */
  async getWeeklySummary(userId: string): Promise<WeeklySummary> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('driving_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', weekAgo.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    const sessions = (data || []).map(this.mapSessionRow);
    const dailyScores = this.groupByDay(data || []);

    const totalScore = sessions.reduce((sum, s) => sum + s.safetyScore, 0);

    return {
      sessions,
      dailyScores,
      totalSessions: sessions.length,
      avgScore: sessions.length > 0 ? Math.round(totalScore / sessions.length) : 0,
    };
  }

  /**
   * Get monthly trend data for charts
   */
  async getMonthlyTrend(userId: string): Promise<TrendData[]> {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    monthAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('driving_sessions')
      .select('start_time, safety_score, distraction_events_count')
      .eq('user_id', userId)
      .gte('start_time', monthAgo.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    return this.aggregateByDay(data || []);
  }

  /**
   * Get session summaries for list display
   */
  async getSessionSummaries(
    userId: string,
    limit: number = 10
  ): Promise<SessionSummary[]> {
    const { data, error } = await supabase
      .from('driving_sessions')
      .select('id, start_time, duration_seconds, safety_score, risk_level, distraction_events_count')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row) => ({
      sessionId: row.id,
      startTime: row.start_time,
      durationMinutes: Math.round((row.duration_seconds || 0) / 60),
      safetyScore: row.safety_score || 0,
      riskLevel: row.risk_level || 'low',
      distractionCount: row.distraction_events_count || 0,
    }));
  }

  /**
   * Get total session count for a user
   */
  async getSessionCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('driving_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;

    return count || 0;
  }

  /**
   * Get lifetime statistics for a user
   */
  async getLifetimeStats(userId: string) {
    const { data, error } = await supabase
      .from('driving_sessions')
      .select('duration_seconds, safety_score, total_distracted_seconds, distraction_events_count, reason_breakdown')
      .eq('user_id', userId);

    if (error) throw error;

    const sessions = data || [];

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalDrivingHours: 0,
        averageSafetyScore: 0,
        totalDistractions: 0,
        mostCommonDistraction: 'NONE' as DistractionReason,
      };
    }

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const totalScore = sessions.reduce((sum, s) => sum + (s.safety_score || 0), 0);
    const totalDistractions = sessions.reduce((sum, s) => sum + (s.distraction_events_count || 0), 0);

    // Aggregate reason breakdown
    const reasonTotals: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.reason_breakdown) {
        Object.entries(s.reason_breakdown).forEach(([reason, count]) => {
          reasonTotals[reason] = (reasonTotals[reason] || 0) + (count as number);
        });
      }
    });

    const mostCommon = Object.entries(reasonTotals).sort(([, a], [, b]) => b - a)[0];

    return {
      totalSessions: sessions.length,
      totalDrivingHours: Math.round((totalDuration / 3600) * 10) / 10,
      averageSafetyScore: Math.round(totalScore / sessions.length),
      totalDistractions,
      mostCommonDistraction: (mostCommon?.[0] || 'NONE') as DistractionReason,
    };
  }

  // Private helper methods

  private mapUserRow(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      profilePhotoUrl: row.profile_photo_url || undefined,
      createdAt: row.created_at,
    };
  }

  private mapVehicleRow(row: VehicleRow): Vehicle {
    return {
      id: row.id,
      userId: row.user_id,
      make: row.make,
      model: row.model,
      year: row.year,
      licensePlate: row.license_plate,
      deviceId: row.device_id || '',
    };
  }

  private mapSessionRow(row: SessionRow): DrivingSession {
    const durationSeconds = row.duration_seconds || 0;
    const distractionEventsCount = row.distraction_events_count || 0;
    const durationMinutes = durationSeconds / 60;

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      userId: row.user_id,
      startTime: row.start_time,
      endTime: row.end_time || undefined,
      durationSeconds,
      safetyScore: row.safety_score || 0,
      riskLevel: row.risk_level || 'low',
      totalDistractedSeconds: row.total_distracted_seconds || 0,
      totalAttentiveSeconds: row.total_attentive_seconds || 0,
      distractionEventsCount,
      distractionsPerMinute: durationMinutes > 0
        ? Math.round((distractionEventsCount / durationMinutes) * 100) / 100
        : 0,
      reasonBreakdown: (row.reason_breakdown || {}) as Record<DistractionReason, number>,
    };
  }

  private mapDistractionEventRow(row: DistractionEventRow): DistractionEvent {
    return {
      id: row.id,
      sessionId: row.session_id,
      startTime: row.start_time,
      endTime: row.end_time,
      durationSeconds: row.duration_seconds,
      dominantReason: row.dominant_reason as DistractionReason,
      averageConfidence: row.average_confidence,
    };
  }

  private groupByDay(
    sessions: SessionRow[]
  ): Array<{ day: string; avgScore: number; sessionsCount: number }> {
    const grouped: Record<string, { scores: number[]; count: number }> = {};

    sessions.forEach((session) => {
      const day = session.start_time.split('T')[0];
      if (!grouped[day]) {
        grouped[day] = { scores: [], count: 0 };
      }
      grouped[day].scores.push(session.safety_score || 0);
      grouped[day].count++;
    });

    return Object.entries(grouped)
      .map(([day, data]) => ({
        day,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        sessionsCount: data.count,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  private aggregateByDay(
    sessions: Array<{
      start_time: string;
      safety_score: number | null;
      distraction_events_count: number | null;
    }>
  ): TrendData[] {
    const grouped: Record<string, { scores: number[]; distractions: number[] }> = {};

    sessions.forEach((session) => {
      const day = session.start_time.split('T')[0];
      if (!grouped[day]) {
        grouped[day] = { scores: [], distractions: [] };
      }
      grouped[day].scores.push(session.safety_score || 0);
      grouped[day].distractions.push(session.distraction_events_count || 0);
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        safetyScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        distractionCount: data.distractions.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Export singleton instance
export const supabaseQueries = new SupabaseQueries();
