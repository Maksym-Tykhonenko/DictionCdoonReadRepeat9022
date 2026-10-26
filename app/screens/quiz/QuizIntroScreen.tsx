import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Mic, Trophy, AudioLines } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { SectionIntro } from '../../components/SectionIntro';
import { AuroraButton } from '../../components/AuroraButton';
import { SoundBars } from '../../components/SoundBars';
import { IconBubble } from '../../components/IconBubble';
import { useEntrance } from '../../hooks/useEntrance';
import { useLibrary } from '../../hooks/useLibrary';
import { QUIZ_ROUND_SIZE } from '../../data/knowledgeQuestions';
import { palette, radius, space } from '../../theme';
import { useI18n } from '../../i18n';

export function QuizIntroScreen({ onStart }: { onStart: () => void }) {
  const { quizScore } = useLibrary();
  const { t } = useI18n();
  const hero = useEntrance({ offset: 18 });

  const bestPct = quizScore
    ? Math.round((quizScore.bestCorrect / Math.max(quizScore.bestTotal, 1)) * 100)
    : null;

  return (
    <ScreenBackdrop>
      <View style={styles.wrap}>
        <Animated.View style={[styles.heroWrap, hero]}>
          <View style={styles.illustration}>
            <LinearGradient
              colors={['rgba(124,92,255,0.30)', 'rgba(231,193,104,0.18)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <IconBubble color={palette.goldMark} size={74}>
              <Mic size={36} color={palette.goldBright} strokeWidth={2} />
            </IconBubble>
            <SoundBars active bars={9} height={34} style={styles.heroBars} />
            <View style={styles.badge}>
              <AudioLines size={16} color={palette.neonViolet} strokeWidth={2.4} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottom}>
          <SectionIntro
            title={t('quiz.title')}
            subtitle={t('quiz.intro', { n: QUIZ_ROUND_SIZE })}
          />

          {bestPct !== null ? (
            <View style={styles.bestRow}>
              <Trophy size={16} color={palette.goldMark} strokeWidth={2.2} />
              <Text style={styles.bestText}>
                {t('quiz.best', {
                  c: quizScore?.bestCorrect ?? 0,
                  t: quizScore?.bestTotal ?? 0,
                  p: bestPct,
                })}
              </Text>
            </View>
          ) : null}

          <AuroraButton label={t('quiz.start')} onPress={onStart} style={styles.startBtn} />
        </View>
      </View>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: space.xl,
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: 240,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.violetEdge,
  },
  heroBars: {
    marginTop: space.xl,
  },
  badge: {
    position: 'absolute',
    top: space.lg,
    right: space.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.violetEdge,
  },
  bottom: {
    paddingBottom: space.xxl,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  bestText: {
    marginLeft: space.sm,
    color: palette.goldMark,
    fontWeight: '700',
    fontSize: 13.5,
  },
  startBtn: {
    marginTop: space.sm,
  },
});
