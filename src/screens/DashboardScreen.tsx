import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FAB, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { RootStackParamList } from '../navigation/types';
import { CycleProgressBar } from '../components/CycleProgressBar';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { PaidEntryRow } from '../components/PaidEntryRow';
import { EmptyState } from '../components/EmptyState';
import { overdueSubscriptions, paymentsInCycle, subscriptionsDueInCycle, sumAmount } from '../utils/selectors';
import { formatCycleRange, payCycleRange } from '../utils/dates';
import { FREE_TIER_MAX_ACTIVE } from '../lib/limits';

export function DashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    subscriptions,
    paymentLog,
    payday,
    isPremium,
    loading,
    refresh,
    markAsPaid,
    deleteSubscription,
    deletePaymentLogEntry,
  } = useSubscriptions();
  const [refreshing, setRefreshing] = useState(false);

  const handleAddPress = () => {
    const activeCount = subscriptions.filter((s) => s.active).length;
    if (!isPremium && activeCount >= FREE_TIER_MAX_ACTIVE) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('SubscriptionForm', undefined);
  };

  // Non va messo in useMemo con [payday] come unica dipendenza: payCycleRange usa la
  // data odierna, che può cambiare da un render all'altro (es. l'app resta aperta
  // durante la notte) senza che `payday` stesso cambi.
  const cycleRange = payCycleRange(payday);
  const dueThisCycle = useMemo(() => subscriptionsDueInCycle(subscriptions, cycleRange), [subscriptions, cycleRange]);
  const overdue = useMemo(() => overdueSubscriptions(subscriptions), [subscriptions]);
  const paymentsThisCycle = useMemo(() => paymentsInCycle(paymentLog, cycleRange), [paymentLog, cycleRange]);

  const paidEntriesSorted = useMemo(
    () => [...paymentsThisCycle].sort((a, b) => (a.due_date < b.due_date ? 1 : -1)),
    [paymentsThisCycle]
  );
  const subscriptionsById = useMemo(() => new Map(subscriptions.map((s) => [s.id, s])), [subscriptions]);

  const remainingTotal = useMemo(() => sumAmount(dueThisCycle), [dueThisCycle]);
  const paidTotal = useMemo(() => sumAmount(paymentsThisCycle), [paymentsThisCycle]);
  const isCycleEmpty = dueThisCycle.length === 0 && paidEntriesSorted.length === 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && subscriptions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text variant="headlineSmall" style={styles.heading}>
          Cosa mi resta da pagare?
        </Text>

        <CycleProgressBar
          remainingTotal={remainingTotal}
          paidTotal={paidTotal}
          rangeLabel={formatCycleRange(cycleRange)}
        />

        {overdue.length > 0 && (
          <View style={[styles.overdueBanner, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={{ color: theme.colors.onErrorContainer, fontWeight: '700' }}>
              ⚠️ {overdue.length} {overdue.length === 1 ? 'pagamento manuale in ritardo' : 'pagamenti manuali in ritardo'}
            </Text>
          </View>
        )}

        {isCycleEmpty ? (
          <EmptyState
            icon="cash-plus"
            title="Nessun pagamento fisso ancora"
            subtitle='Tocca "+" per aggiungere il tuo primo abbonamento o pagamento.'
          />
        ) : (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              In questo ciclo devi ancora pagare
            </Text>

            {dueThisCycle.length === 0 ? (
              <EmptyState
                icon="party-popper"
                title="Tutto pagato"
                subtitle="Nessun pagamento in sospeso per questo ciclo."
              />
            ) : (
              dueThisCycle.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: sub.id })}
                  onMarkAsPaid={sub.payment_type === 'manual' ? () => markAsPaid(sub) : undefined}
                  onEdit={() => navigation.navigate('SubscriptionForm', { subscriptionId: sub.id })}
                  onDelete={() => deleteSubscription(sub.id)}
                />
              ))
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Pagati in questo ciclo
            </Text>

            {paidEntriesSorted.length === 0 ? (
              <EmptyState
                icon="receipt-text-outline"
                title="Ancora nessun pagamento registrato"
                subtitle="Qui vedrai quelli già saldati in questo ciclo."
              />
            ) : (
              paidEntriesSorted.map((entry) => {
                const subscription = subscriptionsById.get(entry.subscription_id);
                return (
                  <PaidEntryRow
                    key={entry.id}
                    entry={entry}
                    subscription={subscription}
                    onPress={subscription ? () => navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id }) : undefined}
                    onDelete={() => deletePaymentLogEntry(entry.id)}
                  />
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={handleAddPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 16,
  },
  overdueBanner: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 28,
  },
});
