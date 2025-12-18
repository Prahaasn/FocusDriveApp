import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '@constants/colors';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = COLORS.primary,
  style,
}) => {
  const rotation = useSharedValue(0);

  const getSizeValue = (): number => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      case 'medium':
      default:
        return 36;
    }
  };

  const sizeValue = getSizeValue();
  const strokeWidth = sizeValue / 8;
  const radius = (sizeValue - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={animatedStyle}>
        <Svg width={sizeValue} height={sizeValue}>
          {/* Background circle */}
          <Circle
            cx={sizeValue / 2}
            cy={sizeValue / 2}
            r={radius}
            stroke={COLORS.surfaceLight}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated arc */}
          <Circle
            cx={sizeValue / 2}
            cy={sizeValue / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
            strokeLinecap="round"
            rotation={-90}
            origin={`${sizeValue / 2}, ${sizeValue / 2}`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
