import { UpcomingInstallment } from '../../types';
import { formatCurrency, formatDateBR } from '../../lib/formatters';
import InstallmentStatusCell from './InstallmentStatusCell';

interface UpcomingInstallmentsCardsProps {
  installments: UpcomingInstallment[];
  onSelectPartner: (row: { partner_id: string }) => void;
}

/** Stacked card layout used below the `sm` breakpoint, where a table would
 *  force the page to scroll sideways. */
export default function UpcomingInstallmentsCards({
  installments,
  onSelectPartner,
}: UpcomingInstallmentsCardsProps) {
  return (
    <ul className="sm:hidden divide-y divide-gray-200">
      {installments.map((row) => (
        <li
          key={row.installment_id}
          className={`p-4 space-y-2 ${row.is_overdue ? 'bg-red-50/40' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => onSelectPartner(row)}
              className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
            >
              {row.partner_name}
            </button>
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              {formatCurrency(row.amount)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className={row.is_overdue ? 'text-red-700 font-medium' : 'text-gray-600'}>
              {formatDateBR(row.due_date)} · {row.installment_number}ª parcela
            </span>
            <InstallmentStatusCell
              status={row.status}
              isOverdue={row.is_overdue}
              dueDate={row.due_date}
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-green-700">
              Pago {formatCurrency(row.paid_amount)}
            </span>
            <span className="text-amber-700">
              Em aberto {formatCurrency(row.remaining_amount)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
