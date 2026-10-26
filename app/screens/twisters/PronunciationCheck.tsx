import React, { useState } from 'react';
import { Linking, Share, StyleSheet, Text, View } from 'react-native';
import { Mic, Square, Share2, RotateCcw, Trophy, MicOff, Swords } from '../../components/icons';
import { GlassCard } from '../../components/GlassCard';
import { AuroraButton } from '../../components/AuroraButton';
import { GhostButton } from '../../components/GhostButton';
import { CircleControl } from '../../components/CircleControl';
import { LevelBars } from '../../components/LevelBars';
import { useVoiceCapture } from '../../hooks/useVoiceCapture';
import { useLibrary } from '../../hooks/useLibrary';
import { useProgress } from '../../hooks/useProgress';
import { duelLink, encodeDuel } from '../../utils/duel';
import { VoiceLab } from '../../native/voiceLab';
import { scorePronunciation, type PronunciationReport, type WordVerdict } from '../../utils/similarity';
import { speechLocaleFor, useI18n, type StringKey } from '../../i18n';
import type { TwisterEntry } from '../../data/types';
import { palette, space, type } from '../../theme';

const MAX_SECONDS = 30;

type Phase = 'idle' | 'recording' | 'processing' | 'result' | 'blocked';

interface Props {
  entry: TwisterEntry;
  /** Friend's score to beat (duel mode). */
  duelScore?: number | null;
  /** Per-word verdicts for colouring the phrase; null clears the colours. */
  onVerdicts: (verdicts: WordVerdict[] | null) => void;
  /** Called right before recording so the guide player can pause. */
  onStart?: () => void;
}

export const VERDICT_COLORS: Record<WordVerdict, string> = {
  hit: palette.mint,
  close: palette.amber,
  miss: palette.coral,
};

/** Records the user reading the twister and scores every word. */
export function PronunciationCheck({ entry, duelScore = null, onVerdicts, onStart }: Props) {
  const { t, lang } = useI18n();
  const { recordTwisterScore, twisterBest } = useLibrary();
  const { recordPractice, completeDaily, dailyTwister } = useProgress();
  const capture = useVoiceCapture();
  const [phase, setPhase] = useState<Phase>('idle');
  const [blockedKey, setBlockedKey] = useState<StringKey>('check.error');
  const [report, setReport] = useState<PronunciationReport | null>(null);
  const [heard, setHeard] = useState('');
  const [duration, setDuration] = useState(0);
  const [newBest, setNewBest] = useState(false);

  const locale = speechLocaleFor(entry.lang ?? lang);

  const block = (key: StringKey) => {
    setBlockedKey(key);
    setPhase('blocked');
  };

  const begin = async () => {
    onStart?.();
    onVerdicts(null);
    setReport(null);
    setNewBest(false);
    if (!capture.available) {
      block('check.unavailable');
      return;
    }
    const perms = await capture.ensurePermissions();
    if (perms.mic !== 'granted') {
      block('check.micDenied');
      return;
    }
    if (perms.speech !== 'granted') {
      block('check.speechDenied');
      return;
    }
    const available = await VoiceLab.isRecognitionAvailable(locale).catch(() => false);
    if (!available) {
      block('check.unavailable');
      return;
    }
    setPhase('recording');
    const started = await capture.start({
      locale,
      transcribe: true,
      maxSeconds: MAX_SECONDS,
      onDone: result => {
        setHeard(result.transcript);
        setDuration(result.duration);
        if (!result.transcript.trim()) {
          setPhase('result');
          return;
        }
        const scored = scorePronunciation(entry.text, result.transcript, result.duration);
        setReport(scored);
        setNewBest(recordTwisterScore(entry.id, scored.accuracy));
        if (dailyTwister?.id === entry.id) {
          completeDaily();
        } else {
          recordPractice();
        }
        onVerdicts(scored.verdicts);
        setPhase('result');
      },
      onError: () => block('check.error'),
    });
    if (!started) {
      block('check.error');
    }
  };

  const finish = () => {
    setPhase('processing');
    void capture.stop();
  };

  const share = () => {
    if (!report) {
      return;
    }
    const code = encodeDuel(entry.id, report.accuracy);
    const message = code
      ? t('duel.message', {
          pct: report.accuracy,
          title: entry.title,
          link: duelLink(code),
          code,
        })
      : t('check.shareMessage', { pct: report.accuracy, title: entry.title });
    Share.share({ message }).catch(() => {});
  };

  const best = twisterBest[entry.id];
  const canDuel = encodeDuel(entry.id, 0) !== null;
  const duelResult =
    duelScore !== null && report
      ? report.accuracy > duelScore
        ? t('duel.won', { mine: report.accuracy, theirs: duelScore })
        : report.accuracy < duelScore
        ? t('duel.lost', { mine: report.accuracy, theirs: duelScore })
        : t('duel.tie', { pct: duelScore })
      : null;

  return (
    <GlassCard padded style={styles.card}>
      <View style={styles.headRow}>
        <Text style={type.heading}>{t('check.title')}</Text>
        {best !== undefined ? (
          <View style={styles.bestRow}>
            <Trophy size={14} color={palette.goldMark} strokeWidth={2.4} />
            <Text style={styles.bestText}>{t('twisters.best', { pct: best })}</Text>
          </View>
        ) : null}
      </View>

      {duelScore !== null ? (
        <View style={styles.duelBanner}>
          <Swords size={16} color={palette.neonViolet} strokeWidth={2.4} />
          <Text style={styles.duelText}>{t('duel.banner', { pct: duelScore })}</Text>
        </View>
      ) : null}

      {phase === 'idle' ? (
        <>
          <Text style={[type.caption, styles.intro]}>{t('check.intro')}</Text>
          <AuroraButton
            label={t('check.start')}
            onPress={begin}
            icon={<Mic size={18} color={palette.textOnGold} strokeWidth={2.4} />}
            style={styles.fullBtn}
          />
        </>
      ) : null}

      {phase === 'recording' ? (
        <View style={styles.center}>
          <LevelBars values={capture.levels} height={40} style={styles.meter} />
          <Text style={styles.timer}>
            {t('check.listening', { s: Math.floor(capture.elapsed) })}
          </Text>
          {capture.liveTranscript ? (
            <Text style={[type.body, styles.live]} numberOfLines={3}>
              {capture.liveTranscript}
            </Text>
          ) : null}
          <CircleControl size={62} glowing onPress={finish} accessibilityLabel={t('a11y.stopRecording')}>
            <Square size={22} color={palette.textOnGold} strokeWidth={2.4} fill={palette.textOnGold} />
          </CircleControl>
          <Text style={[type.caption, styles.tapHint]}>{t('check.tapStop')}</Text>
        </View>
      ) : null}

      {phase === 'processing' ? (
        <Text style={[styles.timer, styles.processing]}>{t('check.processing')}</Text>
      ) : null}

      {phase === 'result' ? (
        <View>
          {report ? (
            <>
              <View style={styles.stats}>
                <Stat label={t('check.accuracy')} value={`${report.accuracy}%`} highlight />
                <Stat label={t('check.wpm')} value={String(report.wpm)} />
                <Stat label={t('check.time')} value={`${duration.toFixed(1)}s`} />
              </View>
              {duelResult ? <Text style={styles.newBest}>{duelResult}</Text> : null}
              {newBest ? (
                <Text style={styles.newBest}>{t('check.newBest')}</Text>
              ) : null}
              <View style={styles.legend}>
                <Legend color={VERDICT_COLORS.hit} label={`${t('check.hit')} ${report.hits}`} />
                <Legend color={VERDICT_COLORS.close} label={`${t('check.close')} ${report.close}`} />
                <Legend color={VERDICT_COLORS.miss} label={`${t('check.miss')} ${report.misses}`} />
              </View>
              <Text style={[type.overline, styles.heardLabel]}>{t('check.heard')}</Text>
              <Text style={[type.body, styles.heard]}>“{heard}”</Text>
            </>
          ) : (
            <Text style={[type.body, styles.message]}>{t('check.nothing')}</Text>
          )}
          <View style={styles.btnRow}>
            <GhostButton
              label={t('check.again')}
              tone="violet"
              onPress={begin}
              icon={<RotateCcw size={16} color={palette.textPrimary} strokeWidth={2.2} />}
              style={styles.flexBtn}
            />
            {report ? (
              <AuroraButton
                label={canDuel ? t('duel.send') : t('check.share')}
                compact
                onPress={share}
                icon={<Share2 size={16} color={palette.textOnGold} strokeWidth={2.4} />}
                style={styles.flexBtn}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {phase === 'blocked' ? (
        <View style={styles.center}>
          <MicOff size={24} color={palette.coral} strokeWidth={2} />
          <Text style={[type.body, styles.message]}>{t(blockedKey)}</Text>
          <View style={styles.btnRow}>
            {blockedKey === 'check.micDenied' || blockedKey === 'check.speechDenied' ? (
              <GhostButton
                label={t('common.openSettings')}
                tone="outline"
                onPress={() => Linking.openSettings()}
                style={styles.flexBtn}
              />
            ) : null}
            <GhostButton
              label={t('common.tryAgain')}
              tone="violet"
              onPress={begin}
              style={styles.flexBtn}
            />
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.statHighlight]}>{value}</Text>
      <Text style={[type.caption, styles.statLabel]}>{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[type.caption, styles.legendText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.xxl,
  },
  duelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
    padding: space.md,
    borderRadius: 12,
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.violetEdge,
  },
  duelText: {
    flex: 1,
    marginLeft: space.sm,
    color: palette.textPrimary,
    fontWeight: '700',
    fontSize: 13.5,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestText: {
    color: palette.goldMark,
    fontWeight: '800',
    fontSize: 12.5,
    marginLeft: 5,
  },
  intro: {
    marginTop: space.sm,
    lineHeight: 18,
  },
  fullBtn: {
    marginTop: space.lg,
  },
  center: {
    alignItems: 'center',
    marginTop: space.md,
  },
  meter: {
    marginVertical: space.sm,
  },
  timer: {
    color: palette.goldMark,
    fontWeight: '700',
    fontSize: 13.5,
    marginBottom: space.md,
  },
  processing: {
    marginTop: space.lg,
    textAlign: 'center',
  },
  live: {
    textAlign: 'center',
    color: palette.textPrimary,
    marginBottom: space.md,
  },
  tapHint: {
    marginTop: space.sm,
  },
  stats: {
    flexDirection: 'row',
    marginTop: space.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  statHighlight: {
    color: palette.goldBright,
    fontSize: 30,
  },
  statLabel: {
    marginTop: 2,
  },
  newBest: {
    marginTop: space.md,
    textAlign: 'center',
    color: palette.goldMark,
    fontWeight: '800',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.lg,
    marginTop: space.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: palette.textSecondary,
  },
  heardLabel: {
    marginTop: space.lg,
  },
  heard: {
    marginTop: space.xs,
    color: palette.textPrimary,
  },
  message: {
    textAlign: 'center',
    marginTop: space.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
    alignSelf: 'stretch',
  },
  flexBtn: {
    flex: 1,
  },
});
