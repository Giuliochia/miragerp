import { AlertTriangle, Shield, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { DangerLevel } from '../../../../shared/types';

interface WarningCardProps {
  riskLevel: DangerLevel;
  title: string;
  explanation: string;
  correction: string;
  affectedElements?: string[];
  type?: 'coherence' | 'abuse' | 'info';
}

const levelConfig: Record<DangerLevel, { bg: string; border: string; icon: string; textColor: string }> = {
  low: { bg: 'bg-accent-green/5', border: 'border-accent-green/30', icon: 'text-accent-green', textColor: 'text-accent-green' },
  medium: { bg: 'bg-accent-amber/5', border: 'border-accent-amber/30', icon: 'text-accent-amber', textColor: 'text-accent-amber' },
  high: { bg: 'bg-accent-red/5', border: 'border-accent-red/30', icon: 'text-accent-red', textColor: 'text-accent-red' },
  critical: { bg: 'bg-accent-red/10', border: 'border-accent-red/50', icon: 'text-accent-red', textColor: 'text-accent-red' },
};

const levelLabel: Record<DangerLevel, string> = {
  low: 'Basso', medium: 'Medio', high: 'Alto', critical: 'Critico',
};

export default function WarningCard({
  riskLevel, title, explanation, correction, affectedElements, type = 'coherence',
}: WarningCardProps) {
  const [expanded, setExpanded] = useState(false);
  const safeRiskLevel: DangerLevel = riskLevel in levelConfig ? riskLevel : 'medium';
  const cfg = levelConfig[safeRiskLevel];
  const Icon = type === 'abuse' ? Shield : type === 'info' ? Info : AlertTriangle;

  return (
    <div className={`rounded-xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon size={16} className={`${cfg.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{String(title ?? 'Avviso')}</span>
            <span className={`text-[10px] font-bold uppercase ${cfg.textColor}`}>{levelLabel[safeRiskLevel]}</span>
          </div>
          {!expanded && (
            <p className="text-xs text-text-secondary mt-1 line-clamp-1">{String(explanation ?? '')}</p>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-current/10 pt-3">
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Problema</div>
            <p className="text-xs text-text-secondary leading-relaxed">{String(explanation ?? '')}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold text-accent-green uppercase tracking-wider mb-1">Correzione consigliata</div>
            <p className="text-xs text-text-primary leading-relaxed">{String(correction ?? '')}</p>
          </div>
          {Array.isArray(affectedElements) && affectedElements.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Elementi coinvolti</div>
              <div className="flex flex-wrap gap-1">
                {affectedElements.map((el, index) => (
                  <span key={`${String(el)}-${index}`} className="badge-gray text-[10px]">{String(el)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
