import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Sparkles, Target, Star } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { DetailHeader } from '../../components/DetailHeader';
import { GlassCard } from '../../components/GlassCard';
import { IconBubble } from '../../components/IconBubble';
import { PointerGlyph } from '../../components/PointerGlyph';
import { useEntrance } from '../../hooks/useEntrance';
import type { VoicePointer } from '../../data/types';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';
import { useI18n } from '../../i18n';

interface Props {
  pointer: VoicePointer;
  onBack: () => void;
}

export function TipDetailScreen({ pointer, onBack }: Props) {
  const { t } = useI18n();
  const heroAnim = useEntrance({ offset: 16, duration: 420 });
  const bodyAnim = useEntrance({ offset: 22, duration: 460, delay: 90 });

  return (
    <ScreenBackdrop>
      <View style={styles.headerWrap}>
        <DetailHeader title={t('tips.title')} onBack={onBack} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={heroAnim}>
          <GlassCard padded style={styles.hero}>
            <IconBubble color={pointer.accent} size={62} style={styles.heroIcon}>
              <PointerGlyph name={pointer.icon} color={pointer.accent} size={30} />
            </IconBubble>
            <Text style={[type.title, styles.heroTitle]}>{pointer.title}</Text>
            <Text style={[type.body, styles.heroSummary]}>{pointer.summary}</Text>
          </GlassCard>
        </Animated.View>

        <Animated.View style={bodyAnim}>
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Sparkles size={15} color={palette.goldMark} strokeWidth={2.4} />
              <Text style={[type.overline, styles.blockTitle]}>{t('tips.why')}</Text>
            </View>
            <Text style={[type.body, styles.blockBody]}>{pointer.whyItWorks}</Text>
          </View>

          <GlassCard padded style={styles.taskCard}>
            <View style={styles.blockHead}>
              <Target size={15} color={palette.neonViolet} strokeWidth={2.4} />
              <Text style={[type.overline, styles.blockTitle]}>{t('tips.task')}</Text>
            </View>
            <Text style={[type.bodyStrong, styles.taskBody]}>{pointer.practiceTask}</Text>
          </GlassCard>

          <View style={styles.reminder}>
            <Star size={15} color={palette.goldMark} strokeWidth={2.2} />
            <Text style={styles.reminderText}>{pointer.dailyNote}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: space.xl,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: SCROLL_BOTTOM_GAP,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: space.xxl,
  },
  heroIcon: {
    marginBottom: space.lg,
  },
  heroTitle: {
    textAlign: 'center',
  },
  heroSummary: {
    textAlign: 'center',
    marginTop: space.sm,
  },
  block: {
    marginTop: space.xl,
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  blockTitle: {
    marginLeft: 7,
    color: palette.textSecondary,
  },
  blockBody: {
    lineHeight: 23,
  },
  taskCard: {
    marginTop: space.xl,
    borderColor: palette.violetEdge,
  },
  taskBody: {
    marginTop: 2,
    lineHeight: 22,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.goldDeep,
  },
  reminderText: {
    flex: 1,
    marginLeft: space.sm,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
