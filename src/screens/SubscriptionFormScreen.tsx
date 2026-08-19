import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, SegmentedButtons, Text, TextInput, TouchableRipple, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { RootStackParamList } from '../navigation/types';
import { BILLING_CYCLE_LABELS, BillingCycle, CATEGORY_SUGGESTIONS, PaymentType, RECURRING_CYCLES } from '../types';
import { formatShortDate, toDateOnly } from '../utils/dates';
import { getCategoryIcon } from '../utils/categoryIcons';
import { ACCENT_COLORS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionForm'>;

export function SubscriptionFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const subscriptionId = route.params?.subscriptionId;
  const isEditing = Boolean(subscriptionId);

  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const existing = subscriptions.find((s) => s.id === subscriptionId);

  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [currency, setCurrency] = useState(existing?.currency ?? 'EUR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(existing?.billing_cycle ?? 'monthly');
  const [nextDueDate, setNextDueDate] = useState<string>(existing?.next_due_date ?? toDateOnly(dayjs()));
  const [paymentType, setPaymentType] = useState<PaymentType>(existing?.payment_type ?? 'manual');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [color, setColor] = useState(existing?.color ?? ACCENT_COLORS[0]);
  const [active, setActive] = useState(existing?.active ?? true);

  const isStandalone = billingCycle === 'once';

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Modifica pagamento' : 'Nuovo pagamento' });
  }, [navigation, isEditing]);

  const handleSave = async () => {
    setError(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!name.trim()) {
      setError('Inserisci un nome.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Inserisci un importo valido.');
      return;
    }
    if (!nextDueDate) {
      setError('Seleziona la data di scadenza.');
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      amount: parsedAmount,
      currency: currency.trim() || 'EUR',
      billing_cycle: billingCycle,
      next_due_date: nextDueDate,
      payment_type: paymentType,
      category: category.trim() || null,
      notes: notes.trim() || null,
      color,
      active,
    };

    const result = isEditing && subscriptionId
      ? await updateSubscription(subscriptionId, payload)
      : await addSubscription(payload);

    setSaving(false);

    if (result.limitReached) {
      navigation.replace('Paywall');
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!subscriptionId) return;
    Alert.alert(
      'Eliminare questo pagamento?',
      `"${name || 'Questo pagamento'}" verrà eliminato definitivamente, insieme al suo storico dei pagamenti. L'azione non può essere annullata.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const result = await deleteSubscription(subscriptionId);
            setSaving(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex1, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput label="Nome (es. Netflix, Affitto, Palestra)" value={name} onChangeText={setName} mode="outlined" style={styles.input} />

        <View style={styles.row}>
          <TextInput
            label="Importo"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="decimal-pad"
            style={[styles.input, styles.flex1, { marginRight: 8 }]}
          />
          <TextInput
            label="Valuta"
            value={currency}
            onChangeText={setCurrency}
            mode="outlined"
            autoCapitalize="characters"
            style={[styles.input, { width: 90 }]}
          />
        </View>

        <Text variant="labelLarge" style={styles.label}>
          Tipo
        </Text>
        <SegmentedButtons
          value={isStandalone ? 'once' : 'recurring'}
          onValueChange={(v) => setBillingCycle(v === 'once' ? 'once' : 'monthly')}
          buttons={[
            { value: 'once', label: 'Stand alone', icon: 'circle-outline' },
            { value: 'recurring', label: 'Ricorrente', icon: 'autorenew' },
          ]}
          style={styles.input}
        />

        {!isStandalone && (
          <>
            <Text variant="labelLarge" style={styles.label}>
              Frequenza
            </Text>
            <SegmentedButtons
              value={billingCycle}
              onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              buttons={RECURRING_CYCLES.map((cycle) => ({ value: cycle, label: BILLING_CYCLE_LABELS[cycle] }))}
              style={styles.input}
            />
          </>
        )}

        <Text variant="labelLarge" style={styles.label}>
          {isStandalone ? 'Scadenza' : 'Prossima scadenza'}
        </Text>
        <TouchableRipple onPress={() => setShowDatePicker(true)} style={[styles.dropdown, { borderColor: theme.colors.outline }]}>
          <Text variant="bodyLarge">{formatShortDate(nextDueDate)}</Text>
        </TouchableRipple>
        {showDatePicker && (
          <DateTimePicker
            value={dayjs(nextDueDate).toDate()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (event.type === 'dismissed') {
                setShowDatePicker(false);
                return;
              }
              if (date) setNextDueDate(toDateOnly(dayjs(date)));
            }}
          />
        )}

        <Text variant="labelLarge" style={styles.label}>
          Tipo di pagamento
        </Text>
        <SegmentedButtons
          value={paymentType}
          onValueChange={(v) => setPaymentType(v as PaymentType)}
          buttons={[
            { value: 'automatic', label: 'Automatico', icon: 'autorenew' },
            { value: 'manual', label: 'Manuale', icon: 'hand-back-right-outline' },
          ]}
          style={styles.input}
        />
        <Text variant="bodySmall" style={styles.hint}>
          {paymentType === 'automatic'
            ? 'Viene addebitato da solo (es. RID/carta): l\'app ti ricorda comunque di controllare i fondi.'
            : 'Devi eseguirlo tu manualmente: potrai segnarlo come pagato dalla dashboard.'}
        </Text>

        <Text variant="labelLarge" style={styles.label}>
          Categoria
        </Text>
        <TextInput
          label="Categoria (facoltativa)"
          value={category}
          onChangeText={setCategory}
          mode="outlined"
          style={styles.input}
        />
        <View style={styles.chipsRow}>
          {CATEGORY_SUGGESTIONS.map((c) => (
            <Chip
              key={c}
              compact
              icon={getCategoryIcon(c)}
              selected={category === c}
              onPress={() => setCategory(c)}
              style={styles.chip}
            >
              {c}
            </Chip>
          ))}
        </View>

        <Text variant="labelLarge" style={styles.label}>
          Colore
        </Text>
        <View style={styles.chipsRow}>
          {ACCENT_COLORS.map((c) => (
            <TouchableRipple key={c} onPress={() => setColor(c)} style={styles.colorSwatchWrapper}>
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c, borderColor: theme.colors.outlineVariant },
                  color === c && [styles.colorSwatchSelected, { borderColor: theme.colors.onSurface }],
                ]}
              />
            </TouchableRipple>
          ))}
        </View>

        <TextInput
          label="Note (facoltative)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        {isEditing && (
          <View style={styles.activeRow}>
            <Text variant="bodyLarge">Pagamento attivo</Text>
            <Chip selected={active} onPress={() => setActive(!active)}>
              {active ? 'Attivo' : isStandalone ? 'Pagato' : 'Sospeso'}
            </Chip>
          </View>
        )}

        {error && (
          <Text style={{ color: theme.colors.error, marginBottom: 12 }} variant="bodySmall">
            {error}
          </Text>
        )}

        <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveButton}>
          {isEditing ? 'Salva modifiche' : 'Aggiungi pagamento'}
        </Button>

        {isEditing && (
          <Button mode="outlined" textColor={theme.colors.error} onPress={handleDelete} style={styles.deleteButton}>
            Elimina pagamento
          </Button>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  input: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    marginBottom: 8,
    opacity: 0.8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  hint: {
    opacity: 0.6,
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 0,
  },
  colorSwatchWrapper: {
    borderRadius: 20,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  colorSwatchSelected: {
    borderWidth: 3,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 10,
  },
  deleteButton: {
    marginTop: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
});
