import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Trophy, Check, X, RotateCcw } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { SectionIntro } from '../../components/SectionIntro';
import { AuroraButton } from '../../components/AuroraButton';
import { GhostButton } from '../../components/GhostButton';
import { useEntrance } from '../../hooks/useEntrance';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';
import { useI18n, type StringKey } from '../../i18n';

interface Props {
  correct: number;
  total: number;
  /** Per-question correctness in answered order. */
  review: boolean[];
  onRetry: () => void;
  onBackToQuiz: () => void;
}

function messageKey(pct: number): StringKey {
  if (pct >= 90) {
    return 'quiz.msg90';
  }
  if (pct >= 60) {
    return 'quiz.msg60';
  }
  if (pct >= 30) {
    return 'quiz.msg30';
  }
  return 'quiz.msg0';
}

export function QuizResultScreen({
  correct,
  total,
  review,
  onRetry,
  onBackToQuiz,
}: Props) {
  const { t } = useI18n();
  const pct = Math.round((correct / Math.max(total, 1)) * 100);
  const anim = useEntrance({ offset: 20, duration: 480 });

  return (
    <ScreenBackdrop>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <SectionIntro title={t('quiz.results')} />

        <Animated.View style={anim}>
          <View style={styles.scoreWrap}>
            <View style={styles.trophyRing}>
              <Trophy size={34} color={palette.goldBright} strokeWidth={2} />
            </View>
            <Text style={styles.scoreBig}>
              {correct}
              <Text style={styles.scoreSmall}>/{total}</Text>
            </Text>
            <Text style={styles.pct}>{t('quiz.correctPct', { p: pct })}</Text>
            <Text style={[type.body, styles.message]}>{t(messageKey(pct))}</Text>
          </View>

          <Text style={[type.overline, styles.reviewLabel]}>{t('quiz.review')}</Text>
          <View style={styles.reviewGrid}>
            {review.map((ok, i) => (
              <View
                key={i}
                style={[styles.reviewCell, ok ? styles.reviewOk : styles.reviewBad]}>
                {ok ? (
                  <Check size={16} color={palette.mint} strokeWidth={3} />
                ) : (
                  <X size={16} color={palette.wrong} strokeWidth={3} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <AuroraButton
              label={t('common.tryAgain')}
              onPress={onRetry}
              icon={<RotateCcw size={18} color={palette.textOnGold} strokeWidth={2.4} />}
              style={styles.flexBtn}
            />
            <GhostButton
              label={t('quiz.backToQuiz')}
              tone="violet"
              onPress={onBackToQuiz}
              style={styles.flexBtn}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: SCROLL_BOTTOM_GAP,
  },
  scoreWrap: {
    alignItems: 'center',
    marginTop: space.lg,
  },
  trophyRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.goldDeep,
  },
  scoreBig: {
    fontSize: 46,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: space.lg,
  },
  scoreSmall: {
    fontSize: 24,
    color: palette.textMuted,
    fontWeight: '700',
  },
  pct: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.goldMark,
    marginTop: 2,
  },
  message: {
    textAlign: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.lg,
  },
  reviewLabel: {
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  reviewCell: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  reviewOk: {
    backgroundColor: palette.correctSoft,
    borderColor: 'rgba(91,216,168,0.5)',
  },
  reviewBad: {
    backgroundColor: palette.wrongSoft,
    borderColor: 'rgba(244,116,138,0.5)',
  },
  actions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xxl,
  },
  flexBtn: {
    flex: 1,
  },
});
