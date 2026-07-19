import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, FileText, Users, DollarSign, Calendar, Link2, Clock } from 'lucide-react';
import { Employee, SalaryAdvance, SalarySummaryResponse } from '../types';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import EmployeeFormModal from './EmployeeFormModal';
import LatenessConfigPanel from './LatenessConfigPanel';

export default function HR() {
  const { isSuperAdmin, isHR } = useAuth();
  const canAccess = useMemo(() => isSuperAdmin || isHR, [isSuperAdmin, isHR]);

  const [activeTab, setActiveTab] = useState<'employees' | 'advances' | 'lateness'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Employee form state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Report filters
  const now = new Date();
  const [reportEmployeeId, setReportEmployeeId] = useState<string>('');
  const [reportMonth, setReportMonth] = useState<number | undefined>(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(now.getFullYear());
  const [summary, setSummary] = useState<SalarySummaryResponse | null>(null);

  // Salary advances state
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [advLoading, setAdvLoading] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: '',
    amount: '',
    note: '' as string | null,
    advance_date: now.toISOString().split('T')[0],
    times: 1,
  });

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
      const data = await employeeService.listSalaryAdvances({ employee_id: reportEmployeeId || undefined, month: reportMonth || undefined, year: reportYear });
      setAdvances(data);
    } catch (e) {
      console.error('Failed to load advances', e);
    } finally {
      setAdvLoading(false);
    }
  };

  const startEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
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

  const closeEmployeeForm = () => {
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
        advance_date: advanceForm.advance_date || undefined,
        times: Number(advanceForm.times),
      });
      setAdvanceForm({ 
        employee_id: '', 
        amount: '', 
        note: '', 
        advance_date: new Date().toISOString().split('T')[0], 
        times: 1 
      });
      await loadAdvances();
    } catch (e) {
      console.error('Failed to create salary advance', e);
      alert('Erro ao criar adiantamento');
    } finally {
      setAdvLoading(false);
    }
  };

  const deleteAdvance = async (advance: SalaryAdvance) => {
    if (!confirm(`Deseja excluir este adiantamento no valor de R$ ${Number(advance.amount).toFixed(2)}?`)) return;
    setAdvLoading(true);
    try {
      await employeeService.deleteSalaryAdvance(advance.id);
      await loadAdvances();
      await loadSummary();
    } catch (e) {
      console.error('Failed to delete salary advance', e);
      alert('Erro ao excluir adiantamento');
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
      const data = await employeeService.getSalarySummary(reportEmployeeId, { month: reportMonth || undefined, year: reportYear });
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Recursos Humanos</h1>
          <p className="text-gray-600 mt-1">Gerencie funcionários e adiantamentos salariais</p>
        </div>
        {activeTab === 'employees' && (
          <button
            onClick={() => {
              setEditingEmployee(null);
              setShowEmployeeForm(true);
            }}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Funcionário
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'employees'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Funcionários
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`px-6 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'advances'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Adiantamentos
        </button>
        <button
          onClick={() => setActiveTab('lateness')}
          className={`px-6 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'lateness'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Configuração de Atrasos
        </button>
      </div>

      {activeTab === 'lateness' ? (
        <LatenessConfigPanel />
      ) : activeTab === 'employees' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Início</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIX</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Conta</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Nenhum funcionário cadastrado
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} className={!emp.active ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {emp.start_date ? new Date(emp.start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.pix_key || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">R$ {Number(emp.salary).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {emp.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        {emp.user_id ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Link2 className="w-3 h-3" /> Vinculada
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sem conta</span>
                        )}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add advance form card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
              <Plus className="w-5 h-5 text-blue-600" />
              Novo Adiantamento
            </div>
            <div className="flex flex-col lg:flex-row items-end gap-4">
              <div className="flex-[2] w-full">
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
              <div className="w-full lg:w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                <input
                  type="date"
                  value={advanceForm.advance_date || ''}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, advance_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="w-full lg:w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="w-full lg:w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vezes</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={advanceForm.times}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, times: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-[2] w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Ref. mês atual"
                  value={advanceForm.note || ''}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={submitAdvance}
                disabled={!advanceForm.employee_id || !advanceForm.amount || advLoading}
                className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {advLoading ? 'Salvando...' : 'Lançar'}
              </button>
            </div>
          </div>

          {/* Report filters and table card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
              <FileText className="w-5 h-5 text-blue-600" />
              Relatório de Adiantamentos
            </div>
            
            <div className="flex flex-wrap gap-4 items-end mb-6 pb-6 border-b border-gray-100">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Funcionário</label>
                <select
                  value={reportEmployeeId}
                  onChange={(e) => setReportEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os funcionários</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                <select
                  value={reportMonth || ''}
                  onChange={(e) => setReportMonth(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os meses</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
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
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lançamento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referência</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vezes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obs.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {advLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Carregando...</td></tr>
                  ) : advances.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhum adiantamento no período</td></tr>
                  ) : (
                    advances.map(a => {
                      const emp = employees.find(e => e.id === a.employee_id);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm text-gray-700">{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{a.advance_date ? new Date(a.advance_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp?.name || 'Desconhecido'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-semibold">R$ {Number(a.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{a.times || 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 italic">{a.note || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            <button onClick={() => deleteAdvance(a)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {!reportEmployeeId && advances.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-700" colSpan={3}>Total Acumulado</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">R$ {advances.reduce((s, a) => s + Number(a.amount), 0).toFixed(2)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* If a specific employee is selected, show salary summary */}
            {reportEmployeeId && summary && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Salário Bruto</div>
                    <div className="text-lg font-bold text-gray-800">R$ {Number(summary.gross_salary).toFixed(2)}</div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-orange-500 uppercase">Total Adiantamentos</div>
                    <div className="text-lg font-bold text-orange-700">R$ {Number(summary.advances_total).toFixed(2)}</div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-green-500 uppercase">Salário Líquido</div>
                    <div className="text-xl font-bold text-green-700">R$ {Number(summary.net_salary).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showEmployeeForm && (
        <EmployeeFormModal
          employee={editingEmployee}
          employees={employees}
          onClose={closeEmployeeForm}
          onSaved={loadEmployees}
        />
      )}
    </div>
  );
}
