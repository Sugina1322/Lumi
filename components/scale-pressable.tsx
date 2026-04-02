import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo } from 'react-native';
import { useEffect, useRef, useState } from 'react';

type Props = React.ComponentProps<typeof Pressable> & {
  /** Layout styles (flex, width, margin) — applied to the outer Pressable. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Visual styles (background, border, padding, borderRadius) — applied to the inner Animated.View that scales. */
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  children: React.ReactNode;
};

/**
 * Pressable with spring-physics scale animation on press (50-100ms).
 * Respects the system Reduce Motion setting automatically.
 *
 * Layout note: put flex/width/margin in `containerStyle`, visual styles in `style`.
 */
export function ScalePressable({
  children,
  containerStyle,
  style,
  scaleValue = 0.95,
  onPress,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  function onPressIn() {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: scaleValue,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
      mass: 0.8,
    }).start();
  }

  function onPressOut() {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
      mass: 0.8,
    }).start();
  }

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        containerStyle,
        pressed && reduceMotion && { opacity: 0.7 },
      ]}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
