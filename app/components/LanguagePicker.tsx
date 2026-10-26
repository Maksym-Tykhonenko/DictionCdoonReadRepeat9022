import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { Check, Globe } from './icons';
import { PressBounce } from './PressBounce';
import { GlassCard } from './GlassCard';
import { AuroraButton } from './AuroraButton';
import { LANGUAGES, useI18n } from '../i18n';
import { palette, radius, space, type, fontFamily } from '../theme';

/** Globe chip that opens the language sheet. */
export function LanguageButton() {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressBounce
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('language.title')}
        style={styles.chip}>
        <Globe size={15} color={palette.textSecondary} strokeWidth={2.2} />
        <Text style={styles.chipText}>{lang.toUpperCase()}</Text>
      </PressBounce>
      <LanguageSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { lang, setLang, t } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheetWrap} onPress={() => {}}>
          <GlassCard padded active style={styles.sheet}>
            <Text style={type.title}>{t('language.title')}</Text>
            <Text style={[type.caption, styles.subtitle]}>{t('language.subtitle')}</Text>
            {LANGUAGES.map(item => {
              const selected = item.code === lang;
              return (
                <PressBounce
                  key={item.code}
                  onPress={() => setLang(item.code)}
                  activeScale={0.98}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.row, selected && styles.rowActive]}>
                  <Text style={[styles.rowText, selected && styles.rowTextActive]}>
                    {item.nativeName}
                  </Text>
                  {selected ? (
                    <Check size={18} color={palette.goldMark} strokeWidth={2.6} />
                  ) : null}
                </PressBounce>
              );
            })}
            {lang !== 'en' ? (
              <Text style={[type.caption, styles.note]}>{t('language.contentNote')}</Text>
            ) : null}
            <AuroraButton label={t('language.done')} onPress={onClose} style={styles.done} />
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
  },
  chipText: {
    fontFamily,
    color: palette.textSecondary,
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 5,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(7,5,18,0.78)',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: palette.duskCard,
  },
  subtitle: {
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    backgroundColor: palette.glassFillSoft,
    marginBottom: space.sm,
  },
  rowActive: {
    borderColor: palette.goldDeep,
    backgroundColor: palette.goldSoft,
  },
  rowText: {
    fontFamily,
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  rowTextActive: {
    color: palette.textPrimary,
  },
  note: {
    marginTop: space.sm,
    lineHeight: 17,
  },
  done: {
    marginTop: space.lg,
  },
});
