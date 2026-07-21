import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useWorkSchedule } from '../../hooks/useWorkSchedule';
import { getCellVisual } from './scheduleCellVisual';
import ScheduleGrid from './ScheduleGrid';
import ScheduleMonthCalendar from './ScheduleMonthCalendar';
import JustifyAbsenceModal from './JustifyAbsenceModal';
import { CalendarCellState, EmployeeScheduleRow } from '../../types';

interface ActiveAction {
  row: EmployeeScheduleRow;
  date: string;
  mode: 'justify' | 'remove';
}

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

const LEGEND_STATES: CalendarCellState[] = [
  'WORKED',
  'JUSTIFIED_ABSENCE',
  'UNJUSTIFIED_ABSENCE',
  'NOT_SCHEDULED',
  'NO_DATA',
];

export default function ScheduleTab() {
  const { rows, month, year, setMonth, setYear, loading, error, reload, justifyAbsence, removeJustification } = useWorkSchedule();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);

  const selectedRow = rows.find((row) => row.employee.id === selectedEmployeeId) ?? null;

  const handleCellClick = (row: EmployeeScheduleRow, date: string) => {
    const cell = row.days.find((d) => d.date === date);
    if (!cell) return;
    const mode = cell.state === 'JUSTIFIED_ABSENCE' ? 'remove' : 'justify';
    setActiveAction({ row, date, mode });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {rows.map((row) => (
                <option key={row.employee.id} value={row.employee.id}>
                  {row.employee.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
          {LEGEND_STATES.map((state) => {
            const visual = getCellVisual(state);
            const Icon = visual.icon;
            return (
              <div key={state} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${visual.className}`}>
                  {Icon && <Icon className="w-2.5 h-2.5" />}
                </span>
                {visual.label}
              </div>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">Carregando...</div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span>Não foi possível carregar a escala de trabalho.</span>
            <button
              onClick={() => reload()}
              className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        </div>
      ) : selectedRow ? (
        <ScheduleMonthCalendar row={selectedRow} onCellClick={(date) => handleCellClick(selectedRow, date)} />
      ) : (
        <ScheduleGrid rows={rows} onCellClick={handleCellClick} />
      )}

      {activeAction && (
        <JustifyAbsenceModal
          mode={activeAction.mode}
          employeeName={activeAction.row.employee.name}
          date={activeAction.date}
          onConfirm={(reason) =>
            activeAction.mode === 'justify'
              ? justifyAbsence(activeAction.row.employee.id, activeAction.date, reason)
              : removeJustification(activeAction.row.employee.id, activeAction.date)
          }
          onClose={() => setActiveAction(null)}
        />
      )}
    </div>
  );
}
