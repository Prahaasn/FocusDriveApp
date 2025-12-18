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
import { formatDate, formatTime, formatDuration } from '../../utils/formatting';
import { RootStackParamList, DrivingSession, DistractionReason } from '../../types';

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

// Get icon for distraction reason
const getDistractionIcon = (reason: DistractionReason): string => {
  switch (reason) {
    case 'PHONE':
      return '📱';
    case 'EYES_CLOSED':
      return '😴';
    case 'DROWSY':
      return '😪';
    case 'HEAD_DOWN':
      return '⬇️';
    case 'LOOKING_AWAY':
      return '👀';
    default:
      return '⚠️';
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
  const distractionIcon = getDistractionIcon(mostCommon);

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
            <Text style={styles.distractionIcon}>{distractionIcon}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Empty state component
const EmptyState: React.FC<{ searchQuery: string }> = ({ searchQuery }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📊</Text>
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
            <Text style={styles.clearButtonText}>✕</Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterButtonTextSelected: {
    color: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: 12,
  },
  clearButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  sessionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionHeader: {
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sessionDuration: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
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
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  scoreBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distractionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distractionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  distractionIcon: {
    fontSize: 16,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
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
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
