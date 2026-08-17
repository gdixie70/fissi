import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentLogEntry, Subscription } from '../types';

const KEYS = {
  subscriptions: 'fissi:subscriptions',
  paymentLog: 'fissi:paymentLog',
};

/** Rimappa i valori di billing_cycle non più supportati (weekly/custom_days) verso 'monthly',
 * per non far crashare l'app su dati salvati con versioni precedenti. */
function migrateLegacyCycle(sub: Subscription): Subscription {
  const legacy = sub.billing_cycle as string;
  if (legacy === 'weekly' || legacy === 'custom_days') {
    return { ...sub, billing_cycle: 'monthly' };
  }
  return sub;
}

export async function loadSubscriptions(): Promise<Subscription[]> {
  const raw = await AsyncStorage.getItem(KEYS.subscriptions);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Subscription[];
    return parsed.map(migrateLegacyCycle);
  } catch {
    return [];
  }
}

export async function saveSubscriptions(list: Subscription[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.subscriptions, JSON.stringify(list));
}

export async function loadPaymentLog(): Promise<PaymentLogEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.paymentLog);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PaymentLogEntry[];
  } catch {
    return [];
  }
}

export async function savePaymentLog(list: PaymentLogEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.paymentLog, JSON.stringify(list));
}
