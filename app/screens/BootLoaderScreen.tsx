import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Mic } from '../components/icons';
import LinearGradient from 'react-native-linear-gradient';
import { ScreenBackdrop, SoundBars } from '../components';
import { usePulse } from '../hooks/usePulse';
import { palette, radius, space, type } from '../theme';
import { useI18n } from '../i18n';

/** Themed boot loader: glowing mic orb, soundwave, and a smooth progress bar. */
export function BootLoaderScreen() {
  const { t } = useI18n();
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = usePulse(true, 1700);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  return (
    <ScreenBackdrop edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.center}>
        <View style={styles.orbWrap}>
          <Animated.View
            style={[
              styles.halo,
              { opacity: haloOpacity, transform: [{ scale: haloScale }] },
            ]}
          />
          <View style={styles.orb}>
            <LinearGradient
              colors={['rgba(124,92,255,0.4)', 'rgba(231,193,104,0.25)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Mic size={42} color={palette.goldBright} strokeWidth={2} />
          </View>
        </View>

        <SoundBars active bars={7} height={30} style={styles.bars} />

        <Text style={[type.title, styles.brand]}>Diction Crown</Text>
        <Text style={[type.caption, styles.tagline]}>{t('boot.tagline')}</Text>

        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['8%', '100%'],
                }),
              },
            ]}>
            <LinearGradient
              colors={['#F4D886', '#E7C168', '#C99B3E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={[type.caption, styles.loadingLabel]}>{t('boot.loading')}</Text>
      </View>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  orbWrap: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: palette.violetSoft,
  },
  orb: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.violetEdge,
  },
  bars: {
    marginTop: space.xl,
  },
  brand: {
    marginTop: space.xl,
  },
  tagline: {
    marginTop: 6,
    letterSpacing: 2.5,
    color: palette.goldMark,
  },
  track: {
    marginTop: space.xxl,
    width: '78%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  loadingLabel: {
    marginTop: space.md,
  },
});
