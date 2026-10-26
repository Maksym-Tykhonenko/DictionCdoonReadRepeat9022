import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Mic,
  Square,
  Play,
  Repeat2,
  RotateCcw,
  MicOff,
  Share2,
} from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { AuroraButton } from '../../components/AuroraButton';
import { GhostButton } from '../../components/GhostButton';
import { CircleControl } from '../../components/CircleControl';
import { LevelBars, compactEnvelope } from '../../components/LevelBars';
import { StepCard } from './StepCard';
import { useReverseRecorder } from '../../hooks/useReverseRecorder';
import { useI18n } from '../../i18n';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';

export function GameTab() {
  const { t } = useI18n();
  const rec = useReverseRecorder();

  const steps = [
    { title: t('game.step1.title'), subtitle: t('game.step1.sub', { s: rec.phraseLimit }) },
    { title: t('game.step2.title'), subtitle: t('game.step2.sub') },
    { title: t('game.step3.title'), subtitle: t('game.step3.sub') },
    { title: t('game.step4.title'), subtitle: t('game.step4.sub') },
  ];

  const recordingView = (
    <>
      <LevelBars values={rec.levels} height={40} style={styles.meter} />
      <Text style={styles.timer}>{t('game.recording', { s: Math.floor(rec.elapsed) })}</Text>
      <CircleControl
        size={64}
        glowing
        onPress={rec.stopRecording}
        accessibilityLabel={t('a11y.stopRecording')}>
        <Square size={24} color={palette.textOnGold} strokeWidth={2.4} fill={palette.textOnGold} />
      </CircleControl>
      <Text style={[type.caption, styles.tapHint]}>{t('game.tapStop')}</Text>
    </>
  );

  const reversedBars = rec.reversed ? compactEnvelope(rec.reversed.envelope) : [];

  return (
    <ScreenBackdrop>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Repeat2 size={22} color={palette.goldMark} strokeWidth={2.4} />
          <Text style={[type.title, styles.titleText]}>{t('game.title')}</Text>
        </View>
        <Text style={[type.body, styles.intro]}>{t('game.intro')}</Text>

        {/* 4-segment progress */}
        <View style={styles.segments}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i + 1 <= rec.activeStep ? styles.segmentOn : styles.segmentOff,
              ]}
            />
          ))}
        </View>

        {rec.notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{t(rec.notice)}</Text>
          </View>
        ) : null}

        {/* Step 1 - Record */}
        <StepCard
          step={1}
          title={steps[0].title}
          subtitle={steps[0].subtitle}
          active={rec.activeStep === 1}
          done={rec.activeStep > 1}>
          {rec.phase === 'denied' ? (
            <View style={styles.deniedBox}>
              <MicOff size={26} color={palette.coral} strokeWidth={2} />
              <Text style={styles.deniedText}>{t('game.micDenied')}</Text>
              <GhostButton
                label={t('common.openSettings')}
                tone="violet"
                onPress={() => Linking.openSettings()}
                style={styles.fullBtn}
              />
            </View>
          ) : rec.phase === 'recording' ? (
            recordingView
          ) : (
            <AuroraButton
              label={t('game.record')}
              onPress={rec.startRecording}
              icon={<Mic size={18} color={palette.textOnGold} strokeWidth={2.4} />}
              style={styles.fullBtn}
            />
          )}
        </StepCard>

        {/* Step 2 - Listen reversed */}
        <StepCard
          step={2}
          title={steps[1].title}
          subtitle={steps[1].subtitle}
          active={rec.activeStep === 2}
          done={rec.activeStep > 2}>
          {rec.phase === 'preparing' ? (
            <Text style={styles.timer}>{t('game.preparing')}</Text>
          ) : (
            <>
              <LevelBars
                values={reversedBars}
                height={36}
                color={palette.neonViolet}
                progress={rec.playing === 'reversed' ? 1 : 0}
                style={styles.meter}
              />
              <AuroraButton
                label={rec.playing === 'reversed' ? t('game.playing') : t('game.listen')}
                onPress={() => rec.play('reversed')}
                disabled={rec.playing === 'reversed'}
                icon={<Play size={18} color={palette.textOnGold} strokeWidth={2.4} />}
                style={styles.fullBtn}
              />
            </>
          )}
        </StepCard>

        {/* Step 3 - Repeat */}
        <StepCard
          step={3}
          title={steps[2].title}
          subtitle={steps[2].subtitle}
          active={rec.activeStep === 3}
          done={rec.activeStep > 3}>
          {rec.phase === 'repeating' ? (
            recordingView
          ) : rec.phase === 'checking' ? (
            <Text style={styles.timer}>{t('game.flipping')}</Text>
          ) : (
            <>
              <AuroraButton
                label={t('game.recordAttempt')}
                onPress={rec.startRepeat}
                icon={<Mic size={18} color={palette.textOnGold} strokeWidth={2.4} />}
                style={styles.fullBtn}
              />
              <GhostButton
                label={rec.playing === 'reversed' ? t('game.playing') : t('game.replay')}
                tone="violet"
                onPress={() => rec.play('reversed')}
                disabled={rec.playing === 'reversed'}
                icon={<Play size={16} color={palette.textPrimary} strokeWidth={2.2} />}
                style={styles.fullBtn}
              />
            </>
          )}
        </StepCard>

        {/* Step 4 - Result */}
        <StepCard
          step={4}
          title={steps[3].title}
          subtitle={steps[3].subtitle}
          active={rec.activeStep === 4}
          done={false}>
          {rec.phase === 'result' && rec.score ? (
            <View style={styles.resultBox}>
              <Text style={styles.matchPct}>{rec.score.total}%</Text>
              <Text style={[type.body, styles.matchLabel]}>
                {t('game.match', { pct: rec.score.total })}
              </Text>

              <View style={styles.breakdown}>
                {rec.score.words !== null ? (
                  <View style={styles.chip}>
                    <Text style={styles.chipValue}>{rec.score.words}%</Text>
                    <Text style={[type.caption, styles.chipLabel]}>{t('game.words')}</Text>
                  </View>
                ) : null}
                <View style={styles.chip}>
                  <Text style={styles.chipValue}>{rec.score.rhythm}%</Text>
                  <Text style={[type.caption, styles.chipLabel]}>{t('game.rhythm')}</Text>
                </View>
              </View>

              {rec.original?.transcript || rec.attemptTranscript ? (
                <View style={styles.transcripts}>
                  {rec.original?.transcript ? (
                    <Text style={[type.caption, styles.transcriptLine]}>
                      {t('game.heardOriginal')}: “{rec.original.transcript}”
                    </Text>
                  ) : null}
                  {rec.attemptTranscript ? (
                    <Text style={[type.caption, styles.transcriptLine]}>
                      {t('game.heardAttempt')}: “{rec.attemptTranscript}”
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.btnRow}>
                <GhostButton
                  label={t('game.playOriginal')}
                  tone="violet"
                  onPress={() => rec.play('original')}
                  disabled={rec.playing === 'original'}
                  icon={<Play size={15} color={palette.textPrimary} strokeWidth={2.2} />}
                  style={styles.flexBtn}
                />
                <GhostButton
                  label={t('game.playFlipped')}
                  tone="violet"
                  onPress={() => rec.play('flipped')}
                  disabled={rec.playing === 'flipped'}
                  icon={<Play size={15} color={palette.textPrimary} strokeWidth={2.2} />}
                  style={styles.flexBtn}
                />
              </View>

              <AuroraButton
                label={rec.sharing ? t('game.sharing') : t('game.share')}
                onPress={rec.shareVideo}
                disabled={rec.sharing}
                icon={<Share2 size={18} color={palette.textOnGold} strokeWidth={2.4} />}
                style={styles.fullBtn}
              />
              <GhostButton
                label={t('game.playAgain')}
                tone="outline"
                onPress={rec.restart}
                style={styles.fullBtn}
              />
            </View>
          ) : null}
        </StepCard>

        <GhostButton
          label={t('game.restart')}
          tone="violet"
          onPress={rec.restart}
          icon={<RotateCcw size={16} color={palette.textPrimary} strokeWidth={2.2} />}
          style={styles.restart}
        />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    marginLeft: space.sm,
    fontSize: 22,
  },
  intro: {
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  segments: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.xl,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  segmentOn: {
    backgroundColor: palette.goldMark,
  },
  segmentOff: {
    backgroundColor: palette.violetSoft,
  },
  notice: {
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.coralSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,124,140,0.4)',
    marginBottom: space.md,
  },
  noticeText: {
    color: palette.coral,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  fullBtn: {
    alignSelf: 'stretch',
    marginTop: space.md,
  },
  meter: {
    marginBottom: space.sm,
  },
  timer: {
    color: palette.goldMark,
    fontWeight: '700',
    fontSize: 13.5,
    marginTop: space.md,
    marginBottom: space.md,
  },
  tapHint: {
    marginTop: space.sm,
  },
  deniedBox: {
    alignItems: 'center',
  },
  deniedText: {
    color: palette.textSecondary,
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: space.md,
  },
  resultBox: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  matchPct: {
    fontSize: 42,
    fontWeight: '800',
    color: palette.goldBright,
  },
  matchLabel: {
    textAlign: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.sm,
  },
  breakdown: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  chip: {
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
  },
  chipValue: {
    color: palette.textPrimary,
    fontWeight: '800',
    fontSize: 17,
  },
  chipLabel: {
    marginTop: 2,
  },
  transcripts: {
    alignSelf: 'stretch',
    marginTop: space.lg,
    gap: space.xs,
  },
  transcriptLine: {
    color: palette.textSecondary,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: space.md,
    alignSelf: 'stretch',
    marginTop: space.lg,
  },
  flexBtn: {
    flex: 1,
  },
  restart: {
    marginTop: space.sm,
  },
});
