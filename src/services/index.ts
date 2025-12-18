/**
 * Services Index
 * Centralized exports for all backend services
 */

// Firebase Services
export { initializeFirebase, getFirebaseAuth, getFirebaseDatabase } from './firebase/config';
export { firebaseAuthService, type AuthResult, type UserProfile } from './firebase/auth';
export {
  firebaseRealtimeService,
  type LiveSessionData,
  type DeviceStatus,
  type RealtimeEvent,
} from './firebase/realtime';

// Supabase Services
export { supabase, getSupabaseUserId, checkSupabaseConnection } from './supabase/client';
export {
  supabaseQueries,
  type TodaySummary,
  type WeeklySummary,
  type SessionFilters,
} from './supabase/queries';
export {
  supabaseMutations,
  type GeoLocation,
  type SessionScoreData,
  type DistractionEventData,
} from './supabase/mutations';

// API Services
export {
  telemetryApiService,
  type TelemetryPayload,
  type TelemetryBatchPayload,
  type TelemetryResponse,
  type DeviceRegistrationPayload,
  type DeviceRegistrationResponse,
  type DeviceHeartbeatPayload,
  type DeviceHeartbeatResponse,
} from './api/telemetry';

export {
  sessionsApiService,
  type ActiveSessionState,
  type SessionStartResult,
  type SessionEndResult,
} from './api/sessions';
