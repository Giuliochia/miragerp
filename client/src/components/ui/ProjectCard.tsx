import { ChevronRight, Zap } from 'lucide-react';
import type { Project } from '../../../../shared/types';

interface ProjectCardProps {
  project: Project;
  isActive?: boolean;
  onClick?: () => void;
  stats?: { factions: number; npcs: number; missions: number };
}

const presetConfig = {
  FiveM: { label: 'FiveM / GTA RP', color: '#D6A13A' },
  RedM: { label: 'RedM / Western RP', color: '#F59E0B' },
  DayZ: { label: 'DayZ / Survival RP', color: '#22C55E' },
  Custom: { label: 'Custom RP', color: '#22D3EE' },
};

export default function ProjectCard({ project, isActive, onClick, stats }: ProjectCardProps) {
  const preset = presetConfig[project.type];

  return (
    <div
      onClick={onClick}
      className={`card-hover cursor-pointer relative overflow-hidden group ${
        isActive ? 'border-violet-primary/50 shadow-card-hover' : ''
      }`}
    >
      {/* Color accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${project.coverColor ?? preset.color}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span className="flex items-center gap-1 badge-violet text-[10px]">
                <Zap size={9} /> Attivo
              </span>
            )}
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${preset.color}20`, color: preset.color, border: `1px solid ${preset.color}40` }}
            >
              {preset.label}
            </span>
          </div>

          <h3 className="font-bold text-base text-text-primary truncate">{project.name}</h3>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">{project.description}</p>

          {stats && (
            <div className="flex gap-4 mt-3">
              {[
                { label: 'Fazioni', v: stats.factions },
                { label: 'NPC', v: stats.npcs },
                { label: 'Missioni', v: stats.missions },
              ].map(({ label, v }) => (
                <div key={label} className="text-center">
                  <div className="text-sm font-bold text-text-primary">{v}</div>
                  <div className="text-[10px] text-text-muted">{label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="text-[10px] text-text-muted mt-2">
            Aggiornato {new Date(project.updatedAt).toLocaleDateString('it-IT')}
          </div>
        </div>

        <ChevronRight size={16} className="text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
