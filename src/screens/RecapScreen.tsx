import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import dayjs from 'dayjs';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { CategoryBar } from '../components/CategoryBar';
import { EmptyState } from '../components/EmptyState';
import { HERO_GRADIENT } from '../theme';
import {
  formatCurrency,
  monthlyTotals,
  paymentsInYear,
  sumAmount,
  totalsByCategory,
  yearsWithData,
} from '../utils/selectors';

export function RecapScreen() {
  const theme = useTheme();
  const { paymentLog, subscriptions } = useSubscriptions();

  const years = useMemo(() => yearsWithData(paymentLog), [paymentLog]);
  const [selectedYear, setSelectedYear] = useState(years[0] ?? dayjs().year());

  const subscriptionsById = useMemo(() => new Map(subscriptions.map((s) => [s.id, s])), [subscriptions]);
  const entries = useMemo(() => paymentsInYear(paymentLog, selectedYear), [paymentLog, selectedYear]);
  const total = useMemo(() => sumAmount(entries), [entries]);
  const categories = useMemo(() => totalsByCategory(entries, subscriptionsById), [entries, subscriptionsById]);
  const months = useMemo(() => monthlyTotals(entries), [entries]);
  const maxMonth = Math.max(...months, 1);
  const maxCategory = categories[0]?.total ?? 0;

  if (years.length === 0) {
    return (
      <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
        <EmptyState
          icon="chart-donut"
          title="Ancora nessun dato per il recap"
          subtitle="Torna qui quando avrai qualche pagamento registrato nello storico."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      {years.length > 1 && (
        <SegmentedButtons
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
          buttons={years.map((y) => ({ value: String(y), label: String(y) }))}
          style={styles.yearSelector}
        />
      )}

      <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <Text variant="labelLarge" style={styles.heroLabel}>
          Speso nel {selectedYear}
        </Text>
        <Text variant="displaySmall" style={styles.heroTotal}>
          {formatCurrency(total)}
        </Text>
        <Text variant="bodyMedium" style={styles.heroSubtitle}>
          {entries.length} {entries.length === 1 ? 'pagamento registrato' : 'pagamenti registrati'}
        </Text>
      </LinearGradient>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Per categoria
      </Text>
      {categories.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Nessun dato per questo anno.
        </Text>
      ) : (
        categories.map((c) => <CategoryBar key={c.category} category={c.category} total={c.total} maxTotal={maxCategory} />)
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Andamento mensile
      </Text>
      <View style={styles.monthsRow}>
        {months.map((amount, i) => (
          <View key={i} style={styles.monthColumn}>
            <View style={styles.monthTrack}>
              <View
                style={[
                  styles.monthFill,
                  {
                    height: `${Math.round((amount / maxMonth) * 100)}%`,
                    backgroundColor: amount > 0 ? theme.colors.secondary : theme.colors.surfaceVariant,
                  },
                ]}
              />
            </View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {dayjs().month(i).format('MMM')}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  yearSelector: {
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  heroTotal: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 14,
  },
  monthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  monthColumn: {
    alignItems: 'center',
    flex: 1,
  },
  monthTrack: {
    width: 10,
    height: 100,
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  monthFill: {
    width: '100%',
    borderRadius: 5,
  },
});
