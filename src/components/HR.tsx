import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, Users, Banknote, Link2, Clock, MapPin } from 'lucide-react';
import { Employee } from '../types';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import EmployeeFormModal from './EmployeeFormModal';
import LatenessConfigPanel from './LatenessConfigPanel';
import SalaryTab from './HR/SalaryTab';
import JourneyTab from './HR/JourneyTab';

export default function HR() {
  const { isSuperAdmin, isHR } = useAuth();
  const canAccess = useMemo(() => isSuperAdmin || isHR, [isSuperAdmin, isHR]);

  const [activeTab, setActiveTab] = useState<'employees' | 'salary' | 'journey' | 'lateness'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Employee form state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (e) {
      console.error('Failed to load employees', e);
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
          <p className="text-gray-600 mt-1">Gerencie funcionários e acompanhe o pagamento de cada um</p>
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
          onClick={() => setActiveTab('salary')}
          className={`px-6 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'salary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Salário
        </button>
        <button
          onClick={() => setActiveTab('journey')}
          className={`px-6 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'journey'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Jornadas
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
      ) : activeTab === 'journey' ? (
        <JourneyTab />
      ) : (
        <SalaryTab />
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
