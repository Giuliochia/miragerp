import { ReactNode, useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, Cloud, DollarSign, FileText, Package, Sparkles, Users, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, MIRAGE_WORKSPACE_ID, supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

interface CloudSyncProviderProps {
  children: ReactNode;
}

type WorkspaceSnapshot = Record<string, unknown>;

function countList(data: WorkspaceSnapshot | null, key: string) {
  const value = data?.[key];
  return Array.isArray(value) ? value.length : 0;
}

function stableString(value: unknown) {
  return JSON.stringify(value ?? null);
}

function workspaceData(snapshot: WorkspaceSnapshot | null) {
  const data = snapshot?.data;
  return (data && typeof data === 'object' ? data : snapshot ?? {}) as WorkspaceSnapshot;
}

function listById(data: WorkspaceSnapshot, key: string) {
  const value = data[key];
  if (!Array.isArray(value)) return new Map<string, Record<string, unknown>>();
  return new Map(
    value
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object' && typeof entry.id === 'string')
      .map((entry) => [entry.id as string, entry])
  );
}

function textValue(value: unknown) {
  if (value == null || value === '') return 'vuoto';
  return String(value);
}

const statusLabels: Record<string, string> = {
  draft: 'Bozza',
  review: 'Da approvare',
  approved: 'Approvato',
  released: 'Rilasciato',
  archived: 'Archiviato',
};

function displayFieldValue(field: string, value: unknown) {
  if (field === 'status') return statusLabels[String(value ?? 'draft')] ?? textValue(value);
  if (field === 'value' || field === 'dropQuantity' || field.includes('Income') || field.includes('Price') || field.includes('Reward')) {
    return textValue(value);
  }
  return textValue(value);
}

function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, fields: Array<{ key: string; label: string }>) {
  return fields
    .filter(({ key }) => stableString(before[key]) !== stableString(after[key]))
    .map(({ key, label }) => `${label} ${displayFieldValue(key, before[key])} -> ${displayFieldValue(key, after[key])}`);
}

function summarizeCollectionChanges(
  previous: WorkspaceSnapshot,
  next: WorkspaceSnapshot,
  config: {
    key: string;
    singular: string;
    section: string;
    nameKey: string;
    fields: Array<{ key: string; label: string }>;
  }
) {
  const beforeMap = listById(previous, config.key);
  const afterMap = listById(next, config.key);
  const messages: string[] = [];

  afterMap.forEach((after, id) => {
    const before = beforeMap.get(id);
    const name = textValue(after[config.nameKey]);
    if (!before) {
      messages.push(`${config.singular} creato: ${name}`);
      return;
    }

    const changes = diffFields(before, after, config.fields);
    if (changes.length > 0) {
      messages.push(`${config.singular} modificato: ${name} (${changes.slice(0, 4).join(', ')})`);
    } else if (stableString(before) !== stableString(after)) {
      messages.push(`${config.singular} aggiornato: ${name}`);
    }
  });

  beforeMap.forEach((before, id) => {
    if (!afterMap.has(id)) {
      messages.push(`${config.singular} eliminato: ${textValue(before[config.nameKey])}`);
    }
  });

  return messages;
}

function firstRecord(data: WorkspaceSnapshot, key: string) {
  const value = data[key];
  return Array.isArray(value) && value[0] && typeof value[0] === 'object'
    ? value[0] as Record<string, unknown>
    : {};
}

function buildAuditSummary(previous: WorkspaceSnapshot | null, next: WorkspaceSnapshot) {
  const sections: string[] = [];
  const messages: string[] = [];
  const previousData = workspaceData(previous);
  const nextData = workspaceData(next);

  const collectionConfigs = [
    {
      key: 'missions',
      singular: 'Evento',
      section: 'Eventi',
      nameKey: 'title',
      fields: [
        { key: 'title', label: 'nome' },
        { key: 'status', label: 'stato' },
        { key: 'type', label: 'tipo' },
        { key: 'location', label: 'location' },
        { key: 'reward', label: 'ricompensa' },
        { key: 'cooldown', label: 'cooldown' },
      ],
    },
    {
      key: 'items',
      singular: 'Drop',
      section: 'Drop',
      nameKey: 'name',
      fields: [
        { key: 'name', label: 'nome' },
        { key: 'status', label: 'stato' },
        { key: 'category', label: 'categoria' },
        { key: 'value', label: 'valore' },
        { key: 'dropDate', label: 'data' },
        { key: 'dropQuantity', label: 'quantita' },
        { key: 'dropMethod', label: 'metodo' },
      ],
    },
    {
      key: 'documents',
      singular: 'Documento',
      section: 'Documenti Drop',
      nameKey: 'title',
      fields: [
        { key: 'title', label: 'titolo' },
        { key: 'status', label: 'stato' },
        { key: 'type', label: 'tipo' },
        { key: 'author', label: 'autore' },
        { key: 'foundLocation', label: 'luogo' },
      ],
    },
  ];

  collectionConfigs.forEach((config) => {
    const collectionMessages = summarizeCollectionChanges(previousData, nextData, config);
    if (collectionMessages.length > 0) {
      sections.push(config.section);
      messages.push(...collectionMessages);
    }
  });

  const previousEconomy = firstRecord(previousData, 'economyProfiles');
  const nextEconomy = firstRecord(nextData, 'economyProfiles');
  const economyChanges = diffFields(previousEconomy, nextEconomy, [
    { key: 'currencyName', label: 'valuta' },
    { key: 'legalIncomeAverage', label: 'legale/ora' },
    { key: 'illegalIncomeAverage', label: 'illegale/ora' },
    { key: 'balanceScore', label: 'score' },
    { key: 'inflationRisk', label: 'rischio inflazione' },
  ]);
  const economyItemMessages = summarizeCollectionChanges(
    { customItems: previousEconomy.customItems },
    { customItems: nextEconomy.customItems },
    {
      key: 'customItems',
      singular: 'Item economia',
      section: 'Economia',
      nameKey: 'name',
      fields: [
        { key: 'name', label: 'nome' },
        { key: 'category', label: 'categoria' },
        { key: 'price', label: 'prezzo' },
        { key: 'quantity', label: 'quantita' },
        { key: 'acquisition', label: 'ottenimento' },
      ],
    }
  );
  if (!previous || economyChanges.length > 0 || economyItemMessages.length > 0) {
    sections.push('Economia');
    if (!previous) {
      messages.push('Workspace inizializzato');
    } else {
      if (economyChanges.length > 0) messages.push(`Economia modificata (${economyChanges.slice(0, 5).join(', ')})`);
      messages.push(...economyItemMessages);
    }
  }

  if (previous && stableString(previousData.customization) !== stableString(nextData.customization)) {
    sections.push('Impostazioni');
    messages.push('Impostazioni modificate');
  }

  const uniqueSections = [...new Set(sections)];
  return {
    sections: uniqueSections,
    summary: messages.length > 0 ? [...new Set(messages)].slice(0, 8).join('; ') : 'Workspace salvato',
  };
}

function getStaffName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  return String(
    metadata?.full_name
    ?? metadata?.name
    ?? metadata?.global_name
    ?? metadata?.user_name
    ?? metadata?.preferred_username
    ?? user.email
    ?? 'Staff'
  );
}

function getStaffAvatarUrl(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const value = metadata?.avatar_url ?? metadata?.picture ?? metadata?.avatar;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const guideSeenKey = (userId: string) => `mirage-guide-seen:${userId}`;

const guideSteps = [
  {
    id: 'economy',
    title: 'Economia',
    icon: DollarSign,
    text: 'Imposta valuta, guadagni medi legali e illegali. Da qui nasce il riferimento per capire se prezzi, item e ricompense sono equilibrati.',
    action: 'Prima cosa da fare: compila Economia Mirage.',
  },
  {
    id: 'events',
    title: 'Eventi',
    icon: CalendarDays,
    text: 'Usa Eventi per segnare attività ufficiali dello staff: nome, data, categoria, responsabili, stato e note operative.',
    action: 'Serve per organizzare cosa succede nel server.',
  },
  {
    id: 'drops',
    title: 'Drop',
    icon: Package,
    text: 'Nel Drop inserisci item, quantità, metodo di rilascio e data. Così sai quando introdurre oggetti senza gonfiare troppo l economia.',
    action: 'Qui si pianificano item custom e rilasci controllati.',
  },
  {
    id: 'documents',
    title: 'Documenti',
    icon: FileText,
    text: 'I Documenti Drop raccolgono prove, note, permessi, immagini o testi collegati ai drop e agli eventi.',
    action: 'Usalo come archivio ufficiale collegato alle decisioni staff.',
  },
  {
    id: 'staff',
    title: 'Staff',
    icon: Users,
    text: 'Quando vedi Cloud sincronizzato, le modifiche vengono salvate nel workspace condiviso. Lo staff vede gli stessi dati dopo l accesso.',
    action: 'Aspetta il badge verde prima di chiudere la pagina.',
  },
];

export default function CloudSyncProvider({ children }: CloudSyncProviderProps) {
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideForced, setGuideForced] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [syncError, setSyncError] = useState('');
  const [status, setStatus] = useState<'local' | 'loading' | 'synced' | 'saving' | 'error'>(
    isSupabaseConfigured ? 'loading' : 'local'
  );
  const skipNextSave = useRef(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const lastCloudSnapshot = useRef<WorkspaceSnapshot | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let mounted = true;

    client.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      const key = guideSeenKey(data.user.id);
      if (!localStorage.getItem(key)) {
        setActiveStep(0);
        setGuideForced(true);
        setGuideOpen(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let mounted = true;

    const loadWorkspace = async () => {
      setStatus('loading');
      setSyncError('');
      const { data, error } = await client
        .from('mirage_workspaces')
        .select('data')
        .eq('id', MIRAGE_WORKSPACE_ID)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setStatus('error');
        setSyncError(error.message);
        console.error('[CloudSync] load failed', error.message);
        return;
      }

      if (data?.data && Object.keys(data.data as object).length > 0) {
        lastCloudSnapshot.current = data.data as WorkspaceSnapshot;
        skipNextSave.current = true;
        importData(JSON.stringify(data.data));
        skipNextSave.current = false;
      } else {
        const saved = await saveWorkspace();
        if (!saved) return;
      }

      hydrated.current = true;
      setStatus('synced');
    };

    loadWorkspace();

    return () => {
      mounted = false;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const unsubscribe = useStore.subscribe(() => {
      if (!hydrated.current) return;
      if (skipNextSave.current) {
        skipNextSave.current = false;
        return;
      }
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveWorkspace();
      }, 900);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const flushSave = () => {
      if (!hydrated.current) return;
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      saveWorkspace();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', flushSave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', flushSave);
    };
  }, []);

  const saveWorkspace = async () => {
    if (!supabase) return false;
    setStatus('saving');
    setSyncError('');
    const parsed = JSON.parse(exportData()) as WorkspaceSnapshot;
    const audit = buildAuditSummary(lastCloudSnapshot.current, parsed);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('mirage_workspaces').upsert({
      id: MIRAGE_WORKSPACE_ID,
      name: 'Mirage RP',
      data: parsed,
      updated_by: userData.user?.id ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setStatus('error');
      setSyncError(error.message);
      console.error('[CloudSync] save failed', error.message);
      return false;
    }

    if (userData.user && audit.sections.length > 0) {
      const auditPayload = {
        workspace_id: MIRAGE_WORKSPACE_ID,
        action: 'update',
        summary: audit.summary,
        sections: audit.sections,
        staff_id: userData.user.id,
        staff_email: userData.user.email ?? null,
        staff_name: getStaffName(userData.user),
        staff_avatar_url: getStaffAvatarUrl(userData.user),
      };
      const { error: auditError } = await supabase.from('mirage_audit_logs').insert(auditPayload);

      if (auditError) {
        if (auditError.message.includes('staff_avatar_url')) {
          const { staff_avatar_url, ...legacyPayload } = auditPayload;
          const { error: legacyAuditError } = await supabase.from('mirage_audit_logs').insert(legacyPayload);
          if (legacyAuditError) {
            setSyncError(`Storico non salvato: ${legacyAuditError.message}`);
            console.warn('[CloudSync] audit log skipped', legacyAuditError.message);
          } else {
            setSyncError('Avatar storico non ancora configurato su Supabase. Esegui la query di upgrade.');
          }
        } else {
          setSyncError(`Storico non salvato: ${auditError.message}`);
          console.warn('[CloudSync] audit log skipped', auditError.message);
        }
      }
    }

    lastCloudSnapshot.current = parsed;
    setStatus('synced');
    return true;
  };

  const activeGuide = guideSteps[activeStep];
  const ActiveGuideIcon = activeGuide.icon;

  const closeGuide = () => {
    if (guideForced) return;
    setGuideOpen(false);
  };

  const completeGuide = async () => {
    const { data } = await supabase?.auth.getUser() ?? { data: { user: null } };
    if (data.user) {
      localStorage.setItem(guideSeenKey(data.user.id), new Date().toISOString());
    }
    setGuideForced(false);
    setGuideOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setGuideOpen(true)}
        className={`fixed left-[calc(15rem+((100vw-15rem)/2))] top-2.5 z-[60] -translate-x-1/2 text-xs px-3 py-2 rounded-lg border transition hover:brightness-125 flex items-center gap-2 ${
        status === 'synced'
          ? 'bg-accent-green/15 border-accent-green/30 text-accent-green'
          : status === 'saving' || status === 'loading'
            ? 'bg-accent-blue/15 border-accent-blue/30 text-accent-blue'
            : status === 'error'
              ? 'bg-accent-red/15 border-accent-red/30 text-accent-red'
              : 'bg-accent-amber/15 border-accent-amber/30 text-accent-amber'
      }`}
        title={syncError ? `Apri guida rapida - ${syncError}` : 'Apri guida rapida'}
      >
        <Cloud size={14} />
        {status === 'local' && 'Locale'}
        {status === 'loading' && 'Caricamento cloud'}
        {status === 'saving' && 'Salvataggio cloud'}
        {status === 'synced' && 'Cloud sincronizzato'}
        {status === 'error' && 'Errore cloud'}
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent-red ring-2 ring-bg-primary" />
      </button>

      {guideOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto px-6 py-8">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={closeGuide} />
          <div className="relative mx-auto w-full max-w-4xl rounded-xl border border-border bg-bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-primary/20 text-violet-light">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Come funziona Mirage RP Economy Hub</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {guideForced
                      ? 'Prima di entrare nel workspace, completa questa guida rapida obbligatoria.'
                      : 'Guida rapida per usare l app come archivio e planner economico dello staff.'}
                  </p>
                </div>
              </div>
              {!guideForced && (
                <button type="button" className="btn-secondary px-3 py-2" onClick={closeGuide} title="Chiudi">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="grid gap-0 lg:grid-cols-[260px,1fr]">
              <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
                <div className="space-y-2">
                  {guideSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const selected = activeStep === index;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveStep(index)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                          selected
                            ? 'border-violet-primary bg-violet-primary/20 text-text-primary'
                            : 'border-border bg-bg-card2 text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <StepIcon size={17} className={selected ? 'text-violet-light' : 'text-text-muted'} />
                        <span className="font-semibold">{step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-card2 text-violet-light border border-border">
                    <ActiveGuideIcon size={23} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted">Passo {activeStep + 1} di {guideSteps.length}</p>
                    <h3 className="text-2xl font-bold text-text-primary">{activeGuide.title}</h3>
                  </div>
                </div>

                <p className="text-base leading-7 text-text-secondary">{activeGuide.text}</p>

                <div className="mt-5 rounded-lg border border-violet-primary/35 bg-violet-primary/10 px-4 py-3 text-sm text-text-primary">
                  {activeGuide.action}
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-bg-card2 p-4">
                    <CheckCircle2 size={18} className="mb-3 text-accent-green" />
                    <h4 className="font-semibold text-text-primary">Compila</h4>
                    <p className="mt-1 text-sm text-text-muted">Inserisci dati chiari e personalizzati per Mirage RP.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg-card2 p-4">
                    <CheckCircle2 size={18} className="mb-3 text-accent-green" />
                    <h4 className="font-semibold text-text-primary">Bilancia</h4>
                    <p className="mt-1 text-sm text-text-muted">Confronta item, prezzi e quantità con le entrate del server.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg-card2 p-4">
                    <CheckCircle2 size={18} className="mb-3 text-accent-green" />
                    <h4 className="font-semibold text-text-primary">Condividi</h4>
                    <p className="mt-1 text-sm text-text-muted">Il cloud salva tutto nel workspace comune dello staff.</p>
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
                    disabled={activeStep === 0}
                  >
                    Indietro
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (activeStep === guideSteps.length - 1) {
                        completeGuide();
                      } else {
                        setActiveStep((current) => current + 1);
                      }
                    }}
                  >
                    {activeStep === guideSteps.length - 1 ? 'Ho capito' : 'Avanti'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
