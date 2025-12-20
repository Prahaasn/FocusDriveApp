import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, getRiskColor } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING, RADIUS, SHADOWS } from '../../constants/spacing';
import { formatDate, formatTime, formatDuration } from '../../utils/formatting';
import { RootStackParamList, DrivingSession, DistractionReason } from '../../types';
import {
  PhoneIcon,
  EyesClosedIcon,
  DrowsyIcon,
  HeadDownIcon,
  LookingAwayIcon,
  AlertTriangleIcon,
  CloseIcon,
  ChartBarIcon,
} from '../../components/icons/Icons';

// Filter options for session history
type FilterOption = 'all' | 'today' | 'week' | 'month';

interface FilterButtonProps {
  label: string;
  value: FilterOption;
  selected: boolean;
  onPress: (value: FilterOption) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, value, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.filterButton, selected && styles.filterButtonSelected]}
    onPress={() => onPress(value)}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterButtonText, selected && styles.filterButtonTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Get icon component for distraction reason
const getDistractionIcon = (reason: DistractionReason, size: number = 18, color: string = COLORS.textSecondary) => {
  switch (reason) {
    case 'PHONE':
      return <PhoneIcon size={size} color={color} />;
    case 'EYES_CLOSED':
      return <EyesClosedIcon size={size} color={color} />;
    case 'DROWSY':
      return <DrowsyIcon size={size} color={color} />;
    case 'HEAD_DOWN':
      return <HeadDownIcon size={size} color={color} />;
    case 'LOOKING_AWAY':
      return <LookingAwayIcon size={size} color={color} />;
    default:
      return <AlertTriangleIcon size={size} color={color} />;
  }
};

// Get most common distraction from breakdown
const getMostCommonDistraction = (
  breakdown: Record<DistractionReason, number>
): DistractionReason => {
  let maxReason: DistractionReason = 'NONE';
  let maxValue = 0;

  Object.entries(breakdown).forEach(([reason, value]) => {
    if (reason !== 'NONE' && value > maxValue) {
      maxValue = value;
      maxReason = reason as DistractionReason;
    }
  });

  return maxReason;
};

// Session list item component
interface SessionListItemProps {
  session: DrivingSession;
  onPress: () => void;
}

const SessionListItem: React.FC<SessionListItemProps> = ({ session, onPress }) => {
  const scoreColor = getRiskColor(session.safetyScore);
  const mostCommon = getMostCommonDistraction(session.reasonBreakdown);

  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>
          {formatDate(session.startTime)} - {formatTime(session.startTime)}
        </Text>
      </View>

      <Text style={styles.sessionDuration}>
        Duration: {formatDuration(session.durationSeconds)}
      </Text>

      <View style={styles.sessionFooter}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score: </Text>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{session.safetyScore}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]} />
        </View>

        <View style={styles.distractionInfo}>
          <Text style={styles.distractionText}>
            Distractions: {session.distractionEventsCount}
          </Text>
          {mostCommon !== 'NONE' && (
            <View style={styles.distractionIconContainer}>
              {getDistractionIcon(mostCommon, 18, COLORS.warning)}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Empty state component
const EmptyState: React.FC<{ searchQuery: string }> = ({ searchQuery }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <ChartBarIcon size={64} color={COLORS.textTertiary} />
    </View>
    <Text style={styles.emptyTitle}>No Sessions Found</Text>
    <Text style={styles.emptyText}>
      {searchQuery
        ? `No sessions match "${searchQuery}"`
        : 'Start a driving session to see your history here.'}
    </Text>
  </View>
);

// Mock data for development - will be replaced with real data from Supabase
const MOCK_SESSIONS: DrivingSession[] = [
  {
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
  },
  {
    id: '2',
    vehicleId: 'v1',
    userId: 'u1',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 84000000).toISOString(),
    durationSeconds: 2400,
    safetyScore: 72,
    riskLevel: 'medium',
    totalDistractedSeconds: 320,
    totalAttentiveSeconds: 2080,
    distractionEventsCount: 8,
    distractionsPerMinute: 0.2,
    reasonBreakdown: {
      PHONE: 120,
      EYES_CLOSED: 80,
      DROWSY: 45,
      HEAD_DOWN: 30,
      LOOKING_AWAY: 45,
      OTHER: 0,
      NONE: 0,
    },
  },
  {
    id: '3',
    vehicleId: 'v1',
    userId: 'u1',
    startTime: new Date(Date.now() - 172800000).toISOString(),
    endTime: new Date(Date.now() - 170000000).toISOString(),
    durationSeconds: 1800,
    safetyScore: 92,
    riskLevel: 'low',
    totalDistractedSeconds: 60,
    totalAttentiveSeconds: 1740,
    distractionEventsCount: 2,
    distractionsPerMinute: 0.07,
    reasonBreakdown: {
      PHONE: 0,
      EYES_CLOSED: 30,
      DROWSY: 0,
      HEAD_DOWN: 0,
      LOOKING_AWAY: 30,
      OTHER: 0,
      NONE: 0,
    },
  },
  {
    id: '4',
    vehicleId: 'v1',
    userId: 'u1',
    startTime: new Date(Date.now() - 259200000).toISOString(),
    endTime: new Date(Date.now() - 256000000).toISOString(),
    durationSeconds: 3200,
    safetyScore: 58,
    riskLevel: 'high',
    totalDistractedSeconds: 580,
    totalAttentiveSeconds: 2620,
    distractionEventsCount: 15,
    distractionsPerMinute: 0.28,
    reasonBreakdown: {
      PHONE: 200,
      EYES_CLOSED: 150,
      DROWSY: 100,
      HEAD_DOWN: 80,
      LOOKING_AWAY: 50,
      OTHER: 0,
      NONE: 0,
    },
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ReportsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with react-query
  // const { data: sessions, refetch, isLoading } = useQuery({
  //   queryKey: ['sessions', filter],
  //   queryFn: () => supabaseQueries.getDrivingSessions(userId, filter),
  // });

  const sessions = MOCK_SESSIONS;

  // Filter sessions based on selected filter and search query
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply date filter
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case 'today':
        filtered = filtered.filter(
          (s) => new Date(s.startTime) >= startOfToday
        );
        break;
      case 'week':
        filtered = filtered.filter(
          (s) => new Date(s.startTime) >= startOfWeek
        );
        break;
      case 'month':
        filtered = filtered.filter(
          (s) => new Date(s.startTime) >= startOfMonth
        );
        break;
    }

    // Apply search filter (search by date)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        formatDate(s.startTime).toLowerCase().includes(query)
      );
    }

    // Sort by date (most recent first)
    filtered.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return filtered;
  }, [sessions, filter, searchQuery]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Replace with react-query refetch
    // await refetch();
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Navigate to session detail
  const handleSessionPress = useCallback(
    (sessionId: string) => {
      navigation.navigate('SessionDetail', { sessionId });
    },
    [navigation]
  );

  // Render session item
  const renderSession = useCallback(
    ({ item }: { item: DrivingSession }) => (
      <SessionListItem
        session={item}
        onPress={() => handleSessionPress(item.id)}
      />
    ),
    [handleSessionPress]
  );

  // Key extractor
  const keyExtractor = useCallback((item: DrivingSession) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Session History</Text>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <FilterButton
          label="All"
          value="all"
          selected={filter === 'all'}
          onPress={setFilter}
        />
        <FilterButton
          label="Today"
          value="today"
          selected={filter === 'today'}
          onPress={setFilter}
        />
        <FilterButton
          label="This Week"
          value="week"
          selected={filter === 'week'}
          onPress={setFilter}
        />
        <FilterButton
          label="This Month"
          value="month"
          selected={filter === 'month'}
          onPress={setFilter}
        />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <CloseIcon size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Session list */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSession}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.display.small,
    color: COLORS.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.label.large,
    color: COLORS.textSecondary,
  },
  filterButtonTextSelected: {
    color: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body.large,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    flexGrow: 1,
  },
  sessionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sessionHeader: {
    marginBottom: SPACING.sm,
  },
  sessionDate: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sessionDuration: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    ...TYPOGRAPHY.body.large,
    fontWeight: 'bold',
    marginRight: SPACING.xs + 2,
  },
  scoreBadge: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.xs + 1,
  },
  distractionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  distractionText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.textSecondary,
  },
  distractionIconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['3xl'],
    paddingTop: SPACING['6xl'] + 16,
  },
  emptyIconContainer: {
    marginBottom: SPACING.lg,
    opacity: 0.6,
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.lg,
    ...TYPOGRAPHY.body.large,
    color: COLORS.textSecondary,
  },
});
