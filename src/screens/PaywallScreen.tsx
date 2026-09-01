import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { RootStackParamList } from '../navigation/types';
import { FREE_TIER_MAX_ACTIVE } from '../lib/limits';

const BENEFITS: Array<{ icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; subtitle: string }> = [
  {
    icon: 'infinity',
    title: 'Pagamenti illimitati',
    subtitle: `Il piano gratuito si ferma a ${FREE_TIER_MAX_ACTIVE} pagamenti attivi — con Premium non c'è limite.`,
  },
  {
    icon: 'cloud-check-outline',
    title: 'Backup automatico',
    subtitle: 'I tuoi dati restano al sicuro nel backup del telefono, senza doverli esportare a mano.',
  },
  {
    icon: 'chart-donut',
    title: 'Recap annuale',
    subtitle: 'Quanto hai speso quest\'anno, per categoria e mese per mese, in un colpo d\'occhio.',
  },
];

export function PaywallScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { purchasePremium, restorePurchases } = useSubscriptions();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setError(null);
    setPurchasing(true);
    const result = await purchasePremium();
    setPurchasing(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigation.goBack();
  };

  const handleRestore = async () => {
    setError(null);
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiaryContainer }]}>
        <MaterialCommunityIcons name="star-four-points" size={32} color={theme.colors.onTertiaryContainer} />
      </View>
      <Text variant="headlineSmall" style={styles.heading}>
        FISSI Premium
      </Text>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
        Tutto quello che ti serve per non perdere mai di vista i tuoi pagamenti fissi.
      </Text>

      {BENEFITS.map((b) => (
        <View key={b.title} style={styles.benefitRow}>
          <View style={[styles.benefitIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name={b.icon} size={20} color={theme.colors.onSecondaryContainer} />
          </View>
          <View style={styles.benefitText}>
            <Text variant="titleMedium">{b.title}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {b.subtitle}
            </Text>
          </View>
        </View>
      ))}

      <View style={[styles.priceCard, { backgroundColor: theme.colors.elevation.level1 }]}>
        <Text variant="displaySmall" style={styles.price}>
          4,99 €
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          all'anno, si rinnova automaticamente
        </Text>
      </View>

      {error && (
        <Text style={{ color: theme.colors.error, marginBottom: 12 }} variant="bodySmall">
          {error}
        </Text>
      )}

      <Button mode="contained" onPress={handlePurchase} loading={purchasing} style={styles.purchaseButton}>
        Abbonati
      </Button>

      <Button mode="text" onPress={handleRestore} loading={restoring} style={styles.restoreButton}>
        Ripristina acquisti
      </Button>

      <Button mode="text" onPress={() => navigation.goBack()} textColor={theme.colors.onSurfaceVariant}>
        Non ora
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 6,
  },
  intro: {
    textAlign: 'center',
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    marginBottom: 18,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  priceCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  price: {
    fontWeight: '800',
  },
  purchaseButton: {
    width: '100%',
    borderRadius: 10,
    marginBottom: 4,
  },
  restoreButton: {
    marginBottom: 4,
  },
});
