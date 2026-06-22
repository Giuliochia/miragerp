import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import WarningCard from '../components/ui/WarningCard';
import ScoreRing from '../components/ui/ScoreRing';
import type {
  AbuseWarning, DangerLevel,
  Mission, NarrativeItem, Faction, EconomyProfile
} from '../../../shared/types';

function analyzeAbuse(
  missions: Mission[],
  items: NarrativeItem[],
  factions: Faction[],
  economy: EconomyProfile | null
): AbuseWarning[] {
  const warnings: AbuseWarning[] = [];
  let id = 0;

  // Farming checks
  missions.forEach((m) => {
    if ((m.type === 'illegal_activity' || m.type === 'heist') && !m.cooldown) {
      warnings.push({
        id: `a-${id++}`,
        type: 'farming',
        riskLevel: 'high' as DangerLevel,
        title: `Farming: ${m.title}`,
        explanation: 'Missione illegale senza cooldown. Può essere ripetuta all\'infinito.',
        correction: 'Aggiungi cooldown minimo 24-72h. Monitora con staff audit.',
        affectedElements: [m.title],
      });
    }

    if (m.abuseRisks.some((r) => r.toLowerCase().includes('log'))) {
      warnings.push({
        id: `a-${id++}`,
        type: 'powergaming',
        riskLevel: 'high' as DangerLevel,
        title: `Powergaming: ${m.title} - Log Out Abuse`,
        explanation: 'Rischio identificato: log out per evitare conseguenze.',
        correction: 'Implementa un sistema che punisce i log-out durante missioni attive (timer, perdita reward).',
        affectedElements: [m.title],
      });
    }
  });

  // Metagaming checks
  missions.forEach((m) => {
    if (m.abuseRisks.some((r) => r.toLowerCase().includes('meta'))) {
      warnings.push({
        id: `a-${id++}`,
        type: 'metagaming',
        riskLevel: 'medium' as DangerLevel,
        title: `Metagaming: ${m.title}`,
        explanation: 'La missione ha informazioni che potrebbero essere condivise out-of-character.',
        correction: 'Assicurati che le informazioni chiave siano scopribili solo tramite RP in-character.',
        affectedElements: [m.title],
      });
    }
  });

  // Item abuse
  items.forEach((i) => {
    if (i.abuseRisk === 'high' || i.abuseRisk === 'critical') {
      warnings.push({
        id: `a-${id++}`,
        type: 'item_abuse',
        riskLevel: i.abuseRisk as DangerLevel,
        title: `Item Abuse: ${i.name}`,
        explanation: `Questo oggetto ha un rischio di abuso ${i.abuseRisk}. ${i.antiFarmRules ? '' : 'Non ha regole anti-farm definite.'}`,
        correction: i.antiFarmRules || 'Aggiungi: max per personaggio, cooldown, confisca su arresto, impossibilità di trasferimento.',
        affectedElements: [i.name],
      });
    }
  });

  // Economy abuse
  if (economy) {
    const ratio = economy.illegalIncomeAverage / economy.legalIncomeAverage;
    if (ratio > 5) {
      warnings.push({
        id: `a-${id++}`,
        type: 'economy_abuse',
        riskLevel: 'critical' as DangerLevel,
        title: 'Economia: Abuso Sistematico Possibile',
        explanation: `Con un ratio di ${ratio.toFixed(1)}x, i player ottimizzeranno sempre verso l'illegale ignorando il RP legale.`,
        correction: 'Riduci il delta. Implementa staff audit mensile su wallet size. Considera un sistema di tasse o costi fissi.',
        affectedElements: ['Economia Server'],
      });
    }
  }

  // Faction power abuse
  factions.forEach((f) => {
    if (f.dangerLevel === 'critical' && f.enemies.length === 0) {
      warnings.push({
        id: `a-${id++}`,
        type: 'powergaming',
        riskLevel: 'high' as DangerLevel,
        title: `${f.name}: Fazione Onnipotente`,
        explanation: 'Questa fazione è di livello critico ma non ha nemici. Potrebbe dominare il server senza opposizione.',
        correction: 'Aggiungi antagonisti e contrappesi narrativi. Considera un nerf del territorio o delle risorse.',
        affectedElements: [f.name],
      });
    }
  });

  return warnings;
}

export default function AbuseCheck() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const missions = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));
  const items = useStore((s) => s.getProjectItems(currentProjectId ?? ''));
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));
  const economy = useStore((s) => s.getProjectEconomy(currentProjectId ?? ''));

  const [warnings, setWarnings] = useState<AbuseWarning[]>(() =>
    analyzeAbuse(missions, items, factions, economy)
  );

  const run = () => setWarnings(analyzeAbuse(missions, items, factions, economy));

  const byType = {
    farming: warnings.filter((w) => w.type === 'farming'),
    powergaming: warnings.filter((w) => w.type === 'powergaming'),
    metagaming: warnings.filter((w) => w.type === 'metagaming'),
    item_abuse: warnings.filter((w) => w.type === 'item_abuse'),
    economy_abuse: warnings.filter((w) => w.type === 'economy_abuse'),
  };

  const critical = warnings.filter((w) => w.riskLevel === 'critical' || w.riskLevel === 'high');
  const score = Math.max(0, 100 - critical.length * 20 - warnings.filter((w) => w.riskLevel === 'medium').length * 8);

  const typeLabels: Record<string, string> = {
    farming: 'Farming', powergaming: 'Powergaming', metagaming: 'Metagaming',
    item_abuse: 'Item Abuse', economy_abuse: 'Economy Abuse',
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-accent-red" />
          <h1 className="text-xl font-bold text-text-primary">Abuse Check</h1>
        </div>
        <button onClick={run} className="btn-primary text-sm py-2 px-4">
          <RefreshCw size={15} /> Analizza
        </button>
      </div>

      {/* Score */}
      <div className="card flex items-center gap-6">
        <ScoreRing score={score} label="Anti-Abuse" size={80} strokeWidth={6} />
        <div className="flex-1 space-y-1.5">
          <div className="text-sm font-semibold text-text-primary">
            {score >= 80 ? 'Basso Rischio Abuso' : score >= 55 ? 'Rischio Moderato' : 'Alto Rischio Abuso'}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(byType).map(([type, ws]) => ws.length > 0 && (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-text-muted">{typeLabels[type]}</span>
                <span className="font-bold text-accent-red">{ws.length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sorted warnings */}
      {warnings.length === 0 ? (
        <div className="card text-center py-8">
          <div className="text-accent-green text-3xl mb-2">OK</div>
          <div className="font-semibold text-text-primary">Nessun rischio abuso rilevato</div>
          <div className="text-sm text-text-muted mt-1">Il server è ben protetto dagli abusi.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {[...warnings].sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return (order[a.riskLevel] ?? 4) - (order[b.riskLevel] ?? 4);
          }).map((w) => (
            <WarningCard key={w.id} {...w} type="abuse" />
          ))}
        </div>
      )}
    </div>
  );
}

