export * from './colors';

// App Configuration Constants
export const APP_CONFIG = {
  APP_NAME: 'FocusDrive',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@focusdrive.com',
};

// Session Constants
export const SESSION_CONFIG = {
  MIN_SESSION_DURATION_SECONDS: 60, // Minimum 1 minute
  MAX_SESSION_DURATION_HOURS: 12, // Maximum 12 hours
  IDLE_TIMEOUT_MINUTES: 5, // End session after 5 minutes of no data
};

// Scoring Constants
export const SCORING_CONFIG = {
  MAX_SCORE: 100,
  MIN_SCORE: 0,
  DISTRACTION_PENALTY_BASE: 5, // Base points deducted per distraction event
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.70,
};

// Time Constants
export const TIME_FORMATS = {
  DATE_SHORT: 'MMM D, YYYY',
  DATE_LONG: 'MMMM D, YYYY',
  TIME_SHORT: 'h:mm A',
  TIME_LONG: 'h:mm:ss A',
  DATETIME: 'MMM D, YYYY h:mm A',
};

// Chart Constants
export const CHART_CONFIG = {
  MAX_DAYS_TREND: 30,
  DEFAULT_DAYS_TREND: 7,
  ANIMATION_DURATION: 300,
};

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
