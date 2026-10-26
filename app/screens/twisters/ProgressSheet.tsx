import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Bell, Flame, Swords, Trophy } from '../../components/icons';
import { GlassCard } from '../../components/GlassCard';
import { AuroraButton } from '../../components/AuroraButton';
import { GhostButton } from '../../components/GhostButton';
import { SegmentToggle } from '../../components/SegmentToggle';
import { REMINDER_HOURS, useProgress } from '../../hooks/useProgress';
import { parseDuel } from '../../utils/duel';
import { pushDuel } from '../../state/duelInbox';
import { twisterDeckFor } from '../../data/twisterDeck';
import { useI18n, type StringKey } from '../../i18n';
import { palette, radius, space, type, fontFamily } from '../../theme';

const HOUR_OPTIONS = REMINDER_HOURS.map(h => `${String(h).padStart(2, '0')}:00`);

/** Streak stats, daily reminder settings and "enter a challenge code". */
export function ProgressSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const progress = useProgress();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<StringKey | null>(null);
  const [notifDenied, setNotifDenied] = useState(false);

  const toggleReminder = async (enabled: boolean) => {
    const ok = await progress.setReminder(enabled);
    setNotifDenied(enabled && !ok);
  };

  const pickHour = (label: string) => {
    const hour = REMINDER_HOURS[HOUR_OPTIONS.indexOf(label)];
    void progress.setReminder(true, hour);
  };

  const acceptCode = () => {
    const duel = parseDuel(code);
    if (!duel) {
      setCodeError('progress.duelInvalid');
      return;
    }
    if (!twisterDeckFor(duel.lang).some(entry => entry.id === duel.twisterId)) {
      setCodeError('progress.duelUnknown');
      return;
    }
    setCode('');
    setCodeError(null);
    onClose();
    pushDuel(duel);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <Pressable onPress={() => {}}>
            <GlassCard padded active style={styles.sheet}>
              <Text style={type.title}>{t('progress.title')}</Text>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Flame size={20} color={palette.amber} strokeWidth={2.4} />
                  <Text style={styles.statValue}>{progress.streak}</Text>
                  <Text style={[type.caption, styles.center]}>{t('progress.streak')}</Text>
                </View>
                <View style={styles.stat}>
                  <Trophy size={20} color={palette.goldMark} strokeWidth={2.4} />
                  <Text style={styles.statValue}>{progress.bestStreak}</Text>
                  <Text style={[type.caption, styles.center]}>{t('progress.best')}</Text>
                </View>
              </View>

              <View style={styles.sectionHead}>
                <Bell size={16} color={palette.textSecondary} strokeWidth={2.2} />
                <Text style={[type.bodyStrong, styles.sectionTitle]}>{t('progress.reminders')}</Text>
              </View>
              <SegmentToggle
                options={['off', 'on'] as const}
                value={progress.reminderEnabled ? 'on' : 'off'}
                onChange={v => toggleReminder(v === 'on')}
                labelFor={v => (v === 'on' ? t('progress.on') : t('progress.off'))}
              />
              {progress.reminderEnabled ? (
                <SegmentToggle
                  options={HOUR_OPTIONS}
                  value={`${String(progress.reminderHour).padStart(2, '0')}:00`}
                  onChange={pickHour}
                  style={styles.hours}
                />
              ) : null}
              <Text style={[type.caption, styles.hint]}>
                {notifDenied ? t('progress.remindersDenied') : t('progress.remindersHint')}
              </Text>
              {notifDenied ? (
                <GhostButton
                  label={t('common.openSettings')}
                  tone="outline"
                  onPress={() => Linking.openSettings()}
                  style={styles.settingsBtn}
                />
              ) : null}

              <View style={styles.sectionHead}>
                <Swords size={16} color={palette.textSecondary} strokeWidth={2.2} />
                <Text style={[type.bodyStrong, styles.sectionTitle]}>{t('progress.duelTitle')}</Text>
              </View>
              <View style={styles.codeRow}>
                <TextInput
                  value={code}
                  onChangeText={value => {
                    setCode(value);
                    setCodeError(null);
                  }}
                  placeholder="DC-EN12-87"
                  placeholderTextColor={palette.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.input}
                  returnKeyType="go"
                  onSubmitEditing={acceptCode}
                />
                <AuroraButton
                  label={t('progress.duelGo')}
                  compact
                  onPress={acceptCode}
                  disabled={!code.trim()}
                  style={styles.goBtn}
                />
              </View>
              {codeError ? <Text style={styles.error}>{t(codeError)}</Text> : null}

              <GhostButton
                label={t('progress.close')}
                tone="violet"
                onPress={onClose}
                style={styles.close}
              />
            </GlassCard>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(7,5,18,0.8)',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  sheet: {
    backgroundColor: palette.duskCard,
  },
  stats: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.violetSoft,
  },
  statValue: {
    fontFamily,
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: space.xs,
  },
  center: {
    textAlign: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  sectionTitle: {
    marginLeft: space.sm,
  },
  hours: {
    marginTop: space.sm,
  },
  hint: {
    marginTop: space.sm,
    lineHeight: 17,
  },
  settingsBtn: {
    marginTop: space.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  input: {
    flex: 1,
    fontFamily,
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    backgroundColor: palette.glassFillSoft,
  },
  goBtn: {
    minWidth: 110,
  },
  error: {
    color: palette.coral,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: space.sm,
  },
  close: {
    marginTop: space.xl,
  },
});
