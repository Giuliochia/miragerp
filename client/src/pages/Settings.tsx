import { Settings as SettingsIcon, Download, Upload, Trash2, RotateCcw, Save } from 'lucide-react';
import { useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';

function parseList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function Settings() {
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetToDemo = useStore((s) => s.resetToDemo);
  const missions = useStore((s) => s.missions);
  const items = useStore((s) => s.items);
  const documents = useStore((s) => s.documents);
  const customization = useStore((s) => s.customization);
  const updateCustomization = useStore((s) => s.updateCustomization);

  const fileRef = useRef<HTMLInputElement>(null);
  const [economyCategories, setEconomyCategories] = useState(customization.economyItemCategories.join('\n'));
  const [acquisitionMethods, setAcquisitionMethods] = useState(customization.economyAcquisitionMethods.join('\n'));
  const [healthyThreshold, setHealthyThreshold] = useState(customization.healthyScoreThreshold);
  const [warningThreshold, setWarningThreshold] = useState(customization.warningScoreThreshold);

  const saveCustomization = () => {
    const nextCategories = parseList(economyCategories);
    const nextMethods = parseList(acquisitionMethods);
    const nextHealthy = Math.max(1, Math.min(100, Number(healthyThreshold) || 75));
    const nextWarning = Math.max(0, Math.min(nextHealthy - 1, Number(warningThreshold) || 50));

    updateCustomization({
      economyItemCategories: nextCategories.length > 0 ? nextCategories : ['Comune'],
      economyAcquisitionMethods: nextMethods.length > 0 ? nextMethods : ['Negozio'],
      healthyScoreThreshold: nextHealthy,
      warningScoreThreshold: nextWarning,
    });
    setHealthyThreshold(nextHealthy);
    setWarningThreshold(nextWarning);
    alert('Personalizzazione salvata.');
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `mirage-rp-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        if (!confirm('Importare questo backup? I dati attuali verranno sostituiti e poi sincronizzati sul cloud.')) return;
        importData(text);
        alert('Import completato con successo!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalElements = missions.length + items.length + documents.length;

  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon size={18} className="text-text-secondary" />
        <h1 className="text-xl font-bold text-text-primary">Impostazioni</h1>
      </div>

      {/* Stats */}
      <div className="card">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Stato Database Locale</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Eventi', v: missions.length },
            { label: 'Drop', v: items.length },
            { label: 'Documenti Drop', v: documents.length },
          ].map(({ label, v }) => (
            <div key={label} className="bg-bg-card2 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-violet-light">{v}</div>
              <div className="text-[10px] text-text-muted">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-text-muted text-center">
          {totalElements} elementi totali - Salvati in localStorage
        </div>
      </div>

      {/* Customization */}
      <div className="card space-y-4">
        <div>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Personalizzazione</div>
          <p className="text-xs text-text-muted mt-1">Questi valori cambiano le scelte disponibili nel modulo Economia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Categorie item economia</label>
            <textarea
              className="input min-h-[150px] resize-y"
              value={economyCategories}
              onChange={(e) => setEconomyCategories(e.target.value)}
              placeholder={'Comune\nRaro\nArma\nIllegale'}
            />
            <div className="text-[10px] text-text-muted mt-1">Una voce per riga oppure separate da virgola.</div>
          </div>
          <div>
            <label className="label">Metodi di ottenimento</label>
            <textarea
              className="input min-h-[150px] resize-y"
              value={acquisitionMethods}
              onChange={(e) => setAcquisitionMethods(e.target.value)}
              placeholder={'Negozio\nCrafting\nMercato nero\nSolo staff'}
            />
            <div className="text-[10px] text-text-muted mt-1">Sono i valori che vedrai nel menu dell'item custom.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Soglia economia sana</label>
            <input
              type="number"
              min={1}
              max={100}
              className="input"
              value={healthyThreshold}
              onChange={(e) => setHealthyThreshold(Number(e.target.value))}
            />
            <div className="text-[10px] text-text-muted mt-1">Da questo punteggio in su l'economia e' considerata sana.</div>
          </div>
          <div>
            <label className="label">Soglia da monitorare</label>
            <input
              type="number"
              min={0}
              max={99}
              className="input"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(Number(e.target.value))}
            />
            <div className="text-[10px] text-text-muted mt-1">Sotto questa soglia l'economia viene segnalata come sproporzionata.</div>
          </div>
        </div>

        <button onClick={saveCustomization} className="btn-primary w-full">
          <Save size={16} /> Salva personalizzazione
        </button>
      </div>

      {/* Backup */}
      <div className="card space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green/15 text-accent-green">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Backup Workspace</div>
            <p className="mt-1 text-xs text-text-muted">
              Crea una copia completa di economia, eventi, drop, documenti e impostazioni.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Eventi', value: missions.length },
            { label: 'Drop', value: items.length },
            { label: 'Documenti', value: documents.length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-bg-card2 px-3 py-2">
              <div className="text-lg font-bold text-text-primary">{value}</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
            </div>
          ))}
        </div>

        <button onClick={handleExport} className="btn-secondary w-full justify-start">
          <Download size={16} className="text-accent-green" />
          <div className="text-left">
            <div className="font-semibold text-text-primary">Scarica backup JSON</div>
            <div className="text-xs text-text-muted">Salva una copia locale con data e ora nel nome file.</div>
          </div>
        </button>

        <button onClick={() => fileRef.current?.click()} className="btn-secondary w-full justify-start">
          <Upload size={16} className="text-accent-blue" />
          <div className="text-left">
            <div className="font-semibold text-text-primary">Ripristina backup JSON</div>
            <div className="text-xs text-text-muted">Carica un backup esportato in precedenza.</div>
          </div>
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {/* Danger zone */}
      <div className="card border-accent-red/30 space-y-3">
        <div className="text-xs font-bold text-accent-red uppercase tracking-wider">Zona Pericolosa</div>

        <button
          onClick={() => { if (confirm('Ripristinare i dati demo? Tutti i dati correnti saranno persi.')) resetToDemo(); }}
          className="btn-secondary w-full justify-start border-accent-amber/30 hover:border-accent-amber"
        >
          <RotateCcw size={16} className="text-accent-amber" />
          <div className="text-left">
            <div className="font-semibold text-text-primary">Ripristina Demo</div>
            <div className="text-xs text-text-muted">Ricarica i dati demo iniziali.</div>
          </div>
        </button>

        <button
          onClick={() => {
            if (confirm('ATTENZIONE: Tutti i dati saranno eliminati definitivamente. Continuare?')) {
              localStorage.removeItem('rp-architect-store');
              window.location.reload();
            }
          }}
          className="btn-secondary w-full justify-start border-accent-red/30 hover:border-accent-red"
        >
          <Trash2 size={16} className="text-accent-red" />
          <div className="text-left">
            <div className="font-semibold text-accent-red">Cancella Tutto</div>
            <div className="text-xs text-text-muted">Elimina tutti i dati salvati localmente</div>
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="card">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Informazioni</div>
        <div className="space-y-2">
          {[
            { label: 'Versione', value: '1.0.0' },
            { label: 'Build', value: 'MVP' },
            { label: 'Storage', value: 'localStorage (browser)' },
            { label: 'Stack', value: 'React + Vite + Tailwind + Zustand' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-text-muted">{label}</span>
              <span className="text-text-secondary font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-text-muted py-4">
        Mirage RP Economy Hub v1.0 - Economia, eventi, drop e documenti operativi.
      </div>
    </div>
  );
}
