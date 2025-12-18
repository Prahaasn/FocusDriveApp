// TODO: [ALL AGENTS] - Add formatting utilities as needed

/**
 * Format duration in seconds to human-readable string
 * Examples: "2m 30s", "1h 15m", "45s"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format date to readable string
 * Example: "Jan 15, 2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time to readable string
 * Example: "3:45 PM"
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format datetime to readable string
 * Example: "Jan 15, 2024 3:45 PM"
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Format number with commas
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format percentage
 * Example: 0.8567 -> "85.7%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ============================================
// Risk Level Functions
// ============================================

export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Determines the risk level based on safety score.
 * - Low risk: 80-100 (good driving behavior)
 * - Medium risk: 50-79 (needs improvement)
 * - High risk: 0-49 (dangerous driving patterns)
 *
 * @param score - Safety score (0-100)
 * @returns Risk level classification
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 50) return 'medium';
  return 'high';
}

/**
 * Risk level color palette.
 * These colors are designed for accessibility and clear visual distinction.
 */
export const RISK_COLORS = {
  low: '#22C55E',     // Green - safe
  medium: '#F59E0B',  // Amber - caution
  high: '#EF4444',    // Red - danger
} as const;

/**
 * Returns the appropriate color hex code for a given safety score.
 *
 * @param score - Safety score (0-100)
 * @returns Hex color code for the score
 */
export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  return RISK_COLORS[level];
}

/**
 * Returns the appropriate color hex code for a given risk level.
 *
 * @param level - Risk level ('low', 'medium', 'high')
 * @returns Hex color code for the level
 */
export function getRiskLevelColor(level: RiskLevel): string {
  return RISK_COLORS[level];
}

/**
 * Returns a human-readable label for a risk level.
 *
 * @param level - Risk level
 * @returns Formatted label string
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
  }
}

/**
 * Returns a description for a risk level.
 *
 * @param level - Risk level
 * @returns Description of what the level means
 */
export function getRiskLevelDescription(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'Great driving! Keep up the safe behavior.';
    case 'medium':
      return 'Room for improvement. Try to reduce distractions.';
    case 'high':
      return 'Attention needed. Frequent distractions detected.';
  }
}
