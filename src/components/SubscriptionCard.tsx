import React, { useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
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
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubscriptionCard({ subscription, onPress, onMarkAsPaid, onEdit, onDelete }: SubscriptionCardProps) {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const overdue = subscription.payment_type === 'manual' && isOverdue(subscription.next_due_date);
  const remaining = daysUntil(subscription.next_due_date);
  const accentColor = subscription.color ?? theme.colors.primary;

  const dueLabel = overdue
    ? `In ritardo di ${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? 'giorno' : 'giorni'}`
    : remaining === 0
    ? 'Scade oggi'
    : `Tra ${remaining} ${remaining === 1 ? 'giorno' : 'giorni'} · ${formatShortDate(subscription.next_due_date)}`;

  const handleEditPress = () => {
    swipeableRef.current?.close();
    onEdit?.();
  };

  const handleDeletePress = () => {
    swipeableRef.current?.close();
    Alert.alert(
      'Eliminare questo pagamento?',
      `"${subscription.name}" verrà eliminato definitivamente, insieme al suo storico dei pagamenti. L'azione non può essere annullata.`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => onDelete?.() },
      ]
    );
  };

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      {onEdit && (
        <TouchableRipple onPress={handleEditPress} style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}>
          <View style={styles.actionContent}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.colors.onSecondary} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSecondary }}>
              Modifica
            </Text>
          </View>
        </TouchableRipple>
      )}
      {onDelete && (
        <TouchableRipple onPress={handleDeletePress} style={[styles.actionButton, { backgroundColor: theme.colors.error }]}>
          <View style={styles.actionContent}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.onError} />
            <Text variant="labelSmall" style={{ color: theme.colors.onError }}>
              Elimina
            </Text>
          </View>
        </TouchableRipple>
      )}
    </View>
  );

  const card = (
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

  if (!onEdit && !onDelete) return card;

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      {card}
    </Swipeable>
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
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  actionButton: {
    width: 72,
    marginLeft: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    alignItems: 'center',
    gap: 4,
  },
});
