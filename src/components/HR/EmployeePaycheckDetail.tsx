import { Clock3, Trash2 } from 'lucide-react';
import { SalaryAdvance } from '../../types';

interface EmployeePaycheckDetailProps {
  advances: SalaryAdvance[] | undefined;
  lateDelayMinutes: number;
  lateDaysCount: number;
  lateDeductionTotal: number | string;
  onDeleteAdvance: (advance: SalaryAdvance) => void;
}

export default function EmployeePaycheckDetail({
  advances,
  lateDelayMinutes,
  lateDaysCount,
  lateDeductionTotal,
  onDeleteAdvance,
}: EmployeePaycheckDetailProps) {
  const hasLateness = lateDaysCount > 0 || lateDelayMinutes > 0 || Number(lateDeductionTotal) > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Adiantamentos do período</div>
        {advances === undefined ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : advances.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum adiantamento neste período</p>
        ) : (
          <ul className="space-y-2">
            {advances.map(advance => (
              <li key={advance.id} className="flex items-center justify-between gap-3 bg-white rounded-lg border border-gray-100 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800">R$ {Number(advance.amount).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">
                    {advance.advance_date ? new Date(advance.advance_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    {advance.note ? ` · ${advance.note}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteAdvance(advance)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                  title="Excluir adiantamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Atrasos do período</div>
        {hasLateness ? (
          <div className="flex items-center gap-4 bg-white rounded-lg border border-gray-100 px-3 py-2">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <Clock3 className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800">{lateDaysCount} dia(s) · {lateDelayMinutes} min</div>
              <div className="text-xs text-red-600">Desconto: R$ {Number(lateDeductionTotal).toFixed(2)}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sem atrasos registrados neste período</p>
        )}
      </div>
    </div>
  );
}
