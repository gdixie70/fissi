import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import { Subscription } from '../types';

const CHANNEL_ID = 'fissi-reminders';
const DEFAULT_REMINDER_HOUR = 9; // notifica alle 9:00 locali

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Promemoria pagamenti',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3E63DD',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

function leadIdentifier(subscriptionId: string): string {
  return `fissi-lead-${subscriptionId}`;
}

function dueIdentifier(subscriptionId: string): string {
  return `fissi-due-${subscriptionId}`;
}

/** Cancella entrambe le notifiche (anticipo + giorno scadenza) per un abbonamento. */
export async function cancelSubscriptionReminders(subscriptionId: string): Promise<void> {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(leadIdentifier(subscriptionId)).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(dueIdentifier(subscriptionId)).catch(() => {}),
  ]);
}

function buildTriggerDate(dateStr: string): Date {
  const d = dayjs(dateStr).hour(DEFAULT_REMINDER_HOUR).minute(0).second(0).millisecond(0);
  return d.toDate();
}

/**
 * Pianifica (o ripianifica) i promemoria locali per un abbonamento:
 * uno `leadDays` giorni prima della scadenza e uno il giorno stesso.
 * Se la data è già passata, la notifica corrispondente viene saltata.
 */
export async function scheduleSubscriptionReminders(
  subscription: Pick<Subscription, 'id' | 'name' | 'amount' | 'currency' | 'next_due_date' | 'payment_type' | 'active'>,
  leadDays: number
): Promise<void> {
  await cancelSubscriptionReminders(subscription.id);

  if (!subscription.active) return;

  const now = dayjs();
  const dueDate = dayjs(subscription.next_due_date);
  const leadDate = dueDate.subtract(leadDays, 'day');

  const amountLabel = `${subscription.amount.toFixed(2)} ${subscription.currency}`;
  const actionLabel = subscription.payment_type === 'automatic' ? 'verrà addebitato automaticamente' : 'da pagare manualmente';

  if (leadDays > 0 && leadDate.isAfter(now)) {
    await Notifications.scheduleNotificationAsync({
      identifier: leadIdentifier(subscription.id),
      content: {
        title: `Tra ${leadDays} giorni: ${subscription.name}`,
        body: `${amountLabel} — ${actionLabel} il ${dueDate.format('DD/MM')}. Controlla di avere fondi sufficienti.`,
        data: { subscriptionId: subscription.id, kind: 'lead' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: buildTriggerDate(leadDate.format('YYYY-MM-DD')),
        channelId: CHANNEL_ID,
      },
    });
  }

  if (dueDate.isAfter(now)) {
    await Notifications.scheduleNotificationAsync({
      identifier: dueIdentifier(subscription.id),
      content: {
        title: `Oggi scade: ${subscription.name}`,
        body:
          subscription.payment_type === 'automatic'
            ? `${amountLabel} verrà addebitato oggi. Verifica il saldo disponibile.`
            : `${amountLabel} da pagare oggi. Ricordati di eseguire il pagamento.`,
        data: { subscriptionId: subscription.id, kind: 'due' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: buildTriggerDate(dueDate.format('YYYY-MM-DD')),
        channelId: CHANNEL_ID,
      },
    });
  }
}

export async function rescheduleAllReminders(
  subscriptions: Array<Pick<Subscription, 'id' | 'name' | 'amount' | 'currency' | 'next_due_date' | 'payment_type' | 'active'>>,
  leadDays: number
): Promise<void> {
  for (const sub of subscriptions) {
    await scheduleSubscriptionReminders(sub, leadDays);
  }
}
