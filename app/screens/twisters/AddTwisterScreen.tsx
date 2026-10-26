import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Save } from '../../components/icons';
import { ScreenBackdrop } from '../../components/ScreenBackdrop';
import { DetailHeader } from '../../components/DetailHeader';
import { AuroraButton } from '../../components/AuroraButton';
import { SegmentToggle } from '../../components/SegmentToggle';
import { useLibrary } from '../../hooks/useLibrary';
import { DIFFICULTY_CHOICES } from '../../data/twisterDeck';
import type { Difficulty } from '../../data/types';
import { palette, radius, space, type, SCROLL_BOTTOM_GAP } from '../../theme';
import { useI18n } from '../../i18n';

export function AddTwisterScreen({ onBack }: { onBack: () => void }) {
  const { addCustomTwister } = useLibrary();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [touched, setTouched] = useState(false);

  const titleOk = title.trim().length > 0;
  const textOk = text.trim().length > 0;
  const canSave = titleOk && textOk;

  const onSave = () => {
    setTouched(true);
    if (!canSave) {
      return;
    }
    addCustomTwister({
      title: title.trim(),
      text: text.trim(),
      difficulty,
    });
    Keyboard.dismiss();
    onBack();
  };

  return (
    <ScreenBackdrop>
      <View style={styles.headerWrap}>
        <DetailHeader title={t('add.title')} onBack={onBack} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={12}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={[type.overline, styles.label]}>{t('add.fieldTitle')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('add.titlePlaceholder')}
              placeholderTextColor={palette.textMuted}
              style={[styles.input, touched && !titleOk && styles.inputError]}
              returnKeyType="next"
              maxLength={48}
            />

            <Text style={[type.overline, styles.label]}>{t('add.fieldText')}</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('add.textPlaceholder')}
              placeholderTextColor={palette.textMuted}
              style={[styles.input, styles.multiline, touched && !textOk && styles.inputError]}
              multiline
              textAlignVertical="top"
              maxLength={220}
            />

            <Text style={[type.overline, styles.label]}>{t('add.fieldDifficulty')}</Text>
            <SegmentToggle
              options={DIFFICULTY_CHOICES}
              value={difficulty}
              onChange={setDifficulty}
              labelFor={d => t(`difficulty.${d}`)}
            />

            <View style={styles.tipBox}>
              <Text style={[type.caption, styles.tipText]}>
                {t('add.tip')}
              </Text>
            </View>

            <AuroraButton
              label={t('add.save')}
              onPress={onSave}
              icon={<Save size={18} color={palette.textOnGold} strokeWidth={2.4} />}
              style={styles.saveBtn}
            />
            {touched && !canSave ? (
              <Text style={styles.errorHint}>
                {t('add.error')}
              </Text>
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
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
    paddingTop: space.lg,
    paddingBottom: SCROLL_BOTTOM_GAP,
  },
  label: {
    marginBottom: space.sm,
    marginTop: space.lg,
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
    minHeight: 120,
    paddingTop: space.md,
  },
  inputError: {
    borderColor: palette.coral,
  },
  tipBox: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.violetSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
  },
  tipText: {
    lineHeight: 18,
  },
  saveBtn: {
    marginTop: space.xxl,
  },
  errorHint: {
    color: palette.coral,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: space.md,
  },
});
