/**
 * Typography System
 * Defines font sizes, line heights, and font weights for consistent text styling
 */

export const TYPOGRAPHY = {
  // Display text (large headings)
  display: {
    large: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700' as const,
    },
    medium: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
    },
    small: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
    },
  },

  // Headings
  heading: {
    h1: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600' as const,
    },
    h4: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
  },

  // Body text
  body: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    medium: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    small: {
      fontSize: 12,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
  },

  // Labels and captions
  label: {
    large: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    medium: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
    small: {
      fontSize: 10,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
  },

  // Caption text
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;
