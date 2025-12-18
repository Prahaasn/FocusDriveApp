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
          <View style={styles.gaugeContainer}>
            {/* Circular Gauge Placeholder - Will be replaced by AGENT_5's CircularGauge */}
            <View style={[styles.gaugePlaceholder, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {Math.round(displayScore)}
              </Text>
              <Text style={styles.scoreLabel}>
                {isSessionActive && currentSession
                  ? currentSession.riskLevelText
                  : 'Today\'s Avg'}
              </Text>
            </View>
          </View>

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
          <Text style={styles.sectionTitle}>Trends - Last 7 Days</Text>
          <View style={styles.chartContainer}>
            {/* Chart Placeholder - Will be replaced by AGENT_5's Chart component */}
            <View style={styles.chartPlaceholder}>
              {weeklySummary.trendData.length > 0 ? (
                <View style={styles.miniChart}>
                  {weeklySummary.trendData.map((point, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chartBar,
                        {
                          height: `${point.score}%`,
                          backgroundColor: getRiskColor(point.score),
                        },
                      ]}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.chartPlaceholderText}>
                  No data available yet
                </Text>
              )}
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Error Banner
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.dangerTransparent,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
  },
  errorDismiss: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },

  // Gauge Section
  gaugeSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  liveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerTransparent,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  durationText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Button Section
  buttonSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sessionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  statAccent: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    width: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 20,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    position: 'absolute',
    bottom: 14,
    right: 18,
  },

  // Trends Section
  trendsSection: {
    paddingHorizontal: 20,
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
    paddingHorizontal: 8,
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 8,
  },
  trendSummary: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trendDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
});

export default DashboardScreen;
