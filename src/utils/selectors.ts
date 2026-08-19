import dayjs from 'dayjs';
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

/** Anni distinti presenti nello storico pagamenti, dal più recente. */
export function yearsWithData(paymentLog: PaymentLogEntry[]): number[] {
  const years = new Set(paymentLog.map((p) => dayjs(p.due_date).year()));
  return Array.from(years).sort((a, b) => b - a);
}

/** Voci dello storico la cui scadenza cade nell'anno indicato. */
export function paymentsInYear(paymentLog: PaymentLogEntry[], year: number): PaymentLogEntry[] {
  return paymentLog.filter((p) => dayjs(p.due_date).year() === year);
}

export interface CategoryTotal {
  category: string;
  total: number;
}

const UNCATEGORIZED_LABEL = 'Senza categoria';

/** Somma per categoria (dal pagamento fisso collegato, "Senza categoria" se assente o
 * eliminato), ordinata dal totale più alto. */
export function totalsByCategory(
  entries: PaymentLogEntry[],
  subscriptionsById: Map<string, Subscription>
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const category = subscriptionsById.get(entry.subscription_id)?.category || UNCATEGORIZED_LABEL;
    totals.set(category, (totals.get(category) ?? 0) + Number(entry.amount));
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/** Totale per ciascuno dei 12 mesi dell'anno (indice 0 = gennaio). */
export function monthlyTotals(entries: PaymentLogEntry[]): number[] {
  const totals = new Array(12).fill(0);
  for (const entry of entries) {
    const month = dayjs(entry.due_date).month();
    totals[month] += Number(entry.amount);
  }
  return totals;
}
