import { EmployeeScheduleRow } from '../../types';
import { getCellVisual } from './scheduleCellVisual';

interface ScheduleGridProps {
  rows: EmployeeScheduleRow[];
  onCellClick?: (row: EmployeeScheduleRow, date: string) => void;
}

export default function ScheduleGrid({ rows, onCellClick }: ScheduleGridProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
              Funcionário
            </th>
            {rows[0]?.days.map((cell) => (
              <th
                key={cell.date}
                className="border-b border-gray-200 px-1 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap"
              >
                {Number(cell.date.split('-')[2])}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employee.id} className="border-b border-gray-100">
              <td className="sticky left-0 z-10 bg-white border-r border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 whitespace-nowrap">
                {row.employee.name}
              </td>
              {row.days.map((cell) => {
                const visual = getCellVisual(cell.state);
                const Icon = visual.icon;
                const actionable = cell.state === 'UNJUSTIFIED_ABSENCE' || cell.state === 'JUSTIFIED_ABSENCE';
                return (
                  <td key={cell.date} className="p-0.5 text-center">
                    <button
                      type="button"
                      disabled={!actionable}
                      onClick={actionable && onCellClick ? () => onCellClick(row, cell.date) : undefined}
                      title={cell.detail ?? visual.label}
                      className={`w-7 h-7 flex items-center justify-center rounded border text-xs ${visual.className} ${
                        actionable ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-8 text-center text-gray-500">Nenhum funcionário cadastrado.</p>
      )}
    </div>
  );
}
