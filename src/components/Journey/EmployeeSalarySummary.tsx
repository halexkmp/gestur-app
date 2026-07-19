import { AlertCircle, Banknote, CalendarClock, Clock3, DollarSign, TrendingDown } from 'lucide-react';
import { useEmployeeSalarySummary } from '../../hooks/useEmployeeSalarySummary';

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

export const EmployeeSalarySummary: React.FC = () => {
  const { summary, advances, month, year, setMonth, setYear, loading, unavailable } = useEmployeeSalarySummary();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Banknote className="text-blue-600" />
          Meu Salário
        </h3>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {monthOptions.map((m) => {
              const monthName = new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' });
              return (
                <option key={m} value={m}>
                  {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                </option>
              );
            })}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Carregando...</p>}

      {!loading && unavailable && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 flex items-center gap-2 text-sm">
          <AlertCircle size={20} />
          <span>Informação indisponível no momento.</span>
        </div>
      )}

      {!loading && !unavailable && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-500 uppercase">Salário Bruto</div>
              <div className="text-lg font-bold text-gray-800">R$ {Number(summary.gross_salary).toFixed(2)}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-4">
            <div className="p-2 bg-orange-100 rounded-lg shrink-0">
              <Banknote className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-orange-500 uppercase">Adiantamentos</div>
              <div className="text-lg font-bold text-orange-700">R$ {Number(summary.advances_total).toFixed(2)}</div>
              <div className="text-xs text-orange-600">{advances.length} lançamento(s)</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-4">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <Clock3 className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-red-500 uppercase">Atraso</div>
              <div className="text-lg font-bold text-red-700">{summary.late_delay_minutes} min</div>
              <div className="text-xs text-red-600">{summary.late_days_count} dia(s)</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-4">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-red-500 uppercase">Desconto por Atraso</div>
              <div className="text-lg font-bold text-red-700">R$ {Number(summary.late_deduction_total).toFixed(2)}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="p-2 bg-green-100 rounded-lg shrink-0">
              <CalendarClock className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-green-500 uppercase">Salário Líquido</div>
              <div className="text-xl font-bold text-green-700">R$ {Number(summary.net_salary).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
