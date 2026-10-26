import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Bookmark, BookmarkCheck } from './icons';
import { PressBounce } from './PressBounce';
import { palette, radius, space, fontFamily } from '../theme';
import { useI18n } from '../i18n';

interface Props {
  saved: boolean;
  onToggle: () => void;
  /** Compact icon-only mode for card corners. */
  iconOnly?: boolean;
}

/** Animated save / bookmark toggle with a little pop when state changes. */
export function SaveToggle({ saved, onToggle, iconOnly }: Props) {
  const { t } = useI18n();
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  }, [saved, pop]);

  const Icon = saved ? BookmarkCheck : Bookmark;
  const color = saved ? palette.goldMark : palette.textMuted;

  if (iconOnly) {
    return (
      <PressBounce
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={saved ? t('twisters.unsave') : t('twisters.save')}
        style={styles.iconBtn}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Icon size={20} color={color} strokeWidth={2.2} />
        </Animated.View>
      </PressBounce>
    );
  }

  return (
    <PressBounce
      onPress={onToggle}
      accessibilityRole="button"
      style={[styles.chip, saved ? styles.chipSaved : styles.chipIdle]}>
      <View style={styles.chipRow}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Icon size={16} color={color} strokeWidth={2.2} />
        </Animated.View>
        <Text style={[styles.chipText, { color }]}>{saved ? t('twisters.savedChip') : t('twisters.saveChip')}</Text>
      </View>
    </PressBounce>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    padding: 6,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipSaved: {
    backgroundColor: palette.goldSoft,
    borderColor: palette.goldDeep,
  },
  chipIdle: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: palette.hairline,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontFamily,
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 6,
  },
});
