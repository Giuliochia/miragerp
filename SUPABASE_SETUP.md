# Supabase setup per Mirage RP Economy Hub

## 1. Crea progetto

Crea un progetto su Supabase.

## 2. Crea schema workspace e permessi

Apri SQL Editor e incolla il contenuto di:

```text
supabase/schema.sql
```

Questo crea:

- workspace condiviso `mirage-rp`
- profili staff con ruoli `user` e `admin`
- storico modifiche staff
- policy RLS: solo gli amministratori possono leggere/modificare il workspace

## 3. Crea utenti staff

Vai in Authentication -> Users e crea gli account staff.

I nuovi account partono sempre come `user` e non vedono il workspace.

Bootstrap iniziale: se non esiste ancora nessun amministratore, il primo account autenticato che apre l'app viene promosso automaticamente ad `admin`.
Dopo il bootstrap, gestisci tutti gli altri utenti dalla sezione **Amministrazione** dell'app.

## 4. Configura variabili frontend

Nel deploy aggiungi:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

In locale puoi creare `client/.env.local` con gli stessi valori.

## 5. Come funziona il sync

- Se Supabase non e' configurato, l'app resta in modalita locale.
- Se Supabase e' configurato, compare il login staff.
- Dopo il login, l'app controlla il ruolo staff.
- Gli utenti con ruolo `user` restano nella schermata di attesa.
- Gli utenti con ruolo `admin` caricano il workspace `mirage-rp`.
- Ogni modifica admin viene salvata sul cloud con debounce.

Nota: questa prima versione usa un workspace JSON condiviso.
E' perfetta per partire velocemente; in seguito possiamo normalizzare economia, eventi, drop e documenti in tabelle separate.
