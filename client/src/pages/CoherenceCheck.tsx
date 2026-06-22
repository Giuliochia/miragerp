import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import WarningCard from '../components/ui/WarningCard';
import ScoreRing from '../components/ui/ScoreRing';
import type {
  CoherenceWarning, DangerLevel,
  Faction, NPC, Mission, NarrativeItem, Document, EconomyProfile
} from '../../../shared/types';

function analyzeCoherence(
  factions: Faction[],
  npcs: NPC[],
  missions: Mission[],
  items: NarrativeItem[],
  documents: Document[],
  economy: EconomyProfile | null
): CoherenceWarning[] {
  const warnings: CoherenceWarning[] = [];
  let id = 0;

  // Faction checks
  factions.forEach((f) => {
    if (!f.territory) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'medium' as DangerLevel,
        title: `${f.name}: Nessun Territorio`,
        explanation: 'Una gang/fazione senza territorio definito è narrativamente vuota.',
        correction: 'Definisci un territorio specifico con quartieri, strade o punti di controllo.',
        affectedElements: [f.name],
      });
    }

    if (f.legalStatus === 'illegal' && !f.economyRole) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'low' as DangerLevel,
        title: `${f.name}: Economia Illegale Non Definita`,
        explanation: 'La fazione è illegale ma non ha un ruolo economico specificato.',
        correction: 'Specifica come guadagnano: droga, protezione, rapine, riciclaggio...',
        affectedElements: [f.name],
      });
    }

    if (f.legalStatus === 'illegal' && f.allies.length === 0 && f.enemies.length === 0) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'low' as DangerLevel,
        title: `${f.name}: Isolamento Narrativo`,
        explanation: 'La fazione non ha alleati né nemici. Questo la rende narrativamente inerte.',
        correction: 'Aggiungi almeno un alleato e un nemico per creare tensione narrativa.',
        affectedElements: [f.name],
      });
    }
  });

  // NPC checks
  npcs.forEach((n) => {
    if (!n.narrativeUse && !n.practicalFunction) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'medium' as DangerLevel,
        title: `${n.name}: Funzione Non Definita`,
        explanation: 'Questo NPC non ha un uso narrativo né una funzione pratica nel server.',
        correction: 'Ogni NPC deve avere almeno una funzione: quest giver, informatore, antagonista, mentor...',
        affectedElements: [n.name],
      });
    }
  });

  // Mission checks
  missions.forEach((m) => {
    if (m.abuseRisks.length === 0) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'high' as DangerLevel,
        title: `${m.title}: Nessuna Analisi Rischi Abuso`,
        explanation: 'La missione non ha un\'analisi dei rischi di abuso. Potrebbe essere farmabile.',
        correction: 'Specifica i rischi di farming, powergaming e metagaming per questa missione.',
        affectedElements: [m.title],
      });
    }

    if (!m.cooldown && (m.type === 'illegal_activity' || m.type === 'heist')) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'high' as DangerLevel,
        title: `${m.title}: Nessun Cooldown (Missione Illegale)`,
        explanation: 'Una missione illegale senza cooldown è un grave rischio di farming.',
        correction: 'Aggiungi un cooldown di almeno 24-72 ore per missioni illegali.',
        affectedElements: [m.title],
      });
    }
  });

  // Item checks
  items.forEach((i) => {
    if ((i.rarity === 'rare' || i.rarity === 'epic' || i.rarity === 'legendary') && !i.antiFarmRules) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'high' as DangerLevel,
        title: `${i.name}: Oggetto Raro Senza Protezione Anti-Farm`,
        explanation: 'Un oggetto raro senza regole anti-farm può essere farmmato sistematicamente.',
        correction: 'Aggiungi regole: max 1 per personaggio, cooldown acquisizione, confisca in caso di arresto...',
        affectedElements: [i.name],
      });
    }
  });

  // Document checks
  const unlinkedDocs = documents.filter((d) => !d.linkedFactionId && !d.linkedNpcId && !d.linkedMissionId);
  if (unlinkedDocs.length > 0) {
    warnings.push({
      id: `c-${id++}`,
      riskLevel: 'low' as DangerLevel,
      title: `${unlinkedDocs.length} Documento/i Non Collegato/i`,
      explanation: 'Documenti senza collegamenti sono narrativamente inerti.',
      correction: 'Collega ogni documento a una fazione, NPC o missione.',
      affectedElements: unlinkedDocs.map((d) => d.title),
    });
  }

  // Economy checks
  if (economy) {
    const ratio = economy.illegalIncomeAverage / economy.legalIncomeAverage;
    if (ratio > 4) {
      warnings.push({
        id: `c-${id++}`,
        riskLevel: 'critical' as DangerLevel,
        title: 'Economia Fuori Controllo',
        explanation: `Il reddito illegale è ${ratio.toFixed(1)}x quello legale. I lavori legali sono economicamente irrilevanti.`,
        correction: 'Riduci il payout illegale o aumenta quello legale fino a un ratio massimo di 3x.',
        affectedElements: ['Economia Server', 'Bilanciamento'],
      });
    }
  }

  return warnings;
}

export default function CoherenceCheck() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const factions = useStore((s) => s.getProjectFactions(currentProjectId ?? ''));
  const npcs = useStore((s) => s.getProjectNpcs(currentProjectId ?? ''));
  const missions = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));
  const items = useStore((s) => s.getProjectItems(currentProjectId ?? ''));
  const documents = useStore((s) => s.getProjectDocuments(currentProjectId ?? ''));
  const economy = useStore((s) => s.getProjectEconomy(currentProjectId ?? ''));

  const [ran, setRan] = useState(true);
  const [warnings, setWarnings] = useState<CoherenceWarning[]>(() =>
    analyzeCoherence(factions, npcs, missions, items, documents, economy)
  );

  const run = () => {
    setWarnings(analyzeCoherence(factions, npcs, missions, items, documents, economy));
    setRan(true);
  };

  const critical = warnings.filter((w) => w.riskLevel === 'critical');
  const high = warnings.filter((w) => w.riskLevel === 'high');
  const medium = warnings.filter((w) => w.riskLevel === 'medium');
  const low = warnings.filter((w) => w.riskLevel === 'low');

  const score = Math.max(0, 100 - critical.length * 25 - high.length * 10 - medium.length * 5 - low.length * 2);

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-accent-amber" />
          <h1 className="text-xl font-bold text-text-primary">Controllo Coerenza</h1>
        </div>
        <button onClick={run} className="btn-primary text-sm py-2 px-4">
          <RefreshCw size={15} /> Analizza
        </button>
      </div>

      {/* Score */}
      <div className="card flex items-center gap-6">
        <ScoreRing score={score} label="Coerenza" size={80} strokeWidth={6} />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-semibold text-text-primary">
            {score >= 80 ? 'Progetto Coerente' : score >= 55 ? 'Problemi Rilevati' : 'Revisione Necessaria'}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: 'Critici', count: critical.length, color: 'text-accent-red' },
              { label: 'Alti', count: high.length, color: 'text-accent-red' },
              { label: 'Medi', count: medium.length, color: 'text-accent-amber' },
              { label: 'Bassi', count: low.length, color: 'text-accent-green' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-text-muted">{label}</span>
                <span className={`font-bold ${color}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length === 0 ? (
        <div className="card text-center py-8">
          <div className="text-accent-green text-3xl mb-2">OK</div>
          <div className="font-semibold text-text-primary">Nessun problema rilevato</div>
          <div className="text-sm text-text-muted mt-1">Il progetto è coerente.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {[...critical, ...high, ...medium, ...low].map((w) => (
            <WarningCard key={w.id} {...w} type="coherence" />
          ))}
        </div>
      )}
    </div>
  );
}

