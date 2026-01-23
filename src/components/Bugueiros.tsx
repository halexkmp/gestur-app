import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, User } from 'lucide-react';
import { Bugueiro } from '../types';
import { partnerService } from '../services/partnerService';

export default function Bugueiros() {
  const [bugueiros, setBugueiros] = useState<Bugueiro[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBugueiro, setEditingBugueiro] = useState<Bugueiro | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    loadBugueiros();
  }, []);

  const loadBugueiros = async () => {
    try {
      const data = await partnerService.getBugueiros();
      setBugueiros(data);
    } catch (error) {
      console.error('Error loading bugueiros:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBugueiro) {
        // await partnerService.updateBugueiro(editingBugueiro.id, formData);
      } else {
        // await partnerService.createBugueiro(formData);
      }
      loadBugueiros();
      resetForm();
    } catch (error) {
      console.error('Error saving bugueiro:', error);
    }
  };

  const toggleActive = async (bugueiro: Bugueiro) => {
    try {
      // await partnerService.updateBugueiro(bugueiro.id, { active: !bugueiro.active });
      loadBugueiros();
    } catch (error) {
      console.error('Error toggling bugueiro status:', error);
    }
  };

  const startEdit = (bugueiro: Bugueiro) => {
    setEditingBugueiro(bugueiro);
    setFormData({
      name: bugueiro.name,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
    setEditingBugueiro(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Bugueiros</h1>
          <p className="text-gray-600 mt-1">Gerencie os bugueiros e suas informações</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Bugueiro
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingBugueiro ? 'Editar Bugueiro' : 'Novo Bugueiro'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingBugueiro ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bugueiros.map(bugueiro => (
          <div
            key={bugueiro.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              bugueiro.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <User className={`w-8 h-8 ${bugueiro.active ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(bugueiro)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => toggleActive(bugueiro)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Archive className={`w-4 h-4 ${bugueiro.active ? 'text-gray-600' : 'text-red-600'}`} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">{bugueiro.name}</h3>

            {!bugueiro.active && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                Inativo
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
