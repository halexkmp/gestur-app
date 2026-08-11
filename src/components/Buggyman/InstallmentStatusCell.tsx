import { AlertTriangle } from 'lucide-react';
import { UpcomingInstallmentStatus } from '../../types';
import { daysOverdue } from '../../lib/formatters';

interface InstallmentStatusCellProps {
  status: UpcomingInstallmentStatus;
  isOverdue: boolean;
  dueDate: string;
}

/**
 * Overdue marker and payment status for one owed installment, shared by the
 * table and the card list so both read identically.
 *
 * Overdue state comes from the server's `is_overdue` flag, never from comparing
 * the due date to the selected range — the server evaluates it against its own
 * current date, so a window starting in the past legitimately contains rows
 * that are already overdue. The day count is derived only once that flag says
 * the row is overdue at all.
 */
export default function InstallmentStatusCell({
  status,
  isOverdue,
  dueDate,
}: InstallmentStatusCellProps) {
  const overdueDays = isOverdue ? daysOverdue(dueDate) : 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isOverdue && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {overdueDays === 1 ? 'Vencida há 1 dia' : `Vencida há ${overdueDays} dias`}
        </span>
      )}

      {status === 'PARTIALLY_PAID' ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          Parcial
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
          Pendente
        </span>
      )}
    </div>
  );
}
