import { useState } from 'react';
import {
  Sparkles, RefreshCw, Save, ChevronDown, ChevronUp,
  BookOpen, AlertTriangle, Lightbulb, FileText, Users,
  User, Swords, Package, DollarSign, Scale, Clock, ShieldAlert
} from 'lucide-react';
import { useStore } from '../store/useStore';
import WarningCard from '../components/ui/WarningCard';
import type { AIGenerationRequest, GenerationType, DetailLevel, ServerPreset } from '../../../shared/types';

const generationTypes: Array<{ value: GenerationType; label: string; icon: typeof Sparkles }> = [
  { value: 'full_package', label: 'Pacchetto Completo', icon: Sparkles },
  { value: 'faction', label: 'BG Fazione', icon: Users },
  { value: 'npc', label: 'BG Player / PG', icon: User },
  { value: 'mission', label: 'Missione / Evento', icon: Swords },
  { value: 'narrative_item', label: 'Oggetto Narrativo', icon: Package },
  { value: 'document', label: 'Documento In-Game', icon: FileText },
  { value: 'economy', label: 'Economia', icon: DollarSign },
  { value: 'legal_illegal_balance', label: 'Legal / Illegal Balance', icon: Scale },
  { value: 'business', label: 'Business RP', icon: DollarSign },
  { value: 'abuse_check', label: 'Abuse Check', icon: ShieldAlert },
  { value: 'timeline', label: 'Timeline', icon: Clock },
  { value: 'coherence_check', label: 'Controllo Coerenza', icon: AlertTriangle },
];

function toText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  if (Array.isArray(value)) {
    return value.map((entry) => toText(entry)).filter(Boolean).join('\n\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const text = toText(entry);
        return text ? `${key}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  return String(value);
}

function cleanDisplayText(value: unknown, fallback = ''): string {
  const text = toText(value, fallback);
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/^\s*{\s*/, '')
    .replace(/\s*}\s*$/i, '')
    .trim();
}

function safeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg border transition-all duration-150 ${
        checked
          ? 'bg-violet-primary/15 border-violet-primary/40 text-text-primary'
          : 'bg-bg-card2 border-border text-text-muted'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-violet-primary' : 'bg-border'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

function ResultSection({ title, content, icon, defaultOpen = false }: {
  title: string; content: string; icon: typeof Sparkles; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = icon;

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-violet-light flex-shrink-0" />
          <span className="font-semibold text-sm text-text-primary">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
      </button>
      {open && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{content}</div>
        </div>
      )}
    </div>
  );
}

export default function AIGenerator() {
  const project = useStore((s) => s.getCurrentProject());
  const addAiResult = useStore((s) => s.addAiResult);
  const markAiResultSaved = useStore((s) => s.markAiResultSaved);
  const aiResults = useStore((s) =>
    s.currentProjectId ? s.getProjectAiResults(s.currentProjectId) : s.aiResults.slice(0, 20)
  );

  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState<ServerPreset>(project?.type ?? 'FiveM');
  const [genType, setGenType] = useState<GenerationType>('full_package');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('high');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentResult, setCurrentResult] = useState(aiResults[0] ?? null);
  const [showToggles, setShowToggles] = useState(false);
  const [toggles, setToggles] = useState({
    includeLore: true,
    includeFactions: true,
    includeNpc: true,
    includeMissions: true,
    includeItems: false,
    includeDocuments: false,
    includeEconomy: false,
    includeTimeline: false,
    includeCoherenceCheck: true,
    includeAbuseCheck: true,
  });

  const setToggle = (key: keyof typeof toggles) => (v: boolean) =>
    setToggles((t) => ({ ...t, [key]: v }));

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Inserisci una richiesta prima di generare.');
      return;
    }
    setLoading(true);
    setError('');

    const req: AIGenerationRequest = {
      projectId: project?.id ?? '',
      preset,
      generationType: genType,
      userPrompt: prompt,
      detailLevel,
      tone: project?.tone ?? 'Realistico',
      ...toggles,
      existingContext: project ? `Progetto: ${project.name} - ${project.setting}` : undefined,
    };

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Errore ${res.status}`);
      }

      const data = await res.json();
      const result = addAiResult({ ...data, projectId: project?.id, savedToCodex: false });
      setCurrentResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (currentResult) {
      markAiResultSaved(currentResult.id);
      setCurrentResult({ ...currentResult, savedToCodex: true });
    }
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-violet-light" />
          <h1 className="text-xl font-bold text-text-primary">Crea PG con AI</h1>
        </div>
        <p className="text-sm text-text-muted">Strumento secondario per generare bozze di personaggi e background da archiviare.</p>
      </div>

      {/* Prompt area */}
      <div className="card space-y-4">
        <div>
          <label className="label">Richiesta *</label>
          <textarea
            className="textarea"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Descrivi cosa vuoi generare...\n\nEsempi:\n- "Crea una nuova gang latina con radici nel cartello messicano"\n- "Genera un evento rapina alla banca federale per FiveM"\n- "Analizza il bilanciamento economy del mio server"`}
          />
        </div>

        {/* Type + Preset row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo Generazione</label>
            <select className="select" value={genType} onChange={(e) => setGenType(e.target.value as GenerationType)}>
              {generationTypes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Preset Server</label>
            <select className="select" value={preset} onChange={(e) => setPreset(e.target.value as ServerPreset)}>
              <option value="FiveM">FiveM / GTA RP</option>
              <option value="RedM">RedM / Western RP</option>
              <option value="DayZ">DayZ / Survival RP</option>
              <option value="Custom">Custom RP</option>
            </select>
          </div>
        </div>

        {/* Detail Level */}
        <div>
          <label className="label">Livello Dettaglio</label>
          <div className="flex gap-2">
            {(['medium', 'high', 'extreme'] as DetailLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setDetailLevel(level)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  detailLevel === level
                    ? 'bg-violet-primary text-white border-violet-primary'
                    : 'bg-bg-card2 text-text-muted border-border hover:border-border-light'
                }`}
              >
                {level === 'medium' ? 'Medio' : level === 'high' ? 'Alto' : 'Estremo'}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div>
          <button
            onClick={() => setShowToggles(!showToggles)}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            {showToggles ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Opzioni avanzate
          </button>

          {showToggles && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {Object.entries({
                includeLore: 'Includi Lore',
                includeFactions: 'Includi Fazioni',
                includeNpc: 'Includi NPC',
                includeMissions: 'Includi Missioni',
                includeItems: 'Includi Oggetti',
                includeDocuments: 'Includi Documenti',
                includeEconomy: 'Includi Economia',
                includeTimeline: 'Includi Timeline',
                includeCoherenceCheck: 'Controllo Coerenza',
                includeAbuseCheck: 'Abuse Check',
              }).map(([key, label]) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={toggles[key as keyof typeof toggles]}
                  onChange={setToggle(key as keyof typeof toggles)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-4 py-3 text-sm text-accent-red">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Genera
              </>
            )}
          </button>
          {currentResult && !loading && (
            <button onClick={handleGenerate} className="btn-secondary px-4" title="Rigenera">
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {currentResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Title + save */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text-primary">{cleanDisplayText(currentResult.title, 'Output AI')}</h2>
              <div className="text-xs text-text-muted mt-0.5">
                {new Date(currentResult.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            {!currentResult.savedToCodex ? (
              <button onClick={handleSave} className="btn-primary text-sm py-2 px-4 flex-shrink-0">
                <Save size={14} /> Salva nel Codex
              </button>
            ) : (
              <span className="badge-green text-xs px-3 py-1.5 flex-shrink-0">
                <BookOpen size={11} /> Salvato
              </span>
            )}
          </div>

          {/* Strategic summary */}
          <div className="card bg-violet-primary/10 border-violet-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-violet-light" />
              <span className="text-xs font-bold text-violet-light uppercase tracking-wider">Sintesi Strategica</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{cleanDisplayText(currentResult.strategicSummary)}</p>
          </div>

          {/* Sections */}
          <ResultSection
            title="Contenuto Completo"
            content={cleanDisplayText(currentResult.fullNarrative)}
            icon={BookOpen}
            defaultOpen
          />

          {currentResult.designReasoning && (
            <ResultSection
              title="Motivazione Progettuale"
              content={cleanDisplayText(currentResult.designReasoning)}
              icon={Lightbulb}
            />
          )}

          {currentResult.economyAnalysis && (
            <ResultSection
              title="Analisi Economia"
              content={cleanDisplayText(currentResult.economyAnalysis)}
              icon={DollarSign}
            />
          )}

          {currentResult.expertNotes && (
            <ResultSection
              title="Note Esperte"
              content={cleanDisplayText(currentResult.expertNotes)}
              icon={Sparkles}
            />
          )}

          {/* Warnings */}
          {safeList(currentResult.coherenceWarnings).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={12} /> Avvisi Coerenza
              </div>
              {safeList<any>(currentResult.coherenceWarnings).map((w, i) => (
                <WarningCard key={w.id ?? `coherence-${i}`} {...w} type="coherence" />
              ))}
            </div>
          )}

          {safeList(currentResult.abuseWarnings).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={12} /> Abuse Warnings
              </div>
              {safeList<any>(currentResult.abuseWarnings).map((w, i) => (
                <WarningCard key={w.id ?? `abuse-${i}`} {...w} type="abuse" />
              ))}
            </div>
          )}

          {/* Alternatives */}
          {safeList(currentResult.alternatives).length > 0 && (
            <div className="card space-y-2">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Varianti Alternative</div>
              {safeList<unknown>(currentResult.alternatives).map((alt, i) => (
                <div key={i} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-violet-light font-bold flex-shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{cleanDisplayText(alt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggested links */}
          {safeList(currentResult.suggestedLinks).length > 0 && (
            <div className="card space-y-2">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Collegamenti Consigliati</div>
              {safeList<any>(currentResult.suggestedLinks).map((link, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-violet-light font-semibold">{toText(link.fromName, 'Elemento')}</span>
                  <span className="text-text-muted">{'->'}</span>
                  <span className="text-accent-blue font-semibold">{toText(link.toName, 'Collegamento')}</span>
                  <span className="badge-gray">{toText(link.type, 'linked')}</span>
                  <span className="text-text-muted flex-1">{toText(link.reason)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {aiResults.length > 1 && (
        <div>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Storico Generazioni</div>
          <div className="space-y-2">
            {aiResults.slice(1, 6).map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrentResult(r)}
                className={`w-full card-hover text-left flex items-center gap-3 ${currentResult?.id === r.id ? 'border-violet-primary/50' : ''}`}
              >
                <div className="w-7 h-7 rounded-lg bg-violet-primary/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={12} className="text-violet-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{cleanDisplayText(r.title, 'Output AI')}</div>
                  <div className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString('it-IT')}</div>
                </div>
                {r.savedToCodex && <span className="badge-green text-[10px]">Codex</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

