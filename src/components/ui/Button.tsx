import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '@constants/colors';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const getBackgroundColor = (): string => {
    if (isDisabled) return COLORS.surfaceLight;

    switch (variant) {
      case 'primary':
        return COLORS.primary;
      case 'secondary':
        return COLORS.secondary;
      case 'danger':
        return COLORS.danger;
      case 'ghost':
        return 'transparent';
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return COLORS.textTertiary;

    switch (variant) {
      case 'primary':
        return COLORS.background;
      case 'secondary':
        return COLORS.textPrimary;
      case 'danger':
        return COLORS.textPrimary;
      case 'ghost':
        return COLORS.primary;
      default:
        return COLORS.background;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'ghost') {
      return isDisabled ? COLORS.border : COLORS.primary;
    }
    return 'transparent';
  };

  const getSizeStyles = (): { height: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case 'small':
        return { height: 36, paddingHorizontal: 16, fontSize: 14 };
      case 'large':
        return { height: 56, paddingHorizontal: 32, fontSize: 18 };
      case 'medium':
      default:
        return { height: 48, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderColor: getBorderColor(),
          borderWidth: variant === 'ghost' ? 1 : 0,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: sizeStyles.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
