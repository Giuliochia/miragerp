import { useEffect, useState } from 'react';
import { Filter, History, RefreshCw, UserRound, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, MIRAGE_WORKSPACE_ID, supabase } from '../../lib/supabase';

interface AuditLog {
  id: number;
  summary: string;
  sections: string[];
  staff_email: string | null;
  staff_name: string | null;
  staff_avatar_url: string | null;
  created_at: string;
}

interface AuditLogPanelProps {
  compact?: boolean;
  limit?: number;
  title?: string;
}

function getStaffAvatarUrl(user: User | null) {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const value = metadata?.avatar_url ?? metadata?.picture ?? metadata?.avatar;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function withSessionAvatar(logs: AuditLog[], user: User | null) {
  const avatarUrl = getStaffAvatarUrl(user);
  if (!avatarUrl || !user?.email) return logs;

  return logs.map((log) => ({
    ...log,
    staff_avatar_url: log.staff_avatar_url || (log.staff_email === user.email ? avatarUrl : null),
  }));
}

export default function AuditLogPanel({ compact = false, limit = 50, title = 'Storico modifiche staff' }: AuditLogPanelProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [queryFilter, setQueryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadAuditLogs = async () => {
    if (!supabase) return;
    setAuditLoading(true);
    setAuditError('');
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user ?? null;

    const { data, error } = await supabase
      .from('mirage_audit_logs')
      .select('id, summary, sections, staff_email, staff_name, staff_avatar_url, created_at')
      .eq('workspace_id', MIRAGE_WORKSPACE_ID)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.message.includes('staff_avatar_url')) {
        const { data: legacyData, error: legacyError } = await supabase
          .from('mirage_audit_logs')
          .select('id, summary, sections, staff_email, staff_name, created_at')
          .eq('workspace_id', MIRAGE_WORKSPACE_ID)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (legacyError) {
          setAuditError('Storico non ancora configurato su Supabase. Esegui la query audit-log.sql e poi aggiorna.');
          setAuditLogs([]);
        } else {
          setAuditError('Avatar storico non ancora configurato su Supabase. Esegui la query di upgrade e poi aggiorna.');
          const logs = ((legacyData ?? []) as Omit<AuditLog, 'staff_avatar_url'>[]).map((log) => ({
            ...log,
            staff_avatar_url: null,
          }));
          setAuditLogs(withSessionAvatar(logs, currentUser));
        }
      } else {
        setAuditError('Storico non ancora configurato su Supabase. Esegui la query audit-log.sql e poi aggiorna.');
        setAuditLogs([]);
      }
    } else {
      setAuditLogs(withSessionAvatar((data ?? []) as AuditLog[], currentUser));
    }

    setAuditLoading(false);
  };

  useEffect(() => {
    loadAuditLogs();
    const timer = window.setInterval(loadAuditLogs, 6000);
    return () => window.clearInterval(timer);
  }, [limit]);

  const staffOptions = [...new Set(auditLogs.map((log) => log.staff_name || log.staff_email || 'Staff'))].sort();
  const sectionOptions = [...new Set(auditLogs.flatMap((log) => log.sections ?? []))].sort();
  const filteredLogs = auditLogs.filter((log) => {
    const staff = log.staff_name || log.staff_email || 'Staff';
    const summary = log.summary.toLowerCase();
    const query = queryFilter.trim().toLowerCase();
    const created = new Date(log.created_at);

    if (staffFilter !== 'all' && staff !== staffFilter) return false;
    if (sectionFilter !== 'all' && !log.sections?.includes(sectionFilter)) return false;
    if (query && !`${staff} ${log.summary} ${(log.sections ?? []).join(' ')}`.toLowerCase().includes(query)) return false;
    if (actionFilter === 'created' && !summary.includes('creat')) return false;
    if (actionFilter === 'updated' && !summary.includes('modificat') && !summary.includes('aggiornat')) return false;
    if (actionFilter === 'deleted' && !summary.includes('eliminat')) return false;
    if (fromDate && created < new Date(`${fromDate}T00:00:00`)) return false;
    if (toDate && created > new Date(`${toDate}T23:59:59`)) return false;
    return true;
  });

  const hasFilters = [staffFilter, sectionFilter, actionFilter].some((value) => value !== 'all') || queryFilter || fromDate || toDate;

  const resetFilters = () => {
    setStaffFilter('all');
    setSectionFilter('all');
    setActionFilter('all');
    setQueryFilter('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-primary/15 text-violet-light">
            <History size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</div>
            {!compact && (
              <p className="text-xs text-text-muted mt-1">
                Tiene traccia dei salvataggi cloud: chi ha modificato, quando e quali aree sono state toccate.
              </p>
            )}
          </div>
        </div>
        <button onClick={loadAuditLogs} className="btn-secondary text-xs py-2 px-3" disabled={!isSupabaseConfigured || auditLoading}>
          <RefreshCw size={14} className={auditLoading ? 'animate-spin' : ''} />
          Aggiorna
        </button>
      </div>

      {!compact && auditLogs.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card2/60 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              <Filter size={14} className="text-violet-light" />
              Filtri storico
            </div>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="btn-ghost px-2 py-1 text-xs">
                <X size={13} />
                Pulisci
              </button>
            )}
          </div>
          <div className="grid gap-3 xl:grid-cols-[1.1fr,0.9fr,0.9fr,0.9fr,0.7fr,0.7fr]">
            <input
              className="input"
              value={queryFilter}
              onChange={(e) => setQueryFilter(e.target.value)}
              placeholder="Cerca modifica, item, evento..."
            />
            <select className="select" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
              <option value="all">Tutto lo staff</option>
              {staffOptions.map((staff) => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
            <select className="select" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
              <option value="all">Tutte le sezioni</option>
              {sectionOptions.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
            <select className="select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="all">Tutte le azioni</option>
              <option value="created">Creazioni</option>
              <option value="updated">Modifiche</option>
              <option value="deleted">Eliminazioni</option>
            </select>
            <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="mt-2 text-[11px] text-text-muted">
            {filteredLogs.length} risultati su {auditLogs.length} modifiche caricate.
          </div>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
          Cloud non configurato: lo storico staff funziona quando Supabase e' attivo.
        </div>
      )}

      {auditError && (
        <div className="bg-accent-amber/10 border border-accent-amber/30 rounded-lg p-4 text-sm text-accent-amber">
          {auditError}
        </div>
      )}

      {!auditError && auditLogs.length === 0 && isSupabaseConfigured && !auditLoading && (
        <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
          Nessuna modifica registrata. Le prossime modifiche salvate nel cloud compariranno qui.
        </div>
      )}

      {auditLogs.length > 0 && filteredLogs.length === 0 && !compact && (
        <div className="bg-bg-card2 border border-border rounded-lg p-4 text-sm text-text-muted">
          Nessuna modifica corrisponde ai filtri selezionati.
        </div>
      )}

      {filteredLogs.length > 0 && (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-bg-card2 border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    {log.staff_avatar_url ? (
                      <img
                        src={log.staff_avatar_url}
                        alt={log.staff_name || log.staff_email || 'Staff'}
                        className="h-5 w-5 flex-shrink-0 rounded-full border border-violet-primary/35 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserRound size={16} className="text-violet-light flex-shrink-0" />
                    )}
                    <span className="truncate">{log.staff_name || log.staff_email || 'Staff'}</span>
                  </div>
                  <div className="mt-1 text-sm text-text-secondary">{log.summary}</div>
                  {!compact && log.sections?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {log.sections.map((section) => (
                        <span key={section} className="badge-amber text-[10px]">{section}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right text-[11px] text-text-muted flex-shrink-0">
                  {new Date(log.created_at).toLocaleString('it-IT')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
