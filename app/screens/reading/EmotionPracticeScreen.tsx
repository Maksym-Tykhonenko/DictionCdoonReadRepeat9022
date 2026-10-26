import React, { useMemo, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Play,
  Pause,
  RotateCcw,
  CircleCheck,
  Repeat,
} from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { DetailHeader } from '../../components/DetailHeader';
import { GlassCard } from '../../components/GlassCard';
import { CircleControl } from '../../components/CircleControl';
import { GhostButton } from '../../components/GhostButton';
import { AuroraButton } from '../../components/AuroraButton';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import { useEntrance } from '../../hooks/useEntrance';
import { useLibrary } from '../../hooks/useLibrary';
import type { EmotionScript } from '../../data/types';
import { palette, space, type } from '../../theme';
import { useI18n } from '../../i18n';

interface Props {
  script: EmotionScript;
  onBack: () => void;
  onAnother: () => void;
}

export function EmotionPracticeScreen({ script, onBack, onAnother }: Props) {
  const { markReadingDone } = useLibrary();
  const { t } = useI18n();
  const [completed, setCompleted] = useState(false);
  const intro = useEntrance({ offset: 14 });

  const player = useStepPlayer({
    count: script.chunks.length,
    durationFor: index => {
      const words = script.chunks[index]?.text.split(/\s+/).length ?? 6;
      return Math.max(1700, words * 230);
    },
  });

  const finish = () => {
    player.pause();
    markReadingDone(script.id);
    setCompleted(true);
  };

  const restartAll = () => {
    player.restart();
    setCompleted(false);
  };

  const caption = useMemo(() => script.emotions.join(' · '), [script.emotions]);

  return (
    <ScreenBackdrop>
      <View style={styles.headerWrap}>
        <DetailHeader title={script.title} caption={caption} onBack={onBack} />
      </View>

      {completed ? (
        <CompletionView script={script} onBack={onBack} onAgain={restartAll} />
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <Animated.View style={intro}>
              {script.chunks.map((chunk, i) => {
                const active = i === player.index;
                const passed = i < player.index;
                return (
                  <View key={i} style={styles.chunk}>
                    <Text style={[styles.cue, active && styles.cueActive]}>
                      {chunk.cue}
                    </Text>
                    {active ? (
                      <GlassCard active padded style={styles.activeChunk}>
                        <Text style={styles.activeText}>{chunk.text}</Text>
                      </GlassCard>
                    ) : (
                      <Text style={[styles.chunkText, passed && styles.chunkPassed]}>
                        {chunk.text}
                      </Text>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          </ScrollView>

          <View style={styles.controlBar}>
            <View style={styles.playRow}>
              <CircleControl
                size={62}
                onPress={player.toggle}
                glowing={player.playing}
                accessibilityLabel={player.playing ? t('a11y.pause') : t('a11y.play')}>
                {player.playing ? (
                  <Pause size={26} color={palette.textOnGold} strokeWidth={2.4} fill={palette.textOnGold} />
                ) : (
                  <Play size={26} color={palette.textOnGold} strokeWidth={2.4} fill={palette.textOnGold} />
                )}
              </CircleControl>
            </View>
            <View style={styles.btnRow}>
              <GhostButton
                label={t('common.restart')}
                tone="violet"
                onPress={restartAll}
                icon={<RotateCcw size={16} color={palette.textPrimary} strokeWidth={2.2} />}
                style={styles.flexBtn}
              />
              <GhostButton
                label={t('reading.complete')}
                tone="outline"
                onPress={finish}
                icon={<CircleCheck size={16} color={palette.mint} strokeWidth={2.2} />}
                style={styles.flexBtn}
              />
            </View>
            <GhostButton
              label={t('reading.another')}
              tone="violet"
              onPress={onAnother}
              icon={<Repeat size={16} color={palette.textPrimary} strokeWidth={2.2} />}
              style={styles.anotherBtn}
            />
          </View>
        </>
      )}
    </ScreenBackdrop>
  );
}

function CompletionView({
  script,
  onBack,
  onAgain,
}: {
  script: EmotionScript;
  onBack: () => void;
  onAgain: () => void;
}) {
  const { t } = useI18n();
  const anim = useEntrance({ offset: 20, duration: 480 });
  return (
    <View style={styles.completeWrap}>
      <Animated.View style={anim}>
        <GlassCard active padded style={styles.completeCard}>
          <View style={styles.completeBadge}>
            <CircleCheck size={34} color={palette.mint} strokeWidth={2.2} />
          </View>
          <Text style={[type.title, styles.completeTitle]}>{t('reading.greatJob')}</Text>
          <Text style={[type.body, styles.completeBody]}>
            {t('reading.completeBody', { emotion: script.emotions[0].toLowerCase() })}
          </Text>
          <View style={styles.completeBtns}>
            <GhostButton label={t('common.back')} tone="violet" onPress={onBack} style={styles.flexBtn} />
            <AuroraButton label={t('common.tryAgain')} compact onPress={onAgain} style={styles.flexBtn} />
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: space.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  chunk: {
    marginBottom: space.lg,
  },
  cue: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: palette.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cueActive: {
    color: palette.coral,
  },
  chunkText: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.textMuted,
  },
  chunkPassed: {
    color: palette.textSecondary,
  },
  activeChunk: {
    marginTop: 2,
  },
  activeText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  controlBar: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairlineSoft,
  },
  playRow: {
    alignItems: 'center',
    marginBottom: space.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  flexBtn: {
    flex: 1,
  },
  anotherBtn: {
    marginTop: space.md,
  },
  completeWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
  },
  completeCard: {
    alignItems: 'center',
  },
  completeBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.correctSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(91,216,168,0.4)',
    marginBottom: space.lg,
  },
  completeTitle: {
    textAlign: 'center',
  },
  completeBody: {
    textAlign: 'center',
    marginTop: space.sm,
  },
  completeBtns: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xl,
    alignSelf: 'stretch',
  },
});
