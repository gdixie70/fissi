# FISSI

App per iOS e Android per tenere traccia degli abbonamenti e dei pagamenti ricorrenti (affitto, bollette, streaming, palestra, assicurazioni...), sapere in ogni momento cosa resta da pagare nel mese e ricevere un promemoria prima delle scadenze — così puoi verificare di avere fondi sufficienti sul conto.

Costruita con **Expo (React Native) + TypeScript**. **Tutti i dati restano sul telefono** (nessun account, nessun server, nessuna connessione richiesta): puoi esportarli in un file di backup e reimportarli quando vuoi, anche su un altro dispositivo.

## Cosa fa

- Inserisci ogni pagamento ricorrente: nome, importo, valuta, frequenza (settimanale / mensile / trimestrale / annuale / personalizzata), categoria, note.
- Specifichi se è **automatico** (addebito diretto/RID/carta — non devi fare nulla, ma devi avere i fondi) o **manuale** (devi eseguirlo tu, es. bonifico).
- La **Panoramica** mostra subito: quanto hai ancora da pagare questo mese, quanto hai già pagato, e la lista dei pagamenti in sospeso ordinati per scadenza. I pagamenti manuali in ritardo sono evidenziati in rosso.
- Per i pagamenti manuali puoi segnarli come "pagato" con un tocco: la scadenza avanza automaticamente al ciclo successivo.
- I pagamenti automatici, una volta passata la data, vengono registrati da soli nello storico e la scadenza avanza al ciclo successivo.
- **Ogni scadenza può sempre essere modificata a mano** in un secondo momento (importo, data, frequenza, categoria, ecc.) dalla schermata di modifica dell'abbonamento.
- Promemoria locali sul telefono N giorni prima della scadenza (configurabile in Impostazioni) e il giorno stesso.
- **Esporta/Importa**: dalla schermata Impostazioni puoi esportare tutti i tuoi FISSI in un file `.json` (da salvare, inviare via email, mettere su Drive/iCloud...) e reimportarlo — utile per fare un backup o per trasferire i dati su un nuovo telefono.

## Dove sono salvati i dati

Tutto (abbonamenti + storico pagamenti) è salvato localmente sul dispositivo tramite `AsyncStorage`. Non c'è alcun account da creare né alcuna sincronizzazione automatica tra dispositivi: se disinstalli l'app o cambi telefono, i dati si perdono **a meno che tu non abbia esportato un backup**. Ti consigliamo di esportare un backup ogni tanto (Impostazioni → "Esporta i tuoi FISSI").

## Struttura del progetto

```
App.tsx                      Entry point: provider (tema) + navigazione
src/
  context/SubscriptionsContext.tsx  Stato dell'app: CRUD abbonamenti, riconciliazione
                                     pagamenti automatici, export/import
  lib/localStore.ts              Lettura/scrittura dati su AsyncStorage (storage locale)
  lib/exportImport.ts            Esportazione in JSON + condivisione, importazione da file
  lib/notifications.ts           Promemoria locali (expo-notifications)
  lib/settings.ts                Preferenza "giorni di anticipo" salvata sul dispositivo
  navigation/                    React Navigation (tab + stack)
  screens/                       Le schermate dell'app
  components/                    Componenti riutilizzabili (card abbonamento, statistiche)
  types/                         Tipi TypeScript condivisi
  utils/dates.ts                 Calcolo delle scadenze ricorrenti
  utils/selectors.ts             Calcoli per la dashboard (totali, filtri)
  utils/id.ts                    Generazione id locali univoci
```

## 1. Requisiti

- [Node.js](https://nodejs.org) 18 o superiore installato sul tuo computer.
- L'app **Expo Go** sul telefono, per testare l'app senza doverla compilare (gratis, da App Store / Play Store).

Non serve creare nessun account online: l'app funziona subito.

## 2. Installare ed eseguire l'app

Da terminale, nella cartella del progetto:

```bash
npm install
npx expo start
```

Si aprirà un QR code nel terminale/browser:

- **Android**: apri l'app Expo Go e scansiona il QR code.
- **iOS**: apri l'app Fotocamera e inquadra il QR code (si aprirà in Expo Go).

Al primo avvio l'app chiederà il permesso di inviare notifiche: concedilo per ricevere i promemoria. Poi puoi iniziare subito ad aggiungere i tuoi abbonamenti con il pulsante "+".

## 3. Backup, trasferimento dati e importazione

Dalla schermata **Impostazioni**:

- **Esporta i tuoi FISSI**: crea un file `fissi-backup-AAAA-MM-GG-hhmm.json` con tutti gli abbonamenti e lo storico pagamenti, e apre il foglio di condivisione del telefono per salvarlo dove preferisci (Email, Drive, iCloud, Files, AirDrop...).
- **Importa (unisci ai dati attuali)**: scegli un file di backup esportato in precedenza; gli abbonamenti nel file vengono aggiunti a quelli già presenti (se un id coincide, viene aggiornato). Utile per sincronizzare manualmente due dispositivi.
- **Importa (sostituisci tutti i dati attuali)**: scegli un file di backup e **sovrascrive completamente** i dati attuali sul dispositivo con quelli del file. Utile quando configuri un telefono nuovo.

Il formato del file è JSON semplice e leggibile, quindi puoi anche aprirlo/modificarlo a mano se necessario.

## 4. Modificare le scadenze in un secondo momento

Ogni abbonamento può essere modificato in qualunque momento: apri l'abbonamento dalla lista o dalla panoramica, tocca l'icona della matita in alto a destra e cambia nome, importo, valuta, frequenza, data della prossima scadenza, tipo di pagamento, categoria, colore o note. Puoi anche sospendere temporaneamente un abbonamento (toggle "Attivo/Sospeso") senza doverlo eliminare, oppure eliminarlo definitivamente.

## 5. Pubblicare l'app sugli store (facoltativo)

Per avere un'app installabile in modo permanente (non solo tramite Expo Go) e pubblicarla su App Store / Play Store si usa **EAS Build** di Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # oppure ios, oppure all
```

Servono un account Apple Developer (99$/anno) per iOS e un account Google Play Console (25$ una tantum) per Android. La guida ufficiale, sempre aggiornata: https://docs.expo.dev/build/introduction/

Nota: `app.json` contiene già un `bundleIdentifier` / `package` di esempio (`com.gianluca.fissi`) — cambiali se vuoi usare un altro identificativo.

## 6. Icona dell'app

Il file `icona_app.png` che avevi nella cartella del progetto era vuoto (0 byte), quindi per ora l'app usa l'icona segnaposto di Expo. Per usare un'icona personalizzata, sostituisci `assets/icon.png` (1024×1024px) e `assets/android-icon-foreground.png`, poi rilancia `npx expo start`.

## Possibili sviluppi futuri

- Vista calendario/mensile con tutte le occorrenze dell'anno.
- Esportazione in CSV/Excel oltre che JSON.
- Grafico per categoria di spesa.
- Backup automatico periodico su un file sempre nella stessa posizione.
