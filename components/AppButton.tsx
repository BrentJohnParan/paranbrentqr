
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

type AppButtonProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  onPress: () => void;
  disabled?: boolean;
};

export default function AppButton({
  title,
  icon,
  theme,
  onPress,
  disabled,
}: AppButtonProps) {
  const isPrimary = theme === 'primary';
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPrimary || disabled) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isPrimary, disabled, pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.65],
  });

  return (
    <View style={styles.wrapper}>
      {isPrimary && !disabled && (
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { opacity: glowOpacity }]}
        />
      )}

      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          isPrimary ? styles.primary : styles.secondary,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.row}>
          <Ionicons
            name={icon}
            size={20}
            color={isPrimary ? COLORS.textOnPrimary : COLORS.textPrimary}
          />
          <Text style={[styles.label, isPrimary && styles.primaryLabel]}>
            {title}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
    borderRadius: 14,
  },
  glow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 19,
    backgroundColor: '#8FCF88',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.sage,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  primaryLabel: {
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
