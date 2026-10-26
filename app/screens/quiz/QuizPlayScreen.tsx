import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, X, ChevronRight } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { DetailHeader } from '../../components/DetailHeader';
import { GlassCard } from '../../components/GlassCard';
import { AuroraButton } from '../../components/AuroraButton';
import { PressBounce } from '../../components/PressBounce';
import { useEntrance } from '../../hooks/useEntrance';
import type { QuizQuestion } from '../../data/types';
import { palette, radius, space, fontFamily } from '../../theme';
import { useI18n } from '../../i18n';

const LETTERS = ['A', 'B', 'C', 'D'];

interface Props {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: number | null;
  onSelect: (optionIndex: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function OptionRow({
  text,
  letter,
  state,
  onPress,
}: {
  text: string;
  letter: string;
  state: 'idle' | 'correct' | 'wrong' | 'mutedCorrect';
  onPress: () => void;
}) {
  const palettes = {
    idle: { border: palette.hairline, bg: palette.glassFillSoft, fg: palette.textPrimary, badge: palette.violetSoft, badgeFg: palette.goldMark },
    correct: { border: 'rgba(91,216,168,0.6)', bg: palette.correctSoft, fg: palette.mint, badge: palette.correctSoft, badgeFg: palette.mint },
    mutedCorrect: { border: 'rgba(91,216,168,0.5)', bg: palette.correctSoft, fg: palette.mint, badge: palette.correctSoft, badgeFg: palette.mint },
    wrong: { border: 'rgba(244,116,138,0.6)', bg: palette.wrongSoft, fg: palette.wrong, badge: palette.wrongSoft, badgeFg: palette.wrong },
  }[state];

  return (
    <PressBounce onPress={onPress} activeScale={0.98} style={styles.optionWrap}>
      <View style={[styles.option, { borderColor: palettes.border, backgroundColor: palettes.bg }]}>
        <View style={[styles.badge, { backgroundColor: palettes.badge }]}>
          {state === 'correct' || state === 'mutedCorrect' ? (
            <Check size={15} color={palettes.badgeFg} strokeWidth={3} />
          ) : state === 'wrong' ? (
            <X size={15} color={palettes.badgeFg} strokeWidth={3} />
          ) : (
            <Text style={[styles.badgeText, { color: palettes.badgeFg }]}>{letter}</Text>
          )}
        </View>
        <Text style={[styles.optionText, { color: palettes.fg }]}>{text}</Text>
      </View>
    </PressBounce>
  );
}

export function QuizPlayScreen({
  question,
  index,
  total,
  selected,
  onSelect,
  onNext,
  onBack,
}: Props) {
  const { t } = useI18n();
  const answered = selected !== null;
  const cardAnim = useEntrance({ resetKey: question.id, offset: 22, duration: 380 });
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (index + 1) / total,
      duration: 360,
      useNativeDriver: false,
    }).start();
  }, [index, total, progress]);

  const stateFor = (i: number): 'idle' | 'correct' | 'wrong' | 'mutedCorrect' => {
    if (!answered) {
      return 'idle';
    }
    if (i === question.correctIndex) {
      return i === selected ? 'correct' : 'mutedCorrect';
    }
    if (i === selected) {
      return 'wrong';
    }
    return 'idle';
  };

  return (
    <ScreenBackdrop>
      <View style={styles.headerWrap}>
        <DetailHeader
          title={t('quiz.title')}
          caption={t('quiz.questionOf', { i: index + 1, n: total })}
          onBack={onBack}
        />
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={cardAnim}>
          <GlassCard padded style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
          </GlassCard>

          <View style={styles.options}>
            {question.options.map((opt, i) => (
              <OptionRow
                key={i}
                text={opt}
                letter={LETTERS[i]}
                state={stateFor(i)}
                onPress={() => !answered && onSelect(i)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <AuroraButton
          label={index + 1 === total ? t('quiz.seeResults') : t('quiz.next')}
          onPress={onNext}
          disabled={!answered}
          icon={<ChevronRight size={18} color={palette.textOnGold} strokeWidth={2.6} />}
        />
      </View>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: space.xl,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginTop: space.sm,
    marginBottom: space.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.goldMark,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  questionCard: {
    marginBottom: space.lg,
  },
  questionText: {
    fontFamily,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  options: {
    gap: space.md,
  },
  optionWrap: {},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  badgeText: {
    fontFamily,
    fontSize: 13,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    fontFamily,
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    paddingTop: space.sm,
  },
});
