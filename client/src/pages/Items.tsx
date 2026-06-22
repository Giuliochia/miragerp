import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import EntityCard from '../components/ui/EntityCard';
import EmptyState from '../components/ui/EmptyState';
import { approvalStatuses, getApprovalStatus, normalizeApprovalStatus } from '../lib/status';
import { MIRAGE_PROJECT_ID } from '../lib/project';
import type { ApprovalStatus, DangerLevel, ItemCategory, NarrativeItem } from '../../../shared/types';

const defaultCategories = [
  'Item economia',
  'Documento',
  'Arma',
  'Item evento',
  'Consumabile',
  'Medico',
  'Chiave',
  'Prova',
  'Contrabbando',
  'Lusso',
  'Quest item',
  'Altro',
];

const defaultRarities = ['Comune', 'Non comune', 'Raro', 'Epico', 'Leggendario', 'Unico'];
const defaultRiskLevels = ['Basso', 'Medio', 'Alto', 'Critico'];
const defaultDropMethods = ['Evento', 'Staff', 'Missione', 'Shop', 'Crafting', 'Loot controllato', 'Ricompensa RP'];

const rarityColors: Record<string, string> = {
  common: 'badge-gray',
  uncommon: 'badge-green',
  rare: 'badge-blue',
  epic: 'badge-violet',
  legendary: 'badge-amber',
};

const legacyCategoryLabels: Record<string, string> = {
  document: 'Documento',
  weapon: 'Arma',
  drug: 'Droga',
  tech: 'Tech',
  vehicle_part: 'Parte veicolo',
  money: 'Denaro',
  key: 'Chiave',
  evidence: 'Prova',
  medical: 'Medico',
  survival: 'Survival',
  contraband: 'Contrabbando',
  luxury: 'Lusso',
  tool: 'Tool',
  misc: 'Altro',
};

const legacyRarityLabels: Record<string, string> = {
  common: 'Comune',
  uncommon: 'Non comune',
  rare: 'Raro',
  epic: 'Epico',
  legendary: 'Leggendario',
};

const legacyRiskLabels: Record<string, string> = {
  low: 'Basso',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Critico',
};

function displayCategory(category: string) {
  return legacyCategoryLabels[category] ?? category;
}

function displayRarity(rarity: string) {
  return legacyRarityLabels[rarity] ?? rarity;
}

function displayRisk(risk: string) {
  return legacyRiskLabels[risk] ?? risk;
}

function toItemCategory(value: string): ItemCategory {
  return value.trim() as ItemCategory;
}

function toRarityLevel(value: string): string {
  return value.trim() || 'Comune';
}

function toDangerLevel(value: string): DangerLevel {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'basso' || normalized === 'low') return 'low';
  if (normalized === 'alto' || normalized === 'high') return 'high';
  if (normalized === 'critico' || normalized === 'critical') return 'critical';
  return 'medium';
}

function ItemModal({ item, onClose }: { item?: NarrativeItem; onClose: () => void }) {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addItem = useStore((s) => s.addItem);
  const updateItem = useStore((s) => s.updateItem);
  const items = useStore((s) => s.getProjectItems(currentProjectId ?? ''));
  const categorySuggestions = Array.from(new Set([...defaultCategories, ...items.map((entry) => displayCategory(entry.category))]));
  const raritySuggestions = Array.from(new Set([...defaultRarities, ...items.map((entry) => displayRarity(entry.rarity))]));
  const dropMethodSuggestions = Array.from(new Set([...defaultDropMethods, ...items.map((entry) => entry.dropMethod ?? '').filter(Boolean)]));

  const [form, setForm] = useState({
    name: item?.name ?? '',
    category: item?.category ? displayCategory(item.category) : 'Altro',
    rarity: item?.rarity ? displayRarity(item.rarity) : 'Comune',
    value: item?.value ?? 0,
    description: item?.description ?? '',
    origin: item?.origin ?? '',
    rpUse: item?.rpUse ?? '',
    gameplayUse: item?.gameplayUse ?? '',
    economyUse: item?.economyUse ?? '',
    dropDate: item?.dropDate ?? '',
    dropQuantity: item?.dropQuantity ?? 1,
    dropMethod: item?.dropMethod ?? 'Evento',
    status: normalizeApprovalStatus(item?.status),
    staffNotes: item?.staffNotes ?? '',
    abuseRisk: item?.abuseRisk ? displayRisk(item.abuseRisk) : 'Basso',
    antiFarmRules: item?.antiFarmRules ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      ...form,
      category: toItemCategory(form.category || 'Altro'),
      rarity: toRarityLevel(form.rarity),
      abuseRisk: toDangerLevel(form.abuseRisk),
      projectId: currentProjectId ?? MIRAGE_PROJECT_ID,
      dropQuantity: Math.max(0, Number(form.dropQuantity) || 0),
      status: form.status as ApprovalStatus,
      documentIds: item?.documentIds ?? [],
      factionId: item?.factionId,
      missionId: item?.missionId,
    };
    if (item) updateItem(item.id, base);
    else addItem(base);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-8">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-3xl mx-auto p-6 z-10 animate-fade-in">
        <h2 className="text-lg font-bold text-text-primary mb-5">{item ? 'Modifica drop' : 'Nuovo drop'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome item *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="es. Chiave magazzino porto" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria custom</label>
              <input className="input" list="item-category-suggestions" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="es. Quest item" />
              <datalist id="item-category-suggestions">
                {categorySuggestions.map((category) => <option key={category} value={category} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Rarità custom</label>
              <input className="input" list="item-rarity-suggestions" value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} placeholder="es. Unico" />
              <datalist id="item-rarity-suggestions">
                {raritySuggestions.map((rarity) => <option key={rarity} value={rarity} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Data drop</label>
              <input type="date" className="input" value={form.dropDate} onChange={(e) => setForm({ ...form, dropDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Quantità</label>
              <input type="number" min={0} className="input" value={form.dropQuantity} onChange={(e) => setForm({ ...form, dropQuantity: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Valore unitario</label>
              <input type="number" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="label">Metodo / contesto drop</label>
            <input className="input" list="drop-method-suggestions" value={form.dropMethod} onChange={(e) => setForm({ ...form, dropMethod: e.target.value })} placeholder="es. Evento apertura casinò" />
            <datalist id="drop-method-suggestions">
              {dropMethodSuggestions.map((method) => <option key={method} value={method} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Stato approvazione</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApprovalStatus })}>
              {approvalStatuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descrizione drop</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A cosa serve, perché viene droppato, chi dovrebbe riceverlo..." />
          </div>

          <div>
            <label className="label">Origine / motivazione</label>
            <input className="input" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="es. Ricompensa evento, drop staff, storyline..." />
          </div>

          <div>
            <label className="label">Uso previsto</label>
            <textarea className="textarea" rows={2} value={form.rpUse} onChange={(e) => setForm({ ...form, rpUse: e.target.value })} placeholder="Uso RP, uso gameplay, limiti, chi può usarlo..." />
          </div>

          <div>
            <label className="label">Rischio Abuso</label>
            <input className="input" list="item-risk-suggestions" value={form.abuseRisk} onChange={(e) => setForm({ ...form, abuseRisk: e.target.value })} />
            <datalist id="item-risk-suggestions">
              {defaultRiskLevels.map((level) => <option key={level} value={level} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Note staff</label>
            <textarea className="textarea" rows={3} value={form.staffNotes} onChange={(e) => setForm({ ...form, staffNotes: e.target.value })} placeholder="Chi autorizza il drop, limiti, log, condizioni, follow-up..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" className="btn-primary flex-1">{item ? 'Salva' : 'Crea drop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Items() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const items = useStore((s) => s.getProjectItems(currentProjectId ?? ''));
  const deleteItem = useStore((s) => s.deleteItem);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState<{ open: boolean; item?: NarrativeItem }>({ open: false });
  const filterOptions = [
    { value: 'all', label: 'Tutti' },
    ...Array.from(new Set(items.map((i) => displayCategory(i.category)))).map((category) => ({ value: category, label: category })),
  ];

  const filtered = items.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || displayCategory(i.category) === filter;
    const matchStatus = statusFilter === 'all' || normalizeApprovalStatus(i.status) === statusFilter;
    return matchSearch && matchFilter && matchStatus;
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-accent-green" />
          <h1 className="text-xl font-bold text-text-primary">Drop</h1>
          <span className="badge-green">{items.length}</span>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary text-sm py-2 px-4">
          <Plus size={15} /> Nuovo
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Cerca drop..." />
      <FilterBar options={filterOptions} active={filter} onChange={setFilter} />
      <FilterBar
        options={[{ value: 'all', label: 'Tutti gli stati' }, ...approvalStatuses.map((status) => ({ value: status.value, label: status.label }))]}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title="Nessun drop"
          description="Pianifica il primo item da droppare nel server Mirage RP."
          action={<button onClick={() => setModal({ open: true })} className="btn-primary">Crea drop</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => (
            <EntityCard
              key={i.id}
              title={i.name}
              subtitle={`${displayCategory(i.category)}${i.dropDate ? ` - ${new Date(i.dropDate).toLocaleDateString('it-IT')}` : ''}`}
              description={i.description}
              riskLevel={i.abuseRisk}
              badge={
                <>
                  <span className={(rarityColors[i.rarity] ?? 'badge-gray') + ' text-[10px]'}>{displayRarity(i.rarity)}</span>
                  <span className={`${getApprovalStatus(i.status).className} text-[10px]`}>{getApprovalStatus(i.status).label}</span>
                </>
              }
              meta={[
                { label: 'Qtà', value: String(i.dropQuantity ?? 1) },
                { label: 'Metodo', value: i.dropMethod ?? 'Non indicato' },
                { label: 'Valore', value: `$${i.value.toLocaleString()}` },
              ]}
              onEdit={() => setModal({ open: true, item: i })}
              onDelete={() => { if (confirm(`Eliminare "${i.name}"?`)) deleteItem(i.id); }}
              accent="green"
            />
          ))}
        </div>
      )}

      {modal.open && <ItemModal item={modal.item} onClose={() => setModal({ open: false })} />}
    </div>
  );
}


