import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { PressBounce } from './PressBounce';
import { palette, radius, space, type } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Use the violet-tinted fill instead of a plain outline. */
  tone?: 'outline' | 'violet';
}

/** Secondary action button (outlined or soft-violet filled). */
export function GhostButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  tone = 'violet',
}: Props) {
  return (
    <PressBounce
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.base,
        tone === 'violet' ? styles.violet : styles.outline,
        style,
      ]}>
      <View style={styles.content}>
        {icon}
        <Text
          style={[type.label, icon ? styles.labelSpaced : null]}
          numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressBounce>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  violet: {
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.violetEdge,
  },
  outline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSpaced: {
    marginLeft: space.sm,
  },
});
