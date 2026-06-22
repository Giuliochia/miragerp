import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import EmptyState from '../components/ui/EmptyState';
import type { TimelineEvent, TimelineEventType } from '../../../shared/types';

const typeColors: Record<string, string> = {
  faction_founding: 'bg-violet-primary/20 border-violet-primary/50 text-violet-light',
  server_event: 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue',
  war: 'bg-accent-red/20 border-accent-red/50 text-accent-red',
  heist: 'bg-accent-amber/20 border-accent-amber/50 text-accent-amber',
  trial: 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue',
  narrative_death: 'bg-accent-red/15 border-accent-red/40 text-accent-red',
  leadership_change: 'bg-violet-primary/15 border-violet-primary/40 text-violet-light',
  economic_crisis: 'bg-accent-amber/20 border-accent-amber/50 text-accent-amber',
  staff_event: 'bg-accent-green/15 border-accent-green/40 text-accent-green',
  alliance: 'bg-accent-green/15 border-accent-green/40 text-accent-green',
  betrayal: 'bg-accent-red/20 border-accent-red/50 text-accent-red',
};

const typeLabels: Record<string, string> = {
  faction_founding: 'Fondazione', server_event: 'Evento Server', war: 'Guerra',
  heist: 'Rapina', trial: 'Processo', narrative_death: 'Morte Narrativa',
  leadership_change: 'Cambio Leadership', economic_crisis: 'Crisi Economica',
  staff_event: 'Staff Event', alliance: 'Alleanza', betrayal: 'Tradimento',
};

function TimelineModal({ event, onClose }: { event?: TimelineEvent; onClose: () => void }) {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addTimelineEvent = useStore((s) => s.addTimelineEvent);
  const updateTimelineEvent = useStore((s) => s.updateTimelineEvent);

  const [form, setForm] = useState({
    title: event?.title ?? '',
    type: event?.type ?? 'server_event' as TimelineEventType,
    date: event?.date ?? new Date().toISOString().split('T')[0],
    description: event?.description ?? '',
    impact: event?.impact ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      ...form,
      projectId: currentProjectId!,
      linkedFactionIds: event?.linkedFactionIds ?? [],
      linkedNpcIds: event?.linkedNpcIds ?? [],
      linkedMissionIds: event?.linkedMissionIds ?? [],
      linkedItemIds: event?.linkedItemIds ?? [],
      linkedDocumentIds: event?.linkedDocumentIds ?? [],
    };
    if (event) updateTimelineEvent(event.id, base);
    else addTimelineEvent(base);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-lg p-6 z-10 animate-fade-in">
        <h2 className="text-lg font-bold text-text-primary mb-5">{event ? 'Modifica Evento' : 'Nuovo Evento Timeline'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Titolo *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="es. Fondazione dei Vagos" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TimelineEventType })}>
                {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Descrizione</label>
            <textarea className="textarea" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="label">Impatto sul Server</label>
            <textarea className="textarea" rows={2} value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} placeholder="Come ha cambiato il mondo RP..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" className="btn-primary flex-1">{event ? 'Salva' : 'Aggiungi'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Timeline() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const events = useStore((s) => s.getProjectTimeline(currentProjectId ?? ''));
  const deleteTimelineEvent = useStore((s) => s.deleteTimelineEvent);
  const [modal, setModal] = useState<{ open: boolean; event?: TimelineEvent }>({ open: false });

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-accent-blue" />
          <h1 className="text-xl font-bold text-text-primary">Timeline</h1>
          <span className="badge-blue">{events.length}</span>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary text-sm py-2 px-4">
          <Plus size={15} /> Evento
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Clock size={24} />}
          title="Timeline vuota"
          description="Aggiungi eventi per costruire la storia del tuo mondo RP."
          action={<button onClick={() => setModal({ open: true })} className="btn-primary">Aggiungi Evento</button>}
        />
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4 pl-10">
            {events.map((ev) => {
              const colorClass = typeColors[ev.type] ?? 'bg-bg-card2 border-border text-text-secondary';
              return (
                <div key={ev.id} className="relative group">
                  {/* Dot */}
                  <div className={`absolute -left-7 top-4 w-3 h-3 rounded-full border-2 ${colorClass.split(' ').slice(1, 3).join(' ')} bg-bg-primary`} />

                  <div className="card-hover">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${colorClass}`}>
                            {typeLabels[ev.type] ?? ev.type}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono">
                            {new Date(ev.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>

                        <h3 className="font-semibold text-text-primary">{ev.title}</h3>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{ev.description}</p>

                        {ev.impact && (
                          <div className="mt-2 text-[10px] text-accent-blue">
                            {'->'} <span className="italic">{ev.impact}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setModal({ open: true, event: ev })}
                          className="p-1.5 text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors text-xs">
                          Edit
                        </button>
                        <button onClick={() => { if (confirm('Eliminare evento?')) deleteTimelineEvent(ev.id); }}
                          className="p-1.5 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors text-xs">
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal.open && <TimelineModal event={modal.event} onClose={() => setModal({ open: false })} />}
    </div>
  );
}


