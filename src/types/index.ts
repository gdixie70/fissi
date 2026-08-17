/** 'once' = pagamento stand alone (una tantum), le altre sono ricorrenze cicliche. */
export type BillingCycle = 'once' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';

export type PaymentType = 'automatic' | 'manual';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_due_date: string; // formato YYYY-MM-DD
  payment_type: PaymentType;
  category: string | null;
  notes: string | null;
  color: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type NewSubscription = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;

export interface PaymentLogEntry {
  id: string;
  subscription_id: string;
  due_date: string;
  amount: number;
  currency: string;
  paid_automatically: boolean;
  paid_at: string;
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  once: 'Stand alone',
  monthly: 'Mensile',
  bimonthly: 'Bimestrale',
  quarterly: 'Trimestrale',
  yearly: 'Annuale',
};

/** Solo le ricorrenze cicliche (esclude "once", che si sceglie con un toggle a parte nel form). */
export const RECURRING_CYCLES: BillingCycle[] = ['monthly', 'bimonthly', 'quarterly', 'yearly'];

export const CATEGORY_SUGGESTIONS = [
  'Streaming',
  'Musica',
  'Palestra',
  'Casa',
  'Utenze',
  'Assicurazioni',
  'Software',
  'Telefonia',
  'Trasporti',
  'Altro',
];

/** Formato del file di backup generato dall'esportazione. */
export interface FissiBackup {
  format: 'fissi-backup';
  version: 1;
  exportedAt: string;
  subscriptions: Subscription[];
  paymentLog: PaymentLogEntry[];
}
