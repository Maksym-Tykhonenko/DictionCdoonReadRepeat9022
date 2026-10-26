import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Save } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { DetailHeader } from '../../components/DetailHeader';
import { AuroraButton } from '../../components/AuroraButton';
import { SegmentToggle } from '../../components/SegmentToggle';
import { LANGUAGES, useI18n, type LanguageCode } from '../../i18n';
import type { SpeechDraft } from '../../storage/vault';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';

const LANG_CODES = LANGUAGES.map(l => l.code);

interface Props {
  speech: SpeechDraft | null;
  onSave: (draft: { id?: string; title: string; text: string; lang: LanguageCode }) => void;
  onBack: () => void;
}

/** Create / edit the text of a speech to rehearse. */
export function SpeechEditScreen({ speech, onSave, onBack }: Props) {
  const { t, lang: uiLang } = useI18n();
  const [title, setTitle] = useState(speech?.title ?? '');
  const [text, setText] = useState(speech?.text ?? '');
  const [lang, setLang] = useState<LanguageCode>(speech?.lang ?? uiLang);
  const [touched, setTouched] = useState(false);

  const canSave = title.trim().length > 0 && text.trim().length > 0;

  const save = () => {
    setTouched(true);
    if (!canSave) {
      return;
    }
    Keyboard.dismiss();
    onSave({ id: speech?.id, title: title.trim(), text: text.trim(), lang });
  };

  return (
    <ScreenBackdrop>
      <View style={styles.headerWrap}>
        <DetailHeader title={speech ? t('speech.editTitle') : t('speech.new')} onBack={onBack} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={12}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={[type.overline, styles.label]}>{t('speech.fieldTitle')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('speech.titlePlaceholder')}
            placeholderTextColor={palette.textMuted}
            style={[styles.input, touched && !title.trim() && styles.inputError]}
            maxLength={60}
          />

          <Text style={[type.overline, styles.label]}>{t('language.title')}</Text>
          <SegmentToggle
            options={LANG_CODES}
            value={lang}
            onChange={setLang}
            labelFor={code => code.toUpperCase()}
          />

          <Text style={[type.overline, styles.label]}>{t('speech.fieldText')}</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('speech.textPlaceholder')}
            placeholderTextColor={palette.textMuted}
            style={[styles.input, styles.multiline, touched && !text.trim() && styles.inputError]}
            multiline
            textAlignVertical="top"
            maxLength={8000}
          />

          <AuroraButton
            label={t('speech.save')}
            onPress={save}
            icon={<Save size={18} color={palette.textOnGold} strokeWidth={2.4} />}
            style={styles.saveBtn}
          />
          {touched && !canSave ? <Text style={styles.error}>{t('speech.error')}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackdrop>
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
  label: {
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  input: {
    backgroundColor: palette.glassFillSoft,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: palette.textPrimary,
    fontSize: 15,
  },
  multiline: {
    minHeight: 240,
    lineHeight: 22,
  },
  inputError: {
    borderColor: palette.coral,
  },
  saveBtn: {
    marginTop: space.xxl,
  },
  error: {
    color: palette.coral,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: space.md,
  },
});
