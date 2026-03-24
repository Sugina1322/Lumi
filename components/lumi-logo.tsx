import { StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
};

const configs = {
  sm: { box: 40, radius: 12, letter: 18, word: 13, gap: 7 },
  md: { box: 56, radius: 16, letter: 26, word: 17, gap: 9 },
  lg: { box: 76, radius: 22, letter: 36, word: 22, gap: 12 },
};

export function LumiLogo({ size = 'md', variant = 'default' }: Props) {
  const c = configs[size];
  const isLight = variant === 'light';

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.box,
          { width: c.box, height: c.box, borderRadius: c.radius },
          isLight ? styles.boxLight : styles.boxDefault,
        ]}
      >
        <View style={[styles.glint, isLight ? styles.glintLight : styles.glintDefault]} />
        <Text style={[styles.letter, { fontSize: c.letter }, isLight ? styles.letterLight : styles.letterDefault]}>
          L
        </Text>
      </View>
      <Text style={[styles.wordmark, { fontSize: c.word, marginTop: c.gap }, isLight ? styles.wordmarkLight : styles.wordmarkDefault]}>
        lumi
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  boxDefault: { backgroundColor: '#7055C8' },
  boxLight: { backgroundColor: '#FFFFFF' },
  glint: { position: 'absolute', top: -10, right: -10, width: 40, height: 40, borderRadius: 20 },
  glintDefault: { backgroundColor: '#9B83F1', opacity: 0.5 },
  glintLight: { backgroundColor: '#EDE8FF', opacity: 0.8 },
  letter: { fontWeight: '900', letterSpacing: -1 },
  letterDefault: { color: '#FFFFFF' },
  letterLight: { color: '#7055C8' },
  wordmark: { fontWeight: '900', letterSpacing: 2.5, textTransform: 'lowercase' },
  wordmarkDefault: { color: '#1E1640' },
  wordmarkLight: { color: '#FFFFFF' },
});
