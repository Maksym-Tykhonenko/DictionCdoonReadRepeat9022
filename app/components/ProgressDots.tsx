import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../theme';

interface Props {
  count: number;
  index: number;
}

/** Onboarding pager dots; the active dot stretches into a gold pill. */
export function ProgressDots({ count, index }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === index;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              active ? styles.active : styles.idle,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 7,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  active: {
    width: 22,
    backgroundColor: palette.goldMark,
  },
  idle: {
    width: 7,
    backgroundColor: palette.violetEdge,
  },
});
