import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import dayjs from 'dayjs';
import { FissiBackup, NewSubscription, PaymentLogEntry, Subscription } from '../types';
import { advanceUntilFuture, computeNextDueDate, today } from '../utils/dates';
import { generateId } from '../utils/id';
import { loadPaymentLog, loadSubscriptions, savePaymentLog, saveSubscriptions } from '../lib/localStore';
import { exportBackup, pickBackupFile } from '../lib/exportImport';
import {
  ensureNotificationSetup,
  rescheduleAllReminders,
  scheduleSubscriptionReminders,
  cancelSubscriptionReminders,
} from '../lib/notifications';
import {
  DEFAULT_PAYDAY,
  DEFAULT_REMINDER_LEAD_DAYS,
  getPayday,
  getReminderLeadDays,
  setPayday as persistPayday,
  setReminderLeadDays as persistReminderLeadDays,
} from '../lib/settings';
import {
  getIsPremium,
  initPurchases,
  purchasePremium as purchasePremiumIap,
  restorePurchases as restorePurchasesIap,
} from '../lib/purchases';
import { wouldExceedFreeLimit } from '../lib/limits';
import { getLastBackupDate, readAutoBackup, scheduleAutoBackup } from '../lib/backup';

export type ImportMode = 'merge' | 'replace';

interface SubscriptionsContextValue {
  subscriptions: Subscription[];
  paymentLog: PaymentLogEntry[];
  loading: boolean;
  error: string | null;
  reminderLeadDays: number;
  payday: number;
  isPremium: boolean;
  lastBackupAt: string | null;
  refresh: () => Promise<void>;
  addSubscription: (data: NewSubscription) => Promise<{ error: string | null; limitReached?: boolean }>;
  updateSubscription: (
    id: string,
    data: Partial<NewSubscription>
  ) => Promise<{ error: string | null; limitReached?: boolean }>;
  deleteSubscription: (id: string) => Promise<{ error: string | null }>;
  deletePaymentLogEntry: (id: string) => Promise<{ error: string | null }>;
  markAsPaid: (subscription: Subscription) => Promise<{ error: string | null }>;
  updateReminderLeadDays: (days: number) => Promise<void>;
  updatePayday: (day: number) => Promise<void>;
  exportData: () => Promise<{ error: string | null }>;
  importData: (mode: ImportMode) => Promise<{ error: string | null; canceled?: boolean; imported?: number }>;
  refreshPremiumStatus: () => Promise<void>;
  purchasePremium: () => Promise<{ error: string | null }>;
  restorePurchases: () => Promise<{ error: string | null }>;
  restoreFromAutoBackup: () => Promise<{ error: string | null; imported?: number }>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | undefined>(undefined);

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentLog, setPaymentLog] = useState<PaymentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderLeadDays, setReminderLeadDaysState] = useState(DEFAULT_REMINDER_LEAD_DAYS);
  const [payday, setPaydayState] = useState(DEFAULT_PAYDAY);
  const [isPremium, setIsPremium] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const refreshPremiumStatus = useCallback(async () => {
    setIsPremium(await getIsPremium());
  }, []);

  /** Pianifica un backup automatico solo per gli utenti Premium: è uno dei vantaggi
   * del piano a pagamento, non gira per chi è sul livello gratuito. */
  const maybeScheduleBackup = useCallback(
    (subs: Subscription[], log: PaymentLogEntry[]) => {
      if (isPremium) scheduleAutoBackup(subs, log);
    },
    [isPremium]
  );

  /** Fa avanzare automaticamente gli abbonamenti "automatici" la cui scadenza è passata,
   * registrando ogni occorrenza saltata nello storico pagamenti. */
  const reconcileAutomaticPayments = useCallback(
    async (
      subs: Subscription[],
      log: PaymentLogEntry[]
    ): Promise<{ subs: Subscription[]; log: PaymentLogEntry[]; changed: boolean }> => {
      const now = today();
      const updatedSubs = [...subs];
      const newEntries: PaymentLogEntry[] = [];
      let changed = false;

      for (let i = 0; i < updatedSubs.length; i++) {
        const sub = updatedSubs[i];
        if (!sub.active || sub.payment_type !== 'automatic') continue;
        if (dayjs(sub.next_due_date).isAfter(now)) continue;

        if (sub.billing_cycle === 'once') {
          // Stand alone: una sola occorrenza, poi il pagamento risulta completato (non più attivo).
          newEntries.push({
            id: generateId(),
            subscription_id: sub.id,
            due_date: sub.next_due_date,
            amount: sub.amount,
            currency: sub.currency,
            paid_automatically: true,
            paid_at: new Date().toISOString(),
          });
          updatedSubs[i] = { ...sub, active: false, updated_at: new Date().toISOString() };
          changed = true;
          continue;
        }

        const { newDueDate, occurrencesPassed } = advanceUntilFuture(sub.next_due_date, sub.billing_cycle, now);
        if (occurrencesPassed.length === 0) continue;

        occurrencesPassed.forEach((dueDate) => {
          newEntries.push({
            id: generateId(),
            subscription_id: sub.id,
            due_date: dueDate,
            amount: sub.amount,
            currency: sub.currency,
            paid_automatically: true,
            paid_at: new Date().toISOString(),
          });
        });

        updatedSubs[i] = { ...sub, next_due_date: newDueDate, updated_at: new Date().toISOString() };
        changed = true;
      }

      const updatedLog = newEntries.length > 0 ? [...log, ...newEntries] : log;
      if (changed) {
        await saveSubscriptions(updatedSubs);
        await savePaymentLog(updatedLog);
      }

      return { subs: updatedSubs, log: updatedLog, changed };
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [storedSubs, storedLog] = await Promise.all([loadSubscriptions(), loadPaymentLog()]);
      const { subs, log } = await reconcileAutomaticPayments(storedSubs, storedLog);

      setSubscriptions(subs);
      setPaymentLog(log);

      const storedPayday = await getPayday();
      setPaydayState(storedPayday);

      await refreshPremiumStatus();
      setLastBackupAt(await getLastBackupDate());

      const granted = await ensureNotificationSetup();
      if (granted) {
        const leadDays = await getReminderLeadDays();
        setReminderLeadDaysState(leadDays);
        await rescheduleAllReminders(
          subs.filter((s) => s.active),
          leadDays
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nel caricamento dei dati locali.');
    } finally {
      setLoading(false);
    }
  }, [reconcileAutomaticPayments, refreshPremiumStatus]);

  useEffect(() => {
    initPurchases();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Rifà refresh() ogni volta che l'app torna in primo piano: il giorno può essere
   * cambiato (es. superato il giorno di stipendio) mentre l'app era in background,
   * e le tab restano montate senza remount tra loro. */
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        refresh();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [refresh]);

  const addSubscription = useCallback(
    async (data: NewSubscription) => {
      const activeCount = subscriptions.filter((s) => s.active).length;
      if (wouldExceedFreeLimit(activeCount, isPremium, data.active)) {
        return { error: null, limitReached: true };
      }

      const now = new Date().toISOString();
      const newSub: Subscription = { ...data, id: generateId(), created_at: now, updated_at: now };
      const updated = [...subscriptions, newSub];
      await saveSubscriptions(updated);
      setSubscriptions(updated);
      await scheduleSubscriptionReminders(newSub, reminderLeadDays);
      maybeScheduleBackup(updated, paymentLog);
      return { error: null };
    },
    [subscriptions, paymentLog, reminderLeadDays, isPremium, maybeScheduleBackup]
  );

  const updateSubscription = useCallback(
    async (id: string, data: Partial<NewSubscription>) => {
      const idx = subscriptions.findIndex((s) => s.id === id);
      if (idx === -1) return { error: 'Pagamento non trovato.' };

      const isActivating = data.active === true && subscriptions[idx].active === false;
      const activeCount = subscriptions.filter((s) => s.active).length;
      if (wouldExceedFreeLimit(activeCount, isPremium, isActivating)) {
        return { error: null, limitReached: true };
      }

      const updatedSub: Subscription = {
        ...subscriptions[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      const updated = [...subscriptions];
      updated[idx] = updatedSub;

      await saveSubscriptions(updated);
      setSubscriptions(updated);
      await scheduleSubscriptionReminders(updatedSub, reminderLeadDays);
      maybeScheduleBackup(updated, paymentLog);
      return { error: null };
    },
    [subscriptions, paymentLog, reminderLeadDays, isPremium, maybeScheduleBackup]
  );

  const deleteSubscription = useCallback(
    async (id: string) => {
      await cancelSubscriptionReminders(id);
      const updated = subscriptions.filter((s) => s.id !== id);
      await saveSubscriptions(updated);
      setSubscriptions(updated);
      maybeScheduleBackup(updated, paymentLog);
      return { error: null };
    },
    [subscriptions, paymentLog, maybeScheduleBackup]
  );

  /** Rimuove una singola voce dallo storico pagamenti (non tocca il pagamento fisso a cui
   * si riferiva, se ancora esiste). Utile per ripulire voci non più rilevanti. */
  const deletePaymentLogEntry = useCallback(
    async (id: string) => {
      const updated = paymentLog.filter((p) => p.id !== id);
      await savePaymentLog(updated);
      setPaymentLog(updated);
      maybeScheduleBackup(subscriptions, updated);
      return { error: null };
    },
    [subscriptions, paymentLog, maybeScheduleBackup]
  );

  const markAsPaid = useCallback(
    async (subscription: Subscription) => {
      const entry: PaymentLogEntry = {
        id: generateId(),
        subscription_id: subscription.id,
        due_date: subscription.next_due_date,
        amount: subscription.amount,
        currency: subscription.currency,
        paid_automatically: false,
        paid_at: new Date().toISOString(),
      };
      const updatedLog = [...paymentLog, entry];

      // Stand alone: una sola occorrenza, il pagamento risulta completato invece di riprogrammarsi.
      const updatedSub: Subscription =
        subscription.billing_cycle === 'once'
          ? { ...subscription, active: false, updated_at: new Date().toISOString() }
          : {
              ...subscription,
              next_due_date: computeNextDueDate(subscription.next_due_date, subscription.billing_cycle),
              updated_at: new Date().toISOString(),
            };
      const updatedSubs = subscriptions.map((s) => (s.id === subscription.id ? updatedSub : s));

      await savePaymentLog(updatedLog);
      await saveSubscriptions(updatedSubs);
      setPaymentLog(updatedLog);
      setSubscriptions(updatedSubs);
      await scheduleSubscriptionReminders(updatedSub, reminderLeadDays);
      maybeScheduleBackup(updatedSubs, updatedLog);
      return { error: null };
    },
    [subscriptions, paymentLog, reminderLeadDays, maybeScheduleBackup]
  );

  const updateReminderLeadDays = useCallback(
    async (days: number) => {
      setReminderLeadDaysState(days);
      await persistReminderLeadDays(days);
      await rescheduleAllReminders(
        subscriptions.filter((s) => s.active),
        days
      );
    },
    [subscriptions]
  );

  const updatePayday = useCallback(async (day: number) => {
    setPaydayState(day);
    await persistPayday(day);
  }, []);

  const purchasePremium = useCallback(async () => {
    const result = await purchasePremiumIap();
    await refreshPremiumStatus();
    return result;
  }, [refreshPremiumStatus]);

  const restorePurchases = useCallback(async () => {
    const result = await restorePurchasesIap();
    await refreshPremiumStatus();
    return result;
  }, [refreshPremiumStatus]);

  const exportData = useCallback(async () => {
    try {
      await exportBackup(subscriptions, paymentLog);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Esportazione non riuscita.' };
    }
  }, [subscriptions, paymentLog]);

  /** Applica un backup (già letto/parsato) allo stato corrente, in merge o sostituzione.
   * Condivisa tra l'import manuale da file e il ripristino dal backup automatico. */
  const applyBackup = useCallback(
    async (backup: FissiBackup, mode: ImportMode) => {
      let mergedSubs: Subscription[];
      let mergedLog: PaymentLogEntry[];

      if (mode === 'replace') {
        mergedSubs = backup.subscriptions;
        mergedLog = backup.paymentLog;
      } else {
        const subsById = new Map(subscriptions.map((s) => [s.id, s]));
        backup.subscriptions.forEach((s) => subsById.set(s.id, s));
        mergedSubs = Array.from(subsById.values());

        const logById = new Map(paymentLog.map((p) => [p.id, p]));
        backup.paymentLog.forEach((p) => logById.set(p.id, p));
        mergedLog = Array.from(logById.values());
      }

      await saveSubscriptions(mergedSubs);
      await savePaymentLog(mergedLog);
      setSubscriptions(mergedSubs);
      setPaymentLog(mergedLog);

      const leadDays = await getReminderLeadDays();
      await rescheduleAllReminders(
        mergedSubs.filter((s) => s.active),
        leadDays
      );

      return backup.subscriptions.length;
    },
    [subscriptions, paymentLog]
  );

  const importData = useCallback(
    async (mode: ImportMode) => {
      try {
        const picked = await pickBackupFile();
        if (picked.canceled) return { error: null, canceled: true };

        const imported = await applyBackup(picked.backup, mode);
        return { error: null, imported };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Importazione non riuscita.' };
      }
    },
    [applyBackup]
  );

  const restoreFromAutoBackup = useCallback(async () => {
    try {
      const backup = await readAutoBackup();
      if (!backup) return { error: 'Nessun backup automatico trovato su questo dispositivo.' };

      const imported = await applyBackup(backup, 'replace');
      return { error: null, imported };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ripristino non riuscito.' };
    }
  }, [applyBackup]);

  const value = useMemo<SubscriptionsContextValue>(
    () => ({
      subscriptions,
      paymentLog,
      loading,
      error,
      reminderLeadDays,
      payday,
      isPremium,
      lastBackupAt,
      refresh,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      deletePaymentLogEntry,
      markAsPaid,
      updateReminderLeadDays,
      updatePayday,
      exportData,
      importData,
      refreshPremiumStatus,
      purchasePremium,
      restorePurchases,
      restoreFromAutoBackup,
    }),
    [
      subscriptions,
      paymentLog,
      loading,
      error,
      reminderLeadDays,
      payday,
      isPremium,
      lastBackupAt,
      refresh,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      deletePaymentLogEntry,
      markAsPaid,
      updateReminderLeadDays,
      updatePayday,
      exportData,
      importData,
      refreshPremiumStatus,
      purchasePremium,
      restorePurchases,
      restoreFromAutoBackup,
    ]
  );

  return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>;
}

export function useSubscriptions(): SubscriptionsContextValue {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) throw new Error('useSubscriptions deve essere usato dentro SubscriptionsProvider');
  return ctx;
}
