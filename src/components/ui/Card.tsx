import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@constants/colors';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: COLORS.surfaceCard,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.border,
        };
      case 'default':
      default:
        return {
          backgroundColor: COLORS.surfaceCard,
          borderWidth: 1,
          borderColor: COLORS.border,
        };
    }
  };

  const getPaddingValue = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return 12;
      case 'large':
        return 24;
      case 'medium':
      default:
        return 16;
    }
  };

  const cardStyles: StyleProp<ViewStyle> = [
    styles.card,
    getVariantStyles(),
    { padding: getPaddingValue() },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default Card;
