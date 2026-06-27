import { useMemo, useState } from 'react';
import { AlertTriangle, DollarSign, Folder, FolderPlus, Package, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import ScoreRing from '../components/ui/ScoreRing';
import WarningCard from '../components/ui/WarningCard';
import { MIRAGE_PROJECT_ID } from '../lib/project';
import type { DangerLevel, EconomyCustomItem, EconomyFolder } from '../../../shared/types';

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

const ALL_FOLDERS = 'all';
const UNCATEGORIZED_FOLDER = 'uncategorized';
const foodDrinkKeywords = [
  'cibo',
  'cibi',
  'food',
  'alimento',
  'alimentari',
  'bevanda',
  'bevande',
  'drink',
  'bibita',
  'bibite',
  'bar',
  'ristorante',
  'burger',
  'milkshake',
  'cola',
  'soda',
  'acqua',
  'caffe',
  'coffee',
];

function descendantFolderIds(folders: EconomyFolder[], parentId: string) {
  const result: string[] = [];
  const visit = (id: string) => {
    folders
      .filter((folder) => folder.parentId === id)
      .forEach((folder) => {
        result.push(folder.id);
        visit(folder.id);
      });
  };
  visit(parentId);
  return result;
}

const impactBands = [
  { value: 'low', label: 'Bassa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
] as const;

const blankItem = (category = 'Comune', acquisition = 'Negozio', folderId = ''): EconomyCustomItem => ({
  id: uuidv4(),
  folderId,
  name: '',
  category,
  acquisition,
  price: 100,
  supplierPrice: 0,
  weight: 10,
  fillWeight: 10,
  satiety: 0,
  impactBand: 'medium',
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

function numberValue(value: number | undefined) {
  return Math.max(0, Number(value ?? 0));
}

function impactBandLabel(value: EconomyCustomItem['impactBand']) {
  return impactBands.find((band) => band.value === value)?.label ?? 'Media';
}

function legacyWeightValue(item: EconomyCustomItem) {
  return item.fillWeight ?? item.quantity ?? 0;
}

function weightValue(item: EconomyCustomItem) {
  return item.weight ?? legacyWeightValue(item);
}

function satietyValue(item: EconomyCustomItem) {
  return item.satiety ?? item.fillWeight ?? 0;
}

function scoreColor(score: number, healthyThreshold: number, warningThreshold: number) {
  if (score >= healthyThreshold) return 'text-accent-green';
  if (score >= warningThreshold) return 'text-accent-amber';
  return 'text-accent-red';
}

function scoreLabel(score: number, healthyThreshold: number, warningThreshold: number) {
  if (score >= healthyThreshold) return 'Economia tendenzialmente fattibile.';
  if (score >= warningThreshold) return 'Economia utilizzabile, ma da monitorare.';
  return 'Economia sproporzionata: serve rivedere payout, prezzi, peso o costo fornitore.';
}

export default function Economy() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [folders, setFolders] = useState<EconomyFolder[]>(economy?.customFolders ?? []);
  const [items, setItems] = useState<EconomyCustomItem[]>(economy?.customItems ?? []);
  const [draft, setDraft] = useState<EconomyCustomItem>(() => blankItem(categories[0], acquisitionMethods[0]));
  const [editingItemId, setEditingItemId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderParentId, setFolderParentId] = useState('');
  const [editingFolderId, setEditingFolderId] = useState('');
  const [activeFolder, setActiveFolder] = useState(searchParams.get('folder') ?? ALL_FOLDERS);

  const folderLabelById = useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder.name]));
  }, [folders]);

  const validFolderIds = useMemo(() => new Set(folders.map((folder) => folder.id)), [folders]);
  const isMasterFolder = (folder: EconomyFolder) => !folder.parentId || !validFolderIds.has(folder.parentId);
  const masterFolders = useMemo(() => folders.filter(isMasterFolder), [folders, validFolderIds]);
  const childFoldersByParent = useMemo(() => {
    const grouped = new Map<string, EconomyFolder[]>();
    folders.forEach((folder) => {
      if (!folder.parentId || !validFolderIds.has(folder.parentId)) return;
      grouped.set(folder.parentId, [...(grouped.get(folder.parentId) ?? []), folder]);
    });
    return grouped;
  }, [folders, validFolderIds]);

  const blockedParentIds = useMemo(() => (
    editingFolderId ? [editingFolderId, ...descendantFolderIds(folders, editingFolderId)] : []
  ), [editingFolderId, folders]);

  const parentFolderOptions = useMemo(() => (
    folders.filter((folder) => isMasterFolder(folder) && !blockedParentIds.includes(folder.id))
  ), [blockedParentIds, folders, validFolderIds]);

  useEffect(() => {
    const folderFromUrl = searchParams.get('folder') ?? ALL_FOLDERS;
    const validFolder = folderFromUrl === ALL_FOLDERS
      || folderFromUrl === UNCATEGORIZED_FOLDER
      || folders.some((folder) => folder.id === folderFromUrl);

    if (validFolder && folderFromUrl !== activeFolder) {
      setActiveFolder(folderFromUrl);
    } else if (!validFolder) {
      setActiveFolder(ALL_FOLDERS);
    }
  }, [activeFolder, folders, searchParams]);

  const selectFolder = (folderId: string) => {
    setActiveFolder(folderId);
    const nextParams = new URLSearchParams(searchParams);
    if (folderId === ALL_FOLDERS) {
      nextParams.delete('folder');
    } else {
      nextParams.set('folder', folderId);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const folderStats = useMemo(() => {
    const stats = new Map<string, number>();
    folders.forEach((folder) => {
      const ids = [folder.id, ...descendantFolderIds(folders, folder.id)];
      stats.set(folder.id, items.filter((item) => item.folderId && ids.includes(item.folderId)).length);
    });
    stats.set(
      UNCATEGORIZED_FOLDER,
      items.filter((item) => !item.folderId || !folderLabelById.has(item.folderId)).length
    );
    return stats;
  }, [folderLabelById, folders, items]);

  const visibleItems = useMemo(() => {
    if (activeFolder === ALL_FOLDERS) return items;
    if (activeFolder === UNCATEGORIZED_FOLDER) {
      return items.filter((item) => !item.folderId || !folderLabelById.has(item.folderId));
    }
    const ids = [activeFolder, ...descendantFolderIds(folders, activeFolder)];
    return items.filter((item) => item.folderId && ids.includes(item.folderId));
  }, [activeFolder, folderLabelById, folders, items]);

  const selectedFolderName = activeFolder === UNCATEGORIZED_FOLDER
    ? 'Senza cartella'
    : folders.find((folder) => folder.id === activeFolder)?.name ?? '';

  const getFolderPathLabels = (folderId?: string) => {
    if (!folderId) return [];
    const labels: string[] = [];
    const visited = new Set<string>();
    let current = folders.find((folder) => folder.id === folderId);

    while (current && !visited.has(current.id)) {
      labels.push(current.name);
      visited.add(current.id);
      current = current.parentId ? folders.find((folder) => folder.id === current?.parentId) : undefined;
    }

    return labels;
  };

  const isFoodDrinkItem = (item: Pick<EconomyCustomItem, 'folderId' | 'category' | 'name'>) => {
    const searchable = [item.category, item.name, ...getFolderPathLabels(item.folderId)].join(' ');
    return containsAny(searchable, foodDrinkKeywords);
  };

  const draftIsFoodDrink = isFoodDrinkItem(draft);

  const folderCards = useMemo(() => {
    const folderSummaries = folders.map((folder) => {
      const ids = [folder.id, ...descendantFolderIds(folders, folder.id)];
      const folderItems = items.filter((item) => item.folderId && ids.includes(item.folderId));
      return {
        id: folder.id,
        parentId: folder.parentId,
        name: folder.name,
        items: folderItems,
        count: folderItems.length,
        value: folderItems.reduce((sum, item) => sum + item.price, 0),
      };
    });

    const uncategorizedItems = items.filter((item) => !item.folderId || !folderLabelById.has(item.folderId));
    return [
      ...folderSummaries,
      {
        id: UNCATEGORIZED_FOLDER,
        name: 'Senza cartella',
        items: uncategorizedItems,
        count: uncategorizedItems.length,
        value: uncategorizedItems.reduce((sum, item) => sum + item.price, 0),
      },
    ];
  }, [folderLabelById, folders, items]);

  const analysis = useMemo(() => {
    const legalIncome = Math.max(1, base.legalIncomeAverage);
    const illegalIncome = Math.max(1, base.illegalIncomeAverage);
    const incomeRatio = illegalIncome / legalIncome;
    const totalCatalogValue = items.reduce((sum, item) => sum + item.price, 0);
    const illegalCatalogValue = items
      .filter((item) => containsAny(item.category, ['illegal', 'illegale']) || containsAny(item.acquisition, ['mercato nero', 'black market']))
      .reduce((sum, item) => sum + item.price, 0);
    const highImpactItems = items.filter((item) => item.impactBand === 'high').length;
    const supplierMarginWarnings = items.filter((item) => (
      (item.supplierPrice ?? 0) > 0 && item.price > 0 && item.supplierPrice! > item.price * 0.85
    ));
    const heavyWeaponItems = items
      .filter((item) => containsAny(item.category, ['arma', 'weapon']))
      .filter((item) => weightValue(item) >= 20).length;
    const tooCheapRareItems = items.filter((item) => (
      containsAny(item.category, ['raro', 'rare', 'arma', 'weapon', 'illegale', 'illegal']) &&
      item.price < base.legalIncomeAverage * 1.5
    ));

    let score = 100;
    if (incomeRatio > 2.5) score -= (incomeRatio - 2.5) * 12;
    if (totalCatalogValue > illegalIncome * 8) score -= 8;
    if (illegalCatalogValue > totalCatalogValue * 0.45 && totalCatalogValue > 0) score -= 12;
    if (highImpactItems > items.length * 0.4 && items.length > 0) score -= 8;
    if (heavyWeaponItems > 3) score -= 8;
    score -= tooCheapRareItems.length * 5;
    score -= supplierMarginWarnings.length * 3;

    return {
      score: clamp(score),
      incomeRatio,
      totalCatalogValue,
      illegalCatalogValue,
      highImpactItems,
      supplierMarginWarnings,
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

    analysis.supplierMarginWarnings.forEach((item) => {
      result.push({
        id: `supplier-${item.id}`,
        riskLevel: 'medium' as DangerLevel,
        title: `${item.name} ha margine fornitore basso`,
        explanation: `Prezzo fornitore $${(item.supplierPrice ?? 0).toLocaleString()} rispetto a vendita $${item.price.toLocaleString()}.`,
        correction: 'Riduci costo fornitore o aumenta prezzo vendita per lasciare margine operativo.',
        affectedElements: [item.name],
      });
    });

    return result;
  }, [analysis, base.legalIncomeAverage]);

  const saveEconomy = (nextItems = items, nextFolders = folders) => {
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
      balanceNotes: 'Score calcolato su entrate, prezzo item, prezzo fornitore, fascia impatto, peso item e rapporto ore/prezzo.',
      antiFarmRules: [],
      customFolders: nextFolders,
      customItems: nextItems,
    });
  };

  const saveFolder = () => {
    const name = folderName.trim();
    if (!name) return;

    const nextParentId = folderParentId && validFolderIds.has(folderParentId) ? folderParentId : undefined;
    const duplicate = folders.some((folder) => (
      folder.id !== editingFolderId
      && (folder.parentId ?? '') === (nextParentId ?? '')
      && folder.name.toLowerCase() === name.toLowerCase()
    ));
    if (duplicate) {
      setFolderName('');
      setFolderParentId('');
      setEditingFolderId('');
      return;
    }

    const now = new Date().toISOString();
    if (editingFolderId) {
      const nextFolders = folders.map((folder) => (
        folder.id === editingFolderId ? { ...folder, name, parentId: nextParentId, updatedAt: now } : folder
      ));
      setFolders(nextFolders);
      setFolderName('');
      setFolderParentId('');
      setEditingFolderId('');
      saveEconomy(items, nextFolders);
      return;
    }

    const folder = { id: uuidv4(), parentId: nextParentId, name, createdAt: now, updatedAt: now };
    const nextFolders = [...folders, folder];
    setFolders(nextFolders);
    setFolderName('');
    setFolderParentId('');
    selectFolder(folder.id);
    setDraft((current) => ({ ...current, folderId: folder.id }));
    saveEconomy(items, nextFolders);
  };

  const startEditFolder = (folder: EconomyFolder) => {
    setEditingFolderId(folder.id);
    setFolderName(folder.name);
    setFolderParentId(folder.parentId ?? '');
    selectFolder(folder.id);
  };

  const cancelFolderEdit = () => {
    setEditingFolderId('');
    setFolderName('');
    setFolderParentId('');
  };

  const removeFolder = (id: string) => {
    const folder = folders.find((entry) => entry.id === id);
    if (!folder) return;
    const removedFolderIds = [id, ...descendantFolderIds(folders, id)];
    const childCount = removedFolderIds.length - 1;
    if (!confirm(`Eliminare la cartella "${folder.name}"${childCount > 0 ? ` e ${childCount} sottocartelle` : ''}? Gli item resteranno in Senza cartella.`)) return;

    const now = new Date().toISOString();
    const nextFolders = folders.filter((entry) => !removedFolderIds.includes(entry.id));
    const nextItems = items.map((item) => (
      item.folderId && removedFolderIds.includes(item.folderId) ? { ...item, folderId: undefined, updatedAt: now } : item
    ));
    setFolders(nextFolders);
    setItems(nextItems);
    if (removedFolderIds.includes(activeFolder)) selectFolder(ALL_FOLDERS);
    if (removedFolderIds.includes(editingFolderId)) cancelFolderEdit();
    if (draft.folderId && removedFolderIds.includes(draft.folderId)) setDraft({ ...draft, folderId: '' });
    saveEconomy(nextItems, nextFolders);
  };

  const resetDraft = (folderId = draft.folderId ?? '') => {
    setDraft(blankItem(categories[0], acquisitionMethods[0], folderId));
    setEditingItemId('');
  };

  const startEditItem = (item: EconomyCustomItem) => {
    setEditingItemId(item.id);
    setDraft({
      ...item,
      supplierPrice: item.supplierPrice ?? 0,
      weight: weightValue(item),
      fillWeight: weightValue(item),
      satiety: isFoodDrinkItem(item) ? satietyValue(item) : 0,
      fats: numberValue(item.fats),
      proteins: numberValue(item.proteins),
      carbohydrates: numberValue(item.carbohydrates),
      calories: numberValue(item.calories),
      impactBand: item.impactBand ?? 'medium',
      quantity: weightValue(item),
    });
    if (item.folderId && folderLabelById.has(item.folderId)) {
      selectFolder(item.folderId);
    } else {
      selectFolder(UNCATEGORIZED_FOLDER);
    }
  };

  const saveItem = () => {
    if (!draft.name.trim()) return;
    const now = new Date().toISOString();
    const nextFolderId = draft.folderId && folderLabelById.has(draft.folderId) ? draft.folderId : undefined;
    const foodDrink = isFoodDrinkItem({
      ...draft,
      folderId: nextFolderId,
    });
    const nextItem = {
      ...draft,
      id: editingItemId || uuidv4(),
      folderId: nextFolderId,
      name: draft.name.trim(),
      category: draft.category.trim() || categories[0],
      acquisition: draft.acquisition.trim() || acquisitionMethods[0],
      price: Math.max(0, draft.price),
      supplierPrice: Math.max(0, draft.supplierPrice ?? 0),
      weight: Math.max(0, weightValue(draft)),
      fillWeight: Math.max(0, weightValue(draft)),
      satiety: foodDrink ? numberValue(draft.satiety) : undefined,
      fats: foodDrink ? numberValue(draft.fats) : undefined,
      proteins: foodDrink ? numberValue(draft.proteins) : undefined,
      carbohydrates: foodDrink ? numberValue(draft.carbohydrates) : undefined,
      calories: foodDrink ? numberValue(draft.calories) : undefined,
      impactBand: draft.impactBand ?? 'medium',
      quantity: Math.max(0, weightValue(draft)),
      restockPerDay: 0,
      createdAt: draft.createdAt ?? now,
      updatedAt: now,
    };
    const nextItems = editingItemId
      ? items.map((item) => (item.id === editingItemId ? nextItem : item))
      : [nextItem, ...items];
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
    resetDraft(nextFolderId ?? '');
    saveEconomy(nextItems);
  };

  const removeItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    if (editingItemId === id) resetDraft();
    saveEconomy(nextItems);
  };

  const renderItemCard = (item: EconomyCustomItem) => {
    const legalHours = item.price / Math.max(1, base.legalIncomeAverage);
    const illegalHours = item.price / Math.max(1, base.illegalIncomeAverage);
    const itemFolder = item.folderId ? folderLabelById.get(item.folderId) : '';
    const supplierMargin = item.price - (item.supplierPrice ?? 0);
    const foodDrink = isFoodDrinkItem(item);
    const hasNutrition = foodDrink && (
      satietyValue(item) > 0
      || numberValue(item.fats) > 0
      || numberValue(item.proteins) > 0
      || numberValue(item.carbohydrates) > 0
      || numberValue(item.calories) > 0
    );

    return (
      <div key={item.id} className="bg-bg-card2 border border-border rounded-lg p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">{item.name}</div>
            <div className="text-[11px] text-text-muted mt-1">
              {displayLabel(item.category)} - {displayLabel(item.acquisition)} - peso {weightValue(item)} - fascia {impactBandLabel(item.impactBand)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => selectFolder(item.folderId && folderLabelById.has(item.folderId) ? item.folderId : UNCATEGORIZED_FOLDER)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-card px-2 py-0.5 text-[10px] font-semibold text-text-muted hover:border-violet-primary hover:text-text-primary"
              >
                <Folder size={11} />
                {itemFolder || 'Senza cartella'}
              </button>
              <span className="inline-flex rounded-full border border-border bg-bg-card px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                Fornitore ${(item.supplierPrice ?? 0).toLocaleString()}
              </span>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                supplierMargin <= 0
                  ? 'border-accent-red/30 bg-accent-red/10 text-accent-red'
                  : 'border-accent-green/30 bg-accent-green/10 text-accent-green'
              }`}>
                Margine ${supplierMargin.toLocaleString()}
              </span>
              {hasNutrition && (
                <span className="inline-flex rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 text-[10px] font-semibold text-accent-amber">
                  Sazieta {satietyValue(item)} - G {numberValue(item.fats)} - P {numberValue(item.proteins)} - C {numberValue(item.carbohydrates)} - {numberValue(item.calories)} kcal
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <div className="text-sm font-bold text-accent-green">${item.price.toLocaleString()}</div>
              <div className="text-[10px] text-text-muted">{legalHours.toFixed(1)}h legale - {illegalHours.toFixed(1)}h illegale</div>
            </div>
            <button className="p-2 text-text-muted hover:bg-accent-blue/10 hover:text-accent-blue rounded-lg" onClick={() => startEditItem(item)} title="Modifica item">
              <Pencil size={14} />
            </button>
            <button className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg" onClick={() => removeItem(item.id)} title="Elimina item">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {item.notes && <p className="text-xs text-text-secondary mt-2 leading-relaxed">{item.notes}</p>}
      </div>
    );
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
          <h2 className="text-sm font-bold text-text-primary">2. Cartelle item</h2>
          <p className="text-xs text-text-muted mt-1">Crea cartelle custom per ordinare liste come cibi, armi, farmaci o business.</p>
        </div>

        <div className="grid gap-2 lg:grid-cols-[1fr,260px,auto,auto]">
          <div>
            <label className="label">Nome cartella</label>
            <input
              className="input"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveFolder();
                }
              }}
              placeholder={editingFolderId ? 'Modifica nome cartella...' : 'es. Cibi, Bevande, Armi, Meccanico...'}
            />
          </div>
          <div>
            <label className="label">Dentro cartella master</label>
            <select className="select" value={folderParentId} onChange={(e) => setFolderParentId(e.target.value)}>
              <option value="">Nessuna: crea cartella master</option>
              {parentFolderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.parentId ? '- ' : ''}{folder.name}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-text-muted mt-1">Lascia Nessuna per creare una master, oppure scegli una master per creare una sottocartella.</div>
          </div>
          <button type="button" className="btn-primary flex-shrink-0" onClick={saveFolder}>
            {editingFolderId ? <Save size={15} /> : <FolderPlus size={15} />}
            {editingFolderId ? 'Salva' : 'Crea'}
          </button>
          {editingFolderId && (
            <button type="button" className="btn-secondary flex-shrink-0 px-3" onClick={cancelFolderEdit} title="Annulla modifica cartella">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectFolder(ALL_FOLDERS)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              activeFolder === ALL_FOLDERS
                ? 'border-violet-primary bg-violet-primary/20 text-text-primary'
                : 'border-border bg-bg-card2 text-text-muted hover:text-text-primary'
            }`}
          >
            Tutte <span className="text-text-muted">({items.length})</span>
          </button>
          {masterFolders.map((master) => (
            <div key={master.id} className="flex flex-wrap items-center gap-1">
              {[master, ...(childFoldersByParent.get(master.id) ?? [])].map((folder) => {
                const isChild = Boolean(folder.parentId);
                return (
                  <div
                    key={folder.id}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 transition ${
                      activeFolder === folder.id
                        ? 'border-violet-primary bg-violet-primary/20'
                        : 'border-border bg-bg-card2'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        selectFolder(folder.id);
                        setDraft((current) => ({ ...current, folderId: folder.id }));
                      }}
                      className="flex items-center gap-2 text-xs font-semibold text-text-primary"
                    >
                      <Folder size={13} className={isChild ? 'text-accent-blue' : 'text-violet-light'} />
                      <span>{isChild ? '- ' : ''}{folder.name}</span>
                      <span className="text-text-muted">({folderStats.get(folder.id) ?? 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditFolder(folder)}
                      className="rounded-md p-1 text-text-muted hover:bg-accent-blue/10 hover:text-accent-blue"
                      title="Modifica nome cartella"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFolder(folder.id)}
                      className="rounded-md p-1 text-text-muted hover:bg-accent-red/10 hover:text-accent-red"
                      title="Elimina cartella"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            onClick={() => selectFolder(UNCATEGORIZED_FOLDER)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              activeFolder === UNCATEGORIZED_FOLDER
                ? 'border-violet-primary bg-violet-primary/20 text-text-primary'
                : 'border-border bg-bg-card2 text-text-muted hover:text-text-primary'
            }`}
          >
            Senza cartella <span className="text-text-muted">({folderStats.get(UNCATEGORIZED_FOLDER) ?? 0})</span>
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-text-primary">{editingItemId ? '3. Modifica item custom' : '3. Item custom'}</h2>
            <p className="text-xs text-text-muted mt-1">
              {editingItemId
                ? 'Aggiorna i dati dell item selezionato nello storico.'
                : 'Inserisci gli item del server con cartella, prezzo vendita, prezzo fornitore, peso e fascia impatto.'}
            </p>
          </div>
          {editingItemId && (
            <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => resetDraft()}>
              <X size={14} /> Annulla
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nome item</label>
            <input className="input" placeholder="es. Lockpick avanzato" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Cartella</label>
            <select className="select" value={draft.folderId ?? ''} onChange={(e) => setDraft({ ...draft, folderId: e.target.value })}>
              <option value="">Senza cartella</option>
              {masterFolders.map((master) => (
                <optgroup key={master.id} label={master.name}>
                  <option value={master.id}>{master.name}</option>
                  {(childFoldersByParent.get(master.id) ?? []).map((folder) => (
                    <option key={folder.id} value={folder.id}>- {folder.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Prezzo vendita</label>
            <input type="number" className="input" placeholder="es. 1000" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            <div className="text-[10px] text-text-muted mt-1">Quanto paga il player per 1 pezzo.</div>
          </div>
          <div>
            <label className="label">Prezzo acquisto fornitore</label>
            <input type="number" className="input" placeholder="es. 450" value={draft.supplierPrice ?? 0} onChange={(e) => setDraft({ ...draft, supplierPrice: Number(e.target.value) })} />
            <div className="text-[10px] text-text-muted mt-1">Quanto costa comprarlo dal fornitore.</div>
          </div>
          <div>
            <label className="label">Peso</label>
            <input
              type="number"
              className="input"
              placeholder="es. 10"
              value={weightValue(draft)}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDraft({ ...draft, weight: value, fillWeight: value, quantity: value });
              }}
            />
            <div className="text-[10px] text-text-muted mt-1">Quanto pesa l'oggetto nell'inventario.</div>
          </div>
          <div>
            <label className="label">Fascia</label>
            <select className="select" value={draft.impactBand ?? 'medium'} onChange={(e) => setDraft({ ...draft, impactBand: e.target.value as EconomyCustomItem['impactBand'] })}>
              {impactBands.map((band) => <option key={band.value} value={band.value}>{band.label}</option>)}
            </select>
            <div className="text-[10px] text-text-muted mt-1">Intensita bassa, media o alta.</div>
          </div>
          {draftIsFoodDrink && (
            <div className="sm:col-span-2 lg:col-span-4 rounded-lg border border-accent-amber/25 bg-accent-amber/5 p-3">
              <div className="mb-3">
                <div className="text-xs font-bold uppercase tracking-wide text-accent-amber">Valori nutrizionali</div>
                <div className="text-[11px] text-text-muted mt-1">Visibili solo per cibi e bevande, riconosciuti da cartella, categoria o nome item.</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="label">Riempimento sazieta</label>
                  <input type="number" className="input" min={0} value={draft.satiety ?? 0} onChange={(e) => setDraft({ ...draft, satiety: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Grassi</label>
                  <input type="number" className="input" min={0} value={draft.fats ?? 0} onChange={(e) => setDraft({ ...draft, fats: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Proteine</label>
                  <input type="number" className="input" min={0} value={draft.proteins ?? 0} onChange={(e) => setDraft({ ...draft, proteins: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Carboidrati</label>
                  <input type="number" className="input" min={0} value={draft.carbohydrates ?? 0} onChange={(e) => setDraft({ ...draft, carbohydrates: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Calorie</label>
                  <input type="number" className="input" min={0} value={draft.calories ?? 0} onChange={(e) => setDraft({ ...draft, calories: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}
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
          <button className="btn-primary sm:col-span-2 lg:col-span-4" onClick={saveItem}>
            {editingItemId ? <Save size={14} /> : <Plus size={14} />}
            {editingItemId ? 'Salva modifiche item' : 'Aggiungi item allo storico'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="card space-y-4">
          <h2 className="text-sm font-bold text-text-primary">4. Calcolo economia</h2>
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
              <span className="text-text-muted">Valore catalogo</span>
              <span className="text-text-primary font-semibold">${analysis.totalCatalogValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Valore illegale</span>
              <span className="text-text-primary font-semibold">${analysis.illegalCatalogValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Fascia alta</span>
              <span className="text-text-primary font-semibold">{analysis.highImpactItems}</span>
            </div>
          </div>
          <p className={`text-sm leading-relaxed ${scoreColor(analysis.score, healthyThreshold, warningThreshold)}`}>
            {scoreLabel(analysis.score, healthyThreshold, warningThreshold)}
          </p>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-primary">5. Cartelle catalogo</h2>
              <p className="text-xs text-text-muted mt-1">Entra in una cartella per vedere solo gli item collegati.</p>
            </div>
            <Folder size={18} className="text-violet-light" />
          </div>

          {folderCards.length === 0 ? (
            <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
              Crea una cartella o aggiungi il primo item per iniziare a organizzare il catalogo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {folderCards.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => selectFolder(folder.id)}
                  className={`bg-bg-card2 border rounded-lg p-4 text-left transition hover:border-violet-primary ${
                    activeFolder === folder.id ? 'border-violet-primary shadow-glow' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Folder size={16} className="text-violet-light flex-shrink-0" />
                        <div className="text-sm font-bold text-text-primary truncate">{folder.name}</div>
                      </div>
                      <div className="mt-2 text-xs text-text-muted">
                        {folder.count} item - valore ${folder.value.toLocaleString()}
                      </div>
                    </div>
                    <span className={folder.count > 0 ? 'badge-violet text-[10px]' : 'badge-gray text-[10px]'}>
                      {folder.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeFolder !== ALL_FOLDERS && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Contenuto cartella: {selectedFolderName}</h2>
              <p className="text-xs text-text-muted mt-1">
                {visibleItems.length} item in questa cartella. La lista completa resta sempre disponibile sotto.
              </p>
            </div>
            <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => selectFolder(ALL_FOLDERS)}>
              Tutti gli item
            </button>
          </div>

          {visibleItems.length === 0 ? (
            <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
              Nessun item in questa cartella.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {visibleItems.map((item) => renderItemCard(item))}
            </div>
          )}
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-text-primary">6. Tutti gli item inseriti</h2>
            <p className="text-xs text-text-muted mt-1">
              Lista completa del catalogo economico, indipendente dalla cartella selezionata.
            </p>
          </div>
          <Package size={18} className="text-accent-blue" />
        </div>

        {items.length === 0 ? (
          <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
            Aggiungi il primo item custom per iniziare a calcolare l'economia.
          </div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {items.map((item) => renderItemCard(item))}
          </div>
        )}
      </div>

      <div className="card bg-accent-blue/5 border-accent-blue/25">
        <div className="text-xs font-bold text-accent-blue uppercase tracking-wide mb-2">Come viene calcolata</div>
        <p className="text-sm text-text-secondary leading-relaxed">
          L'app confronta guadagno orario, prezzo vendita, costo fornitore, fascia impatto e peso dell'illegale.
          Se un item raro o illegale costa poche ore di lavoro, ha margine fornitore troppo basso o concentra troppo valore sull'illegale, il punteggio scende.
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
