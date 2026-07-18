import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Link2 } from 'lucide-react';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, User } from '../types';
import { employeeService } from '../services/employeeService';
import { userService } from '../services/userService';

type AccountLinkMode = 'none' | 'link-existing' | 'create-new';

interface EmployeeFormModalProps {
  employee: Employee | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EmployeeFormModal({ employee, employees, onClose, onSaved }: EmployeeFormModalProps) {
  const [form, setForm] = useState({
    name: '',
    pix_key: '' as string | null,
    salary: 0,
    active: true,
    start_date: '' as string | null,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [accountMode, setAccountMode] = useState<AccountLinkMode>('none');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    userService.getAll().then(setUsers).catch((e) => console.error('Failed to load users', e));
  }, []);

  useEffect(() => {
    if (employee) {
      let formattedDate = '';
      if (employee.start_date) {
        formattedDate = employee.start_date.split('T')[0];
      }
      setForm({
        name: employee.name,
        pix_key: employee.pix_key ?? '',
        salary: employee.salary,
        active: employee.active,
        start_date: formattedDate,
      });
      if (employee.user_id) {
        setAccountMode('link-existing');
        setSelectedUserId(employee.user_id);
      } else {
        setAccountMode('none');
        setSelectedUserId('');
      }
      setNewUser({ name: employee.name, username: '', password: '' });
    } else {
      setForm({ name: '', pix_key: '', salary: 0, active: true, start_date: '' });
      setAccountMode('none');
      setSelectedUserId('');
      setNewUser({ name: '', username: '', password: '' });
    }
    setUserSearchQuery('');
    setError(null);
    setUsernameError(null);
  }, [employee]);

  // Eligible existing-user candidates: EMPLOYEE/OPERATOR role, active, not linked to a
  // different employee — but always keep the employee's own current link visible/selectable.
  const eligibleUsers = useMemo(() => {
    const linkedElsewhere = new Set(
      employees.filter((e) => e.id !== employee?.id && e.user_id).map((e) => e.user_id as string)
    );
    return users.filter((u) => {
      if (u.id === employee?.user_id) return true;
      const hasEligibleRole = u.roles.some((r) => r.name === 'EMPLOYEE' || r.name === 'OPERATOR');
      return hasEligibleRole && u.active && !linkedElsewhere.has(u.id);
    });
  }, [users, employees, employee]);

  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return eligibleUsers;
    return eligibleUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [eligibleUsers, userSearchQuery]);

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  const selectCreateNewMode = () => {
    setAccountMode('create-new');
    setNewUser((prev) => (prev.name ? prev : { ...prev, name: form.name }));
  };

  const canSubmit =
    (accountMode !== 'create-new' || (newUser.username.trim() !== '' && newUser.password.trim() !== '')) &&
    (accountMode !== 'link-existing' || selectedUserId !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUsernameError(null);

    if (!canSubmit) return;

    setLoading(true);
    try {
      let linkedUserId: string | null | undefined;

      if (accountMode === 'none') {
        // Create: omit entirely (no link). Edit: explicit null clears any existing link.
        linkedUserId = employee ? null : undefined;
      } else if (accountMode === 'link-existing') {
        linkedUserId = selectedUserId;
      } else {
        try {
          const created = await userService.create({
            name: newUser.name || form.name,
            username: newUser.username,
            password: newUser.password,
            roles: ['EMPLOYEE'],
          });
          linkedUserId = created.id;
        } catch (err) {
          setUsernameError(err instanceof Error ? err.message : 'Erro ao criar usuário');
          setLoading(false);
          return;
        }
      }

      const basePayload = {
        name: form.name,
        pix_key: form.pix_key || null,
        salary: Number(form.salary),
        active: form.active,
        start_date: form.start_date || null,
      };

      if (employee) {
        const payload: UpdateEmployeeRequest = { ...basePayload, user_id: linkedUserId };
        await employeeService.update(employee.id, payload);
      } else {
        const payload: CreateEmployeeRequest = { ...basePayload };
        if (linkedUserId !== undefined) payload.user_id = linkedUserId;
        await employeeService.create(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar funcionário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{employee ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
            <input
              type="text"
              value={form.pix_key || ''}
              onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
            <input
              type="date"
              value={form.start_date || ''}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salário</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700">Ativo</label>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Conta de acesso</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAccountMode('none')}
                className={`flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border transition ${
                  accountMode === 'none'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Nenhuma
              </button>
              <button
                type="button"
                onClick={() => setAccountMode('link-existing')}
                className={`flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border transition flex items-center justify-center gap-1 ${
                  accountMode === 'link-existing'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" /> Vincular existente
              </button>
              <button
                type="button"
                onClick={selectCreateNewMode}
                className={`flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border transition flex items-center justify-center gap-1 ${
                  accountMode === 'create-new'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Criar nova
              </button>
            </div>

            {accountMode === 'link-existing' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou usuário..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 px-3 py-4 text-center">
                      Nenhuma conta elegível encontrada. Você pode criar uma nova conta.
                    </p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className={`w-full text-left px-3 py-2 text-sm transition ${
                          selectedUserId === u.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {u.name} <span className="text-gray-400">({u.username})</span>
                      </button>
                    ))
                  )}
                </div>
                {selectedUser && (
                  <p className="text-xs text-gray-500">
                    Selecionado: {selectedUser.name} ({selectedUser.username})
                  </p>
                )}
              </div>
            )}

            {accountMode === 'create-new' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nome da conta"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Nome de usuário"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
                {usernameError && <p className="text-xs text-red-600">{usernameError}</p>}
                <p className="text-xs text-gray-400">A conta será criada com acesso de nível Funcionário.</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
