import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryIcon } from '../utils/categoryIcons';
import { formatCurrency } from '../utils/selectors';

interface CategoryBarProps {
  category: string;
  total: number;
  /** Il totale della voce più alta, per calcolare la larghezza proporzionale della barra. */
  maxTotal: number;
}

export function CategoryBar({ category, total, maxTotal }: CategoryBarProps) {
  const theme = useTheme();
  const ratio = maxTotal > 0 ? total / maxTotal : 0;

  const animatedRatio = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedRatio, { toValue: ratio, duration: 500, useNativeDriver: false }).start();
  }, [ratio, animatedRatio]);

  const animatedWidth = animatedRatio.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.row}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name={getCategoryIcon(category) as any} size={16} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodyMedium" style={styles.category} numberOfLines={1}>
          {category}
        </Text>
        <Text variant="bodyMedium" style={styles.total}>
          {formatCurrency(total)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: theme.colors.secondary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  category: {
    flex: 1,
  },
  total: {
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
