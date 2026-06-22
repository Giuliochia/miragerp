# Supabase setup per Mirage RP Economy Hub

## 1. Crea progetto

Crea un progetto su Supabase.

## 2. Crea tabella workspace

Apri SQL Editor e incolla il contenuto di:

```text
supabase/schema.sql
```

Questo crea il workspace condiviso `mirage-rp` e permette agli utenti autenticati di leggerlo/modificarlo.

## 3. Crea utenti staff

Vai in Authentication -> Users e crea gli account staff.

Per ora tutti gli utenti autenticati possono modificare il workspace.
Il prossimo step puo' essere aggiungere ruoli `admin`, `staff`, `viewer`.

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
- Dopo il login, l'app carica il workspace `mirage-rp`.
- Ogni modifica viene salvata sul cloud con debounce.

Nota: questa prima versione usa un workspace JSON condiviso.
E' perfetta per partire velocemente; in seguito possiamo normalizzare economia, eventi, drop e documenti in tabelle separate.
