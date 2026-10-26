import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { PressBounce } from './PressBounce';
import { gradients, palette, radius, space, type } from '../theme';
import { shared } from '../theme/sharedStyles';

interface Props {
  label: string;
  onPress: () => void;
  /** Optional leading icon node (e.g. a lucide icon). */
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Slightly smaller variant for inline use. */
  compact?: boolean;
}

/**
 * Primary gold gradient button. The outer view owns layout/padding while the
 * LinearGradient fills it absolutely, so the gradient can never clip the
 * label or icon.
 */
export function AuroraButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  compact,
}: Props) {
  return (
    <PressBounce
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.base,
        compact && styles.compact,
        !disabled && shared.goldGlow,
        style,
      ]}>
      <LinearGradient
        colors={[...gradients.goldButton]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {icon}
        <Text
          style={[type.label, styles.label, icon ? styles.labelSpaced : null]}
          numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressBounce>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  compact: {
    height: 46,
    borderRadius: radius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  label: {
    color: palette.textOnGold,
    fontSize: 16,
    fontWeight: '700',
  },
  labelSpaced: {
    marginLeft: space.sm,
  },
});
