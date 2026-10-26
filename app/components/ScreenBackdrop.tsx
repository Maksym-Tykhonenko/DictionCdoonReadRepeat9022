import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { gradients, palette } from '../theme';

interface Props {
  children: React.ReactNode;
  /** Which safe-area edges to inset. Defaults to top + horizontal. */
  edges?: Edge[];
}

/**
 * Full-screen gradient backdrop (deep purple -> black) plus a couple of soft
 * ambient glow blobs, wrapped in a SafeAreaView. Every screen sits on this.
 */
export function ScreenBackdrop({
  children,
  edges = ['top', 'left', 'right'],
}: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[...gradients.screen]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottom]} />
      <SafeAreaView style={styles.safe} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.abyss,
  },
  safe: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowTop: {
    top: -130,
    right: -90,
    backgroundColor: 'rgba(124, 92, 255, 0.18)',
  },
  glowBottom: {
    bottom: -140,
    left: -110,
    backgroundColor: 'rgba(231, 193, 104, 0.10)',
  },
});
