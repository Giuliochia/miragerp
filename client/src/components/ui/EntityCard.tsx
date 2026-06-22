import { ReactNode } from 'react';
import { ChevronRight, Trash2, Edit3 } from 'lucide-react';
import RiskBadge from './RiskBadge';
import type { DangerLevel, LegalStatus } from '../../../../shared/types';

interface EntityCardProps {
  title: string;
  subtitle?: string;
  type?: string;
  description?: string;
  riskLevel?: DangerLevel;
  legalStatus?: LegalStatus;
  tags?: string[];
  badge?: ReactNode;
  meta?: Array<{ label: string; value: string }>;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  accent?: 'violet' | 'green' | 'red' | 'amber' | 'blue';
}

const legalStatusConfig: Record<LegalStatus, { label: string; className: string }> = {
  legal: { label: 'Legale', className: 'badge-green' },
  gray: { label: 'Grigio', className: 'badge-amber' },
  illegal: { label: 'Illegale', className: 'badge-red' },
};

const accentBorderMap = {
  violet: 'border-l-violet-primary',
  green: 'border-l-accent-green',
  red: 'border-l-accent-red',
  amber: 'border-l-accent-amber',
  blue: 'border-l-accent-blue',
};

export default function EntityCard({
  title, subtitle, type, description, riskLevel, legalStatus,
  tags, badge, meta, onClick, onEdit, onDelete, accent = 'violet',
}: EntityCardProps) {
  const hasActions = onEdit || onDelete;

  return (
    <div
      className={`card-hover border-l-2 ${accentBorderMap[accent]} cursor-pointer group`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text-primary text-sm truncate">{title}</h3>
            {type && (
              <span className="badge-violet text-[10px]">{type}</span>
            )}
            {badge}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
          )}

          {/* Status badges */}
          {(riskLevel || legalStatus) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {riskLevel && <RiskBadge level={riskLevel} size="sm" />}
              {legalStatus && (
                <span className={`${legalStatusConfig[legalStatus].className} text-[10px] px-1.5 py-0.5`}>
                  {legalStatusConfig[legalStatus].label}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">{description}</p>
          )}

          {/* Meta */}
          {meta && meta.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {meta.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="text-[10px] text-text-muted">{label}:</span>
                  <span className="text-[10px] font-semibold text-text-secondary">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="badge-gray text-[10px]">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasActions && (
            <div className="flex items-center gap-1 opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                >
                  <Edit3 size={13} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
          {onClick && (
            <ChevronRight size={16} className="text-text-muted group-hover:text-text-secondary transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}
