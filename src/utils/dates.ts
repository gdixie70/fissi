import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/it';
import { BillingCycle } from '../types';

dayjs.locale('it');

/** Formato standard usato per le colonne "date" su Supabase (YYYY-MM-DD). */
export const DATE_FORMAT = 'YYYY-MM-DD';

export function today(): Dayjs {
  return dayjs().startOf('day');
}

export function toDateOnly(date: string | Dayjs): string {
  return dayjs(date).format(DATE_FORMAT);
}

/**
 * Calcola la scadenza successiva a partire da una data e da un ciclo di
 * fatturazione ricorrente. Usa l'aritmetica dei mesi di dayjs, che gestisce
 * correttamente i mesi con lunghezza diversa (es. 31 gennaio + 1 mese =
 * 28/29 febbraio). Non ha senso chiamarla per cycle === 'once' (pagamenti
 * stand alone non si riprogrammano da soli).
 */
export function computeNextDueDate(fromDate: string, cycle: BillingCycle): string {
  const base = dayjs(fromDate);

  switch (cycle) {
    case 'bimonthly':
      return toDateOnly(base.add(2, 'month'));
    case 'quarterly':
      return toDateOnly(base.add(3, 'month'));
    case 'yearly':
      return toDateOnly(base.add(1, 'year'));
    case 'monthly':
    case 'once':
    default:
      return toDateOnly(base.add(1, 'month'));
  }
}

/**
 * Fa avanzare `next_due_date` finché non è >= oggi, restituendo la nuova
 * data e il numero di occorrenze "saltate" (cioè quante volte il ciclo è
 * scattato mentre l'app non veniva aperta). Usata per riconciliare i
 * pagamenti automatici. Non va chiamata per cycle === 'once': quei
 * pagamenti si gestiscono con una singola occorrenza (vedi SubscriptionsContext).
 */
export function advanceUntilFuture(
  dueDate: string,
  cycle: BillingCycle,
  referenceDate: Dayjs = today()
): { newDueDate: string; occurrencesPassed: string[] } {
  const occurrencesPassed: string[] = [];
  let current = dueDate;
  let guard = 0;

  while (!dayjs(current).isAfter(referenceDate) && guard < 1000) {
    occurrencesPassed.push(current);
    current = computeNextDueDate(current, cycle);
    guard += 1;
  }

  return { newDueDate: current, occurrencesPassed };
}

export function isSameMonth(dateStr: string, reference: Dayjs = today()): boolean {
  const d = dayjs(dateStr);
  return d.year() === reference.year() && d.month() === reference.month();
}

export interface PayCycleRange {
  start: Dayjs;
  end: Dayjs; // esclusa: il ciclo copre [start, end)
}

/** Il giorno di stipendio "clampato" alla lunghezza del mese indicato (es. 31 a febbraio -> ultimo giorno). */
function clampedPayday(monthAnchor: Dayjs, payday: number): Dayjs {
  const lastDay = monthAnchor.daysInMonth();
  return monthAnchor.date(Math.min(payday, lastDay));
}

/**
 * Calcola il ciclo "mese" dell'app: dal giorno di stipendio (incluso) al
 * giorno di stipendio successivo (escluso), non il mese di calendario.
 * Es. stipendio il 27: dal 27/07 al 26/08 compreso.
 */
export function payCycleRange(payday: number, reference: Dayjs = today()): PayCycleRange {
  const paydayThisMonth = clampedPayday(reference.startOf('month'), payday);

  if (!reference.isBefore(paydayThisMonth, 'day')) {
    const nextMonthAnchor = reference.add(1, 'month').startOf('month');
    return { start: paydayThisMonth, end: clampedPayday(nextMonthAnchor, payday) };
  }

  const prevMonthAnchor = reference.subtract(1, 'month').startOf('month');
  return { start: clampedPayday(prevMonthAnchor, payday), end: paydayThisMonth };
}

/** true se dateStr cade nel ciclo [start, end) (start incluso, end escluso). */
export function isInCycle(dateStr: string, range: PayCycleRange): boolean {
  const d = dayjs(dateStr);
  return !d.isBefore(range.start, 'day') && d.isBefore(range.end, 'day');
}

export function formatCycleRange(range: PayCycleRange): string {
  const sameYear = range.start.year() === range.end.year();
  const startFmt = range.start.format(sameYear ? 'D MMM' : 'D MMM YYYY');
  const endFmt = range.end.subtract(1, 'day').format('D MMM YYYY');
  return `${startFmt} – ${endFmt}`;
}

export function isOverdue(dateStr: string, reference: Dayjs = today()): boolean {
  return dayjs(dateStr).isBefore(reference, 'day');
}

export function isDueToday(dateStr: string, reference: Dayjs = today()): boolean {
  return dayjs(dateStr).isSame(reference, 'day');
}

export function daysUntil(dateStr: string, reference: Dayjs = today()): number {
  return dayjs(dateStr).startOf('day').diff(reference, 'day');
}

export function formatItalianDate(dateStr: string): string {
  return dayjs(dateStr).format('D MMMM YYYY');
}

export function formatShortDate(dateStr: string): string {
  return dayjs(dateStr).format('DD/MM/YYYY');
}

export function monthLabel(reference: Dayjs = today()): string {
  const label = reference.format('MMMM YYYY');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
