import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import dayjs from 'dayjs';
import { FissiBackup, PaymentLogEntry, Subscription } from '../types';

/**
 * Esporta abbonamenti + storico pagamenti in un file JSON e apre il foglio
 * di condivisione del sistema, così l'utente può salvarlo (Files, Drive,
 * email, AirDrop, ecc.) come backup o per trasferirlo su un altro dispositivo.
 */
export async function exportBackup(subscriptions: Subscription[], paymentLog: PaymentLogEntry[]): Promise<void> {
  const backup: FissiBackup = {
    format: 'fissi-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    subscriptions,
    paymentLog,
  };

  const fileName = `fissi-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`;
  const directory = new Directory(Paths.cache, 'fissi-exports');
  if (!directory.exists) directory.create({ intermediates: true });

  const file = new File(directory, fileName);
  if (file.exists) file.delete();
  file.write(JSON.stringify(backup, null, 2));

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Esporta i tuoi FISSI',
      UTI: 'public.json',
    });
  } else {
    throw new Error(
      `Condivisione non disponibile su questo dispositivo. Il file è stato salvato in: ${file.uri}`
    );
  }
}

export type ImportPickResult =
  | { canceled: true }
  | { canceled: false; backup: FissiBackup };

/** Apre il selettore di file e legge/valida un backup FISSI. */
export async function pickBackupFile(): Promise<ImportPickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { canceled: true };
  }

  const uri = result.assets[0].uri;
  const file = new File(uri);
  const content = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Il file selezionato non è un JSON valido.');
  }

  if (!isFissiBackup(parsed)) {
    throw new Error('Il file selezionato non sembra un backup di FISSI valido.');
  }

  return { canceled: false, backup: parsed };
}

function isFissiBackup(value: unknown): value is FissiBackup {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.format === 'fissi-backup' &&
    Array.isArray(obj.subscriptions) &&
    Array.isArray(obj.paymentLog)
  );
}
