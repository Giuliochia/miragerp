import AuditLogPanel from '../components/audit/AuditLogPanel';

export default function AuditLog() {
  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Storico Staff</h1>
        <p className="text-sm text-text-muted mt-1">
          Controlla le modifiche salvate nel cloud e chi le ha effettuate.
        </p>
      </div>

      <AuditLogPanel />
    </div>
  );
}
