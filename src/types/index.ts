// TODO: [ALL AGENTS] - Add your types here

// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  fullName: string;
  profilePhotoUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// ============================================
// Vehicle Types
// ============================================

export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  deviceId: string;
}

// ============================================
// Driving Session Types
// ============================================

export interface DrivingSession {
  id: string;
  vehicleId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  safetyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalDistractedSeconds: number;
  totalAttentiveSeconds: number;
  distractionEventsCount: number;
  distractionsPerMinute: number;
  reasonBreakdown: Record<DistractionReason, number>;
}

export interface SessionSummary {
  sessionId: string;
  startTime: string;
  durationMinutes: number;
  safetyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  distractionCount: number;
}

// ============================================
// Telemetry & Distraction Types
// ============================================

export type DistractionReason =
  | 'PHONE'
  | 'EYES_CLOSED'
  | 'DROWSY'
  | 'HEAD_DOWN'
  | 'LOOKING_AWAY'
  | 'OTHER'
  | 'NONE';

export type DriverState = 'ATTENTIVE' | 'DISTRACTED';

export interface TelemetryEvent {
  timestamp: string;
  state: DriverState;
  reason: DistractionReason;
  confidence: number;
}

export interface DistractionEvent {
  id: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  dominantReason: DistractionReason;
  averageConfidence: number;
}

// ============================================
// Statistics & Analytics Types
// ============================================

export interface SessionStats {
  totalSessions: number;
  totalDrivingHours: number;
  averageSafetyScore: number;
  totalDistractions: number;
  mostCommonDistraction: DistractionReason;
}

export interface TrendData {
  date: string;
  safetyScore: number;
  distractionCount: number;
}

// ============================================
// Navigation Types
// ============================================

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  SessionDetail: { sessionId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Reports: undefined;
  Profile: undefined;
};

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
