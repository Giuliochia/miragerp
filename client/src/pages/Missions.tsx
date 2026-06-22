import { useState } from 'react';
import { Plus, Swords } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import EntityCard from '../components/ui/EntityCard';
import EmptyState from '../components/ui/EmptyState';
import { approvalStatuses, getApprovalStatus, normalizeApprovalStatus } from '../lib/status';
import { MIRAGE_PROJECT_ID } from '../lib/project';
import type { ApprovalStatus, DangerLevel, Mission, MissionType } from '../../../shared/types';

const defaultMissionTypes = [
  'Missione RP',
  'Evento staff',
  'Quest narrativa',
  'Attività legale',
  'Attività illegale',
  'Rapina',
  'Investigazione',
  'Consegna',
  'Processo',
  'Evento business',
  'Altro',
];

const defaultLevels = ['Bassa', 'Media', 'Alta', 'Estrema'];

const legacyMissionTypes: Record<string, string> = {
  rp_mission: 'Missione RP',
  staff_event: 'Evento staff',
  narrative_quest: 'Quest narrativa',
  legal_activity: 'Attività legale',
  illegal_activity: 'Attività illegale',
  heist: 'Rapina',
  investigation: 'Investigazione',
  delivery: 'Consegna',
  territory_war: 'Guerra territorio',
  trial: 'Processo',
  ems_emergency: 'Emergenza EMS',
  caravan: 'Carovana',
  bounty: 'Taglia',
  duel: 'Duello',
  expedition: 'Spedizione',
};

const legacyLevels: Record<string, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Estrema',
};

function displayMissionType(type: string) {
  return legacyMissionTypes[type] ?? type;
}

function displayLevel(level: string) {
  return legacyLevels[level] ?? level;
}

function toMissionType(value: string): MissionType {
  return value.trim() as MissionType;
}

function toDangerLevel(value: string): DangerLevel {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'bassa' || normalized === 'basso' || normalized === 'low') return 'low';
  if (normalized === 'alta' || normalized === 'alto' || normalized === 'high') return 'high';
  if (normalized === 'estrema' || normalized === 'critico' || normalized === 'critical') return 'critical';
  return 'medium';
}

function MissionModal({ mission, onClose }: { mission?: Mission; onClose: () => void }) {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addMission = useStore((s) => s.addMission);
  const updateMission = useStore((s) => s.updateMission);
  const missions = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));
  const missionTypeSuggestions = Array.from(new Set([...defaultMissionTypes, ...missions.map((m) => displayMissionType(m.type))]));

  const [form, setForm] = useState({
    title: mission?.title ?? '',
    type: mission?.type ? displayMissionType(mission.type) : 'Missione RP',
    description: mission?.description ?? '',
    location: mission?.location ?? '',
    objective: mission?.objective ?? '',
    difficulty: mission?.difficulty ? displayLevel(mission.difficulty) : 'Media',
    riskLevel: mission?.riskLevel ? displayLevel(mission.riskLevel) : 'Media',
    reward: mission?.reward ?? '',
    cooldown: mission?.cooldown ?? '',
    status: normalizeApprovalStatus(mission?.status),
    antiFarmNotes: mission?.antiFarmNotes ?? '',
    balanceNotes: mission?.balanceNotes ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      ...form,
      type: toMissionType(form.type || 'Missione RP'),
      difficulty: toDangerLevel(form.difficulty),
      riskLevel: toDangerLevel(form.riskLevel),
      status: form.status as ApprovalStatus,
      projectId: currentProjectId ?? MIRAGE_PROJECT_ID,
      requiredItems: mission?.requiredItems ?? [],
      involvedNpcIds: mission?.involvedNpcIds ?? [],
      involvedFactionIds: mission?.involvedFactionIds ?? [],
      clues: mission?.clues ?? [],
      steps: mission?.steps ?? [],
      alternateEndings: mission?.alternateEndings ?? [],
      abuseRisks: mission?.abuseRisks ?? [],
      linkedDocumentIds: mission?.linkedDocumentIds ?? [],
      linkedItemIds: mission?.linkedItemIds ?? [],
    };
    if (mission) updateMission(mission.id, base);
    else addMission(base);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-8">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-3xl mx-auto p-6 z-10 animate-fade-in">
        <h2 className="text-lg font-bold text-text-primary mb-5">{mission ? 'Modifica evento' : 'Nuovo evento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome evento *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="es. Apertura Mirage Casino" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo custom</label>
              <input className="input" list="mission-type-suggestions" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="es. Evento whitelist" />
              <datalist id="mission-type-suggestions">
                {missionTypeSuggestions.map((type) => <option key={type} value={type} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Difficoltà</label>
              <input className="input" list="mission-level-suggestions" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Stato approvazione</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApprovalStatus })}>
              {approvalStatuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <datalist id="mission-level-suggestions">
            {defaultLevels.map((level) => <option key={level} value={level} />)}
          </datalist>

          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. South LS -> Porto" />
          </div>

          <div>
            <label className="label">Descrizione</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="label">Obiettivo</label>
            <textarea className="textarea" rows={2} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ricompensa</label>
              <input className="input" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} placeholder="es. $8,500 + Rep" />
            </div>
            <div>
              <label className="label">Cooldown</label>
              <input className="input" value={form.cooldown} onChange={(e) => setForm({ ...form, cooldown: e.target.value })} placeholder="es. 72 ore" />
            </div>
          </div>

          <div>
            <label className="label">Rischio</label>
            <input className="input" list="mission-risk-suggestions" value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })} />
            <datalist id="mission-risk-suggestions">
              {defaultLevels.map((level) => <option key={level} value={level} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Note Anti-Farm</label>
            <textarea className="textarea" rows={2} value={form.antiFarmNotes} onChange={(e) => setForm({ ...form, antiFarmNotes: e.target.value })} placeholder="Misure per evitare il farming..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" className="btn-primary flex-1">{mission ? 'Salva' : 'Crea evento'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MissionViewer({
  mission,
  onClose,
  onEdit,
  onDelete,
}: {
  mission: Mission;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updateMission = useStore((s) => s.updateMission);
  const currentStatus = normalizeApprovalStatus(mission.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-8">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-3xl mx-auto p-6 z-10 animate-fade-in">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-text-primary">{mission.title}</h2>
              <span className={`${getApprovalStatus(mission.status).className} text-[10px]`}>{getApprovalStatus(mission.status).label}</span>
            </div>
            <div className="text-xs text-text-muted">{displayMissionType(mission.type)} - {mission.location || 'Location non indicata'}</div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-3">Chiudi</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Stato approvazione</label>
            <select
              className="select"
              value={currentStatus}
              onChange={(e) => updateMission(mission.id, { status: e.target.value as ApprovalStatus })}
            >
              {approvalStatuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rischio</label>
            <div className="bg-bg-card2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary">{displayLevel(mission.riskLevel)}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-bg-card2 border border-border rounded-lg p-4">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Descrizione</div>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{mission.description || 'Nessuna descrizione.'}</p>
          </div>
          <div className="bg-bg-card2 border border-border rounded-lg p-4">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Obiettivo</div>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{mission.objective || 'Nessun obiettivo.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-card2 border border-border rounded-lg p-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Ricompensa</div>
              <p className="text-sm text-text-primary">{mission.reward || 'Non indicata'}</p>
            </div>
            <div className="bg-bg-card2 border border-border rounded-lg p-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Cooldown</div>
              <p className="text-sm text-text-primary">{mission.cooldown || 'Non indicato'}</p>
            </div>
          </div>
          {mission.antiFarmNotes && (
            <div className="bg-bg-card2 border border-border rounded-lg p-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Note Anti-Farm</div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{mission.antiFarmNotes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-5">
          <button type="button" onClick={onEdit} className="btn-secondary flex-1">Modifica</button>
          <button type="button" onClick={onDelete} className="btn-secondary flex-1 border-accent-red/30 text-accent-red hover:border-accent-red">Elimina</button>
        </div>
      </div>
    </div>
  );
}

export default function Missions() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const missions = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));
  const deleteMission = useStore((s) => s.deleteMission);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState<{ open: boolean; mission?: Mission }>({ open: false });
  const [viewMission, setViewMission] = useState<Mission | null>(null);
  const filterOptions = [
    { value: 'all', label: 'Tutte' },
    ...Array.from(new Set(missions.map((m) => displayMissionType(m.type)))).map((type) => ({ value: type, label: type })),
  ];

  const filtered = missions.filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || displayMissionType(m.type) === filter;
    const matchStatus = statusFilter === 'all' || normalizeApprovalStatus(m.status) === statusFilter;
    return matchSearch && matchFilter && matchStatus;
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-accent-amber" />
          <h1 className="text-xl font-bold text-text-primary">Eventi</h1>
          <span className="badge-amber">{missions.length}</span>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary text-sm py-2 px-4">
          <Plus size={15} /> Nuova
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Cerca evento..." />
      <FilterBar options={filterOptions} active={filter} onChange={setFilter} />
      <FilterBar
        options={[{ value: 'all', label: 'Tutti gli stati' }, ...approvalStatuses.map((status) => ({ value: status.value, label: status.label }))]}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Swords size={24} />}
          title="Nessun evento"
          description="Crea eventi operativi per Mirage RP e collega i drop quando necessario."
          action={<button onClick={() => setModal({ open: true })} className="btn-primary">Crea evento</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <EntityCard
              key={m.id}
              title={m.title}
              subtitle={m.location}
              type={displayMissionType(m.type)}
              description={m.objective}
              riskLevel={m.riskLevel}
              badge={<span className={`${getApprovalStatus(m.status).className} text-[10px]`}>{getApprovalStatus(m.status).label}</span>}
              meta={[
                { label: 'Ricompensa', value: m.reward },
                { label: 'Cooldown', value: m.cooldown },
                { label: 'Difficoltà', value: displayLevel(m.difficulty) },
              ]}
              onClick={() => setViewMission(m)}
              onEdit={() => setModal({ open: true, mission: m })}
              onDelete={() => { if (confirm(`Eliminare "${m.title}"?`)) deleteMission(m.id); }}
              accent="amber"
            />
          ))}
        </div>
      )}

      {modal.open && <MissionModal mission={modal.mission} onClose={() => setModal({ open: false })} />}
      {viewMission && (
        <MissionViewer
          mission={viewMission}
          onClose={() => setViewMission(null)}
          onEdit={() => {
            setModal({ open: true, mission: viewMission });
            setViewMission(null);
          }}
          onDelete={() => {
            if (confirm(`Eliminare "${viewMission.title}"?`)) {
              deleteMission(viewMission.id);
              setViewMission(null);
            }
          }}
        />
      )}
    </div>
  );
}


