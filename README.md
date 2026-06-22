# RP Architect

> **Progetta. Organizza. Dai vita al tuo mondo RP.**

RP Architect è un hub AI-powered per creare mondi RP, gang, fazioni, personaggi, missioni, economie, eventi, documenti e sistemi di bilanciamento per server **FiveM**, **RedM** e **DayZ**.

---

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (dark theme, mobile-first) |
| State | Zustand + localStorage |
| Backend | Node.js + Express + TypeScript |
| AI | OpenAI API (solo lato server) |
| Routing | React Router v6 |

---

## Struttura Progetto

```
RP Architect/
├── client/               # React + Vite + Tailwind
│   └── src/
│       ├── components/   # Layout + UI components
│       ├── pages/        # 16 pagine complete
│       ├── store/        # Zustand store
│       ├── data/         # Dati demo
│       ├── styles/       # CSS globale
│       └── utils/        # Hook utilità
├── server/               # Express + TypeScript
│   └── src/
│       ├── routes/       # API endpoints
│       ├── services/     # OpenAI service
│       └── prompts/      # System prompt AI
├── shared/
│   └── types/            # TypeScript types condivisi
├── .env.example
└── README.md
```

---

## Installazione

### Prerequisiti
- Node.js 18+
- npm 9+

### 1. Installa le dipendenze

```bash
# Dalla root del progetto
npm run install:all
```

Oppure manualmente:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

---

## Configurazione

### Configura la chiave OpenAI (obbligatoria per l'AI)

```bash
# Nella cartella server/
cp .env.example .env
```

Modifica `server/.env`:

```env
OPENAI_API_KEY=sk-...la_tua_chiave...
OPENAI_MODEL=gpt-4o
PORT=3001
```

> ⚠️ La chiave API non viene mai esposta al frontend. Rimane solo nel server.

---

## Avvio

### Avvio completo (client + server)

```bash
# Dalla root
npm run dev
```

### Avvio separato

```bash
# Solo client (porta 5173)
npm run dev:client

# Solo server (porta 3001)
npm run dev:server
```

### Accesso

- **App web**: [http://localhost:5173](http://localhost:5173)
- **API health**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## Funzionalità Principali

### Dashboard
- Stato coerenza progetto
- Snapshot economia
- Avvisi attivi
- Accesso rapido a tutti i moduli

### Generatore AI
- Generazione di pacchetti RP completi
- 12 tipi di generazione (gang, NPC, missioni, economy, etc.)
- 3 livelli di dettaglio (Medio, Alto, Estremo)
- Toggle granulari per il contenuto
- Output strutturato con warning e link suggeriti
- Salvataggio nel Codex

### Codex
- Archivio centralizzato di tutti gli elementi
- Ricerca e filtro avanzato
- CRUD completo per tutti gli elementi

### Fazioni / Gang
- Gestione completa con territorio, gerarchia, risorse
- Link a NPC, missioni, oggetti, documenti
- Rischio abuso per fazione

### Personaggi / NPC
- Psicologia profonda (trauma, obiettivo, paura, segreto)
- Evoluzione narrativa
- Collegamento a fazioni e missioni

### Missioni / Eventi
- Supporto per tutti i tipi RP (legali, illegali, staff event, etc.)
- Step dettagliati, rischi, finali alternativi
- Note anti-farm integrate

### Oggetti Narrativi
- Rarità, valore RP/gameplay/economico
- Regole anti-farm
- Collegamento a fazioni e missioni

### Documenti In-Game
- Viewer dedicato
- Tutti i tipi (lettere, contratti, prove, diari, etc.)

### Economia
- Profilo economico con balance score
- Confronto legale/illegale con analisi ratio
- Avvisi automatici su sbilanciamento

### Legal / Illegal Balance
- Confronto diretto con ratio visuale
- Avvisi calibrati
- Integrazione con l'analisi missioni

### Timeline
- Cronologia visuale degli eventi del server
- Collegamento a fazioni, NPC, missioni

### Mappa Relazioni
- Vista grafo testuale per fazione
- Alleati, nemici, NPC, missioni collegate

### Controllo Coerenza
- Analisi automatica del progetto
- Warning per gang senza territorio, NPC senza funzione, oggetti rari senza protezione, etc.
- Score di coerenza

### Abuse Check
- Analisi farming, powergaming, metagaming, item abuse, economy abuse
- Score anti-abuso con correzioni consigliate

### Settings
- Export/Import JSON completo
- Ripristino dati demo
- Info configurazione AI

---

## Dati Demo Precaricati

### OMNIA RP (FiveM — Progetto Attivo)
- Gang: **Los Santos Vagos** (con segreto narrativo dell'informatore FBI)
- Azienda: **OMNIA Corp** (riciclaggio denaro)
- NPC: **Rico Mendez** (doppio ruolo: boss + informatore)
- Missione: **Consegna Speciale** (con 4 finali alternativi)
- Oggetti: Telefono Burner, Registro Contabile Sporco
- Documento: Estratto Registro Contabile Codificato
- Profilo Economia con analisi bilanciamento
- Timeline con eventi fondativi

### Frontier Bloodline (RedM)
- Progetto base configurato

### WILD DEATH (DayZ)
- Progetto base configurato

---

## API Endpoint

### `POST /api/generate`

Genera contenuto RP tramite OpenAI.

**Body:**
```json
{
  "projectId": "string",
  "preset": "FiveM | RedM | DayZ | Custom",
  "generationType": "full_package | faction | npc | mission | ...",
  "userPrompt": "string (min 3 caratteri)",
  "detailLevel": "medium | high | extreme",
  "tone": "string",
  "includeLore": true,
  "includeFactions": true,
  "includeNpc": true,
  "includeMissions": false,
  "includeItems": false,
  "includeDocuments": false,
  "includeEconomy": false,
  "includeTimeline": false,
  "includeCoherenceCheck": true,
  "includeAbuseCheck": true,
  "existingContext": "string (opzionale)"
}
```

**Response:** `AIGenerationResult` (JSON strutturato)

### `GET /api/health`

Controlla lo stato del server e la configurazione della chiave API.

---

## Note Sicurezza

- La chiave OpenAI è **solo lato server** nel file `.env`
- Il file `.env` è in `.gitignore` — non viene mai committato
- Il frontend comunica con `/api/*` tramite proxy Vite in dev
- In produzione, metti il server dietro un reverse proxy (nginx, Caddy)
- Nessuna autenticazione utente nell'MVP — da aggiungere nella v2.0

---

## Roadmap

### MVP (v1.0) ✓
- UI mobile-first con bottom navigation
- Dashboard con KPI
- Gestione progetti multipli
- Codex completo (CRUD)
- Generatore AI con output strutturato
- Economy Analyzer
- Legal/Illegal Balance
- Controllo Coerenza
- Abuse Check
- Timeline
- Mappa Relazioni
- Export/Import JSON
- Dati demo ricchi

### v1.1
- Esportazione Markdown/PDF
- Preset avanzati FiveM/RedM/DayZ
- Business Builder completo
- Template missioni per tipo server

### v1.2
- Mappa relazioni visuale (grafo interattivo)
- Immagini/avatar per personaggi e fazioni
- AI batch: genera intero progetto da una descrizione

### v2.0
- Database remoto (Supabase/PostgreSQL)
- Autenticazione utenti
- Collaborazione real-time
- Plugin per framework RP (ESX, QB-Core, Ox)
- App mobile nativa (React Native)

---

## Sviluppo

### Build

```bash
npm run build
```

### Preview build

```bash
npm run build:client
cd client && npm run preview
```

---

*RP Architect — Built for server owners, game masters, RP developers and worldbuilders.*
