import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from './icons';
import { PressBounce } from './PressBounce';
import { palette, radius, space, type } from '../theme';
import { useI18n } from '../i18n';

interface Props {
  title: string;
  /** Optional small label under the title. */
  caption?: string;
  onBack: () => void;
  /** Optional right-aligned control. */
  right?: React.ReactNode;
}

/** Reusable back-arrow header for detail / practice screens. */
export function DetailHeader({ title, caption, onBack, right }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <PressBounce
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.goBack')}
        style={styles.backBtn}>
        <ChevronLeft size={22} color={palette.textPrimary} strokeWidth={2.4} />
      </PressBounce>
      <View style={styles.center}>
        <Text style={type.heading} numberOfLines={1}>
          {title}
        </Text>
        {caption ? (
          <Text style={[type.caption, styles.caption]} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const SIDE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  backBtn: {
    width: SIDE,
    height: SIDE,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.violetEdge,
  },
  center: {
    flex: 1,
    paddingHorizontal: space.md,
  },
  caption: {
    marginTop: 2,
    color: palette.goldMark,
  },
  right: {
    minWidth: SIDE,
    alignItems: 'flex-end',
  },
});
