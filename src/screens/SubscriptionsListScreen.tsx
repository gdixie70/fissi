import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FAB, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { RootStackParamList } from '../navigation/types';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { EmptyState } from '../components/EmptyState';

export function SubscriptionsListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { subscriptions, loading, refresh, markAsPaid } = useSubscriptions();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const filtered = useMemo(() => {
    const list = filter === 'active' ? subscriptions.filter((s) => s.active) : subscriptions;
    return [...list].sort((a, b) => (a.next_due_date < b.next_due_date ? -1 : 1));
  }, [subscriptions, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.heading}>
          Pagamenti fissi
        </Text>
        <SegmentedButtons
          value={filter}
          onValueChange={(v) => setFilter(v as 'active' | 'all')}
          buttons={[
            { value: 'active', label: 'Attivi' },
            { value: 'all', label: 'Tutti' },
          ]}
          style={styles.segmented}
        />
      </View>

      {loading && subscriptions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="cash-multiple"
              title="Nessun pagamento"
              subtitle='Tocca "+" per aggiungerne uno.'
            />
          }
          renderItem={({ item }) => (
            <SubscriptionCard
              subscription={item}
              onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: item.id })}
              onMarkAsPaid={item.payment_type === 'manual' && item.active ? () => markAsPaid(item) : undefined}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('SubscriptionForm', undefined)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 28,
  },
});
