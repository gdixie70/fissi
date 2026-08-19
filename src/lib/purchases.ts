import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Livello di astrazione per gli acquisti in-app (abbonamento Premium).
 *
 * Oggi è uno STUB sostenuto da un flag locale in AsyncStorage, così possiamo
 * costruire e testare gating/paywall/backup/recap senza dipendere da RevenueCat.
 * Le firme sono già quelle definitive: quando colleghiamo l'SDK vero (Fase 5 del
 * piano), cambia solo l'interno di questo file, non chi lo chiama.
 *
 * In produzione (`!__DEV__`) il flag fittizio viene ignorato e `getIsPremium`
 * restituisce sempre `false` finché non è collegato l'SDK reale.
 */

const DEV_PREMIUM_OVERRIDE_KEY = 'fissi:devPremiumOverride';

export async function initPurchases(): Promise<void> {
  // No-op nello stub. Con RevenueCat: Purchases.configure({ apiKey }).
}

export async function getIsPremium(): Promise<boolean> {
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
  if (__DEV__) {
    await setDevPremiumOverride(true);
    return { error: null };
  }
  return { error: 'Acquisti non ancora disponibili in questa versione.' };
}

export async function restorePurchases(): Promise<{ error: string | null }> {
  if (__DEV__) {
    return { error: null };
  }
  return { error: 'Ripristino acquisti non ancora disponibile in questa versione.' };
}
