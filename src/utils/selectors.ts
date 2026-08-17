import { PaymentLogEntry, Subscription } from '../types';
import { isInCycle, isOverdue, PayCycleRange } from './dates';

/** Pagamenti fissi attivi la cui prossima scadenza cade nel ciclo corrente (ancora da pagare). */
export function subscriptionsDueInCycle(subscriptions: Subscription[], range: PayCycleRange): Subscription[] {
  return subscriptions
    .filter((s) => s.active && isInCycle(s.next_due_date, range))
    .sort((a, b) => (a.next_due_date < b.next_due_date ? -1 : 1));
}

export function overdueSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter((s) => s.active && s.payment_type === 'manual' && isOverdue(s.next_due_date));
}

/** Pagamenti registrati (log) la cui scadenza di riferimento cade nel ciclo corrente. */
export function paymentsInCycle(paymentLog: PaymentLogEntry[], range: PayCycleRange): PaymentLogEntry[] {
  return paymentLog.filter((p) => isInCycle(p.due_date, range));
}

export function sumAmount(subscriptions: Array<Pick<Subscription, 'amount'>>): number {
  return subscriptions.reduce((acc, s) => acc + Number(s.amount), 0);
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
