import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentLogEntry, Subscription } from '../types';
import { formatShortDate } from '../utils/dates';
import { formatCurrency } from '../utils/selectors';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getContrastColor } from '../theme';

interface PaidEntryRowProps {
  entry: PaymentLogEntry;
  subscription?: Subscription;
  onPress?: () => void;
}

export function PaidEntryRow({ entry, subscription, onPress }: PaidEntryRowProps) {
  const theme = useTheme();
  const accentColor = subscription?.color ?? theme.colors.primary;

  return (
    <TouchableRipple onPress={onPress} disabled={!onPress} borderless style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
        <View style={[styles.iconBadge, { backgroundColor: accentColor, borderColor: theme.colors.outlineVariant }]}>
          <MaterialCommunityIcons
            name={getCategoryIcon(subscription?.category) as any}
            size={18}
            color={getContrastColor(accentColor)}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
              {subscription?.name ?? 'Pagamento eliminato'}
            </Text>
            <Text variant="titleMedium" style={styles.amount}>
              {formatCurrency(entry.amount, entry.currency)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Chip compact style={styles.chip} textStyle={styles.chipText}>
              {entry.paid_automatically ? 'Automatico' : 'Manuale'}
            </Chip>
            <Text variant="bodySmall" style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>
              Pagato il {formatShortDate(entry.due_date)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    opacity: 0.85,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    marginRight: 8,
    fontWeight: '600',
  },
  amount: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
    lineHeight: 14,
  },
  dateLabel: {
    opacity: 0.9,
  },
});
