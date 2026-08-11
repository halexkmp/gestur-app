import { ListChecks, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

interface UpcomingSummaryBarProps {
  rowCount: number;
  totalOutstanding: number;
}

/**
 * Row count and outstanding total for the rows currently listed.
 *
 * The total is deliberately scoped to "as parcelas listadas" — it is not the
 * same figure as the summary tab's outstanding amount and must not be presented
 * as reconciling with it (see specs/api/loans.md on the two settle paths).
 */
export default function UpcomingSummaryBar({
  rowCount,
  totalOutstanding,
}: UpcomingSummaryBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center gap-x-8 gap-y-3">
      <div className="flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-600">
          <strong className="text-gray-900">{rowCount}</strong>{' '}
          {rowCount === 1 ? 'parcela listada' : 'parcelas listadas'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-600">
          Total em aberto nas parcelas listadas{' '}
          <strong className="text-amber-700 whitespace-nowrap">
            {formatCurrency(totalOutstanding)}
          </strong>
        </span>
      </div>
    </div>
  );
}
