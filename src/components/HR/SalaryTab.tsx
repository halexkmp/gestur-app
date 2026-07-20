import { useState } from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { SalaryAdvance } from '../../types';
import { useEmployeePaychecks } from '../../hooks/useEmployeePaychecks';
import EmployeePaycheckRow from './EmployeePaycheckRow';
import NewAdvanceForm from './NewAdvanceForm';

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

export default function SalaryTab() {
  const {
    paychecks,
    month,
    year,
    setMonth,
    setYear,
    loading,
    error,
    fetchPaychecks,
    getAdvancesForEmployee,
    loadAdvancesForEmployee,
    createAdvance,
    deleteAdvance,
  } = useEmployeePaychecks();

  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [showNewAdvanceForm, setShowNewAdvanceForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleRow = (employeeId: string) => {
    const next = expandedEmployeeId === employeeId ? null : employeeId;
    setExpandedEmployeeId(next);
    if (next && getAdvancesForEmployee(employeeId) === undefined) {
      loadAdvancesForEmployee(employeeId);
    }
  };

  const handleCreateAdvance = async (payload: Parameters<typeof createAdvance>[0]) => {
    setSubmitting(true);
    try {
      await createAdvance(payload);
      setShowNewAdvanceForm(false);
    } catch (e) {
      console.error('Failed to create salary advance', e);
      alert('Erro ao criar adiantamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdvance = async (advance: SalaryAdvance) => {
    if (!confirm(`Deseja excluir este adiantamento no valor de R$ ${Number(advance.amount).toFixed(2)}?`)) return;
    try {
      await deleteAdvance(advance.id, advance.employee_id);
    } catch (e) {
      console.error('Failed to delete salary advance', e);
      alert('Erro ao excluir adiantamento');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        </div>
        <button
          onClick={() => setShowNewAdvanceForm(v => !v)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Adiantamento
        </button>
      </div>

      {showNewAdvanceForm && (
        <NewAdvanceForm
          employeeOptions={paychecks.map(p => ({ id: p.employee_id, name: p.employee_name }))}
          submitting={submitting}
          onSubmit={handleCreateAdvance}
          onCancel={() => setShowNewAdvanceForm(false)}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salário Bruto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. Adiantamentos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. Atraso</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salário Líquido</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Carregando...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <span>Não foi possível carregar os pagamentos.</span>
                      <button
                        onClick={() => fetchPaychecks()}
                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                      >
                        <RefreshCw className="w-4 h-4" /> Tentar novamente
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paychecks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Nenhum funcionário ativo cadastrado</td>
                </tr>
              ) : (
                paychecks.map(paycheck => (
                  <EmployeePaycheckRow
                    key={paycheck.employee_id}
                    paycheck={paycheck}
                    expanded={expandedEmployeeId === paycheck.employee_id}
                    onToggle={() => toggleRow(paycheck.employee_id)}
                    advances={getAdvancesForEmployee(paycheck.employee_id)}
                    onDeleteAdvance={handleDeleteAdvance}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
