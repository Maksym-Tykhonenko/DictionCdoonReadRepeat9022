import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '../../components/icons';
import { GlassCard } from '../../components/GlassCard';
import { IconBubble } from '../../components/IconBubble';
import { PointerGlyph } from '../../components/PointerGlyph';
import { PressBounce } from '../../components/PressBounce';
import { palette, space, type } from '../../theme';
import type { VoicePointer } from '../../data/types';

interface Props {
  pointer: VoicePointer;
  onOpen: (pointer: VoicePointer) => void;
}

function TipRowBase({ pointer, onOpen }: Props) {
  return (
    <PressBounce onPress={() => onOpen(pointer)} activeScale={0.98} style={styles.wrap}>
      <GlassCard padded style={styles.card}>
        <View style={styles.row}>
          <IconBubble color={pointer.accent} size={44}>
            <PointerGlyph name={pointer.icon} color={pointer.accent} size={22} />
          </IconBubble>
          <View style={styles.col}>
            <Text style={type.bodyStrong} numberOfLines={1}>
              {pointer.title}
            </Text>
            <Text style={[type.caption, styles.summary]} numberOfLines={2}>
              {pointer.summary}
            </Text>
          </View>
          <ChevronRight size={20} color={palette.textMuted} strokeWidth={2.2} />
        </View>
      </GlassCard>
    </PressBounce>
  );
}

export const TipRow = memo(TipRowBase);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
  },
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flex: 1,
    marginHorizontal: space.md,
  },
  summary: {
    marginTop: 3,
    lineHeight: 16,
  },
});
