import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Play, Pause, RotateCcw, CircleCheck } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { DetailHeader } from '../../components/DetailHeader';
import { GlassCard } from '../../components/GlassCard';
import { SegmentToggle } from '../../components/SegmentToggle';
import { CircleControl } from '../../components/CircleControl';
import { GhostButton } from '../../components/GhostButton';
import { TagPill } from '../../components/TagPill';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import { useEntrance } from '../../hooks/useEntrance';
import { tokenizeWords, speakableIndexes, type SpokenToken } from '../../utils/text';
import { normalizeWords, type WordVerdict } from '../../utils/similarity';
import { PronunciationCheck, VERDICT_COLORS } from './PronunciationCheck';
import { useI18n } from '../../i18n';
import type { TwisterEntry } from '../../data/types';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';

type Speed = 'Slow' | 'Normal' | 'Fast';
const SPEED_MS: Record<Speed, number> = { Slow: 720, Normal: 480, Fast: 300 };
const SPEED_KEYS = {
  Slow: 'practice.slow',
  Normal: 'practice.normal',
  Fast: 'practice.fast',
} as const;

/**
 * Maps verdicts for normalized target words back onto display tokens. A
 * token can hold 0 words (a dash) or several ("well-known"); the worst
 * verdict wins.
 */
function verdictsForTokens(
  tokens: SpokenToken[],
  verdicts: WordVerdict[] | null,
): Array<WordVerdict | undefined> {
  if (!verdicts) {
    return [];
  }
  const rank: Record<WordVerdict, number> = { hit: 0, close: 1, miss: 2 };
  let cursor = 0;
  return tokens.map(tok => {
    if (tok.isSpace) {
      return undefined;
    }
    const count = normalizeWords(tok.word).length;
    let worst: WordVerdict | undefined;
    for (let k = 0; k < count; k++) {
      const v = verdicts[cursor + k];
      if (v && (!worst || rank[v] > rank[worst])) {
        worst = v;
      }
    }
    cursor += count;
    return worst;
  });
}

export function TwisterPracticeScreen({
  entry,
  duelScore = null,
  onBack,
}: {
  entry: TwisterEntry;
  /** Friend's score to beat when opened from a duel. */
  duelScore?: number | null;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [speed, setSpeed] = useState<Speed>('Normal');
  const [verdicts, setVerdicts] = useState<WordVerdict[] | null>(null);
  const tokens = useMemo(() => tokenizeWords(entry.text), [entry.text]);
  const speakable = useMemo(() => speakableIndexes(tokens), [tokens]);
  const intro = useEntrance({ offset: 14 });

  const player = useStepPlayer({
    count: speakable.length,
    durationFor: () => SPEED_MS[speed],
  });

  // The currently highlighted token index within the full token list.
  const activeTokenIndex = speakable[player.index] ?? -1;
  const tokenVerdicts = useMemo(() => verdictsForTokens(tokens, verdicts), [tokens, verdicts]);

  const { pause } = player;
  const pauseGuide = useCallback(() => pause(), [pause]);

  // Reset playback if the speed changes mid-run for predictable pacing.
  useEffect(() => {
    if (player.playing) {
      player.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  return (
    <ScreenBackdrop>
      <View style={styles.headerWrap}>
        <DetailHeader
          title={entry.title}
          onBack={onBack}
          right={<TagPill label={t(`difficulty.${entry.difficulty}`)} accentKey={entry.difficulty} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={intro}>
          <GlassCard style={styles.textCard} active>
            <Text style={styles.phrase}>
              {tokens.map((tok, i) => {
                if (tok.isSpace) {
                  return <Text key={i}>{tok.word}</Text>;
                }
                const active = i === activeTokenIndex;
                const verdict = tokenVerdicts[i];
                return (
                  <Text
                    key={i}
                    style={
                      active
                        ? styles.wordActive
                        : verdict
                        ? { color: VERDICT_COLORS[verdict] }
                        : styles.wordIdle
                    }>
                    {tok.word}
                  </Text>
                );
              })}
            </Text>
          </GlassCard>
        </Animated.View>

        <Text style={[type.overline, styles.sectionLabel]}>{t('practice.speed')}</Text>
        <SegmentToggle
          options={['Slow', 'Normal', 'Fast'] as const}
          value={speed}
          onChange={setSpeed}
          labelFor={v => t(SPEED_KEYS[v])}
        />

        <View style={styles.controls}>
          <CircleControl
            onPress={player.toggle}
            glowing={player.playing}
            accessibilityLabel={player.playing ? t('a11y.pause') : t('a11y.play')}>
            {player.playing ? (
              <Pause size={30} color={palette.textOnGold} strokeWidth={2.4} fill={palette.textOnGold} />
            ) : (
              <Play size={30} color={palette.textOnGold} strokeWidth={2.4} fill={palette.textOnGold} />
            )}
          </CircleControl>
        </View>

        <GhostButton
          label={t('common.restart')}
          tone="violet"
          onPress={player.restart}
          icon={<RotateCcw size={17} color={palette.textPrimary} strokeWidth={2.2} />}
          style={styles.restart}
        />

        {player.finished ? (
          <View style={styles.doneCard}>
            <CircleCheck size={18} color={palette.mint} strokeWidth={2.4} />
            <Text style={styles.doneText}>{t('practice.done')}</Text>
          </View>
        ) : (
          <Text style={[type.caption, styles.hint]}>
            {t('practice.hint')}
          </Text>
        )}

        <PronunciationCheck
          entry={entry}
          duelScore={duelScore}
          onVerdicts={setVerdicts}
          onStart={pauseGuide}
        />
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
  textCard: {
    minHeight: 200,
    justifyContent: 'center',
  },
  phrase: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 36,
    fontWeight: '700',
  },
  wordIdle: {
    color: palette.textSecondary,
  },
  wordActive: {
    color: palette.textOnGold,
    backgroundColor: palette.goldMark,
  },
  sectionLabel: {
    marginTop: space.xxl,
    marginBottom: space.md,
    textAlign: 'center',
  },
  controls: {
    alignItems: 'center',
    marginTop: space.xl,
  },
  restart: {
    alignSelf: 'center',
    paddingHorizontal: space.xxl,
    marginTop: space.sm,
  },
  hint: {
    textAlign: 'center',
    marginTop: space.xl,
    paddingHorizontal: space.lg,
  },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xl,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: palette.correctSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(91,216,168,0.4)',
  },
  doneText: {
    color: palette.mint,
    fontWeight: '700',
    fontSize: 13.5,
    marginLeft: space.sm,
  },
});
