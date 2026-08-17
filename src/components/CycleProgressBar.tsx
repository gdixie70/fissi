import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatCurrency } from '../utils/selectors';
import { SUCCESS_COLOR } from '../theme';

interface CycleProgressBarProps {
  /** Quanto resta ancora da pagare in questo ciclo. */
  remainingTotal: number;
  /** Quanto è già stato pagato in questo ciclo. */
  paidTotal: number;
  /** Etichetta del periodo, es. "27 lug – 26 ago". */
  rangeLabel: string;
}

export function CycleProgressBar({ remainingTotal, paidTotal, rangeLabel }: CycleProgressBarProps) {
  const theme = useTheme();
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
    <View style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
      <Text variant="labelLarge" style={[styles.rangeLabel, { color: theme.colors.onSurfaceVariant }]}>
        {rangeLabel}
      </Text>

      {committedTotal === 0 ? (
        <Text variant="titleMedium" style={styles.emptyState}>
          Nessun pagamento fisso in questo ciclo. 🎉
        </Text>
      ) : (
        <>
          <Text variant="displaySmall" style={styles.bigNumber}>
            {formatCurrency(remainingTotal)}
          </Text>
          <Text variant="bodyMedium" style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}>
            ancora da pagare su {formatCurrency(committedTotal)} totali
          </Text>

          <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: SUCCESS_COLOR }]} />
          </View>

          <Text variant="bodySmall" style={[styles.paidLabel, { color: theme.colors.onSurfaceVariant }]}>
            {formatCurrency(paidTotal)} già pagati
          </Text>
        </>
      )}
    </View>
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
    marginBottom: 8,
  },
  emptyState: {
    marginTop: 4,
    marginBottom: 4,
  },
  bigNumber: {
    fontWeight: '800',
  },
  subLabel: {
    marginTop: 2,
    marginBottom: 14,
  },
  track: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  paidLabel: {
    marginTop: 8,
  },
});
