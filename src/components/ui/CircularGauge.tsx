import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { COLORS, getRiskLevel, getRiskLevelText } from '@constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  score,
  size = 250,
  strokeWidth = 20,
  animated = true,
}) => {
  const animatedScore = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Arc starts from top (270 degrees / -90 degrees)
  const startAngle = -90;
  const maxAngle = 270; // 3/4 of the circle

  useEffect(() => {
    if (animated) {
      animatedScore.value = withTiming(score, {
        duration: 1000,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      });
    } else {
      animatedScore.value = score;
    }
  }, [score, animated]);

  // Calculate stroke dash offset for the arc
  const animatedProps = useAnimatedProps(() => {
    const normalizedScore = Math.max(0, Math.min(100, animatedScore.value));
    const arcLength = (normalizedScore / 100) * (maxAngle / 360) * circumference;
    const dashOffset = circumference - arcLength;

    return {
      strokeDashoffset: dashOffset,
    };
  });

  // Derive color based on score
  const strokeColor = useDerivedValue(() => {
    const currentScore = animatedScore.value;
    if (currentScore >= 85) {
      return COLORS.success;
    } else if (currentScore >= 70) {
      return interpolateColor(
        currentScore,
        [70, 85],
        [COLORS.warning, COLORS.success]
      );
    } else {
      return interpolateColor(
        currentScore,
        [0, 70],
        [COLORS.danger, COLORS.warning]
      );
    }
  });

  const animatedColorProps = useAnimatedProps(() => {
    return {
      stroke: strokeColor.value,
    };
  });

  const displayScore = Math.round(Math.max(0, Math.min(100, score)));
  const riskLevel = getRiskLevel(score);
  const riskText = getRiskLevelText(riskLevel);

  // Background arc dash array (showing the max arc length)
  const backgroundArcLength = (maxAngle / 360) * circumference;
  const backgroundDashArray = `${backgroundArcLength} ${circumference}`;

  // Foreground arc dash array
  const foregroundDashArray = `${circumference} ${circumference}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation={startAngle} origin={`${center}, ${center}`}>
          {/* Background arc */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={COLORS.surfaceLight}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={backgroundDashArray}
            strokeLinecap="round"
          />
          {/* Animated foreground arc */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={foregroundDashArray}
            strokeLinecap="round"
            animatedProps={{ ...animatedProps, ...animatedColorProps }}
          />
        </G>
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text
          style={[
            styles.scoreText,
            { color: getScoreColor(score) },
          ]}
        >
          {displayScore}
        </Text>
        <Text style={styles.labelText}>Safety Score</Text>
        <View
          style={[
            styles.riskBadge,
            { backgroundColor: getScoreColor(score) + '20' },
          ]}
        >
          <Text
            style={[
              styles.riskText,
              { color: getScoreColor(score) },
            ]}
          >
            {riskText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const getScoreColor = (score: number): string => {
  if (score >= 85) return COLORS.success;
  if (score >= 70) return COLORS.warning;
  return COLORS.danger;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
  },
  labelText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  riskBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CircularGauge;
