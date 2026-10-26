import React from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { PressBounce } from './PressBounce';
import { palette, radius, space, fontFamily } from '../theme';

interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Display text for an option (defaults to the value itself). */
  labelFor?: (value: T) => string;
  /** Allow horizontal scroll when options overflow. */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Pill segmented control used for filters and reading-speed choices. */
export function SegmentToggle<T extends string>({
  options,
  value,
  onChange,
  labelFor,
  scroll,
  style,
}: Props<T>) {
  const pills = options.map(option => {
    const active = option === value;
    return (
      <PressBounce
        key={option}
        onPress={() => onChange(option)}
        activeScale={0.94}
        style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}>
        <Text
          style={[styles.text, { color: active ? palette.textOnGold : palette.textSecondary }]}>
          {labelFor ? labelFor(option) : option}
        </Text>
      </PressBounce>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.rowScroll, style]}>
        {pills}
      </ScrollView>
    );
  }

  return <View style={[styles.row, style]}>{pills}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  rowScroll: {
    flexDirection: 'row',
    gap: space.sm,
    paddingRight: space.lg,
  },
  pill: {
    paddingHorizontal: space.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillActive: {
    backgroundColor: palette.goldMark,
    borderColor: palette.goldBright,
  },
  pillIdle: {
    backgroundColor: palette.violetSoft,
    borderColor: palette.hairline,
  },
  text: {
    fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
  },
});
