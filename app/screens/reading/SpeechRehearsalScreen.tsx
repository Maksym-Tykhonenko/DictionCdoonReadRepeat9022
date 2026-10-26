import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Mic, MicOff, RotateCcw, Square } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { DetailHeader } from '../../components/DetailHeader';
import { GlassCard } from '../../components/GlassCard';
import { AuroraButton } from '../../components/AuroraButton';
import { GhostButton } from '../../components/GhostButton';
import { CircleControl } from '../../components/CircleControl';
import { LevelBars } from '../../components/LevelBars';
import { useVoiceCapture } from '../../hooks/useVoiceCapture';
import { useProgress } from '../../hooks/useProgress';
import { VoiceLab } from '../../native/voiceLab';
import { normalizeWords } from '../../utils/similarity';
import { tokenizeWords } from '../../utils/text';
import {
  advanceScriptPosition,
  analyzeRehearsal,
  countFillers,
  type RehearsalReport,
} from '../../utils/speechCoach';
import { speechLocaleFor, useI18n, type StringKey } from '../../i18n';
import type { RehearsalAttempt, SpeechDraft } from '../../storage/vault';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';

const MAX_SECONDS = 600;
const MIN_SECONDS = 5;

type Phase = 'ready' | 'recording' | 'processing' | 'report' | 'blocked';

interface Chunk {
  key: number;
  tokens: Array<{ word: string; isSpace: boolean; wordIndex: number }>;
  firstWord: number;
  lastWord: number;
}

/** Splits the script into sentence chunks, tagging each token with the
 *  index of its first normalized word (for teleprompter tracking). */
function buildChunks(text: string): { chunks: Chunk[]; words: string[] } {
  const sentences = text.match(/[^.!?…\n]+[.!?…]*\s*|\n+/g) ?? [text];
  const words: string[] = [];
  const chunks: Chunk[] = [];
  sentences.forEach((sentence, key) => {
    const firstWord = words.length;
    const tokens = tokenizeWords(sentence).map(tok => {
      const parts = tok.isSpace ? [] : normalizeWords(tok.word);
      const wordIndex = parts.length ? words.length : -1;
      words.push(...parts);
      return { word: tok.word, isSpace: tok.isSpace, wordIndex };
    });
    if (tokens.length) {
      chunks.push({ key, tokens, firstWord, lastWord: words.length - 1 });
    }
  });
  return { chunks, words };
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

interface Props {
  speech: SpeechDraft;
  onAttempt: (attempt: RehearsalAttempt) => void;
  onBack: () => void;
}

export function SpeechRehearsalScreen({ speech, onAttempt, onBack }: Props) {
  const { t } = useI18n();
  const { recordPractice } = useProgress();
  const capture = useVoiceCapture();
  const [phase, setPhase] = useState<Phase>('ready');
  const [blockedKey, setBlockedKey] = useState<StringKey>('check.error');
  const [report, setReport] = useState<RehearsalReport | null>(null);
  const [position, setPosition] = useState(0);

  const { chunks, words } = useMemo(() => buildChunks(speech.text), [speech.text]);
  const chunkY = useRef<Record<number, number>>({});
  const scrollRef = useRef<ScrollView>(null);
  const locale = speechLocaleFor(speech.lang);

  // Follow the speaker through the script.
  useEffect(() => {
    if (phase !== 'recording') {
      return;
    }
    setPosition(prev => advanceScriptPosition(words, capture.liveTranscript, prev));
  }, [capture.liveTranscript, phase, words]);

  useEffect(() => {
    if (phase !== 'recording') {
      return;
    }
    const chunk = chunks.find(c => position <= c.lastWord) ?? chunks[chunks.length - 1];
    const y = chunk ? chunkY.current[chunk.key] : undefined;
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
    }
  }, [position, phase, chunks]);

  const block = (key: StringKey) => {
    setBlockedKey(key);
    setPhase('blocked');
  };

  const start = async () => {
    setReport(null);
    setPosition(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
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
      block('speech.noSpeech');
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
      continuous: true,
      envelopeBinsPerSecond: 10,
      maxSeconds: MAX_SECONDS,
      onDone: result => {
        if (result.duration < MIN_SECONDS || !result.transcript.trim()) {
          block(result.duration < MIN_SECONDS ? 'speech.tooShort' : 'check.nothing');
          return;
        }
        const analysis = analyzeRehearsal({
          script: speech.text,
          transcript: result.transcript,
          duration: result.duration,
          envelope: result.envelope,
          lang: speech.lang,
        });
        setReport(analysis);
        setPhase('report');
        recordPractice();
        onAttempt({
          at: Date.now(),
          duration: Math.round(analysis.duration),
          wpm: analysis.wpm,
          fillerTotal: analysis.fillerTotal,
          coverage: analysis.coverage,
        });
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

  const recording = phase === 'recording';
  const liveWords = normalizeWords(capture.liveTranscript);
  const liveWpm = capture.elapsed > 3 ? Math.round(liveWords.length / (capture.elapsed / 60)) : 0;
  const liveFillers = recording
    ? countFillers(liveWords, speech.lang).reduce((sum, f) => sum + f.count, 0)
    : 0;

  const prompter = (
    <GlassCard active={recording} padded style={styles.prompter}>
      {chunks.map(chunk => (
        <View
          key={chunk.key}
          onLayout={e => {
            chunkY.current[chunk.key] = e.nativeEvent.layout.y;
          }}>
          <Text style={[styles.prompterText, recording && styles.prompterLive]}>
            {chunk.tokens.map((tok, i) => {
              if (tok.isSpace || tok.wordIndex < 0 || !recording) {
                return <Text key={i}>{tok.word}</Text>;
              }
              const said = tok.wordIndex < position;
              const next = tok.wordIndex >= position && tok.wordIndex < position + 6;
              return (
                <Text key={i} style={said ? styles.wordSaid : next ? styles.wordNext : undefined}>
                  {tok.word}
                </Text>
              );
            })}
          </Text>
        </View>
      ))}
    </GlassCard>
  );

  return (
    <ScreenBackdrop>
      <View style={styles.headerWrap}>
        <DetailHeader title={speech.title} caption={t('speech.title')} onBack={onBack} />
      </View>

      {phase === 'report' && report ? (
        <ReportView
          report={report}
          attempts={speech.attempts}
          onAgain={start}
        />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            {prompter}
          </ScrollView>

          <View style={styles.controlBar}>
            {recording ? (
              <>
                <View style={styles.liveRow}>
                  <LiveStat label={t('check.time')} value={formatTime(capture.elapsed)} />
                  <LiveStat label={t('speech.livePace')} value={liveWpm ? String(liveWpm) : '—'} />
                  <LiveStat label={t('speech.liveFillers')} value={String(liveFillers)} />
                </View>
                <LevelBars values={capture.levels} height={28} style={styles.meter} />
                <View style={styles.center}>
                  <CircleControl size={58} glowing onPress={finish} accessibilityLabel={t('speech.finish')}>
                    <Square size={20} color={palette.textOnGold} strokeWidth={2.4} fill={palette.textOnGold} />
                  </CircleControl>
                  <Text style={[type.caption, styles.hint]}>{t('speech.following')}</Text>
                </View>
              </>
            ) : phase === 'processing' ? (
              <Text style={styles.processing}>{t('speech.processing')}</Text>
            ) : phase === 'blocked' ? (
              <View style={styles.center}>
                <MicOff size={22} color={palette.coral} strokeWidth={2} />
                <Text style={[type.body, styles.message]}>{t(blockedKey)}</Text>
                <View style={styles.btnRow}>
                  {blockedKey === 'check.micDenied' || blockedKey === 'speech.noSpeech' ? (
                    <GhostButton
                      label={t('common.openSettings')}
                      tone="outline"
                      onPress={() => Linking.openSettings()}
                      style={styles.flex}
                    />
                  ) : null}
                  <GhostButton label={t('common.tryAgain')} tone="violet" onPress={start} style={styles.flex} />
                </View>
              </View>
            ) : (
              <>
                <AuroraButton
                  label={t('speech.start')}
                  onPress={start}
                  icon={<Mic size={18} color={palette.textOnGold} strokeWidth={2.4} />}
                />
                <Text style={[type.caption, styles.hint]}>{t('speech.cap')}</Text>
              </>
            )}
          </View>
        </>
      )}
    </ScreenBackdrop>
  );
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.liveStat}>
      <Text style={styles.liveValue}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

function ReportView({
  report,
  attempts,
  onAgain,
}: {
  report: RehearsalReport;
  attempts: RehearsalAttempt[];
  onAgain: () => void;
}) {
  const { t } = useI18n();
  const paceKey: StringKey =
    report.pace === 'slow' ? 'speech.paceSlow' : report.pace === 'fast' ? 'speech.paceFast' : 'speech.paceGood';
  const paceColor = report.pace === 'good' ? palette.mint : palette.amber;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[type.title, styles.reportTitle]}>{t('speech.report')}</Text>

      <GlassCard padded style={styles.block}>
        <Text style={type.overline}>{t('speech.pace')}</Text>
        <Text style={[styles.bigValue, { color: paceColor }]}>
          {report.wpm} <Text style={styles.unit}>{t('speech.wpmUnit')}</Text>
        </Text>
        <Text style={[type.body, styles.blockBody]}>{t(paceKey)}</Text>
      </GlassCard>

      <GlassCard padded style={styles.block}>
        <Text style={type.overline}>{t('speech.fillers')}</Text>
        {report.fillerTotal === 0 ? (
          <Text style={[type.body, styles.blockBody]}>{t('speech.fillersNone')}</Text>
        ) : (
          <>
            <Text style={[styles.bigValue, { color: palette.coral }]}>
              {report.fillerTotal}{' '}
              <Text style={styles.unit}>{t('speech.fillersPerMin', { n: report.fillersPerMinute })}</Text>
            </Text>
            <View style={styles.chips}>
              {report.fillers.map(f => (
                <View key={f.phrase} style={styles.chip}>
                  <Text style={styles.chipText}>
                    “{f.phrase}” × {f.count}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
        <Text style={[type.caption, styles.note]}>{t('speech.fillerNote')}</Text>
      </GlassCard>

      <View style={styles.statGrid}>
        <MiniStat label={t('speech.coverage')} value={`${report.coverage}%`} />
        <MiniStat label={t('speech.duration')} value={formatTime(report.duration)} />
        <MiniStat
          label={t('speech.pauses')}
          value={t('speech.pausesValue', { n: report.pauses.count, s: report.pauses.longest })}
        />
      </View>

      {attempts.length > 0 ? (
        <>
          <Text style={[type.overline, styles.historyLabel]}>{t('speech.history')}</Text>
          {attempts.slice(0, 5).map(a => (
            <View key={a.at} style={styles.historyRow}>
              <Text style={[type.caption, styles.historyDate]}>
                {new Date(a.at).toLocaleDateString()}
              </Text>
              <Text style={[type.caption, styles.historyValue]}>
                {a.wpm} {t('speech.wpmUnit')} · {a.fillerTotal} · {a.coverage}%
              </Text>
            </View>
          ))}
        </>
      ) : null}

      <AuroraButton
        label={t('speech.again')}
        onPress={onAgain}
        icon={<RotateCcw size={18} color={palette.textOnGold} strokeWidth={2.4} />}
        style={styles.again}
      />
    </ScrollView>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={[type.caption, styles.miniLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerWrap: {
    paddingHorizontal: space.xl,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: SCROLL_BOTTOM_GAP,
  },
  prompter: {
    minHeight: 200,
  },
  prompterText: {
    fontSize: 19,
    lineHeight: 30,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  prompterLive: {
    fontSize: 24,
    lineHeight: 38,
    color: palette.textMuted,
  },
  wordSaid: {
    color: palette.textSecondary,
  },
  wordNext: {
    color: palette.goldBright,
    fontWeight: '800',
  },
  controlBar: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairlineSoft,
  },
  liveRow: {
    flexDirection: 'row',
  },
  liveStat: {
    flex: 1,
    alignItems: 'center',
  },
  liveValue: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  meter: {
    marginVertical: space.sm,
  },
  center: {
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
    marginTop: space.sm,
  },
  processing: {
    color: palette.goldMark,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: space.lg,
  },
  message: {
    textAlign: 'center',
    marginTop: space.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: space.md,
    alignSelf: 'stretch',
    marginTop: space.md,
  },
  reportTitle: {
    marginBottom: space.md,
  },
  block: {
    marginBottom: space.md,
  },
  bigValue: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: space.xs,
  },
  unit: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textMuted,
  },
  blockBody: {
    marginTop: space.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.coralSoft,
  },
  chipText: {
    color: palette.coral,
    fontWeight: '700',
    fontSize: 12.5,
  },
  note: {
    marginTop: space.md,
  },
  statGrid: {
    flexDirection: 'row',
    gap: space.sm,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    borderRadius: radius.md,
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
  },
  miniValue: {
    color: palette.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
  miniLabel: {
    marginTop: 2,
    textAlign: 'center',
  },
  historyLabel: {
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.hairlineSoft,
  },
  historyDate: {
    color: palette.textSecondary,
  },
  historyValue: {
    color: palette.textPrimary,
  },
  again: {
    marginTop: space.xl,
  },
});
