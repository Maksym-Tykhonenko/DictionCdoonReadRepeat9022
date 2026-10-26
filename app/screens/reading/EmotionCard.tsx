import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Play, CircleCheck, Sparkles } from '../../components/icons';
import { GlassCard } from '../../components/GlassCard';
import { TagPill } from '../../components/TagPill';
import { AuroraButton } from '../../components/AuroraButton';
import { IconBubble } from '../../components/IconBubble';
import { palette, space, type } from '../../theme';
import type { EmotionScript } from '../../data/types';
import { useI18n } from '../../i18n';

interface Props {
  script: EmotionScript;
  done: boolean;
  onStart: (script: EmotionScript) => void;
}

function EmotionCardBase({ script, done, onStart }: Props) {
  const { t } = useI18n();
  return (
    <GlassCard style={styles.card} active={done}>
      <View style={styles.topRow}>
        <IconBubble color={done ? palette.mint : palette.neonViolet} size={40}>
          {done ? (
            <CircleCheck size={20} color={palette.mint} strokeWidth={2.4} />
          ) : (
            <Sparkles size={20} color={palette.neonViolet} strokeWidth={2.2} />
          )}
        </IconBubble>
        <View style={styles.titleCol}>
          <Text style={type.heading} numberOfLines={1}>
            {script.title}
          </Text>
          {done ? <Text style={styles.doneLabel}>{t('reading.completed')}</Text> : null}
        </View>
      </View>

      <Text style={[type.body, styles.desc]} numberOfLines={3}>
        {script.description}
      </Text>

      <View style={styles.tags}>
        {script.emotions.map(tag => (
          <TagPill key={tag} label={tag} dot />
        ))}
      </View>

      <AuroraButton
        label={t('reading.start')}
        compact
        onPress={() => onStart(script)}
        icon={<Play size={16} color={palette.textOnGold} strokeWidth={2.6} />}
        style={styles.btn}
      />
    </GlassCard>
  );
}

export const EmotionCard = memo(EmotionCardBase);

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleCol: {
    flex: 1,
    marginLeft: space.md,
  },
  doneLabel: {
    color: palette.mint,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  desc: {
    marginTop: space.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.md,
  },
  btn: {
    marginTop: space.lg,
  },
});
