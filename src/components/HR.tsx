import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, FileText } from 'lucide-react';
import { Employee, SalaryAdvance, SalarySummaryResponse } from '../types';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';

export default function HR() {
  const { user } = useAuth();
  const canAccess = useMemo(() => user?.roles.some(r => r.name === 'ADMIN' || r.name === 'HUMAN_RESOURCES') ?? false, [user]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Employee form state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    pix_key: '' as string | null,
    salary: 0,
    active: true,
  });

  // Salary advances state
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [advLoading, setAdvLoading] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: '',
    amount: '',
    note: '' as string | null,
  });

  // Report filters
  const now = new Date();
  const [reportEmployeeId, setReportEmployeeId] = useState<string>('');
  const [reportMonth, setReportMonth] = useState<number>(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(now.getFullYear());
  const [summary, setSummary] = useState<SalarySummaryResponse | null>(null);

  useEffect(() => {
    loadEmployees();
    loadAdvances();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (e) {
      console.error('Failed to load employees', e);
    }
  };

  const loadAdvances = async () => {
    setAdvLoading(true);
    try {
      const data = await employeeService.listSalaryAdvances({ employee_id: reportEmployeeId || undefined, month: reportMonth, year: reportYear });
      setAdvances(data);
    } catch (e) {
      console.error('Failed to load advances', e);
    } finally {
      setAdvLoading(false);
    }
  };

  const submitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, {
          name: employeeForm.name,
          pix_key: employeeForm.pix_key || null,
          salary: Number(employeeForm.salary),
          active: employeeForm.active,
        });
      } else {
        await employeeService.create({
          name: employeeForm.name,
          pix_key: employeeForm.pix_key || null,
          salary: Number(employeeForm.salary),
          active: employeeForm.active,
        });
      }
      await loadEmployees();
      resetEmployeeForm();
    } catch (e) {
      console.error('Failed to save employee', e);
      alert('Erro ao salvar funcionário');
    } finally {
      setLoading(false);
    }
  };

  const startEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      name: emp.name,
      pix_key: emp.pix_key ?? '',
      salary: emp.salary,
      active: emp.active,
    });
    setShowEmployeeForm(true);
  };

  const deleteEmployee = async (emp: Employee) => {
    if (!confirm(`Deseja excluir o funcionário ${emp.name}?`)) return;
    try {
      await employeeService.delete(emp.id);
      await loadEmployees();
    } catch (e) {
      console.error('Failed to delete employee', e);
      alert('Erro ao excluir funcionário');
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({ name: '', pix_key: '', salary: 0, active: true });
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };

  const submitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvLoading(true);
    try {
      await employeeService.createSalaryAdvance({
        employee_id: advanceForm.employee_id,
        amount: Number(advanceForm.amount),
        note: advanceForm.note || undefined,
      });
      setAdvanceForm({ employee_id: '', amount: '', note: '' });
      await loadAdvances();
    } catch (e) {
      console.error('Failed to create salary advance', e);
      alert('Erro ao criar adiantamento');
    } finally {
      setAdvLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!reportEmployeeId) {
      setSummary(null);
      return;
    }
    try {
      const data = await employeeService.getSalarySummary(reportEmployeeId, { month: reportMonth, year: reportYear });
      setSummary(data);
    } catch (e) {
      console.error('Failed to load summary', e);
      setSummary(null);
    }
  };

  useEffect(() => {
    // When filters change, reload advances and summary
    loadAdvances();
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportEmployeeId, reportMonth, reportYear]);

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Acesso Negado</h2>
          <p className="text-gray-600">Apenas Recursos Humanos e Administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Recursos Humanos</h1>
          <p className="text-gray-600 mt-1">Gerencie funcionários e adiantamentos salariais</p>
        </div>
        <button
          onClick={() => setShowEmployeeForm(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Funcionário
        </button>
      </div>

      {/* Employees table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIX</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map(emp => (
                <tr key={emp.id} className={!emp.active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.pix_key || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">R$ {Number(emp.salary).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {emp.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEditEmployee(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteEmployee(emp)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary advances */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
            <select
              value={advanceForm.employee_id}
              onChange={(e) => setAdvanceForm({ ...advanceForm, employee_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {employees.filter(e => e.active).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={advanceForm.amount}
              onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
            <input
              type="text"
              value={advanceForm.note || ''}
              onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <button
              onClick={submitAdvance}
              disabled={!advanceForm.employee_id || !advanceForm.amount || advLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {advLoading ? 'Salvando...' : 'Adicionar Adiantamento'}
            </button>
          </div>
        </div>

        {/* Report filters */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Relatório: Funcionário</label>
            <select
              value={reportEmployeeId}
              onChange={(e) => setReportEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <input
              type="number"
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <button onClick={() => { loadAdvances(); loadSummary(); }} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Minimalist report */}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Relatório de Adiantamentos</h3>
            <span className="text-sm text-gray-500">{reportMonth.toString().padStart(2, '0')}/{reportYear}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {advLoading ? (
                  <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">Carregando...</td></tr>
                ) : advances.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">Nenhum registro</td></tr>
                ) : (
                  advances.map(a => {
                    const emp = employees.find(e => e.id === a.employee_id);
                    return (
                      <tr key={a.id}>
                        <td className="px-4 py-2 text-sm text-gray-700">{new Date(a.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{emp?.name || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">R$ {Number(a.amount).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{a.note || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {!reportEmployeeId && advances.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-700" colSpan={2}>Total</td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">R$ {advances.reduce((s, a) => s + Number(a.amount), 0).toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* If a specific employee is selected, show salary summary */}
          {reportEmployeeId && summary && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 border">
                <div className="text-xs text-gray-500">Salário Bruto</div>
                <div className="text-lg font-semibold text-gray-800">R$ {Number(summary.gross_salary).toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <div className="text-xs text-gray-500">Adiantamentos</div>
                <div className="text-lg font-semibold text-gray-800">R$ {Number(summary.advances_total).toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <div className="text-xs text-gray-500">Salário Líquido</div>
                <div className="text-lg font-semibold text-gray-800">R$ {Number(summary.net_salary).toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: employee form */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
            <form onSubmit={submitEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                <input
                  type="text"
                  value={employeeForm.pix_key || ''}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, pix_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salário</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={employeeForm.salary}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, salary: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={employeeForm.active}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm text-gray-700">Ativo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Confirmar'}
                </button>
                <button type="button" onClick={resetEmployeeForm} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
