import { CalendarRange, Loader2, RefreshCw } from 'lucide-react';
import { formatDateBR } from '../../lib/formatters';

interface UpcomingFiltersBarProps {
  startDate: string;
  endDate: string;
  includeOverdue: boolean;
  overdueCount: number;
  refreshing: boolean;
  resolving: boolean;
  disabled: boolean;
  onIncludeOverdueChange: (include: boolean) => void;
  onRefresh: () => void;
}

export default function UpcomingFiltersBar({
  startDate,
  endDate,
  includeOverdue,
  overdueCount,
  refreshing,
  resolving,
  disabled,
  onIncludeOverdueChange,
  onRefresh,
}: UpcomingFiltersBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CalendarRange className="w-4 h-4 text-gray-400" />
        <span>
          Vencimentos de <strong>{formatDateBR(startDate)}</strong> a{' '}
          <strong>{formatDateBR(endDate)}</strong>
        </span>
        {resolving && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={includeOverdue}
          onChange={(e) => onIncludeOverdueChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          Incluir parcelas vencidas de períodos anteriores
        </span>
        {overdueCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
            {overdueCount} vencida{overdueCount === 1 ? '' : 's'}
          </span>
        )}
      </label>

      <button
        onClick={onRefresh}
        disabled={disabled}
        title="Atualizar"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        Atualizar
      </button>
    </div>
  );
}
