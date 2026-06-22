interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}

export default function ScoreRing({
  score, size = 72, strokeWidth = 5, label, sublabel, color,
}: ScoreRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  const autoColor = score >= 70 ? '#22C55E' : score >= 45 ? '#F59E0B' : '#EF4444';
  const strokeColor = color ?? autoColor;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#2A3350" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
            strokeDasharray={c} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold" style={{ color: strokeColor }}>{score}%</span>
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-text-primary">{label}</span>}
      {sublabel && <span className="text-[10px] text-text-muted">{sublabel}</span>}
    </div>
  );
}
