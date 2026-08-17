import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Subscription } from '../types';
import { daysUntil, formatShortDate, isOverdue } from '../utils/dates';
import { formatCurrency } from '../utils/selectors';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getContrastColor, SUCCESS_COLOR } from '../theme';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress: () => void;
  onMarkAsPaid?: () => void;
}

export function SubscriptionCard({ subscription, onPress, onMarkAsPaid }: SubscriptionCardProps) {
  const theme = useTheme();
  const overdue = subscription.payment_type === 'manual' && isOverdue(subscription.next_due_date);
  const remaining = daysUntil(subscription.next_due_date);
  const accentColor = subscription.color ?? theme.colors.primary;

  const dueLabel = overdue
    ? `In ritardo di ${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? 'giorno' : 'giorni'}`
    : remaining === 0
    ? 'Scade oggi'
    : `Tra ${remaining} ${remaining === 1 ? 'giorno' : 'giorni'} · ${formatShortDate(subscription.next_due_date)}`;

  return (
    <TouchableRipple onPress={onPress} borderless style={styles.wrapper}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.elevation.level1 },
          overdue && { borderColor: theme.colors.error, borderWidth: 1.5 },
        ]}
      >
        <View style={[styles.iconBadge, { backgroundColor: accentColor, borderColor: theme.colors.outlineVariant }]}>
          <MaterialCommunityIcons
            name={getCategoryIcon(subscription.category) as any}
            size={20}
            color={getContrastColor(accentColor)}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
              {subscription.name}
            </Text>
            <Text variant="titleMedium" style={styles.amount}>
              {formatCurrency(subscription.amount, subscription.currency)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Chip
              compact
              style={styles.chip}
              textStyle={styles.chipText}
              mode={subscription.payment_type === 'automatic' ? 'flat' : 'outlined'}
            >
              {subscription.payment_type === 'automatic' ? 'Automatico' : 'Manuale'}
            </Chip>
            <Text
              variant="bodySmall"
              style={[styles.dueLabel, { color: theme.colors.onSurfaceVariant }, overdue && { color: theme.colors.error, fontWeight: '700' }]}
            >
              {dueLabel}
            </Text>
          </View>

          {subscription.payment_type === 'manual' && onMarkAsPaid && (
            <Text variant="bodySmall" style={styles.markAsPaid} onPress={onMarkAsPaid}>
              Segna come pagato ✓
            </Text>
          )}
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
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  dueLabel: {
    opacity: 0.9,
  },
  markAsPaid: {
    marginTop: 10,
    color: SUCCESS_COLOR,
    fontWeight: '700',
  },
});
