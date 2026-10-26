import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Mic, Play, Repeat2, Lightbulb, Heart } from '../../components/icons';
import { GlassCard } from '../../components/GlassCard';
import { IconBubble } from '../../components/IconBubble';
import { palette, radius, space, fontFamily } from '../../theme';
import type { OnboardingSlide } from '../../data/types';

/** Gentle continuous float wrapper. */
function Float({
  children,
  delay = 0,
  range = 10,
}: {
  children: React.ReactNode;
  delay?: number;
  range?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 2200,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return (
    <Animated.View
      style={{
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -range] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

function MiniWord({ text, gold }: { text: string; gold?: boolean }) {
  return (
    <View style={[styles.word, gold && styles.wordGold]}>
      <Text style={[styles.wordText, gold && styles.wordTextGold]}>{text}</Text>
    </View>
  );
}

/** Minimal floating illustration that differs per onboarding slide. */
export function FloatingGlyph({ glyph }: { glyph: OnboardingSlide['glyph'] }) {
  if (glyph === 'twister') {
    return (
      <Float>
        <GlassCard style={styles.card} padded>
          <View style={styles.wordRow}>
            <MiniWord text="She" />
            <MiniWord text="sells" gold />
            <MiniWord text="shells" />
          </View>
          <View style={styles.playRow}>
            <IconBubble color={palette.goldMark} size={34}>
              <Play size={16} color={palette.goldMark} strokeWidth={2.4} />
            </IconBubble>
            <View style={styles.line} />
          </View>
        </GlassCard>
      </Float>
    );
  }

  if (glyph === 'emotion') {
    const chips = ['Confident', 'Dramatic', 'Mysterious'];
    return (
      <View style={styles.stack}>
        {chips.map((c, i) => (
          <Float key={c} delay={i * 220} range={8 + i * 2}>
            <View style={[styles.emotionChip, { marginLeft: i * 18 }]}>
              <Heart size={13} color={palette.rose} strokeWidth={2.2} />
              <Text style={styles.emotionText}>{c}</Text>
            </View>
          </Float>
        ))}
      </View>
    );
  }

  if (glyph === 'tips') {
    return (
      <Float>
        <GlassCard style={styles.card} padded>
          <IconBubble color={palette.amber} size={42}>
            <Lightbulb size={22} color={palette.amber} strokeWidth={2} />
          </IconBubble>
          <View style={styles.tipLineLong} />
          <View style={styles.tipLineShort} />
        </GlassCard>
      </Float>
    );
  }

  if (glyph === 'quiz') {
    const letters = ['A', 'B', 'C', 'D'];
    return (
      <Float>
        <View style={styles.quizGrid}>
          {letters.map((l, i) => (
            <View
              key={l}
              style={[styles.quizCell, i === 2 && styles.quizCellRight]}>
              <Text style={styles.quizLetter}>{l}</Text>
              <View style={styles.quizBar} />
            </View>
          ))}
        </View>
      </Float>
    );
  }

  // game
  return (
    <Float>
      <View style={styles.gameRow}>
        <IconBubble color={palette.goldMark} size={56}>
          <Mic size={26} color={palette.goldMark} strokeWidth={2} />
        </IconBubble>
        <Repeat2 size={26} color={palette.neonViolet} strokeWidth={2.2} style={styles.gameArrow} />
        <IconBubble color={palette.neonViolet} size={56}>
          <Play size={24} color={palette.neonViolet} strokeWidth={2.2} />
        </IconBubble>
      </View>
    </Float>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 210,
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  word: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  wordGold: {
    backgroundColor: palette.goldMark,
  },
  wordText: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  wordTextGold: {
    color: palette.textOnGold,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
  },
  line: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginLeft: space.sm,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  stack: {
    alignItems: 'flex-start',
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: palette.duskCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    marginVertical: 6,
  },
  emotionText: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: palette.textPrimary,
    marginLeft: 8,
  },
  tipLineLong: {
    width: 150,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: space.md,
  },
  tipLineShort: {
    width: 96,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 8,
  },
  quizGrid: {
    width: 168,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quizCell: {
    width: 72,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.duskCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: 10,
    justifyContent: 'space-between',
  },
  quizCellRight: {
    borderColor: palette.mint,
  },
  quizLetter: {
    fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: palette.goldMark,
  },
  quizBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameArrow: {
    marginHorizontal: space.md,
  },
});
