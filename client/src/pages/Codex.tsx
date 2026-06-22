import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, User, Swords, Package, FileText, Plus
} from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import EntityCard from '../components/ui/EntityCard';
import EmptyState from '../components/ui/EmptyState';

type CodexSection = 'all' | 'factions' | 'npcs' | 'missions' | 'items' | 'documents';

const filterOptions = [
  { value: 'all', label: 'Tutto' },
  { value: 'factions', label: 'Fazioni' },
  { value: 'npcs', label: 'NPC' },
  { value: 'missions', label: 'Missioni' },
  { value: 'items', label: 'Oggetti' },
  { value: 'documents', label: 'Documenti' },
];

export default function Codex() {
  const navigate = useNavigate();
  const currentProjectId = useStore((s) => s.currentProjectId);
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));
  const npcs = useStore((s) => s.getProjectNpcs(currentProjectId ?? ''));
  const missions = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));
  const items = useStore((s) => s.getProjectItems(currentProjectId ?? ''));
  const documents = useStore((s) => s.getProjectDocuments(currentProjectId ?? ''));
  const deleteFaction = useStore((s) => s.deleteFaction);
  const deleteNpc = useStore((s) => s.deleteNpc);
  const deleteMission = useStore((s) => s.deleteMission);
  const deleteItem = useStore((s) => s.deleteItem);
  const deleteDocument = useStore((s) => s.deleteDocument);

  const [search, setSearch] = useState('');
  const [section, setSection] = useState<CodexSection>('all');

  const q = search.toLowerCase();
  const show = (name: string) => !q || name.toLowerCase().includes(q);

  const filteredFactions = (section === 'all' || section === 'factions') ? factions.filter((f) => show(f.name)) : [];
  const filteredNpcs = (section === 'all' || section === 'npcs') ? npcs.filter((n) => show(n.name)) : [];
  const filteredMissions = (section === 'all' || section === 'missions') ? missions.filter((m) => show(m.title)) : [];
  const filteredItems = (section === 'all' || section === 'items') ? items.filter((i) => show(i.name)) : [];
  const filteredDocs = (section === 'all' || section === 'documents') ? documents.filter((d) => show(d.title)) : [];

  const total = filteredFactions.length + filteredNpcs.length + filteredMissions.length + filteredItems.length + filteredDocs.length;

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-violet-light" />
          <h1 className="text-xl font-bold text-text-primary">Codex</h1>
          {total > 0 && (
            <span className="badge-violet">{total}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/factions')} className="btn-secondary text-xs py-2 px-3">
            <Plus size={13} /> Aggiungi
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Cerca nel Codex..." />
      <FilterBar options={filterOptions} active={section} onChange={(v) => setSection(v as CodexSection)} />

      {total === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title={search ? 'Nessun risultato' : 'Codex vuoto'}
          description={search ? `Nessun elemento corrisponde a "${search}".` : 'Aggiungi fazioni, NPC, missioni e oggetti per popolare il Codex.'}
        />
      ) : (
        <div className="space-y-6">
          {filteredFactions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-violet-light" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Fazioni ({filteredFactions.length})</span>
              </div>
              <div className="space-y-2">
                {filteredFactions.map((f) => (
                  <EntityCard
                    key={f.id}
                    title={f.name}
                    subtitle={f.territory}
                    type={f.type}
                    description={f.description}
                    riskLevel={f.dangerLevel}
                    legalStatus={f.legalStatus}
                    meta={[
                      { label: 'Membri', value: f.memberCount },
                      { label: 'Rep', value: `${f.reputation}%` },
                    ]}
                    onClick={() => navigate('/factions')}
                    onDelete={() => { if (confirm(`Eliminare "${f.name}"?`)) deleteFaction(f.id); }}
                    accent="violet"
                  />
                ))}
              </div>
            </div>
          )}

          {filteredNpcs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-accent-blue" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Personaggi ({filteredNpcs.length})</span>
              </div>
              <div className="space-y-2">
                {filteredNpcs.map((n) => (
                  <EntityCard
                    key={n.id}
                    title={n.name}
                    subtitle={n.role}
                    description={n.personality}
                    tags={[`${n.age} anni`]}
                    onClick={() => navigate('/npcs')}
                    onDelete={() => { if (confirm(`Eliminare "${n.name}"?`)) deleteNpc(n.id); }}
                    accent="blue"
                  />
                ))}
              </div>
            </div>
          )}

          {filteredMissions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Swords size={14} className="text-accent-amber" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Missioni ({filteredMissions.length})</span>
              </div>
              <div className="space-y-2">
                {filteredMissions.map((m) => (
                  <EntityCard
                    key={m.id}
                    title={m.title}
                    subtitle={m.location}
                    type={m.type}
                    description={m.objective}
                    riskLevel={m.riskLevel}
                    meta={[{ label: 'Ricompensa', value: m.reward }, { label: 'Cooldown', value: m.cooldown }]}
                    onClick={() => navigate('/missions')}
                    onDelete={() => { if (confirm(`Eliminare "${m.title}"?`)) deleteMission(m.id); }}
                    accent="amber"
                  />
                ))}
              </div>
            </div>
          )}

          {filteredItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={14} className="text-accent-green" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Oggetti ({filteredItems.length})</span>
              </div>
              <div className="space-y-2">
                {filteredItems.map((i) => (
                  <EntityCard
                    key={i.id}
                    title={i.name}
                    subtitle={i.category}
                    description={i.description}
                    riskLevel={i.abuseRisk}
                    meta={[
                      { label: 'Rarità', value: i.rarity },
                      { label: 'Valore', value: `$${i.value.toLocaleString()}` },
                    ]}
                    onClick={() => navigate('/items')}
                    onDelete={() => { if (confirm(`Eliminare "${i.name}"?`)) deleteItem(i.id); }}
                    accent="green"
                  />
                ))}
              </div>
            </div>
          )}

          {filteredDocs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-text-secondary" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Documenti ({filteredDocs.length})</span>
              </div>
              <div className="space-y-2">
                {filteredDocs.map((d) => (
                  <EntityCard
                    key={d.id}
                    title={d.title}
                    subtitle={d.author}
                    type={d.type}
                    description={d.content.slice(0, 100) + '...'}
                    onClick={() => navigate('/documents')}
                    onDelete={() => { if (confirm(`Eliminare "${d.title}"?`)) deleteDocument(d.id); }}
                    accent="blue"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

