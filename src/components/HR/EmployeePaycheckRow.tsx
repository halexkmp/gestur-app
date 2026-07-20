import { ChevronDown, ChevronUp } from 'lucide-react';
import { EmployeePaycheck, SalaryAdvance } from '../../types';
import EmployeePaycheckDetail from './EmployeePaycheckDetail';

interface EmployeePaycheckRowProps {
  paycheck: EmployeePaycheck;
  expanded: boolean;
  onToggle: () => void;
  advances: SalaryAdvance[] | undefined;
  onDeleteAdvance: (advance: SalaryAdvance) => void;
}

export default function EmployeePaycheckRow({
  paycheck,
  expanded,
  onToggle,
  advances,
  onDeleteAdvance,
}: EmployeePaycheckRowProps) {
  return (
    <>
      <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{paycheck.employee_name}</td>
        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">R$ {Number(paycheck.gross_salary).toFixed(2)}</td>
        <td className="px-4 py-3 text-sm text-orange-700 whitespace-nowrap">R$ {Number(paycheck.advances_total).toFixed(2)}</td>
        <td className="px-4 py-3 text-sm text-red-700 whitespace-nowrap">R$ {Number(paycheck.late_deduction_total).toFixed(2)}</td>
        <td className="px-4 py-3 text-sm font-bold text-green-700 whitespace-nowrap">R$ {Number(paycheck.net_salary).toFixed(2)}</td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            title={expanded ? 'Recolher detalhes' : 'Ver detalhes'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 pb-4">
            <EmployeePaycheckDetail
              advances={advances}
              lateDelayMinutes={paycheck.late_delay_minutes}
              lateDaysCount={paycheck.late_days_count}
              lateDeductionTotal={paycheck.late_deduction_total}
              onDeleteAdvance={onDeleteAdvance}
            />
          </td>
        </tr>
      )}
    </>
  );
}
