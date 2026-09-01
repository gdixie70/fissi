import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Divider, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { RootStackParamList } from '../navigation/types';
import { setDevPremiumOverride } from '../lib/purchases';
import { SUCCESS_COLOR } from '../theme';

const LEAD_OPTIONS = ['0', '1', '3', '5', '7'];

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    reminderLeadDays,
    updateReminderLeadDays,
    payday,
    updatePayday,
    exportData,
    importData,
    subscriptions,
    paymentLog,
    isPremium,
    lastBackupAt,
    restorePurchases,
    restoreFromAutoBackup,
    refreshPremiumStatus,
  } = useSubscriptions();

  const [paydayInput, setPaydayInput] = useState(String(payday));
  const [paydayError, setPaydayError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handlePaydayBlur = () => {
    const parsed = parseInt(paydayInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) {
      setPaydayError('Inserisci un giorno tra 1 e 31.');
      setPaydayInput(String(payday));
      return;
    }
    setPaydayError(null);
    if (parsed !== payday) updatePayday(parsed);
  };

  const handleExport = async () => {
    setMessage(null);
    setExporting(true);
    const result = await exportData();
    setExporting(false);
    if (result.error) {
      setMessage({ text: result.error, isError: true });
    }
  };

  const handleImport = async (mode: 'merge' | 'replace') => {
    setMessage(null);
    setImporting(true);
    const result = await importData(mode);
    setImporting(false);

    if (result.error) {
      setMessage({ text: result.error, isError: true });
      return;
    }
    if (result.canceled) return;

    setMessage({
      text:
        mode === 'replace'
          ? `Dati sostituiti: ${result.imported ?? 0} pagamenti importati.`
          : `Dati uniti: ${result.imported ?? 0} pagamenti nel file importato.`,
      isError: false,
    });
  };

  const handleRestoreBackup = async () => {
    setMessage(null);
    setRestoringBackup(true);
    const result = await restoreFromAutoBackup();
    setRestoringBackup(false);

    if (result.error) {
      setMessage({ text: result.error, isError: true });
      return;
    }
    setMessage({ text: `Backup ripristinato: ${result.imported ?? 0} pagamenti.`, isError: false });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text variant="headlineSmall" style={styles.heading}>
        Impostazioni
      </Text>

      {isPremium ? (
        <>
          <View style={[styles.premiumCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <MaterialCommunityIcons name="star-four-points" size={22} color={theme.colors.onTertiaryContainer} />
            <Text variant="titleMedium" style={{ color: theme.colors.onTertiaryContainer, flex: 1 }}>
              Sei Premium
            </Text>
            <Chip compact onPress={restorePurchases}>
              Ripristina
            </Chip>
          </View>
          <Button
            mode="outlined"
            icon="chart-donut"
            onPress={() => navigation.navigate('Recap')}
            style={styles.button}
          >
            Recap annuale
          </Button>
        </>
      ) : (
        <View style={[styles.premiumCard, { backgroundColor: theme.colors.elevation.level1 }]}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium">Passa a Premium</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pagamenti illimitati, backup automatico, recap annuale.
            </Text>
          </View>
          <Button mode="contained" compact onPress={() => navigation.navigate('Paywall')}>
            Scopri
          </Button>
        </View>
      )}

      <Divider style={styles.divider} />

      <Text variant="labelLarge" style={styles.label}>
        Giorno di stipendio
      </Text>
      <TextInput
        value={paydayInput}
        onChangeText={setPaydayInput}
        onBlur={handlePaydayBlur}
        mode="outlined"
        keyboardType="number-pad"
        style={styles.paydayInput}
      />
      {paydayError && (
        <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 8 }}>
          {paydayError}
        </Text>
      )}
      <Text variant="bodySmall" style={styles.hint}>
        Il "mese" mostrato in Panoramica va da questo giorno al giorno di stipendio successivo, non dal
        calendario. Serve solo per raggruppare i pagamenti fissi: l'app non gestisce importi di stipendio o
        saldi, resta tutto nelle tue mani.
      </Text>

      <Divider style={styles.divider} />

      <Text variant="labelLarge" style={styles.label}>
        Promemoria: quanti giorni prima della scadenza
      </Text>
      <SegmentedButtons
        value={String(reminderLeadDays)}
        onValueChange={(v) => updateReminderLeadDays(parseInt(v, 10))}
        buttons={LEAD_OPTIONS.map((v) => ({ value: v, label: v === '0' ? 'No' : v }))}
        style={styles.segmented}
      />
      <Text variant="bodySmall" style={styles.hint}>
        Riceverai comunque una notifica il giorno stesso della scadenza. Le notifiche sono locali sul
        dispositivo: assicurati di aver concesso il permesso quando richiesto.
      </Text>

      <Divider style={styles.divider} />

      <Text variant="labelLarge" style={styles.label}>
        Dati locali
      </Text>
      <Text variant="bodySmall" style={styles.hint}>
        Tutti i tuoi dati ({subscriptions.length} pagamenti, {paymentLog.length} pagamenti registrati) sono
        salvati solo su questo dispositivo. Esporta un backup per conservarlo o per trasferirlo su un altro
        telefono.
      </Text>

      <Button mode="contained" icon="export" onPress={handleExport} loading={exporting} style={styles.button}>
        Esporta i tuoi FISSI
      </Button>

      <Button
        mode="outlined"
        icon="import"
        onPress={() => handleImport('merge')}
        loading={importing}
        style={styles.button}
      >
        Importa (unisci ai dati attuali)
      </Button>

      <Button
        mode="outlined"
        icon="delete-sweep-outline"
        textColor={theme.colors.error}
        onPress={() => handleImport('replace')}
        loading={importing}
        style={styles.button}
      >
        Importa (sostituisci tutti i dati attuali)
      </Button>

      {message && (
        <Text
          variant="bodySmall"
          style={[styles.message, { color: message.isError ? theme.colors.error : SUCCESS_COLOR }]}
        >
          {message.text}
        </Text>
      )}

      <Divider style={styles.divider} />

      <Text variant="labelLarge" style={styles.label}>
        Backup automatico
      </Text>
      {isPremium ? (
        <>
          <Text variant="bodySmall" style={styles.hint}>
            {lastBackupAt
              ? `Ultimo backup: ${dayjs(lastBackupAt).format('DD/MM/YYYY HH:mm')}. `
              : 'Nessun backup ancora effettuato: verrà creato automaticamente alla prossima modifica. '}
            Rientra nel backup di sistema del telefono, nessuna configurazione richiesta.
          </Text>
          <Button
            mode="outlined"
            icon="cloud-download-outline"
            onPress={handleRestoreBackup}
            loading={restoringBackup}
            style={styles.button}
          >
            Ripristina da backup automatico
          </Button>
        </>
      ) : (
        <>
          <Text variant="bodySmall" style={styles.hint}>
            Con Premium i tuoi dati vengono salvati automaticamente nel backup di sistema del telefono,
            senza doverli esportare a mano.
          </Text>
          <Button mode="outlined" onPress={() => navigation.navigate('Paywall')} style={styles.button}>
            Scopri Premium
          </Button>
        </>
      )}

      {__DEV__ && (
        <>
          <Divider style={styles.divider} />
          <Text variant="labelLarge" style={styles.label}>
            Solo sviluppo
          </Text>
          <Text variant="bodySmall" style={styles.hint}>
            Simula lo stato Premium senza un acquisto reale. Non visibile nella build di produzione.
          </Text>
          <SegmentedButtons
            value={isPremium ? 'on' : 'off'}
            onValueChange={async (v) => {
              await setDevPremiumOverride(v === 'on');
              await refreshPremiumStatus();
            }}
            buttons={[
              { value: 'off', label: 'Premium OFF' },
              { value: 'on', label: 'Premium ON' },
            ]}
          />
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 20,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  label: {
    opacity: 0.7,
    marginBottom: 6,
  },
  paydayInput: {
    marginBottom: 6,
    width: 100,
  },
  divider: {
    marginVertical: 20,
  },
  segmented: {
    marginBottom: 10,
  },
  hint: {
    opacity: 0.6,
    marginBottom: 14,
  },
  button: {
    marginTop: 10,
    borderRadius: 10,
  },
  message: {
    marginTop: 16,
  },
});
