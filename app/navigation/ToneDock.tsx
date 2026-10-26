import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { PressBounce } from '../components/PressBounce';
import { palette, radius, space, fontFamily } from '../theme';
import { shared } from '../theme/sharedStyles';
import { TAB_DEFS, type TabKey } from './tabs';
import { useI18n } from '../i18n';

interface Props {
  active: TabKey;
  onSelect: (key: TabKey) => void;
}

/** A single tab with an animated gold glow + underline when active. */
function DockItem({
  def,
  active,
  onSelect,
}: {
  def: (typeof TAB_DEFS)[number];
  active: boolean;
  onSelect: (key: TabKey) => void;
}) {
  const glow = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(glow, {
      toValue: active ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [active, glow]);

  const { t } = useI18n();
  const label = t(`tabs.${def.key}`);
  const Icon = def.icon;
  const color = active ? palette.goldMark : palette.textMuted;

  return (
    <PressBounce
      onPress={() => onSelect(def.key)}
      activeScale={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.item}>
      <Animated.View
        style={[
          styles.iconWrap,
          {
            backgroundColor: glow.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(231,193,104,0)', 'rgba(231,193,104,0.14)'],
            }),
          },
        ]}>
        <Icon size={21} color={color} strokeWidth={active ? 2.4 : 2} />
      </Animated.View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
      <Animated.View
        style={[
          styles.underline,
          {
            opacity: glow,
            transform: [
              { scaleX: glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
            ],
          },
        ]}
      />
    </PressBounce>
  );
}

/** Floating glass dock with five evenly distributed tabs. */
export function ToneDock({ active, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.dockWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.dock, shared.dockShadow]}>
        <LinearGradient
          colors={['rgba(34, 25, 72, 0.96)', 'rgba(18, 13, 42, 0.96)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {TAB_DEFS.map(def => (
          // Кожен таб у власному flex-слоті: слоти ділять ширину доку
          // порівну, тож іконки розподіляються на весь екран.
          <View key={def.key} style={styles.slot}>
            <DockItem def={def} active={def.key === active} onSelect={onSelect} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
  },
  dock: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    overflow: 'hidden',
    paddingVertical: space.sm,
  },
  slot: {
    flex: 1,
  },
  item: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  underline: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.goldMark,
    marginTop: 4,
  },
});
