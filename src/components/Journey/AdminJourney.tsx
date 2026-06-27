import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, User as UserIcon, AlertCircle, Save, X, Camera } from 'lucide-react';
import { useJourney } from '../../hooks/useJourney';
import { userService } from '../../services/userService';
import { JourneyResponse, User } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const buildSelfieProofUrl = (selfieId: string): string =>
  `${API_URL}/journey/selfie?selfie_id=${encodeURIComponent(selfieId)}`;

export const AdminJourney: React.FC = () => {
  const { history, loading, error, fetchAdminHistory, updateJourney, deleteJourney } = useJourney();
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    user_id: '',
    start_date: '',
    end_date: '',
  });

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<JourneyResponse | null>(null);
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    timestamp: '',
    latitude: 0,
    longitude: 0,
    edit_reason: '',
  });

  useEffect(() => {
    loadUsers();
    handleSearch();
  }, []);

  const loadUsers = async (): Promise<void> => {
    try {
      setUsersError(null);
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      setUsersError('Não foi possível carregar a lista de funcionários.');
    }
  };

  const handleSearch = (): void => {
    fetchAdminHistory({
      user_id: filters.user_id || null,
      start_date: filters.start_date ? new Date(filters.start_date).toISOString() : null,
      end_date: filters.end_date ? new Date(filters.end_date).toISOString() : null,
    });
  };

  const handleEdit = (record: JourneyResponse): void => {
    setEditingRecord(record);
    setEditForm({
      timestamp: record.timestamp.split('.')[0], // remove milliseconds for datetime-local input
      latitude: record.latitude,
      longitude: record.longitude,
      edit_reason: '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingRecord) return;
    
    try {
      await updateJourney(editingRecord.id, {
        timestamp: new Date(editForm.timestamp).toISOString(),
        latitude: editForm.latitude,
        longitude: editForm.longitude,
        edit_reason: editForm.edit_reason,
      });
      setEditingRecord(null);
      handleSearch();
    } catch {
      // Handled by hook
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Deseja realmente excluir este registro? Esta ação é irreversível (soft-delete).')) return;
    
    try {
      await deleteJourney(id);
      handleSearch();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Search className="text-blue-600" />
          Gerenciar Jornadas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
            <select
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className="w-full border rounded-md p-2"
            >
              <option value="">Todos</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full border rounded-md p-2"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Filtrar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {usersError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{usersError}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Funcionário</th>
              <th className="p-4 font-semibold text-gray-600">Data/Hora</th>
              <th className="p-4 font-semibold text-gray-600">Coordenadas</th>
              <th className="p-4 font-semibold text-gray-600">Selfie</th>
              <th className="p-4 font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto" />
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td>
              </tr>
            ) : (
              history.map((record) => {
                const user = users.find(u => u.id === record.user_id);
                const selfieId = record.selfie_id?.trim();
                const hasSelfie = Boolean(selfieId);

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <UserIcon size={16} className="text-gray-400" />
                        <span>{user?.name || 'Desconhecido'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span>{new Date(record.timestamp).toLocaleDateString('pt-BR')}</span>
                        <span className="text-sm text-gray-500">{new Date(record.timestamp).toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                    </td>
                    <td className="p-4">
                      {hasSelfie ? (
                        <div className="flex flex-col gap-1">
                          <button
                              type="button"
                              onClick={() => setSelectedSelfie(buildSelfieProofUrl(selfieId as string))}
                              data-testid={`selfie-${record.id}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            <Camera size={14} />
                            Ver selfie
                          </button>
                          <span className="text-[10px] text-gray-400">Se não abrir, a referência pode ter expirado.</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sem selfie disponível</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(record)}
                          data-testid={`edit-${record.id}`}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          data-testid={`delete-${record.id}`}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold">Editar Registro</h3>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.timestamp}
                  onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editForm.latitude}
                    onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) })}
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editForm.longitude}
                    onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) })}
                    className="w-full border rounded-md p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Alteração</label>
                <textarea
                  required
                  value={editForm.edit_reason}
                  onChange={(e) => setEditForm({ ...editForm, edit_reason: e.target.value })}
                  placeholder="Explique o porquê desta alteração..."
                  className="w-full border rounded-md p-2 h-24"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selfie Modal */}
      {selectedSelfie && (
          <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
              onClick={() => setSelectedSelfie(null)}
          >
            <div
                className="relative max-h-[90vh] max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
              <button
                  type="button"
                  onClick={() => setSelectedSelfie(null)}
                  className="absolute -top-4 -right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>

              <img
                  src={selectedSelfie}
                  alt="Selfie do funcionário"
                  className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
              />
            </div>
          </div>
      )}
    </div>
  );
};
