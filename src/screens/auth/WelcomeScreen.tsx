import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '@constants/colors';
import { TYPOGRAPHY } from '@constants/typography';
import { SPACING, RADIUS, SHADOWS } from '@constants/spacing';
import type { RootStackParamList } from '@types/index';
import { CarIcon, ChartLineIcon, TargetIcon } from '../../components/icons/Icons';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Drive Safer',
    description: 'FocusDrive monitors your driving behavior in real-time to help you stay focused and avoid distractions.',
    icon: <CarIcon size={64} color={COLORS.primary} />,
  },
  {
    id: '2',
    title: 'Track Progress',
    description: 'View detailed reports of your driving sessions, safety scores, and improvement trends over time.',
    icon: <ChartLineIcon size={64} color={COLORS.primary} />,
  },
  {
    id: '3',
    title: 'Stay Alert',
    description: 'Get instant feedback when distracted driving is detected. Build better driving habits every day.',
    icon: <TargetIcon size={64} color={COLORS.primary} />,
  },
];

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleGetStarted = () => {
    navigation.navigate('SignUp');
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn');
  };

  const handleNextSlide = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        {item.icon}
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {ONBOARDING_SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>FocusDrive</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.slideList}
      />

      {renderPaginationDots()}

      <View style={styles.footer}>
        {currentIndex < ONBOARDING_SLIDES.length - 1 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextSlide}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.signInLink}
          onPress={handleSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING['2xl'],
    alignItems: 'center',
  },
  logo: {
    ...TYPOGRAPHY.display.small,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  slideList: {
    flex: 1,
  },
  slide: {
    width,
    paddingHorizontal: SPACING['3xl'],
    paddingTop: height * 0.08,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: RADIUS['2xl'] * 3,
    backgroundColor: COLORS.successTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING['4xl'],
    ...SHADOWS.md,
  },
  slideTitle: {
    ...TYPOGRAPHY.display.small,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  slideDescription: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.xs,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  footer: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['2xl'],
  },
  nextButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  getStartedButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  getStartedButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.background,
  },
  signInLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  signInText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.textSecondary,
  },
  signInTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
