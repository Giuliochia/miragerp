import { CheckCircle2, Archive, Rocket, ClipboardCheck, FileText, Package, Swords } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getApprovalStatus, normalizeApprovalStatus } from '../lib/status';
import type { ApprovalStatus, Document, Mission, NarrativeItem } from '../../../shared/types';

type ApprovalEntry =
  | { kind: 'event'; label: 'Evento'; id: string; title: string; subtitle: string; status: ApprovalStatus; item: Mission }
  | { kind: 'drop'; label: 'Drop'; id: string; title: string; subtitle: string; status: ApprovalStatus; item: NarrativeItem }
  | { kind: 'document'; label: 'Documento'; id: string; title: string; subtitle: string; status: ApprovalStatus; item: Document };

const kindConfig = {
  event: { icon: Swords, className: 'text-accent-amber', pathLabel: 'Eventi' },
  drop: { icon: Package, className: 'text-accent-green', pathLabel: 'Drop' },
  document: { icon: FileText, className: 'text-accent-blue', pathLabel: 'Documenti' },
};

function ApprovalCard({
  entry,
  onStatus,
}: {
  entry: ApprovalEntry;
  onStatus: (entry: ApprovalEntry, status: ApprovalStatus) => void;
}) {
  const status = getApprovalStatus(entry.status);
  const Icon = kindConfig[entry.kind].icon;

  return (
    <div className="bg-bg-card2 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
            <Icon size={16} className={kindConfig[entry.kind].className} />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{entry.label}</span>
            <span className={`${status.className} text-[10px]`}>{status.label}</span>
          </div>
          <div className="text-base font-bold text-text-primary truncate">{entry.title}</div>
          <div className="text-sm text-text-muted mt-1">{entry.subtitle || kindConfig[entry.kind].pathLabel}</div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {entry.status === 'draft' && (
            <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => onStatus(entry, 'review')}>
              <ClipboardCheck size={14} /> Da approvare
            </button>
          )}
          {entry.status !== 'approved' && (
            <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => onStatus(entry, 'approved')}>
              <CheckCircle2 size={14} /> Approva
            </button>
          )}
          {entry.status !== 'released' && (
            <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => onStatus(entry, 'released')}>
              <Rocket size={14} /> Rilascia
            </button>
          )}
          {entry.status !== 'archived' && (
            <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={() => onStatus(entry, 'archived')}>
              <Archive size={14} /> Archivia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Approvals() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const events = useStore((s) => s.getProjectMissions(currentProjectId ?? ''));
  const drops = useStore((s) => s.getProjectItems(currentProjectId ?? ''));
  const documents = useStore((s) => s.getProjectDocuments(currentProjectId ?? ''));
  const updateMission = useStore((s) => s.updateMission);
  const updateItem = useStore((s) => s.updateItem);
  const updateDocument = useStore((s) => s.updateDocument);

  const entries: ApprovalEntry[] = [
    ...events.map((item) => ({
      kind: 'event' as const,
      label: 'Evento' as const,
      id: item.id,
      title: item.title,
      subtitle: item.location || item.type,
      status: normalizeApprovalStatus(item.status),
      item,
    })),
    ...drops.map((item) => ({
      kind: 'drop' as const,
      label: 'Drop' as const,
      id: item.id,
      title: item.name,
      subtitle: `${item.dropMethod || 'Metodo non indicato'}${item.dropDate ? ` - ${new Date(item.dropDate).toLocaleDateString('it-IT')}` : ''}`,
      status: normalizeApprovalStatus(item.status),
      item,
    })),
    ...documents.map((item) => ({
      kind: 'document' as const,
      label: 'Documento' as const,
      id: item.id,
      title: item.title,
      subtitle: item.author || item.type,
      status: normalizeApprovalStatus(item.status),
      item,
    })),
  ];

  const draftEntries = entries.filter((entry) => entry.status === 'draft');
  const reviewEntries = entries.filter((entry) => entry.status === 'review');
  const approvedEntries = entries.filter((entry) => entry.status === 'approved');
  const releasedEntries = entries.filter((entry) => entry.status === 'released');

  const updateStatus = (entry: ApprovalEntry, status: ApprovalStatus) => {
    if (entry.kind === 'event') updateMission(entry.id, { status });
    if (entry.kind === 'drop') updateItem(entry.id, { status });
    if (entry.kind === 'document') updateDocument(entry.id, { status });
  };

  const renderSection = (title: string, description: string, sectionEntries: ApprovalEntry[]) => (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</div>
          <p className="text-xs text-text-muted mt-1">{description}</p>
        </div>
        <span className="badge-amber">{sectionEntries.length}</span>
      </div>

      {sectionEntries.length === 0 ? (
        <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
          Nessun elemento in questa sezione.
        </div>
      ) : (
        <div className="space-y-2">
          {sectionEntries.map((entry) => (
            <ApprovalCard key={`${entry.kind}-${entry.id}`} entry={entry} onStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck size={18} className="text-violet-light" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Workflow staff</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Centro approvazioni</h1>
          <p className="text-sm text-text-muted mt-1">
            Gestisci velocemente stati di eventi, drop e documenti senza aprire ogni scheda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="card">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Bozze</div>
          <div className="text-3xl font-bold text-text-secondary mt-2">{draftEntries.length}</div>
        </div>
        <div className="card">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Da approvare</div>
          <div className="text-3xl font-bold text-accent-blue mt-2">{reviewEntries.length}</div>
        </div>
        <div className="card">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Approvati</div>
          <div className="text-3xl font-bold text-accent-green mt-2">{approvedEntries.length}</div>
        </div>
        <div className="card">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Rilasciati</div>
          <div className="text-3xl font-bold text-accent-amber mt-2">{releasedEntries.length}</div>
        </div>
      </div>

      {renderSection('Bozze', 'Elementi creati ma non ancora inviati in approvazione.', draftEntries)}
      {renderSection('Da approvare', 'Elementi pronti per revisione staff.', reviewEntries)}
      {renderSection('Approvati', 'Elementi approvati ma non ancora rilasciati.', approvedEntries)}
      {renderSection('Rilasciati', 'Elementi gia pubblicati o consegnati in server.', releasedEntries)}
    </div>
  );
}
