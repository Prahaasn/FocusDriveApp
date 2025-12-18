import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  COLORS,
  getRiskColor,
  getRiskLevelText,
  getDistractionReasonColor,
  getDistractionReasonLabel,
} from '../../constants/colors';
import { formatDate, formatTime, formatDuration } from '../../utils/formatting';
import {
  RootStackParamList,
  DrivingSession,
  DistractionEvent,
  DistractionReason,
} from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SessionDetailRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;

// Circular Gauge Component
interface CircularGaugeProps {
  score: number;
  size?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ score, size = 160 }) => {
  const color = getRiskColor(score);
  const riskText = getRiskLevelText(
    score >= 85 ? 'low' : score >= 70 ? 'medium' : 'high'
  );
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.gaugeBackground,
          {
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            borderWidth: strokeWidth,
            borderColor: COLORS.surface,
          },
        ]}
      />
      {/* Progress arc (simplified visual) */}
      <View
        style={[
          styles.gaugeProgress,
          {
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: score < 75 ? 'transparent' : color,
            borderBottomColor: score < 50 ? 'transparent' : color,
            borderLeftColor: score < 25 ? 'transparent' : color,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {/* Score text */}
      <View style={styles.gaugeTextContainer}>
        <Text style={[styles.gaugeScore, { color }]}>{score}</Text>
        <Text style={styles.gaugeRiskText}>{riskText}</Text>
      </View>
    </View>
  );
};

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color }) => (
  <View style={styles.metricCard}>
    <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

// Progress Bar Component for Distraction Breakdown
interface ProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  maxValue,
  color,
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarHeader}>
        <Text style={styles.progressBarLabel}>{label}</Text>
        <Text style={styles.progressBarValue}>{formatDuration(value)}</Text>
      </View>
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

// Event Timeline Item Component
interface TimelineItemProps {
  event: DistractionEvent;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ event }) => {
  const color = getDistractionReasonColor(event.dominantReason);
  const label = getDistractionReasonLabel(event.dominantReason);

  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineDot, { backgroundColor: color }]} />
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTime}>{formatTime(event.startTime)}</Text>
          <Text style={[styles.timelineReason, { color }]}>{label}</Text>
        </View>
        <View style={styles.timelineDetails}>
          <Text style={styles.timelineDetail}>
            Duration: {formatDuration(event.durationSeconds)}
          </Text>
          <Text style={styles.timelineDetail}>
            Confidence: {Math.round(event.averageConfidence * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

// Mock data for development
const MOCK_SESSION: DrivingSession = {
  id: '1',
  vehicleId: 'v1',
  userId: 'u1',
  startTime: new Date(Date.now() - 3600000).toISOString(),
  endTime: new Date().toISOString(),
  durationSeconds: 1530,
  safetyScore: 85,
  riskLevel: 'low',
  totalDistractedSeconds: 154,
  totalAttentiveSeconds: 1376,
  distractionEventsCount: 4,
  distractionsPerMinute: 0.16,
  reasonBreakdown: {
    PHONE: 45,
    EYES_CLOSED: 20,
    DROWSY: 0,
    HEAD_DOWN: 0,
    LOOKING_AWAY: 10,
    OTHER: 0,
    NONE: 0,
  },
};

const MOCK_EVENTS: DistractionEvent[] = [
  {
    id: 'e1',
    sessionId: '1',
    startTime: new Date(Date.now() - 3500000).toISOString(),
    endTime: new Date(Date.now() - 3488000).toISOString(),
    durationSeconds: 12,
    dominantReason: 'PHONE',
    averageConfidence: 0.92,
  },
  {
    id: 'e2',
    sessionId: '1',
    startTime: new Date(Date.now() - 3260000).toISOString(),
    endTime: new Date(Date.now() - 3252000).toISOString(),
    durationSeconds: 8,
    dominantReason: 'EYES_CLOSED',
    averageConfidence: 0.87,
  },
  {
    id: 'e3',
    sessionId: '1',
    startTime: new Date(Date.now() - 2900000).toISOString(),
    endTime: new Date(Date.now() - 2875000).toISOString(),
    durationSeconds: 25,
    dominantReason: 'PHONE',
    averageConfidence: 0.95,
  },
  {
    id: 'e4',
    sessionId: '1',
    startTime: new Date(Date.now() - 2100000).toISOString(),
    endTime: new Date(Date.now() - 2090000).toISOString(),
    durationSeconds: 10,
    dominantReason: 'LOOKING_AWAY',
    averageConfidence: 0.78,
  },
];

// Helper to get day of week
const getDayOfWeek = (date: Date): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getDay()];
};

// Helper to get formatted date with day
const getFormattedDateWithDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  const dayOfWeek = getDayOfWeek(date);
  return `${dayOfWeek}, ${formatDate(dateStr)}`;
};

// Helper to find longest distraction event
const getLongestDistraction = (events: DistractionEvent[]): number => {
  if (events.length === 0) return 0;
  return Math.max(...events.map((e) => e.durationSeconds));
};

// Helper to get average confidence
const getAverageConfidence = (events: DistractionEvent[]): number => {
  if (events.length === 0) return 0;
  const sum = events.reduce((acc, e) => acc + e.averageConfidence, 0);
  return sum / events.length;
};

export default function SessionDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SessionDetailRouteProp>();
  const { sessionId } = route.params;

  // TODO: Replace with react-query
  // const { data: session, isLoading } = useQuery({
  //   queryKey: ['session', sessionId],
  //   queryFn: () => supabaseQueries.getSessionDetails(sessionId),
  // });
  //
  // const { data: events } = useQuery({
  //   queryKey: ['events', sessionId],
  //   queryFn: () => supabaseQueries.getSessionEvents(sessionId),
  // });

  const session = MOCK_SESSION;
  const events = MOCK_EVENTS;
  const loading = false;

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!session || !events) {
      return {
        distractedTime: '0s',
        attentiveTime: '0s',
        eventCount: 0,
        eventsPerMinute: '0',
        longestDistraction: '0s',
        avgConfidence: '0%',
      };
    }

    const durationMinutes = session.durationSeconds / 60;

    return {
      distractedTime: formatDuration(session.totalDistractedSeconds),
      attentiveTime: formatDuration(session.totalAttentiveSeconds),
      eventCount: session.distractionEventsCount,
      eventsPerMinute: (session.distractionEventsCount / durationMinutes).toFixed(1),
      longestDistraction: formatDuration(getLongestDistraction(events)),
      avgConfidence: `${Math.round(getAverageConfidence(events) * 100)}%`,
    };
  }, [session, events]);

  // Get distraction breakdown sorted by value
  const distractionBreakdown = useMemo(() => {
    if (!session) return [];

    const breakdown = Object.entries(session.reasonBreakdown)
      .filter(([reason, value]) => reason !== 'NONE' && value > 0)
      .map(([reason, value]) => ({
        reason: reason as DistractionReason,
        value,
        label: getDistractionReasonLabel(reason),
        color: getDistractionReasonColor(reason),
      }))
      .sort((a, b) => b.value - a.value);

    return breakdown;
  }, [session]);

  // Get max value for progress bars
  const maxDistractionValue = useMemo(() => {
    if (distractionBreakdown.length === 0) return 1;
    return Math.max(...distractionBreakdown.map((d) => d.value));
  }, [distractionBreakdown]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!session) return;

    try {
      const startDate = new Date(session.startTime);
      const endDate = session.endTime ? new Date(session.endTime) : new Date();

      const message = `FocusDrive Session Report

Date: ${getFormattedDateWithDay(session.startTime)}
Time: ${formatTime(session.startTime)} - ${formatTime(endDate.toISOString())}

Safety Score: ${session.safetyScore}/100 (${getRiskLevelText(session.riskLevel)})
Duration: ${formatDuration(session.durationSeconds)}

Metrics:
- Distracted Time: ${metrics.distractedTime}
- Attentive Time: ${metrics.attentiveTime}
- Distraction Events: ${metrics.eventCount}
- Events/min: ${metrics.eventsPerMinute}

Distraction Breakdown:
${distractionBreakdown.map((d) => `- ${d.label}: ${formatDuration(d.value)}`).join('\n')}

Tracked with FocusDrive - Stay Focused, Drive Safe`;

      await Share.share({
        message,
        title: 'FocusDrive Session Report',
      });
    } catch (error) {
      if ((error as Error).message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share session report');
      }
    }
  }, [session, metrics, distractionBreakdown]);

  // Handle back
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = new Date(session.startTime);
  const endDate = session.endTime ? new Date(session.endTime) : new Date();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.headerButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Text style={styles.headerButtonText}>{'Share >'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date/Time Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{getFormattedDateWithDay(session.startTime)}</Text>
          <Text style={styles.timeText}>
            {formatTime(startDate.toISOString())} - {formatTime(endDate.toISOString())}
          </Text>
        </View>

        {/* Score Gauge */}
        <View style={styles.gaugeSection}>
          <CircularGauge score={session.safetyScore} size={160} />
        </View>

        {/* Duration */}
        <Text style={styles.durationText}>
          Duration: {formatDuration(session.durationSeconds)}
        </Text>

        {/* Metrics Grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <MetricCard
                label="Distracted"
                value={metrics.distractedTime}
                color={COLORS.danger}
              />
              <MetricCard
                label="Attentive"
                value={metrics.attentiveTime}
                color={COLORS.success}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard label="Events" value={String(metrics.eventCount)} />
              <MetricCard label="Events/m" value={metrics.eventsPerMinute} />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard label="Longest" value={metrics.longestDistraction} />
              <MetricCard label="Avg Conf." value={metrics.avgConfidence} />
            </View>
          </View>
        </View>

        {/* Distraction Breakdown */}
        {distractionBreakdown.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Distraction Breakdown</Text>
            <View style={styles.breakdownContainer}>
              {distractionBreakdown.map((item) => (
                <ProgressBar
                  key={item.reason}
                  label={item.label}
                  value={item.value}
                  maxValue={maxDistractionValue}
                  color={item.color}
                />
              ))}
            </View>
          </View>
        )}

        {/* Event Timeline */}
        {events.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Event Timeline</Text>
            <View style={styles.timelineContainer}>
              {events.map((event, index) => (
                <TimelineItem key={event.id} event={event} />
              ))}
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  dateHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gaugeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gaugeBackground: {
    position: 'absolute',
  },
  gaugeProgress: {
    position: 'absolute',
  },
  gaugeTextContainer: {
    alignItems: 'center',
  },
  gaugeScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  gaugeRiskText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  durationText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  breakdownContainer: {
    gap: 16,
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  progressBarValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timelineContainer: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timelineReason: {
    fontSize: 14,
    fontWeight: '500',
  },
  timelineDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 24,
  },
});
