import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useEmployeeAdvanceHistory } from '../../hooks/useEmployeeAdvanceHistory';

interface EmployeeAdvanceHistoryModalProps {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
}

export default function EmployeeAdvanceHistoryModal({
  employeeId,
  employeeName,
  onClose,
}: EmployeeAdvanceHistoryModalProps) {
  const { advances, total, loading, error, reload } = useEmployeeAdvanceHistory(employeeId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-none sm:max-h-[90vh] overflow-hidden flex flex-col my-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{employeeName}</h2>
            <p className="text-sm text-gray-500">Histórico completo de adiantamentos</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-10">Carregando...</p>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-500">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span>Não foi possível carregar o histórico de adiantamentos.</span>
              <button
                onClick={() => reload()}
                className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Tentar novamente
              </button>
            </div>
          ) : advances.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">Nenhum adiantamento registrado</p>
          ) : (
            <>
              <ul className="space-y-2">
                {advances.map(advance => (
                  <li key={advance.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800">R$ {Number(advance.amount).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {advance.advance_date ? new Date(advance.advance_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                        {advance.note ? ` · ${advance.note}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-lg font-bold text-gray-800">R$ {total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
