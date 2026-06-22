import { useMemo, useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import EntityCard from '../components/ui/EntityCard';
import EmptyState from '../components/ui/EmptyState';
import type { Faction, FactionType, LegalStatus } from '../../../shared/types';

const filterOptions = [
  { value: 'all', label: 'Tutte' },
  { value: 'illegal', label: 'Illegali' },
  { value: 'legal', label: 'Legali' },
  { value: 'gray', label: 'Grigie' },
];

const defaultFactionTypes = [
  'Gang',
  'Mafia',
  'Cartello',
  'Famiglia',
  'Azienda copertura',
  'Ribelli',
  'Governo',
  'Polizia',
  'EMS',
  'Meccanici',
  'Banda fuorilegge',
  'Sceriffo',
  'Tribu',
  'Fazione survival',
  'Business',
  'Altro',
];

const legalOptions: Array<{ value: LegalStatus; label: string; hint: string }> = [
  { value: 'legal', label: 'Legale', hint: 'azienda, stato, servizio pubblico' },
  { value: 'gray', label: 'Grigia', hint: 'zona ambigua o doppio fondo' },
  { value: 'illegal', label: 'Illegale', hint: 'criminale o clandestina' },
];

const legacyTypeLabels: Record<string, string> = {
  gang: 'Gang',
  mafia: 'Mafia',
  cartel: 'Cartello',
  family: 'Famiglia',
  cover_company: 'Azienda copertura',
  rebel: 'Ribelli',
  government: 'Governo',
  police: 'Polizia',
  ems: 'EMS',
  mechanic: 'Meccanici',
  outlaw_band: 'Banda fuorilegge',
  sheriff: 'Sceriffo',
  tribe: 'Tribu',
  survival_faction: 'Fazione survival',
  other: 'Altro',
};

function displayType(type: string) {
  return legacyTypeLabels[type] ?? type;
}

function toFactionType(value: string): FactionType {
  return value.trim() as FactionType;
}

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; hint?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`text-left rounded-lg border px-3 py-2 transition-colors ${
              active
                ? 'border-violet-primary bg-violet-primary/15 text-text-primary'
                : 'border-border bg-bg-card2 text-text-secondary hover:border-violet-primary/50 hover:text-text-primary'
            }`}
          >
            <div className="text-sm font-semibold">{option.label}</div>
            {option.hint && <div className="text-[10px] text-text-muted mt-0.5">{option.hint}</div>}
          </button>
        );
      })}
    </div>
  );
}

function FactionModal({ faction, onClose }: { faction?: Faction; onClose: () => void }) {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addFaction = useStore((s) => s.addFaction);
  const updateFaction = useStore((s) => s.updateFaction);
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));

  const factionTypeSuggestions = useMemo(() => {
    const fromExisting = factions.map((entry) => displayType(entry.type));
    return Array.from(new Set([...defaultFactionTypes, ...fromExisting])).filter(Boolean);
  }, [factions]);

  const [form, setForm] = useState({
    name: faction?.name ?? '',
    type: faction?.type ? displayType(faction.type) : 'Gang',
    description: faction?.description ?? '',
    ideology: faction?.ideology ?? '',
    territory: faction?.territory ?? '',
    leader: faction?.leader ?? '',
    legalStatus: faction?.legalStatus ?? 'illegal' as LegalStatus,
    memberCount: faction?.memberCount ?? '',
    secret: faction?.secret ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      ...form,
      type: toFactionType(form.type || 'Altro'),
      projectId: currentProjectId!,
      dangerLevel: faction?.dangerLevel ?? 'medium',
      abuseRisk: faction?.abuseRisk ?? 'medium',
      reputation: faction?.reputation ?? 50,
      economyRole: faction?.economyRole ?? '',
      hierarchy: faction?.hierarchy ?? [],
      resources: faction?.resources ?? [],
      allies: faction?.allies ?? [],
      enemies: faction?.enemies ?? [],
      linkedNpcIds: faction?.linkedNpcIds ?? [],
      linkedMissionIds: faction?.linkedMissionIds ?? [],
      linkedItemIds: faction?.linkedItemIds ?? [],
      linkedDocumentIds: faction?.linkedDocumentIds ?? [],
    };
    if (faction) updateFaction(faction.id, base);
    else addFaction(base);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-8">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-5xl mx-auto z-10 animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/70">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{faction ? 'Modifica fazione' : 'Nuova fazione'}</h2>
            <p className="text-xs text-text-muted mt-1">Archivia il background di gruppi, gang, aziende, istituzioni o organizzazioni custom.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="card bg-bg-card2/45 space-y-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Identita</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="lg:col-span-2">
                  <label className="label">Nome *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="es. Los Santos Vagos" required />
                </div>
                <div>
                  <label className="label">Tipo custom</label>
                  <input
                    className="input"
                    list="faction-type-suggestions"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    placeholder="es. Gang, Cartello, Business..."
                  />
                  <datalist id="faction-type-suggestions">
                    {factionTypeSuggestions.map((type) => <option key={type} value={type} />)}
                  </datalist>
                  <div className="text-[10px] text-text-muted mt-1">Puoi scrivere qualsiasi tipo, non e' bloccato.</div>
                </div>
                <div>
                  <label className="label">Numero membri</label>
                  <input className="input" value={form.memberCount} onChange={(e) => setForm({ ...form, memberCount: e.target.value })} placeholder="es. 24-60" />
                </div>
                <div>
                  <label className="label">Territorio</label>
                  <input className="input" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} placeholder="es. South LS, Davis" />
                </div>
                <div>
                  <label className="label">Leader</label>
                  <input className="input" value={form.leader} onChange={(e) => setForm({ ...form, leader: e.target.value })} placeholder="es. Rico Mendez" />
                </div>
              </div>
            </div>

            <div className="card bg-bg-card2/45 space-y-4">
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Stato legale</div>
                <p className="text-xs text-text-muted mt-1">Serve solo per filtrare e leggere subito che tipo di gruppo e'.</p>
              </div>
              <ChoiceGroup value={form.legalStatus} options={legalOptions} onChange={(legalStatus) => setForm({ ...form, legalStatus })} />
            </div>

            <div className="card bg-bg-card2/45 space-y-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Background fazione</div>
              <div>
                <label className="label">Descrizione</label>
                <textarea className="textarea" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Chi sono, cosa controllano, come vengono percepiti..." />
              </div>
              <div>
                <label className="label">Ideologia / motivazione</label>
                <textarea className="textarea" rows={3} value={form.ideology} onChange={(e) => setForm({ ...form, ideology: e.target.value })} placeholder="Valori, obiettivi, codice interno, ragione d'esistere..." />
              </div>
              <div>
                <label className="label">Segreto opzionale</label>
                <textarea className="textarea" rows={3} value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="Il dettaglio nascosto che puo' generare storyline..." />
              </div>
            </div>
          </div>

          <div className="bg-bg-card border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="btn-secondary">Annulla</button>
            <button type="submit" className="btn-primary min-w-[160px]">{faction ? 'Salva' : 'Crea fazione'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Factions() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));
  const deleteFaction = useStore((s) => s.deleteFaction);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState<{ open: boolean; faction?: Faction }>({ open: false });

  const filtered = factions.filter((f) => {
    const query = search.toLowerCase();
    const matchSearch = !query
      || f.name.toLowerCase().includes(query)
      || f.territory.toLowerCase().includes(query)
      || displayType(f.type).toLowerCase().includes(query);
    const matchFilter = filter === 'all' || f.legalStatus === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-violet-light" />
          <h1 className="text-xl font-bold text-text-primary">BG Fazioni</h1>
          <span className="badge-violet">{factions.length}</span>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary text-sm py-2 px-4">
          <Plus size={15} /> Nuova
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Cerca fazione..." />
      <FilterBar options={filterOptions} active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Nessun BG fazione"
          description="Archivia il primo background fazione del tuo server RP."
          action={<button onClick={() => setModal({ open: true })} className="btn-primary">Crea BG fazione</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <EntityCard
              key={f.id}
              title={f.name}
              subtitle={f.territory}
              type={displayType(f.type)}
              description={f.description}
              riskLevel={f.dangerLevel}
              legalStatus={f.legalStatus}
              meta={[
                { label: 'Membri', value: f.memberCount },
                { label: 'Leader', value: f.leader },
              ]}
              onEdit={() => setModal({ open: true, faction: f })}
              onDelete={() => { if (confirm(`Eliminare "${f.name}"?`)) deleteFaction(f.id); }}
              accent="violet"
            />
          ))}
        </div>
      )}

      {modal.open && (
        <FactionModal faction={modal.faction} onClose={() => setModal({ open: false })} />
      )}
    </div>
  );
}
