/**
 * Supabase Client Configuration
 * Initializes Supabase client for PostgreSQL database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { firebaseAuthService } from '../firebase/auth';

// Environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          firebase_uid: string;
          email: string;
          full_name: string;
          profile_photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          firebase_uid: string;
          email: string;
          full_name: string;
          profile_photo_url?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string;
          profile_photo_url?: string | null;
        };
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          make: string;
          model: string;
          year: number;
          license_plate: string;
          device_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          make: string;
          model: string;
          year: number;
          license_plate: string;
          device_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          make?: string;
          model?: string;
          year?: number;
          license_plate?: string;
          device_id?: string | null;
          is_active?: boolean;
        };
      };
      devices: {
        Row: {
          id: string;
          device_id: string;
          vehicle_id: string;
          api_key_hash: string;
          is_active: boolean;
          created_at: string;
          last_seen: string | null;
        };
        Insert: {
          device_id: string;
          vehicle_id: string;
          api_key_hash: string;
          is_active?: boolean;
        };
        Update: {
          is_active?: boolean;
          last_seen?: string;
        };
      };
      driving_sessions: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          start_time: string;
          end_time: string | null;
          duration_seconds: number;
          safety_score: number;
          risk_level: 'low' | 'medium' | 'high';
          total_distracted_seconds: number;
          total_attentive_seconds: number;
          distraction_events_count: number;
          distractions_per_minute: number;
          reason_breakdown: Record<string, number>;
          start_location: Record<string, number> | null;
          end_location: Record<string, number> | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          vehicle_id: string;
          start_time?: string;
          start_location?: Record<string, number> | null;
        };
        Update: {
          end_time?: string;
          duration_seconds?: number;
          safety_score?: number;
          risk_level?: 'low' | 'medium' | 'high';
          total_distracted_seconds?: number;
          total_attentive_seconds?: number;
          distraction_events_count?: number;
          distractions_per_minute?: number;
          reason_breakdown?: Record<string, number>;
          end_location?: Record<string, number> | null;
        };
      };
      distraction_events: {
        Row: {
          id: string;
          session_id: string;
          start_time: string;
          end_time: string;
          duration_seconds: number;
          dominant_reason: string;
          average_confidence: number;
          created_at: string;
        };
        Insert: {
          session_id: string;
          start_time: string;
          end_time: string;
          duration_seconds: number;
          dominant_reason: string;
          average_confidence: number;
        };
        Update: never;
      };
      telemetry_events: {
        Row: {
          id: string;
          session_id: string;
          timestamp: string;
          state: 'ATTENTIVE' | 'DISTRACTED';
          reason: string;
          confidence: number;
          created_at: string;
        };
        Insert: {
          session_id: string;
          timestamp: string;
          state: 'ATTENTIVE' | 'DISTRACTED';
          reason: string;
          confidence: number;
        };
        Update: never;
      };
    };
  };
}

// Create Supabase client with type safety
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Get the current Firebase user's Supabase user ID
 * Maps Firebase UID to Supabase user ID
 */
export async function getSupabaseUserId(): Promise<string | null> {
  const firebaseUser = firebaseAuthService.getCurrentUser();
  if (!firebaseUser) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUser.uid)
      .single();

    if (error) {
      console.error('Error getting Supabase user ID:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error getting Supabase user ID:', error);
    return null;
  }
}

/**
 * Set authorization header for Supabase requests
 * Uses Firebase Auth token for backend validation
 */
export async function setSupabaseAuthHeader(): Promise<void> {
  const token = await firebaseAuthService.getIdToken();
  if (token) {
    // Note: In production, you'd set up RLS policies that validate this token
    // or use a custom Supabase auth solution
  }
}

/**
 * Check if Supabase connection is healthy
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
