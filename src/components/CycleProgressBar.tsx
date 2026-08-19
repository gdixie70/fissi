import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native-paper';
import { formatCurrency } from '../utils/selectors';
import { HERO_GRADIENT, SUCCESS_COLOR } from '../theme';

interface CycleProgressBarProps {
  /** Quanto resta ancora da pagare in questo ciclo. */
  remainingTotal: number;
  /** Quanto è già stato pagato in questo ciclo. */
  paidTotal: number;
  /** Etichetta del periodo, es. "27 lug – 26 ago". */
  rangeLabel: string;
}

export function CycleProgressBar({ remainingTotal, paidTotal, rangeLabel }: CycleProgressBarProps) {
  const committedTotal = remainingTotal + paidTotal;
  const remainingRatio = committedTotal > 0 ? remainingTotal / committedTotal : 0;

  const animatedRatio = useRef(new Animated.Value(remainingRatio)).current;
  useEffect(() => {
    Animated.timing(animatedRatio, {
      toValue: remainingRatio,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [remainingRatio, animatedRatio]);

  const animatedWidth = animatedRatio.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Text variant="labelLarge" style={styles.rangeLabel}>
        {rangeLabel}
      </Text>

      {committedTotal === 0 ? (
        <Text variant="titleMedium" style={styles.emptyState}>
          Tutto tranquillo — nessun pagamento fisso in questo ciclo.
        </Text>
      ) : (
        <>
          <Text variant="displaySmall" style={styles.bigNumber}>
            {formatCurrency(remainingTotal)}
          </Text>
          <Text variant="bodyMedium" style={styles.subLabel}>
            ancora da pagare su {formatCurrency(committedTotal)} totali
          </Text>

          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: SUCCESS_COLOR }]} />
          </View>

          <Text variant="bodySmall" style={styles.paidLabel}>
            {formatCurrency(paidTotal)} già pagati
          </Text>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  rangeLabel: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  emptyState: {
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 4,
  },
  bigNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    marginBottom: 14,
  },
  track: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  paidLabel: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
});
