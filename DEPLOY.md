# Deploy Mirage RP Economy Hub

Mirage RP Economy Hub puo' essere pubblicata come una singola webapp Node:

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
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

Con il Blueprint, Render prende gia' build e start command da `render.yaml`.
Il nome servizio suggerito e' `mirage-rp-economy-hub`, quindi l'URL Render sara' simile a:

```bash
https://mirage-rp-economy-hub.onrender.com
```

Dopo il deploy aggiungi questo URL anche in Supabase:

- Authentication -> URL Configuration -> Site URL
- Authentication -> URL Configuration -> Redirect URLs

## Vercel

Vercel pubblica la webapp React come frontend statico collegato a Supabase.
La configurazione e' in `vercel.json`.

1. Vai su Vercel e crea un nuovo progetto.
2. Importa la repository GitHub `Giuliochia/miragerp`.
3. Lascia la root del progetto sulla cartella principale della repo.
4. Aggiungi le Environment Variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Deploy.

Dopo il deploy, copia l'URL Vercel e aggiungilo in Supabase:

- Authentication -> URL Configuration -> Site URL
- Authentication -> URL Configuration -> Redirect URLs

Nota: su Vercel questa configurazione pubblica la dashboard, economia, eventi, drop, documenti, storico e login Discord.
Le vecchie API AI Node non vengono pubblicate su Vercel in questa modalita'.

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
