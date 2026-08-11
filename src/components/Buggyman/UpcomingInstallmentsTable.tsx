import { UpcomingInstallment } from '../../types';
import { formatCurrency, formatDateBR } from '../../lib/formatters';
import InstallmentStatusCell from './InstallmentStatusCell';

interface UpcomingInstallmentsTableProps {
  installments: UpcomingInstallment[];
  onSelectPartner: (row: { partner_id: string }) => void;
}

const HEADERS: { label: string; numeric: boolean }[] = [
  { label: 'Vencimento', numeric: false },
  { label: 'Bugueiro', numeric: false },
  { label: 'Parcela', numeric: false },
  { label: 'Valor', numeric: true },
  { label: 'Pago', numeric: true },
  { label: 'Em aberto', numeric: true },
  { label: 'Situação', numeric: false },
];

/**
 * Rows are rendered exactly as received: the server orders by due date, then
 * loan, then installment number, and that order is the contract. There are no
 * sortable headers and no search box — this tab's only filters are the date
 * range and the overdue switch.
 */
export default function UpcomingInstallmentsTable({
  installments,
  onSelectPartner,
}: UpcomingInstallmentsTableProps) {
  return (
    <div className="hidden sm:block overflow-x-auto max-h-[70vh]">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {HEADERS.map(({ label, numeric }) => (
              <th
                key={label}
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                  numeric ? 'text-right' : 'text-left'
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {installments.map((row) => (
            <tr
              key={row.installment_id}
              className={row.is_overdue ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50'}
            >
              <td
                className={`px-4 py-3 whitespace-nowrap ${
                  row.is_overdue ? 'text-red-700 font-medium' : 'text-gray-900'
                }`}
              >
                {formatDateBR(row.due_date)}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onSelectPartner(row)}
                  className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                >
                  {row.partner_name}
                </button>
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {row.installment_number}ª
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                {formatCurrency(row.amount)}
              </td>
              <td className="px-4 py-3 text-right text-green-700 whitespace-nowrap">
                {formatCurrency(row.paid_amount)}
              </td>
              <td className="px-4 py-3 text-right text-amber-700 font-medium whitespace-nowrap">
                {formatCurrency(row.remaining_amount)}
              </td>
              <td className="px-4 py-3">
                <InstallmentStatusCell
                  status={row.status}
                  isOverdue={row.is_overdue}
                  dueDate={row.due_date}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
