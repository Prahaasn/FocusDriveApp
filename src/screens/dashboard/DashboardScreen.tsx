import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../hooks/useSession';
import { COLORS, getDistractionReasonLabel, getRiskColor } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/spacing';
import { CircularGauge } from '../../components/ui/CircularGauge';
import { Chart } from '../../components/ui/Chart';

// ============================================
// Dashboard Screen Component
// ============================================

export const DashboardScreen: React.FC = () => {
  const {
    currentSession,
    isSessionActive,
    deviceConnected,
    todaySummary,
    weeklySummary,
    isLoading,
    isLoadingSummaries,
    error,
    startSession,
    endSession,
    refreshSummaries,
    clearError,
  } = useSession();

  // Handle session toggle
  const handleSessionToggle = useCallback(async () => {
    if (isSessionActive) {
      await endSession();
    } else {
      // Using a default vehicle ID - in production, this would come from vehicle selection
      await startSession('default-vehicle');
    }
  }, [isSessionActive, startSession, endSession]);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Get formatted date
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Score to display (either live or today's average)
  const displayScore = isSessionActive && currentSession
    ? currentSession.smoothedScore
    : todaySummary.averageScore;

  const scoreColor = getRiskColor(displayScore);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingSummaries}
            onRefresh={refreshSummaries}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}, Prahaas</Text>
          <Text style={styles.date}>{formattedDate}</Text>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: deviceConnected ? COLORS.success : COLORS.textTertiary },
              ]}
            />
            <Text style={styles.statusText}>
              {deviceConnected ? 'Device Connected' : 'Device Disconnected'}
            </Text>
          </View>
        </View>

        {/* Error Banner */}
        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorDismiss}>Tap to dismiss</Text>
          </TouchableOpacity>
        )}

        {/* Score Gauge Section */}
        <View style={styles.gaugeSection}>
          <CircularGauge
            score={displayScore}
            size={220}
            subtitle={
              isSessionActive && currentSession
                ? currentSession.riskLevelText
                : 'Today\'s Average'
            }
          />

          {/* Live Session Info */}
          {isSessionActive && currentSession && (
            <View style={styles.liveInfo}>
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.durationText}>{currentSession.durationFormatted}</Text>
            </View>
          )}
        </View>

        {/* Session Control Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.sessionButton,
              isSessionActive ? styles.endButton : styles.startButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSessionToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>
                {isSessionActive ? 'End Drive' : 'Start Drive'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Distracted"
              value={
                isSessionActive && currentSession
                  ? currentSession.distractedFormatted
                  : todaySummary.totalDistractedFormatted
              }
              color={COLORS.danger}
            />
            <StatCard
              label="Events/min"
              value={
                isSessionActive && currentSession
                  ? currentSession.eventsPerMinute.toFixed(1)
                  : todaySummary.eventsPerMinute.toFixed(1)
              }
              color={COLORS.warning}
            />
            <StatCard
              label="Top Reason"
              value={getDistractionReasonLabel(
                isSessionActive && currentSession
                  ? currentSession.currentReason
                  : todaySummary.topDistractionReason
              )}
              color={COLORS.info}
            />
            <StatCard
              label="Drives"
              value={todaySummary.totalDrives.toString()}
              color={COLORS.success}
            />
          </View>
        </View>

        {/* Weekly Trends Section */}
        <View style={styles.trendsSection}>
          <Text style={styles.sectionTitle}>7-Day Trend</Text>
          <View style={styles.chartContainer}>
            {weeklySummary.trendData.length > 0 ? (
              <Chart
                type="area"
                data={weeklySummary.trendData.map(point => ({
                  x: point.date,
                  y: point.score,
                }))}
                height={160}
                animated
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No data available yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Complete a few drives to see your trends
                </Text>
              </View>
            )}
          </View>
          <View style={styles.trendSummary}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Avg Score</Text>
              <Text style={[styles.trendValue, { color: getRiskColor(weeklySummary.averageScore) }]}>
                {Math.round(weeklySummary.averageScore)}
              </Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Drive Time</Text>
              <Text style={styles.trendValue}>{weeklySummary.totalDrivingFormatted}</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Sessions</Text>
              <Text style={styles.trendValue}>{weeklySummary.totalSessions}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statAccent, { backgroundColor: color }]} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  greeting: {
    ...TYPOGRAPHY.display.small,
    color: COLORS.textPrimary,
  },
  date: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.xs,
    marginRight: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.textSecondary,
  },

  // Error Banner
  errorBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.dangerTransparent,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  errorText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.danger,
  },
  errorDismiss: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },

  // Gauge Section
  gaugeSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  liveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerTransparent,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.xs,
    marginRight: SPACING.md,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.danger,
    marginRight: SPACING.xs + 2,
  },
  liveText: {
    ...TYPOGRAPHY.label.small,
    fontWeight: '700',
    color: COLORS.danger,
  },
  durationText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Button Section
  buttonSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING['2xl'],
  },
  sessionButton: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  endButton: {
    backgroundColor: COLORS.danger,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.textPrimary,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs - 2,
  },
  statCard: {
    width: '50%',
    padding: SPACING.xs + 2,
  },
  statAccent: {
    position: 'absolute',
    left: SPACING.xs + 2,
    top: SPACING.xs + 2,
    bottom: SPACING.xs + 2,
    width: 4,
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
  },
  statValue: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingLeft: SPACING.xl,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  statLabel: {
    ...TYPOGRAPHY.label.medium,
    color: COLORS.textSecondary,
    position: 'absolute',
    bottom: SPACING.md + 2,
    right: SPACING.lg + 2,
  },

  // Trends Section
  trendsSection: {
    paddingHorizontal: SPACING.xl,
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  emptyState: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  trendSummary: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendLabel: {
    ...TYPOGRAPHY.label.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  trendValue: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.textPrimary,
  },
  trendDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
});

export default DashboardScreen;
