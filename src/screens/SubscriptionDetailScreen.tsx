import React, { useLayoutEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, IconButton, Text, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { RootStackParamList } from '../navigation/types';
import { BILLING_CYCLE_LABELS } from '../types';
import { formatItalianDate, formatShortDate, isOverdue } from '../utils/dates';
import { formatCurrency } from '../utils/selectors';
import { getCategoryIcon } from '../utils/categoryIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionDetail'>;

export function SubscriptionDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { subscriptionId } = route.params;

  const { subscriptions, paymentLog, markAsPaid } = useSubscriptions();
  const subscription = subscriptions.find((s) => s.id === subscriptionId);

  const history = useMemo(
    () =>
      paymentLog
        .filter((p) => p.subscription_id === subscriptionId)
        .sort((a, b) => (a.due_date < b.due_date ? 1 : -1))
        .slice(0, 12),
    [paymentLog, subscriptionId]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: subscription?.name ?? 'Dettaglio',
      headerRight: () => (
        <IconButton icon="pencil" onPress={() => navigation.navigate('SubscriptionForm', { subscriptionId })} />
      ),
    });
  }, [navigation, subscription, subscriptionId]);

  if (!subscription) {
    return (
      <View style={styles.centered}>
        <Text>Pagamento non trovato.</Text>
      </View>
    );
  }

  const overdue = subscription.payment_type === 'manual' && isOverdue(subscription.next_due_date);

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={[styles.colorDot, { backgroundColor: subscription.color ?? theme.colors.primary }]} />
        <Text variant="headlineSmall" style={styles.amount}>
          {formatCurrency(subscription.amount, subscription.currency)}
        </Text>
        <Text variant="bodyMedium" style={styles.cycle}>
          {BILLING_CYCLE_LABELS[subscription.billing_cycle]}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Chip icon={subscription.payment_type === 'automatic' ? 'autorenew' : 'hand-back-right-outline'}>
          {subscription.payment_type === 'automatic' ? 'Pagamento automatico' : 'Pagamento manuale'}
        </Chip>
        {!subscription.active && (
          <Chip icon={subscription.billing_cycle === 'once' ? 'check' : 'pause'}>
            {subscription.billing_cycle === 'once' ? 'Pagato' : 'Sospeso'}
          </Chip>
        )}
      </View>

      <View style={styles.dueBlock}>
        <Text variant="labelLarge" style={styles.label}>
          Prossima scadenza
        </Text>
        <Text variant="titleLarge" style={overdue ? { color: theme.colors.error, fontWeight: '700' } : undefined}>
          {formatItalianDate(subscription.next_due_date)}
          {overdue ? ' — in ritardo' : ''}
        </Text>
      </View>

      {subscription.category && (
        <View style={styles.dueBlock}>
          <Text variant="labelLarge" style={styles.label}>
            Categoria
          </Text>
          <Chip icon={getCategoryIcon(subscription.category)} compact style={styles.categoryChip}>
            {subscription.category}
          </Chip>
        </View>
      )}

      {subscription.notes && (
        <View style={styles.dueBlock}>
          <Text variant="labelLarge" style={styles.label}>
            Note
          </Text>
          <Text variant="bodyLarge">{subscription.notes}</Text>
        </View>
      )}

      {subscription.payment_type === 'manual' && subscription.active && (
        <Button mode="contained" style={styles.markPaidButton} onPress={() => markAsPaid(subscription)}>
          Segna come pagato
        </Button>
      )}

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.historyTitle}>
        Storico pagamenti
      </Text>
      {history.length === 0 ? (
        <Text variant="bodyMedium" style={styles.emptyHistory}>
          Nessun pagamento registrato finora.
        </Text>
      ) : (
        history.map((entry) => (
          <View key={entry.id} style={[styles.historyRow, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text variant="bodyMedium">{formatShortDate(entry.due_date)}</Text>
            <Text variant="bodyMedium">{formatCurrency(entry.amount, entry.currency)}</Text>
            <Text variant="bodySmall" style={styles.historyTag}>
              {entry.paid_automatically ? 'Automatico' : 'Manuale'}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 10,
  },
  amount: {
    fontWeight: '800',
  },
  cycle: {
    opacity: 0.6,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  dueBlock: {
    marginBottom: 16,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  label: {
    opacity: 0.7,
    marginBottom: 4,
  },
  markPaidButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 10,
  },
  divider: {
    marginVertical: 20,
  },
  historyTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyHistory: {
    opacity: 0.6,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyTag: {
    opacity: 0.6,
  },
});
