import { useState } from 'react';
import { Plus, User, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBar from '../components/ui/SearchBar';
import EntityCard from '../components/ui/EntityCard';
import EmptyState from '../components/ui/EmptyState';
import type { NPC } from '../../../shared/types';

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function calculateAge(birthDate: string) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

function buildLegacyDescription(npc?: NPC) {
  if (!npc) return '';
  if (npc.characterDescription) return npc.characterDescription;

  return [
    npc.personality && `Carattere: ${npc.personality}`,
    npc.trauma && `Storia/passato: ${npc.trauma}`,
    npc.goal && `Obiettivi: ${npc.goal}`,
    npc.fear && `Paure: ${npc.fear}`,
    npc.secret && `Segreto: ${npc.secret}`,
  ].filter(Boolean).join('\n\n');
}

function NPCModal({ npc, onClose }: { npc?: NPC; onClose: () => void }) {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addNpc = useStore((s) => s.addNpc);
  const updateNpc = useStore((s) => s.updateNpc);
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));
  const nameParts = splitName(npc?.name ?? '');

  const [form, setForm] = useState({
    firstName: npc?.firstName ?? nameParts.firstName,
    lastName: npc?.lastName ?? nameParts.lastName,
    role: npc?.role ?? '',
    birthDate: npc?.birthDate ?? '',
    factionId: npc?.factionId ?? '',
    characterDescription: buildLegacyDescription(npc),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const description = form.characterDescription.trim();
    const base = {
      projectId: currentProjectId!,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      name: fullName,
      role: form.role.trim(),
      birthDate: form.birthDate,
      age: calculateAge(form.birthDate),
      factionId: form.factionId,
      characterDescription: description,
      personality: description,
      trauma: '',
      goal: '',
      fear: '',
      secret: '',
      speechStyle: '',
      narrativeUse: '',
      practicalFunction: '',
      possibleEvolution: '',
      linkedMissionIds: npc?.linkedMissionIds ?? [],
      linkedItemIds: npc?.linkedItemIds ?? [],
      linkedDocumentIds: npc?.linkedDocumentIds ?? [],
    };
    if (npc) updateNpc(npc.id, base);
    else addNpc(base);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-8">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-3xl mx-auto z-10 animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/70">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{npc ? 'Modifica BG player' : 'Nuovo BG player'}</h2>
            <p className="text-xs text-text-muted mt-1">Archivia il background completo del personaggio.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="card bg-bg-card2/45 space-y-4">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Dati personaggio</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome *</label>
                  <input
                    className="input"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="es. Rico"
                    required
                  />
                </div>
                <div>
                  <label className="label">Cognome *</label>
                  <input
                    className="input"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="es. Mendez"
                    required
                  />
                </div>
                <div>
                  <label className="label">Ruolo opzionale</label>
                  <input
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="es. Capo gang, meccanico, civile..."
                  />
                </div>
                <div>
                  <label className="label">Data di nascita</label>
                  <input
                    type="date"
                    className="input"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Fazione</label>
                  <select className="select" value={form.factionId} onChange={(e) => setForm({ ...form, factionId: e.target.value })}>
                    <option value="">Nessuna fazione</option>
                    {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card bg-bg-card2/45 space-y-3">
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Descrizione personaggio</div>
                <p className="text-xs text-text-muted mt-1">
                  Qui puoi inserire storia, carattere, obiettivo a medio termine, obiettivo a lungo termine, paure e segreto opzionale.
                </p>
              </div>
              <textarea
                className="textarea min-h-[260px]"
                value={form.characterDescription}
                onChange={(e) => setForm({ ...form, characterDescription: e.target.value })}
                placeholder={`Storia del personaggio...\n\nCarattere...\n\nObiettivo a medio termine...\n\nObiettivo a lungo termine...\n\nPaure...\n\nSegreto opzionale...`}
              />
            </div>
          </div>

          <div className="bg-bg-card border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="btn-secondary">Annulla</button>
            <button type="submit" className="btn-primary min-w-[160px]">{npc ? 'Salva' : 'Crea BG player'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NPCs() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const npcs = useStore((s) => s.getProjectNpcs(currentProjectId ?? ''));
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));
  const deleteNpc = useStore((s) => s.deleteNpc);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; npc?: NPC }>({ open: false });

  const filtered = npcs.filter((n) => {
    const query = search.toLowerCase();
    return !query
      || n.name.toLowerCase().includes(query)
      || n.role.toLowerCase().includes(query)
      || (n.characterDescription ?? n.personality).toLowerCase().includes(query);
  });

  const getFaction = (id: string) => factions.find((f) => f.id === id);

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User size={18} className="text-accent-blue" />
          <h1 className="text-xl font-bold text-text-primary">BG Player</h1>
          <span className="badge-blue">{npcs.length}</span>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary text-sm py-2 px-4">
          <Plus size={15} /> Nuovo
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Cerca BG player..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<User size={24} />}
          title="Nessun BG player"
          description="Archivia il primo background player del tuo server."
          action={<button onClick={() => setModal({ open: true })} className="btn-primary">Crea BG player</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const faction = getFaction(n.factionId);
            const description = n.characterDescription ?? n.personality;
            const tags = [
              n.birthDate ? `Nato il ${new Date(n.birthDate).toLocaleDateString('it-IT')}` : n.age ? `${n.age} anni` : '',
              faction?.name ?? '',
            ].filter(Boolean);

            return (
              <EntityCard
                key={n.id}
                title={n.name}
                subtitle={n.role || 'Ruolo non indicato'}
                description={description}
                tags={tags}
                onEdit={() => setModal({ open: true, npc: n })}
                onDelete={() => { if (confirm(`Eliminare "${n.name}"?`)) deleteNpc(n.id); }}
                accent="blue"
              />
            );
          })}
        </div>
      )}

      {modal.open && <NPCModal npc={modal.npc} onClose={() => setModal({ open: false })} />}
    </div>
  );
}
