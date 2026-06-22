import { useNavigate } from 'react-router-dom';
import { CalendarClock, ChevronRight, DollarSign, FileText, Package, Swords } from 'lucide-react';
import { useStore } from '../store/useStore';
import StatCard from '../components/ui/StatCard';
import ScoreRing from '../components/ui/ScoreRing';
import AuditLogPanel from '../components/audit/AuditLogPanel';
import { normalizeApprovalStatus } from '../lib/status';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentProjectId = useStore((s) => s.currentProjectId);
  const project = useStore((s) => s.getCurrentProject());
  const events = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));
  const drops = useStore((s) => s.getProjectItems(currentProjectId ?? ''));
  const documents = useStore((s) => s.getProjectDocuments(currentProjectId ?? ''));
  const economy = useStore((s) => s.getProjectEconomy(currentProjectId ?? ''));

  const upcomingDrops = drops
    .filter((drop) => drop.dropDate)
    .sort((a, b) => String(a.dropDate).localeCompare(String(b.dropDate)))
    .slice(0, 5);

  const allOperationalItems = [...events, ...drops, ...documents];
  const draftCount = allOperationalItems.filter((entry) => normalizeApprovalStatus(entry.status) === 'draft').length;
  const reviewCount = allOperationalItems.filter((entry) => normalizeApprovalStatus(entry.status) === 'review').length;
  const approvedCount = allOperationalItems.filter((entry) => normalizeApprovalStatus(entry.status) === 'approved').length;
  const releasedCount = allOperationalItems.filter((entry) => normalizeApprovalStatus(entry.status) === 'released').length;

  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-accent-green" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Mirage RP Economy Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Economia ufficiale Mirage RP
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Gestisci economia, eventi, drop item e documenti collegati.
          </p>
        </div>
        <button onClick={() => navigate('/economy')} className="btn-primary text-sm py-2 px-4">
          Apri economia
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard title="Economia" value={economy?.balanceScore ?? 0} icon={<DollarSign size={16} />} color="green" onClick={() => navigate('/economy')} />
        <StatCard title="Eventi" value={events.length} icon={<Swords size={16} />} color="amber" onClick={() => navigate('/missions')} />
        <StatCard title="Drop" value={drops.length} icon={<Package size={16} />} color="green" onClick={() => navigate('/items')} />
        <StatCard title="Documenti Drop" value={documents.length} icon={<FileText size={16} />} color="blue" onClick={() => navigate('/documents')} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard title="Bozze" value={draftCount} subtitle="Da inviare in approvazione" color="violet" onClick={() => navigate('/approvals')} />
        <StatCard title="Da approvare" value={reviewCount} subtitle="Eventi, drop e documenti" color="blue" onClick={() => navigate('/approvals')} />
        <StatCard title="Approvati" value={approvedCount} subtitle="Pronti per rilascio" color="green" onClick={() => navigate('/approvals')} />
        <StatCard title="Rilasciati" value={releasedCount} subtitle="Gia' pubblicati in server" color="amber" onClick={() => navigate('/approvals')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        <div className="card space-y-4">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Stato economia</div>
          <div className="flex justify-center">
            <ScoreRing score={economy?.balanceScore ?? 0} label="Score" sublabel="Mirage RP" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Valuta</span>
              <span className="text-text-primary font-semibold">{economy?.currencyName ?? 'Non impostata'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Legale / ora</span>
              <span className="text-accent-green font-semibold">${(economy?.legalIncomeAverage ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Illegale / ora</span>
              <span className="text-accent-red font-semibold">${(economy?.illegalIncomeAverage ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Prossimi drop</div>
              <p className="text-xs text-text-muted mt-1">Item con data di rilascio pianificata.</p>
            </div>
            <button onClick={() => navigate('/items')} className="text-xs text-violet-light hover:underline flex items-center gap-1">
              Gestisci <ChevronRight size={12} />
            </button>
          </div>

          {upcomingDrops.length === 0 ? (
            <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
              Nessun drop con data impostata. Aggiungi una data nel modulo Drop.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingDrops.map((drop) => (
                <button
                  key={drop.id}
                  onClick={() => navigate('/items')}
                  className="w-full bg-bg-card2 border border-border rounded-lg p-3 text-left hover:border-violet-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{drop.name}</div>
                      <div className="text-xs text-text-muted mt-1">{drop.dropMethod ?? 'Metodo non indicato'} - qtà {drop.dropQuantity ?? 1}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-accent-blue flex-shrink-0">
                      <CalendarClock size={13} />
                      {new Date(String(drop.dropDate)).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { title: 'Eventi', text: 'Crea e organizza eventi ufficiali Mirage RP.', path: '/missions', icon: Swords },
          { title: 'Drop', text: 'Decidi item, data, quantità e metodo di rilascio.', path: '/items', icon: Package },
          { title: 'Documenti Drop', text: 'Archivia prove, note e documenti collegati ai drop.', path: '/documents', icon: FileText },
        ].map(({ title, text, path, icon: Icon }) => (
          <button key={path} onClick={() => navigate(path)} className="card-hover text-left">
            <Icon size={18} className="text-violet-light mb-3" />
            <div className="text-sm font-bold text-text-primary">{title}</div>
            <div className="text-xs text-text-muted mt-1 leading-relaxed">{text}</div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Controllo staff</div>
            <p className="text-xs text-text-muted mt-1">Ultime modifiche salvate nel cloud.</p>
          </div>
          <button onClick={() => navigate('/audit-log')} className="text-xs text-violet-light hover:underline flex items-center gap-1">
            Vedi storico completo <ChevronRight size={12} />
          </button>
        </div>
        <AuditLogPanel compact limit={5} title="Ultime modifiche staff" />
      </div>
    </div>
  );
}
