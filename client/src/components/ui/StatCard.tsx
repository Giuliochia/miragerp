import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: ReactNode;
  color?: 'violet' | 'green' | 'red' | 'amber' | 'blue';
  onClick?: () => void;
}

const colorMap = {
  violet: 'text-violet-light bg-violet-primary/15',
  green: 'text-accent-green bg-accent-green/10',
  red: 'text-accent-red bg-accent-red/10',
  amber: 'text-accent-amber bg-accent-amber/10',
  blue: 'text-accent-blue bg-accent-blue/10',
};

const trendColorMap = {
  up: 'text-accent-green',
  down: 'text-accent-red',
  neutral: 'text-text-muted',
};

export default function StatCard({
  title, value, unit, subtitle, trend, trendValue, icon, color = 'violet', onClick,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={`card ${onClick ? 'cursor-pointer card-hover' : ''} flex flex-col gap-2`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider leading-tight">{title}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {unit && <span className="text-sm text-text-muted font-medium">{unit}</span>}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-1 ${trendColorMap[trend]}`}>
              <TrendIcon size={12} strokeWidth={2} />
              {trendValue && <span className="text-xs font-medium">{trendValue}</span>}
            </div>
          )}
          {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
