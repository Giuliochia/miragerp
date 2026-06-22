import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-card2 border border-border flex items-center justify-center mb-4 text-text-muted">
        {icon}
      </div>
      <h3 className="font-semibold text-text-primary text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted leading-relaxed max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
