import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Trash2, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import ProjectCard from '../components/ui/ProjectCard';
import EmptyState from '../components/ui/EmptyState';
import type { Project, ServerPreset } from '../../../shared/types';

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const addProject = useStore((s) => s.addProject);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const [form, setForm] = useState({
    name: '', type: 'FiveM' as ServerPreset,
    setting: '', description: '', tone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const p = addProject({ ...form, activePreset: form.type });
    setCurrentProject(p.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-lg p-6 z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-text-primary mb-5">Nuovo Progetto</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome Progetto *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="es. OMNIA RP" required />
          </div>

          <div>
            <label className="label">Tipo Server</label>
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ServerPreset })}>
              <option value="FiveM">FiveM / GTA RP</option>
              <option value="RedM">RedM / Western RP</option>
              <option value="DayZ">DayZ / Survival RP</option>
              <option value="Custom">Custom RP</option>
            </select>
          </div>

          <div>
            <label className="label">Ambientazione</label>
            <input className="input" value={form.setting} onChange={(e) => setForm({ ...form, setting: e.target.value })} placeholder="Descrivi l'ambientazione del server..." />
          </div>

          <div>
            <label className="label">Descrizione</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrizione del server RP..." />
          </div>

          <div>
            <label className="label">Tono Narrativo</label>
            <input className="input" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} placeholder="es. Realistico, maturo, cinematografico" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" className="btn-primary flex-1">Crea Progetto</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const factions = useStore((s) => s.factions);
  const npcs = useStore((s) => s.npcs);
  const missions = useStore((s) => s.missions);
  const [showNew, setShowNew] = useState(false);

  const getStats = (pid: string) => ({
    factions: factions.filter((f) => f.projectId === pid).length,
    npcs: npcs.filter((n) => n.projectId === pid).length,
    missions: missions.filter((m) => m.projectId === pid).length,
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Progetti</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary text-sm py-2 px-4">
          <Plus size={15} /> Nuovo
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={24} />}
          title="Nessun progetto"
          description="Crea il tuo primo progetto RP per iniziare."
          action={<button onClick={() => setShowNew(true)} className="btn-primary">Crea Progetto</button>}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="relative group">
              <ProjectCard
                project={p}
                isActive={p.id === currentProjectId}
                stats={getStats(p.id)}
                onClick={() => {
                  setCurrentProject(p.id);
                  navigate('/');
                }}
              />
              {/* Overlay actions */}
              <div className="absolute top-3 right-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {p.id !== currentProjectId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentProject(p.id); }}
                    className="p-1.5 bg-bg-card2 border border-border rounded-lg text-accent-green hover:bg-accent-green/10 transition-colors text-xs flex items-center gap-1"
                    title="Imposta come attivo"
                  >
                    <Check size={12} /> Attiva
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Eliminare "${p.name}"?`)) deleteProject(p.id);
                  }}
                  className="p-1.5 bg-bg-card2 border border-border rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </div>
  );
}


