import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesError } from 'react-native-purchases';

/**
 * Livello di astrazione per gli acquisti in-app (abbonamento Premium), collegato a
 * RevenueCat (`react-native-purchases`). Le funzioni provano prima l'SDK reale; se non è
 * disponibile — piattaforma non ancora configurata (es. Android, in attesa dell'account
 * Google Play Console) o modulo nativo assente (Expo Go, dove questo pacchetto non gira,
 * a differenza di una build con dev-client) — ricadono su uno stub locale in AsyncStorage,
 * attivabile solo in `__DEV__` tramite l'interruttore "Premium ON/OFF" in Impostazioni.
 * Così il resto dell'app resta testabile su Expo Go anche dopo aver collegato l'SDK vero.
 */

const REVENUECAT_API_KEYS: Partial<Record<'ios' | 'android', string>> = {
  ios: 'appl_ORaGloFdzBzTDCQEDYwbCkclLVK',
  // android: non ancora disponibile — account Google Play Console in attesa di approvazione,
  // vedi AGENTS.md. Da aggiungere qui una volta creato il prodotto e collegata l'app su RevenueCat.
};

const PRODUCT_ID = 'fissi_premium_annual';
const ENTITLEMENT_ID = 'premium';
const DEV_PREMIUM_OVERRIDE_KEY = 'fissi:devPremiumOverride';

let sdkReady = false;

export async function initPurchases(): Promise<void> {
  const apiKey = REVENUECAT_API_KEYS[Platform.OS as 'ios' | 'android'];
  if (!apiKey) return;

  try {
    Purchases.configure({ apiKey });
    sdkReady = true;
  } catch {
    // Modulo nativo non disponibile (es. Expo Go): resta sullo stub di sviluppo.
    sdkReady = false;
  }
}

export async function getIsPremium(): Promise<boolean> {
  if (sdkReady) {
    try {
      const info = await Purchases.getCustomerInfo();
      return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
    } catch {
      // Ricade sullo stub sotto.
    }
  }
  if (!__DEV__) return false;
  const stored = await AsyncStorage.getItem(DEV_PREMIUM_OVERRIDE_KEY);
  return stored === 'true';
}

/** Solo per test in sviluppo: attiva/disattiva lo stato Premium senza un acquisto reale. */
export async function setDevPremiumOverride(value: boolean): Promise<void> {
  if (!__DEV__) return;
  await AsyncStorage.setItem(DEV_PREMIUM_OVERRIDE_KEY, value ? 'true' : 'false');
}

export async function purchasePremium(): Promise<{ error: string | null }> {
  if (sdkReady) {
    try {
      const products = await Purchases.getProducts([PRODUCT_ID]);
      const product = products[0];
      if (!product) return { error: 'Prodotto non trovato sullo store. Riprova più tardi.' };

      await Purchases.purchaseStoreProduct(product);
      return { error: null };
    } catch (e) {
      const purchasesError = e as PurchasesError;
      if (purchasesError?.userCancelled) return { error: null };
      return { error: purchasesError?.message ?? 'Acquisto non riuscito.' };
    }
  }

  if (__DEV__) {
    await setDevPremiumOverride(true);
    return { error: null };
  }
  return { error: 'Acquisti non ancora disponibili su questa piattaforma.' };
}

export async function restorePurchases(): Promise<{ error: string | null }> {
  if (sdkReady) {
    try {
      await Purchases.restorePurchases();
      return { error: null };
    } catch (e) {
      const purchasesError = e as PurchasesError;
      return { error: purchasesError?.message ?? 'Ripristino non riuscito.' };
    }
  }

  if (__DEV__) return { error: null };
  return { error: 'Ripristino non ancora disponibile su questa piattaforma.' };
}
