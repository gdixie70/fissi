import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_LEAD_DAYS_KEY = 'fissi:reminderLeadDays';
const PAYDAY_KEY = 'fissi:payday';

export const DEFAULT_REMINDER_LEAD_DAYS = 3;
export const DEFAULT_PAYDAY = 1;

export async function getReminderLeadDays(): Promise<number> {
  const stored = await AsyncStorage.getItem(REMINDER_LEAD_DAYS_KEY);
  if (!stored) return DEFAULT_REMINDER_LEAD_DAYS;
  const parsed = parseInt(stored, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_REMINDER_LEAD_DAYS;
}

export async function setReminderLeadDays(days: number): Promise<void> {
  await AsyncStorage.setItem(REMINDER_LEAD_DAYS_KEY, String(days));
}

/** Giorno del mese (1-31) in cui l'utente riceve lo stipendio: ancora del ciclo dell'app. */
export async function getPayday(): Promise<number> {
  const stored = await AsyncStorage.getItem(PAYDAY_KEY);
  if (!stored) return DEFAULT_PAYDAY;
  const parsed = parseInt(stored, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 31 ? parsed : DEFAULT_PAYDAY;
}

export async function setPayday(day: number): Promise<void> {
  await AsyncStorage.setItem(PAYDAY_KEY, String(day));
}
