interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  options: FilterOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function FilterBar({ options, active, onChange, className = '' }: FilterBarProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 ${className}`}>
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
            active === value
              ? 'bg-violet-primary text-white'
              : 'bg-bg-card2 text-text-muted border border-border hover:text-text-primary hover:border-border-light'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
