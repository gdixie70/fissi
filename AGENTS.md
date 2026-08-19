# Stato del progetto FISSI (riepilogo per sessioni future)

Questo file viene caricato automaticamente in ogni sessione (`CLAUDE.md` lo include con `@AGENTS.md`).
Leggilo prima di iniziare a lavorare: risparmia di dover ririspiegare il progetto da capo.

## Regole di lavoro fisse (richieste esplicitamente dall'utente)

1. **Tieni questo file aggiornato ad ogni sessione di lavoro rilevante.** Dopo aver implementato
   qualcosa di significativo, aggiungi/aggiorna qui la sezione pertinente — è così che una
   conversazione futura (anche su una macchina diversa) recupera tutto il contesto senza doverselo
   far rispiegare da zero.
2. **Fai sempre commit e push su GitHub** dopo aver completato un pezzo di lavoro (repo:
   `https://github.com/gdixie70/fissi.git`, branch `master`). Non lasciare lavoro fatto solo
   committato in locale o peggio non committato.
3. **Non lanciare mai una build EAS (`eas build`) senza permesso esplicito dell'utente in quella
   specifica conversazione.** Le build sono a pagamento/a quota limitata: non vanno consumate di
   iniziativa, nemmeno per "testare velocemente" una modifica. Aspetta che sia l'utente a chiedere
   di buildare.

## Cos'è

App Expo (React Native + TypeScript) per iOS/Android che tiene traccia dei **Pagamenti fissi**
dell'utente — abbonamenti ricorrenti (streaming, palestra, telefonia...) e pagamenti stand alone
(una tantum, es. una fattura una tantum) — per sapere sempre "cosa mi resta da pagare questo
ciclo?". **Non gestisce saldi, conti bancari, né importi di stipendio**: è deliberatamente solo
un promemoria/tracker, l'utente amministra le finanze per conto suo. Nessun account, nessun
backend/cloud: storage 100% locale su dispositivo (AsyncStorage).

Il nome "FISSI" richiama proprio "pagamenti fissi" — usato anche nei testi dell'interfaccia.

## Stack e versioni (IMPORTANTE)

- **Expo SDK 54** (`expo: ~54.0.37`), React 19.1.0, React Native 0.81.5.
- **Il progetto era partito su SDK 57, poi è stato fatto un downgrade deliberato a SDK 54.**
  Motivo: l'app Expo Go pubblicata su App Store/Play Store supporta solo l'SDK indicato dal
  campo `expoGoSdkVersion` di `https://api.expo.dev/v2/versions/latest` — quando è stato
  controllato era **54**, non 57 (SDK nuovissimi restano indietro rispetto a Expo Go pubblico
  anche per settimane/mesi). **Prima di assumere che un SDK più recente sia usabile con Expo Go,
  verifica quel campo** — non fidarti solo del fatto che `expo` supporti quella versione su npm.
- Se in futuro si torna a un SDK più recente, verificare sempre la documentazione versionata su
  `docs.expo.dev/versions/vXX.0.0/` prima di scrivere codice, dato che le API di Expo cambiano
  frequentemente tra SDK.

## Modello dati

`src/types/index.ts`:
- `Subscription` (un "Pagamento" nell'UI): `name`, `amount`, `currency`, `billing_cycle`,
  `next_due_date` (YYYY-MM-DD), `payment_type` (`automatic`/`manual`), `category`, `notes`,
  `color`, `active`.
- `BillingCycle = 'once' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly'`.
  `'once'` = pagamento **Stand alone**: una sola occorrenza, dopo il pagamento la subscription
  diventa `active: false` (non si riprogramma). Le altre sono ricorrenze cicliche.
  *(Non esistono più `weekly` e `custom_days`: sono stati rimossi perché il selettore che li
  usava era rotto — vedi sezione bug sotto — e comunque non richiesti dall'utente. C'è una
  migrazione difensiva in `src/lib/localStore.ts` che rimappa eventuali vecchi valori salvati a
  `monthly`.)*
- `PaymentLogEntry`: storico dei pagamenti effettivamente registrati (con `due_date`, `amount`,
  `paid_automatically`).

## Il concetto chiave: ciclo stipendio, non mese di calendario

L'utente ha impostato un **giorno di stipendio fisso** (`payday`, 1-31, in Impostazioni,
`src/lib/settings.ts`). Il "mese" mostrato nell'app **non è il mese di calendario**: va dal
giorno di stipendio al giorno di stipendio successivo (`payCycleRange` in `src/utils/dates.ts`).
La Dashboard (`src/screens/DashboardScreen.tsx`) mostra:
- una **barra verde animata** (`src/components/CycleProgressBar.tsx`) con il totale ancora da
  pagare nel ciclo corrente, che si riduce quando un pagamento risulta pagato;
- lista "In questo ciclo devi ancora pagare" (pagamenti attivi con scadenza nel ciclo);
- lista "Pagati in questo ciclo" (voci di storico nel ciclo, `src/components/PaidEntryRow.tsx`).

Sottrazione automatica: per i pagamenti **automatici**, `reconcileAutomaticPayments` (in
`SubscriptionsContext.tsx`) li segna pagati **il giorno stesso** della scadenza (non il giorno
dopo — era un bug corretto, il controllo era `isBefore` invece di includere il giorno corrente).
Per i **manuali** non scatta nulla in automatico: serve che l'utente tocchi "Segna come pagato".

Il calcolo del ciclo (`cycleRange` in `DashboardScreen.tsx`) **non va mai messo in un `useMemo`
con `[payday]` come unica dipendenza**: dipende anche dalla data odierna, che cambia da un
render all'altro senza che `payday` cambi. C'è anche un listener `AppState` in
`SubscriptionsContext.tsx` che rifà `refresh()` quando l'app torna in primo piano (le tab di
React Navigation restano montate, non si rismontano cambiando schermata — senza quel listener
l'app resterebbe ferma sul ciclo vecchio se lasciata in background overnight).

## Bug noti e risolti (da non reintrodurre)

- **`Menu` di react-native-paper non funziona sotto la New Architecture** (attiva di default da
  SDK 54+): il selettore a tendina della frequenza restava bloccato sul valore iniziale. Sostituito
  con `SegmentedButtons` a due livelli in `SubscriptionFormScreen.tsx` (Tipo: Stand
  alone/Ricorrente → Frequenza). Se serve un altro selettore a scelta multipla, **non usare
  `Menu`**, preferire `SegmentedButtons` o `Chip`.
- I campi in fondo al form venivano coperti dalla tastiera → risolto con `KeyboardAvoidingView`
  in `SubscriptionFormScreen.tsx`.
- I titoli delle tre schermate tab (headerShown: false nel Tab.Navigator) partivano da sotto la
  barra di stato/notch → risolto avvolgendo ciascuna con `SafeAreaView` (`edges={['top']}`) da
  `react-native-safe-area-context`. Le schermate stack (form/dettaglio) non ne hanno bisogno,
  usano l'header nativo che gestisce da solo la safe area.

## Design visivo

`src/theme.ts` centralizza tema chiaro/scuro (`App.tsx` sceglie in base a `useColorScheme()`,
`app.json` ha `userInterfaceStyle: "automatic"`), la palette `ACCENT_COLORS` (9 colori, incluso
bianco e giallo — con `getContrastColor()` per scegliere icona scura/chiara automaticamente sopra
ogni colore) e `SUCCESS_COLOR`. `src/utils/categoryIcons.ts` mappa le categorie suggerite a icone
MaterialCommunityIcons. Evitare colori hex hardcoded nei componenti: usare i token del tema
(`theme.colors.*`) così dark mode funziona ovunque senza sorprese.

## Deploy / EAS

- Progetto EAS collegato: `@gdixie70/fissi-app` (`eas.json` con profili `development`, `preview`,
  `production`; `app.json` ha `extra.eas.projectId`).
- **Build Android (profilo `preview`)**: completata, APK installabile direttamente (no Play
  Store necessario).
- **Build iOS (profilo `production`)**: completata, sottomessa con `eas submit` e **già
  installata su TestFlight** dall'utente.
- iOS richiede un Apple Developer Program a pagamento (l'utente ce l'ha già). Il certificato di
  distribuzione Apple è condiviso con altri progetti dello stesso account (`fatturazione`,
  `il-ricettario`) — è normale, i certificati sono legati all'account/team, non al singolo
  progetto: nessun rischio di sovrapposizione tra le app.
- **La quota build gratuita mensile di EAS non è verificabile da CLI**, solo dalla dashboard web
  (expo.dev → account → billing/usage). Se una build fallisce per quota esaurita, aspettare il
  reset mensile o chiedere conferma prima di procedere.

## Monetizzazione: livello Premium (in corso)

Piano completo in `C:\Users\gdixi\.claude\plans\composed-juggling-hennessy.md` (fasi 0-6). Decisioni
prese: livello gratuito limitato a **3 pagamenti attivi** (`FREE_TIER_MAX_ACTIVE` in
`src/lib/limits.ts`), Premium **4,99€/anno** che sblocca pagamenti illimitati + backup automatico +
recap annuale. Conteggio del limite solo sui pagamenti `active: true`, non su tutti quelli mai
creati.

**Fasi 0-3 già implementate** (nessuna dipendenza esterna, tutto testabile subito):
- `src/lib/purchases.ts`: stub degli acquisti in-app con le firme già definitive
  (`initPurchases`, `getIsPremium`, `purchasePremium`, `restorePurchases`) — oggi sostenuto da un
  flag `AsyncStorage` attivabile solo in `__DEV__` tramite un interruttore "Premium ON/OFF" in
  fondo a Impostazioni. **Quando si collega l'SDK reale (RevenueCat, vedi Fase 5 del piano), va
  riscritto solo l'interno di questo file**, non chi lo chiama.
- Gating in `SubscriptionsContext.tsx`: `addSubscription`/`updateSubscription` controllano il
  limite (anche sul percorso "riattiva un pagamento sospeso" via form, non solo su "+ nuovo").
  Ritornano `{ error, limitReached? }` — `limitReached: true` va gestito reindirizzando al Paywall,
  non mostrato come testo d'errore.
- `src/screens/PaywallScreen.tsx` (rotta `Paywall`, modal) + `src/lib/backup.ts` (scrittura
  automatica debounced in `Paths.document`, non `Paths.cache`, così rientra nei backup di sistema
  del telefono — nessuna integrazione OAuth con iCloud/Drive, deliberatamente) +
  `src/screens/RecapScreen.tsx` (rotta `Recap`, dati aggregati con nuove funzioni in
  `src/utils/selectors.ts`: `paymentsInYear`, `totalsByCategory`, `monthlyTotals`,
  `yearsWithData`; niente libreria di grafici, riusa il pattern di barre `Animated.Value` di
  `CycleProgressBar.tsx`, vedi anche il nuovo `src/components/CategoryBar.tsx`).

**Fase 4 in corso** (setup esterno, solo l'utente può farlo):
- Progetto RevenueCat "Fissi" creato (piattaforma React Native), con l'app iOS collegata:
  Bundle ID `com.gianluca.fissi`, chiave **In-App Purchase** di Apple caricata (Key ID
  `JFTDD76N23` + Issuer ID + file `.p8`, generata da App Store Connect → Utenti e accessi →
  Integrazioni).
- **Prodotto abbonamento creato su App Store Connect**: `fissi_premium_annual`, gruppo
  "Fissi" (ID gruppo `22320695`), durata 1 anno, disponibilità configurata su "Pagamento
  anticipato di 1 anno" (non sulla variante a rate mensili), prezzo 4,99€, localizzazione
  italiana (nome "FISSI Premium", descrizione impostata), localizzazione del gruppo fatta
  ("FISSI Premium"). Stato: "In preparazione per l'invio" — non ancora sottomesso alla
  review Apple, non serve finché non si pubblica davvero.
- **Prodotto collegato su RevenueCat**: importato manualmente in Product catalog → Products
  (identifier `fissi_premium_annual`, sotto l'app "Fissi (App Store)"), con l'**entitlement
  `premium`** creato e collegato (risulta "1 Entitlement" nella lista prodotti). Lato iOS su
  RevenueCat è sostanzialmente pronto.
- **Prossimo passo**: recuperare la chiave SDK pubblica iOS da RevenueCat → API keys — serve
  per la Fase 5 (collegamento del codice, va messa in `src/lib/purchases.ts`). Non è un
  segreto come la chiave `.p8`: è pensata per stare nel codice dell'app.
- Manca ancora: collegare l'app Android su RevenueCat (bloccato, vedi sotto).
- **⚠️ BLOCCO Android**: l'account **Google Play Console dell'utente è in attesa di
  approvazione** (Google ha segnalato che la verifica può richiedere alcuni giorni) — finché
  non è approvato, l'utente non può pubblicare né creare prodotti reali su Play Console.
  **Nel frattempo si può procedere solo sul lato iOS** (App Store Connect + configurazione
  iOS su RevenueCat); il lato Android (prodotto abbonamento su Play Console, service account
  Google, app Android su RevenueCat) resta in sospeso finché l'account non viene approvato —
  non serve ripetere la domanda all'utente ogni sessione, controllare prima se è stato
  sbloccato nel frattempo.

**Fase 5-6 non ancora iniziate**, vedi il piano per i dettagli. **Fase 5 richiede una nuova
build EAS di sviluppo** (RevenueCat è un modulo nativo, non gira su Expo Go): non lanciarla
senza permesso esplicito (vedi Regole di lavoro fisse sopra).

## Repository git — attenzione

**Questa cartella (`C:\Users\gdixi\Progetti\FISSI`) ha una sua repo git dedicata**, creata apposta
(primo commit `ca3a828`). Prima non esisteva: il progetto viveva dentro un'unica, enorme repo git
radicata sull'intera home directory dell'utente (`C:\Users\gdixi`), che include decine di altri
progetti scollegati tra loro (fatturazione, farmacare, timbrature-app, ecc.) e cartelle di sistema.
Questo causava un errore reale in `eas build` (il tarball caricato includeva file estranei come
cache di altre app, con conflitti di maiuscole/minuscole nei nomi file). **Lavora sempre dentro
la repo scoped a FISSI**, non serve mai toccare la repo della home directory — e se in futuro
`git` sembra comportarsi in modo strano (file inattesi, remote sbagliati), controlla per prima
cosa `git rev-parse --show-toplevel` per assicurarti di essere nella repo giusta.
