# Deploy RP Architect

RP Architect puo' essere pubblicata come una singola webapp Node:

- `server` espone le API `/api`
- `client` viene buildato in `client/dist`
- in produzione Express serve anche il frontend React

## Render

1. Carica il progetto su GitHub.
2. Vai su Render e crea un nuovo Blueprint usando `render.yaml`.
3. Aggiungi nelle Environment Variables:
   - `GROQ_API_KEY`
   - `AI_PROVIDER=groq`
   - `GROQ_MODEL=llama-3.3-70b-versatile`
   - `NODE_ENV=production`
4. Deploy.

Build command:

```bash
npm run install:all && npm run build
```

Start command:

```bash
npm --prefix server run start
```

## Railway / VPS

Usa gli stessi comandi:

```bash
npm run install:all
npm run build
npm --prefix server run start
```

Variabili richieste:

```bash
NODE_ENV=production
AI_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## Nota dati

Con Supabase configurato, lo staff lavora sul workspace condiviso `mirage-rp`.
Senza Supabase, l'app resta in modalita locale con `localStorage`.
