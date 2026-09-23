# SlidePulse Live 🚀
### Piattaforma di Interazione Studenti via QR Code per Presentazioni PowerPoint

Sito web real-time progettato per gestire l'interazione anonima di **centinaia di studenti** durante lezioni universitarie, conferenze e presentazioni PowerPoint.

---

## ✨ Funzionalità Principali

- **Zero Database & Zero Registrazioni**: Nessun database da configurare, nessun utente o password. Gli studenti partecipano in forma **100% anonima** semplicemente inquadrando il QR code con la fotocamera dello smartphone o inserendo il PIN numerico a 6 cifre.
- **Salvataggio Locale nel Browser del Relatore**: I sondaggi sono memorizzati nel tuo browser (`localStorage`) con possibilità di esportare/importare l'intera sessione in formato `.json`. Puoi preparare le domande la sera prima a casa, chiudere il portatile, riaprirlo in aula e trovare tutto pronto.
- **Pronto per il Deploy su Vercel**: Architettura serverless ottimizzata con buffer di stato in memoria e sincronizzazione ad alta frequenza (sub-secondo). Predisposta anche per WebSockets opzionali (Pusher / Ably Channels) per eventi con oltre 500 partecipanti simultanei senza database.
- **Esportazione QR Code per PowerPoint**: Da ogni sondaggio puoi scaricare un'immagine PNG in alta definizione (1024×1024) da incollare direttamente sulla tua slide PowerPoint, oppure usare la vista proiettore integrata.

---

## 🎯 6 Tipologie di Interazione Incluse

1. **Scala di Accordo da 1 a 10**:
   - Studenti: Pulsanti touch reattivi da 1 a 10 con slider graduato.
   - Proiettore: Istogramma dinamico dei voti, calcolo della media in tempo reale (*es. Media: 8.4/10*), punteggio più frequente e contatore presenze.
2. **Testo Libero & Nuvola di Parole (Word Cloud)**:
   - Studenti: Campo di risposta sintetica (es. 1-2 parole chiave o breve frase).
   - Proiettore: Commutazione istantanea tra **Nuvola di Parole live** (con dimensione font dinamica in base alle parole più ripetute) e **Bacheca a Schede animate**.
3. **Scelta Multipla (A, B, C, D...)**:
   - Studenti: Grandi pulsanti colorati touch-friendly.
   - Proiettore: Barre animate con percentuali e voti assoluti, con pulsante per svelare l'eventuale risposta corretta con esplosione di coriandoli 🎉.
4. **Q&A dal Pubblico con Upvote 👍**:
   - Studenti: Inviano domande anonime e possono votare con 👍 le domande degli altri.
   - Proiettore: Graduatoria in tempo reale delle domande più votate, con possibilità di evidenziare a schermo la domanda a cui si sta rispondendo.
5. **Emoji Pulse (Reazioni Live in Streaming)**:
   - Studenti: Toccano emoji rapide (🚀, 💡, 🔥, 🤔, ☕, 👏).
   - Proiettore: Le emoji fluttuano e volano sullo schermo del proiettore in tempo reale.
6. **Sì / No / Forse (Decisione Istantanea)**:
   - Votazione binaria fulminea a 3 stati con grafico a barre sovrapposte e schede percentuali.

---

## 🎮 Scorciatoie da Tastiera nella Vista Proiettore (`/projector`)

Durante la proiezione a schermo intero sul proiettore o monitor dell'aula:
- `⬅️` / `➡️` (o `Pag Su` / `Pag Giù` con telecomando presenter): Passa al sondaggio precedente / successivo
- `F`: Attiva / Disattiva Schermo Intero (Fullscreen)
- `H`: Nascondi / Mostra i risultati (utile per raccogliere i voti senza influenzare la platea)
- `L`: Blocca / Sblocca le votazioni (Lock)
- `C`: Lancia coriandoli celebrativi 🎉
- `R`: Azzera tutti i voti del sondaggio corrente
- `Q`: Ingrandisce il QR code a tutto schermo per l'aula

---

## 🚀 Avvio Locale

Assicurati di avere Node.js installato, quindi esegui:

```bash
# Installa le dipendenze (se non già fatto)
npm install

# Avvia il server di sviluppo
npm run dev
```

Apri nel browser:
- **Home**: [http://localhost:3000](http://localhost:3000)
- **Pannello Relatore (Admin)**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Vista Proiettore**: [http://localhost:3000/projector](http://localhost:3000/projector)
- **Partecipazione Studenti**: [http://localhost:3000/p/poll-1](http://localhost:3000/p/poll-1) oppure inserendo il PIN su `/join`

---

## 📦 Come Pubblicare su GitHub (`enricoarmiento`)

Dalla cartella del progetto (`/Users/enricoarmiento/Desktop/Progetti_AI/Interazione`), esegui:

```bash
# 1. Crea un nuovo repository su GitHub con il tuo account enricoarmiento:
#    Vai su https://github.com/new e crea una repo chiamata ad esempio "interazione-live"

# 2. Collega il repository remoto locale:
git remote add origin https://github.com/enricoarmiento/interazione-live.git

# 3. Imposta il branch principale e fai il push:
git branch -M main
git push -u origin main
```

*(Se usi GitHub CLI `gh`, puoi fare tutto in un solo comando: `gh repo create interazione-live --public --source=. --remote=origin --push`)*

---

## ⚡ Come fare il Deploy su Vercel (`enricoarmiento`)

### Metodo 1: Tramite Vercel Dashboard (Consigliato, 2 click)
1. Accedi a [vercel.com](https://vercel.com) con il tuo account **enricoarmiento**.
2. Clicca su **"Add New..."** → **"Project"**.
3. Seleziona il repository GitHub `enricoarmiento/interazione-live`.
4. Lascia tutte le impostazioni predefinite (Next.js viene rilevato automaticamente).
5. Clicca su **"Deploy"**.
6. In meno di 60 secondi il tuo sito sarà online con URL pubblico HTTPS (es. `https://interazione-live.vercel.app`) pronto per essere proiettato in aula!

### Metodo 2: Tramite CLI Vercel
```bash
npx vercel
```
Segui i prompt confermando con `Y` e scegliendo il tuo account `enricoarmiento`.

---

## 💡 Best Practice per le Presentazioni PowerPoint

1. **A casa prima della lezione**:
   - Vai su `/admin` e scrivi le tue domande personalizzate (puoi usare i 6 template già pronti o crearne di nuovi).
   - Per ogni domanda, clicca su **"QR Code"** e poi su **"Salva PNG"**.
   - Trascina il file PNG direttamente all'interno della slide PowerPoint in cui vuoi porre la domanda.
2. **In aula durante la lezione**:
   - Quando arrivi alla slide con il QR code, gli studenti inquadrano con il cellulare e rispondono istantaneamente.
   - Puoi tenere aperto il browser su `/projector` (o cambiare finestra con `Cmd+Tab` / `Alt+Tab`) per mostrare i grafici che si muovono dal vivo!
