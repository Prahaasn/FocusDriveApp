// FocusDrive Color Palette - Dark Mode Theme

export const COLORS = {
  // Backgrounds
  background: '#0A0E1A',
  surface: '#151B2E',
  surfaceLight: '#1E2640',
  surfaceCard: '#1A2235',

  // Accent colors
  success: '#00D68F',
  warning: '#FFAB00',
  danger: '#FF3366',
  info: '#3366FF',

  // UI elements
  primary: '#00D68F',
  secondary: '#3366FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#8F9BB3',
  textTertiary: '#5A6376',
  border: '#222B45',
  borderLight: '#2E3A59',

  // Chart colors
  chartGreen: '#00D68F',
  chartRed: '#FF3366',
  chartBlue: '#3366FF',
  chartYellow: '#FFAB00',
  chartPurple: '#8F5FE8',

  // Status colors (for different distraction reasons)
  statusPhone: '#FF3366',
  statusEyesClosed: '#FF6B6B',
  statusDrowsy: '#FFAB00',
  statusHeadDown: '#FF8C42',
  statusLookingAway: '#FFA94D',
  statusOther: '#8F9BB3',

  // Gradient colors
  gradientStart: '#00D68F',
  gradientEnd: '#00A67E',
  dangerGradientStart: '#FF3366',
  dangerGradientEnd: '#E62958',

  // Overlay
  overlay: 'rgba(10, 14, 26, 0.8)',
  overlayLight: 'rgba(21, 27, 46, 0.9)',

  // Transparent variants
  successTransparent: 'rgba(0, 214, 143, 0.1)',
  warningTransparent: 'rgba(255, 171, 0, 0.1)',
  dangerTransparent: 'rgba(255, 51, 102, 0.1)',
  infoTransparent: 'rgba(51, 102, 255, 0.1)',
};

/**
 * Get color based on safety score (0-100)
 */
export const getRiskColor = (score: number): string => {
  if (score >= 85) return COLORS.success;
  if (score >= 70) return COLORS.warning;
  return COLORS.danger;
};

/**
 * Get risk level based on safety score (0-100)
 */
export const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score >= 85) return 'low';
  if (score >= 70) return 'medium';
  return 'high';
};

/**
 * Get risk level text
 */
export const getRiskLevelText = (riskLevel: 'low' | 'medium' | 'high'): string => {
  switch (riskLevel) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
  }
};

/**
 * Get color for specific distraction reason
 */
export const getDistractionReasonColor = (reason: string): string => {
  switch (reason.toUpperCase()) {
    case 'PHONE':
      return COLORS.statusPhone;
    case 'EYES_CLOSED':
      return COLORS.statusEyesClosed;
    case 'DROWSY':
      return COLORS.statusDrowsy;
    case 'HEAD_DOWN':
      return COLORS.statusHeadDown;
    case 'LOOKING_AWAY':
      return COLORS.statusLookingAway;
    case 'OTHER':
    default:
      return COLORS.statusOther;
  }
};

/**
 * Get human-readable label for distraction reason
 */
export const getDistractionReasonLabel = (reason: string): string => {
  switch (reason.toUpperCase()) {
    case 'PHONE':
      return 'Phone Use';
    case 'EYES_CLOSED':
      return 'Eyes Closed';
    case 'DROWSY':
      return 'Drowsiness';
    case 'HEAD_DOWN':
      return 'Head Down';
    case 'LOOKING_AWAY':
      return 'Looking Away';
    case 'OTHER':
      return 'Other';
    case 'NONE':
      return 'Attentive';
    default:
      return reason;
  }
};
