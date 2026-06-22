import { Network } from 'lucide-react';
import { useStore } from '../store/useStore';
import EmptyState from '../components/ui/EmptyState';

const relationColors: Record<string, string> = {
  ally: 'text-accent-green border-accent-green/40',
  enemy: 'text-accent-red border-accent-red/40',
  rival: 'text-accent-amber border-accent-amber/40',
  neutral: 'text-text-muted border-border',
  linked: 'text-accent-blue border-accent-blue/40',
  dependent: 'text-violet-light border-violet-primary/40',
  cover: 'text-text-secondary border-border',
};

const relationLabel: Record<string, string> = {
  ally: 'Alleato', enemy: 'Nemico', rival: 'Rivale',
  neutral: 'Neutrale', linked: 'Collegato', dependent: 'Dipendente', cover: 'Copertura',
};

export default function Relations() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));
  const npcs = useStore((s) => s.getProjectNpcs(currentProjectId ?? ''));
  const missions = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));

  const hasContent = factions.length > 0 || npcs.length > 0 || missions.length > 0;

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center gap-2">
        <Network size={18} className="text-violet-light" />
        <h1 className="text-xl font-bold text-text-primary">Mappa Relazioni</h1>
      </div>

      {!hasContent ? (
        <EmptyState
          icon={<Network size={24} />}
          title="Nessun elemento"
          description="Aggiungi fazioni, NPC e missioni per vedere le relazioni."
        />
      ) : (
        <div className="space-y-6">
          {factions.map((faction) => {
            const linkedNpcs = npcs.filter((n) => n.factionId === faction.id);
            const linkedMissions = missions.filter((m) => m.involvedFactionIds.includes(faction.id));

            return (
              <div key={faction.id} className="card space-y-3">
                {/* Faction header */}
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-violet-primary flex-shrink-0" />
                  <div>
                    <div className="font-bold text-text-primary">{faction.name}</div>
                    <div className="text-[10px] text-text-muted">{faction.type} - {faction.territory}</div>
                  </div>
                </div>

                <div className="pl-6 space-y-2">
                  {/* Allies */}
                  {faction.allies.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider">Alleati</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {faction.allies.map((a) => (
                          <span key={a} className="text-xs px-2 py-0.5 rounded-full border border-accent-green/40 text-accent-green bg-accent-green/10">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enemies */}
                  {faction.enemies.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-accent-red uppercase tracking-wider">Nemici</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {faction.enemies.map((e) => (
                          <span key={e} className="text-xs px-2 py-0.5 rounded-full border border-accent-red/40 text-accent-red bg-accent-red/10">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NPCs */}
                  {linkedNpcs.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider">Membri Chiave</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {linkedNpcs.map((n) => (
                          <span key={n.id} className="text-xs px-2 py-0.5 rounded-full border border-accent-blue/40 text-accent-blue bg-accent-blue/10">
                            {n.name} ({n.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missions */}
                  {linkedMissions.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-accent-amber uppercase tracking-wider">Missioni Collegate</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {linkedMissions.map((m) => (
                          <span key={m.id} className="text-xs px-2 py-0.5 rounded-full border border-accent-amber/40 text-accent-amber bg-accent-amber/10">{m.title}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secret */}
                  {faction.secret && (
                    <div className="bg-bg-card2 rounded-lg p-2 border border-border/50">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Segreto</span>
                      <p className="text-xs text-text-secondary mt-1 italic">{faction.secret}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {factions.length === 0 && npcs.length > 0 && (
            <div className="card">
              <div className="text-sm font-semibold text-text-muted mb-3">NPC Senza Fazione</div>
              <div className="space-y-2">
                {npcs.map((n) => (
                  <div key={n.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" />
                    <span className="text-sm text-text-primary">{n.name}</span>
                    <span className="text-xs text-text-muted">{n.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

