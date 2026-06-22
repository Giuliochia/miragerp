import type { DangerLevel } from '../../../../shared/types';

interface RiskBadgeProps {
  level: DangerLevel;
  label?: string;
  size?: 'sm' | 'md';
}

const config: Record<DangerLevel, { label: string; className: string; dot: string }> = {
  low: { label: 'Basso', className: 'badge-green', dot: 'bg-accent-green' },
  medium: { label: 'Medio', className: 'badge-amber', dot: 'bg-accent-amber' },
  high: { label: 'Alto', className: 'badge-red', dot: 'bg-accent-red' },
  critical: { label: 'Critico', className: 'badge-red', dot: 'bg-accent-red animate-pulse' },
};

export default function RiskBadge({ level, label, size = 'md' }: RiskBadgeProps) {
  const { label: defaultLabel, className, dot } = config[level];
  return (
    <span className={`${className} ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
      {label ?? defaultLabel}
    </span>
  );
}
