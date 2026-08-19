import React, { useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
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
  onDelete?: () => void;
}

export function PaidEntryRow({ entry, subscription, onPress, onDelete }: PaidEntryRowProps) {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const accentColor = subscription?.color ?? theme.colors.primary;
  const entryName = subscription?.name ?? 'Pagamento eliminato';

  const handleDeletePress = () => {
    swipeableRef.current?.close();
    Alert.alert(
      'Rimuovere questa voce dallo storico?',
      `Il pagamento di ${formatCurrency(entry.amount, entry.currency)} per "${entryName}" del ${formatShortDate(entry.due_date)} verrà rimosso definitivamente dallo storico. L'azione non può essere annullata.`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Rimuovi', style: 'destructive', onPress: () => onDelete?.() },
      ]
    );
  };

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      <TouchableRipple onPress={handleDeletePress} style={[styles.actionButton, { backgroundColor: theme.colors.error }]}>
        <View style={styles.actionContent}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.onError} />
          <Text variant="labelSmall" style={{ color: theme.colors.onError }}>
            Rimuovi
          </Text>
        </View>
      </TouchableRipple>
    </View>
  );

  const row = (
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
              {entryName}
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

  if (!onDelete) return row;

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      {row}
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
