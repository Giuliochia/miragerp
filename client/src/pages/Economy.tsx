import { useMemo, useState } from 'react';
import { AlertTriangle, DollarSign, Package, Plus, Save, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import ScoreRing from '../components/ui/ScoreRing';
import WarningCard from '../components/ui/WarningCard';
import { MIRAGE_PROJECT_ID } from '../lib/project';
import type { DangerLevel, EconomyCustomItem } from '../../../shared/types';

const legacyLabels: Record<string, string> = {
  common: 'Comune',
  rare: 'Raro',
  weapon: 'Arma',
  medical: 'Medico',
  illegal: 'Illegale',
  business: 'Business',
  luxury: 'Lusso',
  utility: 'Utilita',
  shop: 'Negozio',
  crafting: 'Crafting',
  mission: 'Missione RP',
  black_market: 'Mercato nero',
  staff_only: 'Solo staff',
  loot: 'Loot',
};

const blankItem = (category = 'Comune', acquisition = 'Negozio'): EconomyCustomItem => ({
  id: uuidv4(),
  name: '',
  category,
  acquisition,
  price: 100,
  quantity: 10,
  restockPerDay: 0,
  notes: '',
});

function clamp(score: number) {
  return Math.round(Math.max(0, Math.min(100, score)));
}

function displayLabel(value: string) {
  return legacyLabels[value] ?? value;
}

function normalized(value: string) {
  return displayLabel(value).toLowerCase();
}

function containsAny(value: string, needles: string[]) {
  const text = normalized(value);
  return needles.some((needle) => text.includes(needle));
}

function scoreColor(score: number, healthyThreshold: number, warningThreshold: number) {
  if (score >= healthyThreshold) return 'text-accent-green';
  if (score >= warningThreshold) return 'text-accent-amber';
  return 'text-accent-red';
}

function scoreLabel(score: number, healthyThreshold: number, warningThreshold: number) {
  if (score >= healthyThreshold) return 'Economia tendenzialmente fattibile.';
  if (score >= warningThreshold) return 'Economia utilizzabile, ma da monitorare.';
  return 'Economia sproporzionata: serve rivedere payout, prezzi o quantita disponibili.';
}

export default function Economy() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const projectId = currentProjectId ?? MIRAGE_PROJECT_ID;
  const economy = useStore((s) => s.getProjectEconomy(projectId));
  const upsertEconomy = useStore((s) => s.upsertEconomy);
  const customization = useStore((s) => s.customization);
  const updateCustomization = useStore((s) => s.updateCustomization);

  const categories = customization.economyItemCategories.length > 0 ? customization.economyItemCategories : ['Comune'];
  const acquisitionMethods = customization.economyAcquisitionMethods.length > 0 ? customization.economyAcquisitionMethods : ['Negozio'];
  const healthyThreshold = customization.healthyScoreThreshold;
  const warningThreshold = customization.warningScoreThreshold;

  const [base, setBase] = useState({
    currencyName: economy?.currencyName ?? 'Dollaro LS ($)',
    legalIncomeAverage: economy?.legalIncomeAverage ?? 2200,
    illegalIncomeAverage: economy?.illegalIncomeAverage ?? 8000,
  });
  const [items, setItems] = useState<EconomyCustomItem[]>(economy?.customItems ?? []);
  const [draft, setDraft] = useState<EconomyCustomItem>(() => blankItem(categories[0], acquisitionMethods[0]));

  const analysis = useMemo(() => {
    const legalIncome = Math.max(1, base.legalIncomeAverage);
    const illegalIncome = Math.max(1, base.illegalIncomeAverage);
    const incomeRatio = illegalIncome / legalIncome;
    const totalStockValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const illegalStockValue = items
      .filter((item) => containsAny(item.category, ['illegal', 'illegale']) || containsAny(item.acquisition, ['mercato nero', 'black market']))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    const weaponQuantity = items
      .filter((item) => containsAny(item.category, ['arma', 'weapon']))
      .reduce((sum, item) => sum + item.quantity, 0);
    const tooCheapRareItems = items.filter((item) => (
      containsAny(item.category, ['raro', 'rare', 'arma', 'weapon', 'illegale', 'illegal']) &&
      item.price < base.legalIncomeAverage * 1.5
    ));

    let score = 100;
    if (incomeRatio > 2.5) score -= (incomeRatio - 2.5) * 12;
    if (totalStockValue > illegalIncome * 25) score -= 10;
    if (illegalStockValue > totalStockValue * 0.45 && totalStockValue > 0) score -= 12;
    if (weaponQuantity > 20) score -= 10;
    score -= tooCheapRareItems.length * 5;

    return {
      score: clamp(score),
      incomeRatio,
      totalStockValue,
      illegalStockValue,
      weaponQuantity,
      tooCheapRareItems,
    };
  }, [base, items]);

  const warnings = useMemo(() => {
    const result = [];

    if (analysis.incomeRatio > 3.5) {
      result.push({
        id: 'income-ratio',
        riskLevel: 'high' as DangerLevel,
        title: 'Illegale troppo conveniente',
        explanation: `Il guadagno illegale e' ${analysis.incomeRatio.toFixed(1)}x quello legale. I player saranno spinti verso farm illegale.`,
        correction: 'Riduci payout illegale o aumenta rischio: polizia, cooldown, perdita item, prove investigative.',
        affectedElements: ['Entrate base'],
      });
    }

    analysis.tooCheapRareItems.forEach((item) => {
      result.push({
        id: `cheap-${item.id}`,
        riskLevel: 'medium' as DangerLevel,
        title: `${item.name} costa poco rispetto alle entrate`,
        explanation: `Costa $${item.price.toLocaleString()}, cioe' meno di 1.5 ore di lavoro legale medio.`,
        correction: 'Aumenta prezzo, abbassa disponibilita o rendilo ottenibile solo tramite rischio/RP.',
        affectedElements: [item.name],
      });
    });

    return result;
  }, [analysis, base.legalIncomeAverage]);

  const saveEconomy = (nextItems = items) => {
    upsertEconomy({
      projectId,
      currencyName: base.currencyName,
      legalIncomeAverage: base.legalIncomeAverage,
      illegalIncomeAverage: base.illegalIncomeAverage,
      commonItemPrice: 0,
      rareItemPrice: 0,
      weaponPrice: 0,
      medicalPrice: 0,
      easyMissionReward: 0,
      mediumMissionReward: 0,
      hardMissionReward: 0,
      inflationRisk: analysis.score < warningThreshold ? 'high' : analysis.score < healthyThreshold ? 'medium' : 'low',
      balanceScore: analysis.score,
      balanceNotes: 'Score calcolato su entrate, prezzo item, quantita disponibili, peso illegale e rapporto ore/prezzo.',
      antiFarmRules: [],
      customItems: nextItems,
    });
  };

  const addItem = () => {
    if (!draft.name.trim()) return;
    const now = new Date().toISOString();
    const nextItem = {
      ...draft,
      id: uuidv4(),
      name: draft.name.trim(),
      category: draft.category.trim() || categories[0],
      acquisition: draft.acquisition.trim() || acquisitionMethods[0],
      price: Math.max(0, draft.price),
      quantity: Math.max(0, draft.quantity),
      restockPerDay: 0,
      createdAt: now,
      updatedAt: now,
    };
    const nextItems = [nextItem, ...items];
    const nextCategory = nextItem.category.trim();
    const nextAcquisition = nextItem.acquisition.trim();
    const nextCategories = categories.includes(nextCategory) ? categories : [...categories, nextCategory];
    const nextAcquisitionMethods = acquisitionMethods.includes(nextAcquisition) ? acquisitionMethods : [...acquisitionMethods, nextAcquisition];

    if (nextCategories !== categories || nextAcquisitionMethods !== acquisitionMethods) {
      updateCustomization({
        economyItemCategories: nextCategories,
        economyAcquisitionMethods: nextAcquisitionMethods,
      });
    }

    setItems(nextItems);
    setDraft(blankItem(categories[0], acquisitionMethods[0]));
    saveEconomy(nextItems);
  };

  const removeItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    saveEconomy(nextItems);
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center gap-2">
        <DollarSign size={18} className="text-accent-green" />
        <h1 className="text-xl font-bold text-text-primary">Economia Mirage RP</h1>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">1. Entrate base</h2>
            <p className="text-xs text-text-muted mt-1">Imposta quanto guadagna mediamente un player all'ora. Da qui l'app capisce se i prezzi sono realistici.</p>
          </div>
          <button className="btn-secondary text-sm py-2 px-3" onClick={() => saveEconomy()}>
            <Save size={14} /> Salva
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Valuta</label>
            <input className="input" value={base.currencyName} onChange={(e) => setBase({ ...base, currencyName: e.target.value })} />
          </div>
          <div>
            <label className="label">Guadagno legale / ora</label>
            <input type="number" className="input" value={base.legalIncomeAverage} onChange={(e) => setBase({ ...base, legalIncomeAverage: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Guadagno illegale / ora</label>
            <input type="number" className="input" value={base.illegalIncomeAverage} onChange={(e) => setBase({ ...base, illegalIncomeAverage: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">2. Item custom</h2>
          <p className="text-xs text-text-muted mt-1">Inserisci gli item del server con nome, prezzo singolo, quantita, categoria e modo in cui si ottengono.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nome item</label>
            <input className="input" placeholder="es. Lockpick avanzato" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Prezzo unitario</label>
            <input type="number" className="input" placeholder="es. 1000" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            <div className="text-[10px] text-text-muted mt-1">Quanto costa 1 pezzo.</div>
          </div>
          <div>
            <label className="label">Stock disponibile</label>
            <input type="number" className="input" placeholder="es. 10" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} />
            <div className="text-[10px] text-text-muted mt-1">Quanti pezzi possono circolare.</div>
          </div>
          <div>
            <label className="label">Categoria</label>
            <input
              className="input"
              list="economy-categories"
              placeholder="es. Illegale, Food, Armi..."
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
            <datalist id="economy-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
            <div className="text-[10px] text-text-muted mt-1">Puoi scriverne una nuova: verra' salvata tra i suggerimenti.</div>
          </div>
          <div>
            <label className="label">Ottenimento</label>
            <input
              className="input"
              list="economy-acquisition-methods"
              placeholder="es. Negozio, Crafting, Rapina..."
              value={draft.acquisition}
              onChange={(e) => setDraft({ ...draft, acquisition: e.target.value })}
            />
            <datalist id="economy-acquisition-methods">
              {acquisitionMethods.map((method) => <option key={method} value={method} />)}
            </datalist>
            <div className="text-[10px] text-text-muted mt-1">Anche questo campo accetta valori nuovi.</div>
          </div>
          <div className="lg:col-span-2">
            <label className="label">Note</label>
            <input className="input" placeholder="limiti, licenze, rischio abuso..." value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>
          <button className="btn-primary sm:col-span-2 lg:col-span-4" onClick={addItem}>
            <Plus size={14} /> Aggiungi item allo storico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="card space-y-4">
          <h2 className="text-sm font-bold text-text-primary">3. Calcolo economia</h2>
          <div className="flex justify-center">
            <ScoreRing score={analysis.score} label="Fattibilita" size={96} strokeWidth={7} />
          </div>
          <div className="bg-bg-card2 border border-border rounded-lg p-3 text-xs text-text-secondary leading-relaxed">
            <div className="font-semibold text-text-primary mb-1">Soglie personalizzate</div>
            <div>{healthyThreshold}-100: economia sana</div>
            <div>{warningThreshold}-{Math.max(warningThreshold, healthyThreshold - 1)}: da monitorare</div>
            <div>0-{Math.max(0, warningThreshold - 1)}: sproporzionata</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Illegale / legale</span>
              <span className={analysis.incomeRatio > 3.5 ? 'text-accent-red font-bold' : 'text-text-primary font-semibold'}>{analysis.incomeRatio.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Valore stock</span>
              <span className="text-text-primary font-semibold">${analysis.totalStockValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Valore illegale</span>
              <span className="text-text-primary font-semibold">${analysis.illegalStockValue.toLocaleString()}</span>
            </div>
          </div>
          <p className={`text-sm leading-relaxed ${scoreColor(analysis.score, healthyThreshold, warningThreshold)}`}>
            {scoreLabel(analysis.score, healthyThreshold, warningThreshold)}
          </p>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-primary">4. Storico item inseriti</h2>
              <p className="text-xs text-text-muted mt-1">{items.length} item nel catalogo economico.</p>
            </div>
            <Package size={18} className="text-accent-blue" />
          </div>

          {items.length === 0 ? (
            <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
              Aggiungi il primo item custom per iniziare a calcolare l'economia.
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {items.map((item) => {
                const legalHours = item.price / Math.max(1, base.legalIncomeAverage);
                const illegalHours = item.price / Math.max(1, base.illegalIncomeAverage);
                return (
                  <div key={item.id} className="bg-bg-card2 border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text-primary truncate">{item.name}</div>
                        <div className="text-[11px] text-text-muted mt-1">
                          {displayLabel(item.category)} - {displayLabel(item.acquisition)} - qty {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-accent-green">${item.price.toLocaleString()}</div>
                          <div className="text-[10px] text-text-muted">{legalHours.toFixed(1)}h legale - {illegalHours.toFixed(1)}h illegale</div>
                        </div>
                        <button className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg" onClick={() => removeItem(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {item.notes && <p className="text-xs text-text-secondary mt-2 leading-relaxed">{item.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card bg-accent-blue/5 border-accent-blue/25">
        <div className="text-xs font-bold text-accent-blue uppercase tracking-wide mb-2">Come viene calcolata</div>
        <p className="text-sm text-text-secondary leading-relaxed">
          L'app confronta guadagno orario, prezzo degli item, quantita totale disponibile e peso dell'illegale.
          Se un item raro o illegale costa poche ore di lavoro, oppure se l'illegale domina il valore del mercato, il punteggio scende.
        </p>
      </div>

      {warnings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-accent-amber" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Avvisi automatici</span>
          </div>
          <div className="space-y-2">
            {warnings.map((warning) => <WarningCard key={warning.id} {...warning} type="coherence" />)}
          </div>
        </div>
      )}
    </div>
  );
}

