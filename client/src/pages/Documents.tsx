import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import EmptyState from '../components/ui/EmptyState';
import { approvalStatuses, getApprovalStatus, normalizeApprovalStatus } from '../lib/status';
import { MIRAGE_PROJECT_ID } from '../lib/project';
import type { ApprovalStatus, Document, DocumentType } from '../../../shared/types';

const defaultDocumentTypes = [
  'Lettera',
  'Contratto',
  'Rapporto polizia',
  'Referto EMS',
  'Diario',
  'Manifesto',
  'Prova',
  'Nota sporca',
  'Messaggio radio',
  'Mandato',
  'Registro contabile',
  'Documento staff',
  'Altro',
];

const legacyDocumentTypes: Record<string, string> = {
  letter: 'Lettera',
  contract: 'Contratto',
  police_report: 'Rapporto polizia',
  ems_report: 'Referto EMS',
  military_order: 'Ordine militare',
  diary: 'Diario',
  manifesto: 'Manifesto',
  evidence: 'Prova',
  dirty_note: 'Nota sporca',
  radio_message: 'Messaggio radio',
  warrant: 'Mandato',
  bounty: 'Taglia',
  ledger: 'Registro contabile',
  other: 'Altro',
};

function displayDocumentType(type: string) {
  return legacyDocumentTypes[type] ?? type;
}

function toDocumentType(value: string): DocumentType {
  return value.trim() as DocumentType;
}

function DocModal({ doc, onClose }: { doc?: Document; onClose: () => void }) {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const addDocument = useStore((s) => s.addDocument);
  const updateDocument = useStore((s) => s.updateDocument);
  const documents = useStore((s) => s.getProjectDocuments(currentProjectId ?? ''));
  const documentTypeSuggestions = Array.from(new Set([...defaultDocumentTypes, ...documents.map((entry) => displayDocumentType(entry.type))]));

  const [form, setForm] = useState({
    title: doc?.title ?? '',
    type: doc?.type ? displayDocumentType(doc.type) : 'Lettera',
    author: doc?.author ?? '',
    foundLocation: doc?.foundLocation ?? '',
    tone: doc?.tone ?? '',
    status: normalizeApprovalStatus(doc?.status),
    content: doc?.content ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      ...form,
      type: toDocumentType(form.type || 'Altro'),
      status: form.status as ApprovalStatus,
      projectId: currentProjectId ?? MIRAGE_PROJECT_ID,
      linkedFactionId: doc?.linkedFactionId,
      linkedNpcId: doc?.linkedNpcId,
      linkedMissionId: doc?.linkedMissionId,
      linkedItemId: doc?.linkedItemId,
    };
    if (doc) updateDocument(doc.id, base);
    else addDocument(base);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-8">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-3xl mx-auto p-6 z-10 animate-fade-in">
        <h2 className="text-lg font-bold text-text-primary mb-5">{doc ? 'Modifica documento drop' : 'Nuovo documento drop'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Titolo *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="es. Registro Contabile Sporco" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo custom</label>
              <input className="input" list="document-type-suggestions" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="es. Documento staff" />
              <datalist id="document-type-suggestions">
                {documentTypeSuggestions.map((type) => <option key={type} value={type} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Autore</label>
              <input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Chi ha scritto..." />
            </div>
          </div>

          <div>
            <label className="label">Luogo di Ritrovamento</label>
            <input className="input" value={form.foundLocation} onChange={(e) => setForm({ ...form, foundLocation: e.target.value })} placeholder="Dove si trova il documento..." />
          </div>

          <div>
            <label className="label">Tono</label>
            <input className="input" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} placeholder="es. Freddo, burocratico, disperato..." />
          </div>

          <div>
            <label className="label">Stato approvazione</label>
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApprovalStatus })}>
              {approvalStatuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Contenuto</label>
            <textarea className="textarea" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Il testo completo del documento in-game..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" className="btn-primary flex-1">{doc ? 'Salva' : 'Crea documento'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Documents() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const documents = useStore((s) => s.getProjectDocuments(currentProjectId ?? ''));
  const deleteDocument = useStore((s) => s.deleteDocument);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState<{ open: boolean; doc?: Document }>({ open: false });
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const filterOptions = [
    { value: 'all', label: 'Tutti' },
    ...Array.from(new Set(documents.map((d) => displayDocumentType(d.type)))).map((type) => ({ value: type, label: type })),
  ];

  const filtered = documents.filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.author.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || displayDocumentType(d.type) === filter;
    const matchStatus = statusFilter === 'all' || normalizeApprovalStatus(d.status) === statusFilter;
    return matchSearch && matchFilter && matchStatus;
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-text-secondary" />
          <h1 className="text-xl font-bold text-text-primary">Documenti Drop</h1>
          <span className="badge-gray">{documents.length}</span>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary text-sm py-2 px-4">
          <Plus size={15} /> Nuovo
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Cerca documento drop..." />
      <FilterBar options={filterOptions} active={filter} onChange={setFilter} />
      <FilterBar
        options={[{ value: 'all', label: 'Tutti gli stati' }, ...approvalStatuses.map((status) => ({ value: status.value, label: status.label }))]}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="Nessun documento drop"
          description="Archivia documenti, prove, note e file collegati ai drop."
          action={<button onClick={() => setModal({ open: true })} className="btn-primary">Crea documento</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="card-hover cursor-pointer group"
              onClick={() => setViewDoc(d)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-text-primary truncate">{d.title}</span>
                    <span className="badge-gray text-[10px]">{displayDocumentType(d.type)}</span>
                    <span className={`${getApprovalStatus(d.status).className} text-[10px]`}>{getApprovalStatus(d.status).label}</span>
                  </div>
                  <div className="text-xs text-text-muted mb-2">Autore: {d.author} - {d.foundLocation}</div>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed font-mono bg-bg-card2 rounded-lg p-3 border border-border/50">
                    {d.content}
                  </p>
                  {d.tone && (
                    <div className="text-[10px] text-text-muted mt-2">Tono: <span className="text-text-secondary italic">{d.tone}</span></div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, doc: d }); }}
                    className="p-1.5 text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors">
                    <FileText size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Eliminare "${d.title}"?`)) deleteDocument(d.id); }}
                    className="p-1.5 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors">
                    <Plus size={13} className="rotate-45" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document viewer */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-8">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewDoc(null)} />
          <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-3xl mx-auto p-6 z-10 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-text-primary">{viewDoc.title}</h2>
                  <span className="badge-gray text-[10px]">{displayDocumentType(viewDoc.type)}</span>
                  <span className={`${getApprovalStatus(viewDoc.status).className} text-[10px]`}>{getApprovalStatus(viewDoc.status).label}</span>
                </div>
                <div className="text-xs text-text-muted">Autore: {viewDoc.author} - Trovato: {viewDoc.foundLocation}</div>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-text-muted hover:text-text-primary p-1">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <div className="bg-bg-card2 rounded-xl border border-border p-5">
              <pre className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed font-mono">{viewDoc.content}</pre>
            </div>
            {viewDoc.tone && (
              <div className="mt-3 text-xs text-text-muted italic">Tono: {viewDoc.tone}</div>
            )}
          </div>
        </div>
      )}

      {modal.open && <DocModal doc={modal.doc} onClose={() => setModal({ open: false })} />}
    </div>
  );
}


