import { Scale, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { useStore } from '../store/useStore';
import ScoreRing from '../components/ui/ScoreRing';
import WarningCard from '../components/ui/WarningCard';
import type { DangerLevel } from '../../../shared/types';

interface BalanceRow {
  label: string;
  legal: string;
  illegal: string;
  status: 'ok' | 'warning' | 'danger';
}

export default function LegalIllegalBalance() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const economy = useStore((s) => s.getProjectEconomy(currentProjectId ?? ''));
  const missions = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));

  const legalIncome = economy?.legalIncomeAverage ?? 2000;
  const illegalIncome = economy?.illegalIncomeAverage ?? 9000;
  const ratio = illegalIncome / legalIncome;

  const legalMissions = missions.filter((m) => m.type === 'legal_activity');
  const illegalMissions = missions.filter((m) => m.type === 'illegal_activity' || m.type === 'heist');

  const balanceScore = Math.round(Math.max(0, Math.min(100, 100 - (ratio - 1.5) * 15)));

  const rows: BalanceRow[] = [
    {
      label: 'Reddito Orario',
      legal: `$${legalIncome.toLocaleString()}/h`,
      illegal: `$${illegalIncome.toLocaleString()}/h`,
      status: ratio > 4 ? 'danger' : ratio > 2.5 ? 'warning' : 'ok',
    },
    {
      label: 'Missioni Disponibili',
      legal: `${legalMissions.length} missioni`,
      illegal: `${illegalMissions.length} missioni`,
      status: illegalMissions.length > legalMissions.length * 2 ? 'warning' : 'ok',
    },
    {
      label: 'Rischio Conseguenze',
      legal: 'Basso (nessuna)',
      illegal: 'Alto (arresto, morte, perdita item)',
      status: 'ok',
    },
    {
      label: 'Investimento Iniziale',
      legal: 'Basso / Nullo',
      illegal: 'Medio-Alto (attrezzatura)',
      status: 'ok',
    },
  ];

  const warnings = [];

  if (ratio > 4) {
    warnings.push({
      id: 'li-1',
      riskLevel: 'high' as DangerLevel,
      title: 'Sbilanciamento Critico Illegale',
      explanation: `Le attività illegali rendono ${ratio.toFixed(1)}x più di quelle legali. I giocatori che preferiscono il RP legale sono penalizzati economicamente.`,
      correction: 'Opzioni: (1) Aumenta reddito legale del 40%; (2) Riduci payout illegale del 30%; (3) Aumenta drasticamente il rischio delle attività illegali.',
      affectedElements: ['Lavori Legali', 'Attività Illegali', 'Economia Server'],
    });
  }

  if (illegalMissions.length === 0) {
    warnings.push({
      id: 'li-2',
      riskLevel: 'medium' as DangerLevel,
      title: 'Assenza Missioni Illegali',
      explanation: 'Non ci sono missioni illegali nel Codex. L\'economia illegale è astratta senza contenuto concreto.',
      correction: 'Crea almeno 3-5 missioni illegali con cooldown, rischi e ricompense calibrate.',
      affectedElements: ['Missioni', 'Attività Illegali'],
    });
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      <div className="flex items-center gap-2">
        <Scale size={18} className="text-accent-amber" />
        <h1 className="text-xl font-bold text-text-primary">Legal / Illegal Balance</h1>
      </div>

      {/* Score */}
      <div className="card flex items-center gap-6">
        <ScoreRing score={balanceScore} label="Balance Score" size={80} strokeWidth={6} />
        <div className="space-y-1 flex-1">
          <div className="text-sm font-semibold text-text-primary">
            {balanceScore >= 70 ? 'Bilanciamento Buono' : balanceScore >= 45 ? 'Bilanciamento Accettabile' : 'Bilanciamento Critico'}
          </div>
          <div className="text-xs text-text-muted">
            Ratio illegale/legale: <span className={`font-bold ${ratio > 4 ? 'text-accent-red' : ratio > 2.5 ? 'text-accent-amber' : 'text-accent-green'}`}>{ratio.toFixed(1)}x</span>
          </div>
          <div className="text-xs text-text-muted">
            Soglia ideale: tra 1.5x e 2.5x (rischio giustificato)
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="card overflow-hidden">
        <h2 className="text-sm font-bold text-text-primary mb-4">Confronto Diretto</h2>
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="grid grid-cols-3 bg-bg-card2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <div className="px-3 py-2">Parametro</div>
            <div className="px-3 py-2 flex items-center gap-1"><TrendingUp size={10} className="text-accent-green" /> Legale</div>
            <div className="px-3 py-2 flex items-center gap-1"><TrendingDown size={10} className="text-accent-red" /> Illegale</div>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 text-xs border-t border-border ${
                row.status === 'danger' ? 'bg-accent-red/5' : row.status === 'warning' ? 'bg-accent-amber/5' : ''
              }`}
            >
              <div className="px-3 py-2.5 font-medium text-text-secondary">{row.label}</div>
              <div className="px-3 py-2.5 text-accent-green font-semibold">{row.legal}</div>
              <div className={`px-3 py-2.5 font-semibold ${row.status === 'danger' ? 'text-accent-red' : 'text-accent-amber'}`}>{row.illegal}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual ratio bar */}
      <div className="card">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Ratio Visuale</div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-accent-green font-semibold">Legale</span>
              <span className="text-text-muted">${legalIncome.toLocaleString()}/h</span>
            </div>
            <div className="h-3 bg-bg-card2 rounded-full overflow-hidden">
              <div className="h-full bg-accent-green rounded-full" style={{ width: `${(legalIncome / illegalIncome) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-accent-red font-semibold">Illegale</span>
              <span className="text-text-muted">${illegalIncome.toLocaleString()}/h</span>
            </div>
            <div className="h-3 bg-bg-card2 rounded-full overflow-hidden">
              <div className="h-full bg-accent-red rounded-full w-full" />
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-text-muted text-center">
          Zona ideale: illegale tra 1.5x e 2.5x il legale per giustificare il rischio.
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className="text-accent-red" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Problemi Rilevati</span>
          </div>
          <div className="space-y-2">
            {warnings.map((w) => <WarningCard key={w.id} {...w} type="coherence" />)}
          </div>
        </div>
      )}

      {/* Missions overview */}
      <div className="card">
        <h2 className="text-sm font-bold text-text-primary mb-3">Missioni per Tipo</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent-green/10 border border-accent-green/25 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-accent-green">{legalMissions.length}</div>
            <div className="text-xs text-text-muted">Missioni Legali</div>
          </div>
          <div className="bg-accent-red/10 border border-accent-red/25 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-accent-red">{illegalMissions.length}</div>
            <div className="text-xs text-text-muted">Missioni Illegali</div>
          </div>
        </div>
        {legalMissions.length === 0 && illegalMissions.length === 0 && (
          <p className="text-xs text-text-muted text-center mt-2">Nessuna missione nel Codex. Aggiungile nella sezione Missioni.</p>
        )}
      </div>
    </div>
  );
}

