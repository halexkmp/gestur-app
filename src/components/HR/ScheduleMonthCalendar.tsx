import { CalendarDayCell, EmployeeScheduleRow } from '../../types';
import { getCellVisual } from './scheduleCellVisual';

interface ScheduleMonthCalendarProps {
  row: EmployeeScheduleRow;
  onCellClick?: (date: string) => void;
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function ScheduleMonthCalendar({ row, onCellClick }: ScheduleMonthCalendarProps) {
  const days = row.days;

  if (days.length === 0) {
    return <p className="text-gray-500 p-8 text-center">Sem dados para este período.</p>;
  }

  const [year, month] = days[0].date.split('-').map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  // getDay(): 0=Sunday..6=Saturday; shift so 0=Monday..6=Sunday
  const firstWeekdayIndex = (firstOfMonth.getDay() + 6) % 7;

  const cells: (CalendarDayCell | null)[] = [...Array(firstWeekdayIndex).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalendarDayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{row.employee.name}</h3>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-gray-500 py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1">
            {week.map((cell, dayIdx) => {
              if (!cell) return <div key={dayIdx} />;

              const visual = getCellVisual(cell.state);
              const Icon = visual.icon;
              const actionable = cell.state === 'UNJUSTIFIED_ABSENCE' || cell.state === 'JUSTIFIED_ABSENCE';

              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={!actionable}
                  onClick={actionable && onCellClick ? () => onCellClick(cell.date) : undefined}
                  title={cell.detail ?? visual.label}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded border text-xs py-2 ${visual.className} ${
                    actionable ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                  }`}
                >
                  <span>{Number(cell.date.split('-')[2])}</span>
                  {Icon && <Icon className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
