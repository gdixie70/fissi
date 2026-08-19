import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FissiBackup, PaymentLogEntry, Subscription } from '../types';

/**
 * Backup automatico "leggero": scrive lo stesso formato JSON dell'export manuale
 * (src/lib/exportImport.ts) dentro la cartella Documents dell'app invece della
 * cartella Cache. La cartella Documents rientra nei backup di sistema del telefono
 * (Auto Backup for Apps su Android, backup iCloud del dispositivo su iOS, se attivo)
 * senza bisogno di integrare API cloud nostre — nessun account, nessun OAuth.
 */

const BACKUP_DIR_NAME = 'fissi-auto-backup';
const BACKUP_FILE_NAME = 'backup.json';
const LAST_BACKUP_AT_KEY = 'fissi:lastAutoBackupAt';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

function getBackupFile(): File {
  const directory = new Directory(Paths.document, BACKUP_DIR_NAME);
  if (!directory.exists) directory.create({ intermediates: true });
  return new File(directory, BACKUP_FILE_NAME);
}

async function writeAutoBackupNow(subscriptions: Subscription[], paymentLog: PaymentLogEntry[]): Promise<void> {
  const backup: FissiBackup = {
    format: 'fissi-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    subscriptions,
    paymentLog,
  };

  const file = getBackupFile();
  if (file.exists) file.delete();
  file.write(JSON.stringify(backup));

  await AsyncStorage.setItem(LAST_BACKUP_AT_KEY, backup.exportedAt);
}

/** Pianifica una scrittura del backup automatico, raggruppando modifiche ravvicinate. */
export function scheduleAutoBackup(subscriptions: Subscription[], paymentLog: PaymentLogEntry[]): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    writeAutoBackupNow(subscriptions, paymentLog).catch(() => {
      // Il backup automatico è un "di più": se fallisce non deve bloccare l'app.
    });
  }, DEBOUNCE_MS);
}

export async function getLastBackupDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_BACKUP_AT_KEY);
}

/** Legge il backup automatico più recente, se esiste. */
export async function readAutoBackup(): Promise<FissiBackup | null> {
  const file = getBackupFile();
  if (!file.exists) return null;

  const content = await file.text();
  try {
    const parsed = JSON.parse(content) as FissiBackup;
    if (parsed.format !== 'fissi-backup') return null;
    return parsed;
  } catch {
    return null;
  }
}
