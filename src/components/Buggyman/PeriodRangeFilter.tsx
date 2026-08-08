import { AlertCircle } from 'lucide-react';
import { PeriodPresetId } from '../../types';

const PRESETS: { id: PeriodPresetId; label: string }[] = [
  { id: 'current-month', label: 'Mês atual' },
  { id: 'previous-month', label: 'Mês anterior' },
  { id: 'current-quarter', label: 'Trimestre atual' },
  { id: 'current-year', label: 'Ano atual' },
  { id: 'next-30-days', label: 'Próximos 30 dias' },
];

interface PeriodRangeFilterProps {
  startDate: string;
  endDate: string;
  preset: PeriodPresetId;
  invalidRange: boolean;
  onPresetSelect: (preset: PeriodPresetId) => void;
  onDateChange: (startDate: string, endDate: string) => void;
}

export default function PeriodRangeFilter({
  startDate,
  endDate,
  preset,
  invalidRange,
  onPresetSelect,
  onDateChange,
}: PeriodRangeFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onPresetSelect(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              preset === id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
        {preset === 'custom' && (
          <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Personalizado
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data inicial
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data final
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
              invalidRange
                ? 'border-red-400 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
        </div>
      </div>

      {invalidRange && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          A data final não pode ser anterior à inicial.
        </p>
      )}
    </div>
  );
}
