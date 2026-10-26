import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowRight } from '../components/icons';
import { ScreenBackdrop } from '../components/ScreenBackdrop';
import { AuroraButton } from '../components/AuroraButton';
import { ProgressDots } from '../components/ProgressDots';
import { PressBounce } from '../components/PressBounce';
import { FloatingGlyph } from './onboarding/FloatingGlyph';
import { useEntrance } from '../hooks/useEntrance';
import { ONBOARDING_SLIDES } from '../data/onboardingSlides';
import { palette, space, type } from '../theme';
import { useI18n } from '../i18n';
import { LanguageButton } from '../components/LanguagePicker';

const { width } = Dimensions.get('window');

export function IntroJourneyScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<Animated.FlatList<any>>(null);
  const textAnim = useEntrance({ resetKey: index, offset: 18, duration: 460 });

  const last = ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[index];

  const goTo = (i: number) => {
    scrollRef.current?.scrollToOffset({ offset: i * width, animated: true });
    setIndex(i);
  };

  const onNext = () => {
    if (index < last) {
      goTo(index + 1);
    } else {
      onDone();
    }
  };

  const onMomentum = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) {
      setIndex(next);
    }
  };

  return (
    <ScreenBackdrop edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.fill}>
        {/* Skip top-right */}
        <View style={styles.language}>
          <LanguageButton />
        </View>
        {index < last && (
          <PressBounce onPress={onDone} style={styles.skip} accessibilityLabel={t('onboarding.skip')}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </PressBounce>
        )}

        {/* Upper floating illustration area (horizontally paged) */}
        <Animated.FlatList
          ref={scrollRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={item => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentum}
          style={styles.pager}
          renderItem={({ item }) => (
            <View style={[styles.page, { width }]}>
              <Image
                source={item.background}
                style={styles.bgImage}
                resizeMode="cover"
                blurRadius={6}
              />
              <LinearGradient
                colors={['rgba(7,5,18,0.55)', 'rgba(7,5,18,0.92)', '#070512']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glyphHolder}>
                <FloatingGlyph glyph={item.glyph} />
              </View>
            </View>
          )}
        />

        {/* Lower text block + controls */}
        <View style={styles.lower}>
          <Animated.View style={[styles.textBlock, textAnim]}>
            <View style={styles.accentLine} />
            <Text style={styles.accentLabel}>
              {t(`onboarding.${slide.key}.accent`).toUpperCase()}
            </Text>
            <Text style={[type.title, styles.title]}>{t(`onboarding.${slide.key}.title`)}</Text>
            <Text style={[type.body, styles.desc]}>{t(`onboarding.${slide.key}.desc`)}</Text>
          </Animated.View>

          <View style={styles.dots}>
            <ProgressDots count={ONBOARDING_SLIDES.length} index={index} />
          </View>

          <AuroraButton
            label={index === last ? t('onboarding.start') : t('onboarding.next')}
            onPress={onNext}
            icon={
              index === last ? undefined : (
                <ArrowRight size={18} color={palette.textOnGold} strokeWidth={2.6} />
              )
            }
          />
        </View>
      </View>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  language: {
    position: 'absolute',
    top: space.sm,
    left: space.xl,
    zIndex: 10,
  },
  skip: {
    position: 'absolute',
    top: space.sm,
    right: space.xl,
    zIndex: 10,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    backgroundColor: palette.violetSoft,
  },
  skipText: {
    color: palette.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  pager: {
    flexGrow: 0,
    height: '52%',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  glyphHolder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  lower: {
    flex: 1,
    paddingHorizontal: space.xl,
    justifyContent: 'flex-end',
    paddingBottom: space.lg,
  },
  textBlock: {
    marginBottom: space.lg,
  },
  accentLine: {
    width: 30,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.goldMark,
    marginBottom: space.md,
  },
  accentLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: palette.goldMark,
    marginBottom: space.sm,
  },
  title: {
    fontSize: 27,
  },
  desc: {
    marginTop: space.sm,
  },
  dots: {
    alignItems: 'center',
    marginBottom: space.lg,
  },
});
