import type { ApprovalStatus } from '../../../shared/types';

export const approvalStatuses: Array<{ value: ApprovalStatus; label: string; className: string }> = [
  { value: 'draft', label: 'Bozza', className: 'badge-gray' },
  { value: 'review', label: 'Da approvare', className: 'badge-blue' },
  { value: 'approved', label: 'Approvato', className: 'badge-green' },
  { value: 'released', label: 'Rilasciato', className: 'badge-amber' },
  { value: 'archived', label: 'Archiviato', className: 'badge-gray' },
];

export function normalizeApprovalStatus(value: unknown): ApprovalStatus {
  if (value === 'review' || value === 'approved' || value === 'released' || value === 'archived') return value;
  return 'draft';
}

export function getApprovalStatus(value: unknown) {
  const normalized = normalizeApprovalStatus(value);
  return approvalStatuses.find((status) => status.value === normalized) ?? approvalStatuses[0];
}
