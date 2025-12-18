import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '@constants/colors';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
  icon,
}) => {
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'success':
        return COLORS.successTransparent;
      case 'warning':
        return COLORS.warningTransparent;
      case 'danger':
        return COLORS.dangerTransparent;
      case 'info':
        return COLORS.infoTransparent;
      case 'default':
      default:
        return COLORS.surfaceLight;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'danger':
        return COLORS.danger;
      case 'info':
        return COLORS.info;
      case 'default':
      default:
        return COLORS.textSecondary;
    }
  };

  const getSizeStyles = (): {
    paddingHorizontal: number;
    paddingVertical: number;
    fontSize: number;
  } => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 8, paddingVertical: 2, fontSize: 10 };
      case 'large':
        return { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 };
      case 'medium':
      default:
        return { paddingHorizontal: 12, paddingVertical: 4, fontSize: 12 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          { color: getTextColor(), fontSize: sizeStyles.fontSize },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
