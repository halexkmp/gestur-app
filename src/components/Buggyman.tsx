import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, User, Coins } from 'lucide-react';
import { Partner, PartnerType } from '../types';
import { partnerService } from '../services/partnerService';
import LoanDrawer from './LoanDrawer';

export default function Buggyman() {
  const [buggymans, setBuggymans] = useState<Partner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBuggymanForLoans, setSelectedBuggymanForLoans] = useState<Partner | null>(null);
  const [isLoansDrawerOpen, setIsLoansDrawerOpen] = useState(false);
  const [editingBuggyman, setEditingBuggyman] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pix_key: '',
    type: PartnerType.BUGGYMAN
  });

  useEffect(() => {
    loadBuggymans();
  }, []);

  const loadBuggymans = async () => {
    try {
      const data = await partnerService.getByType(PartnerType.BUGGYMAN);
      setBuggymans(data);
    } catch (error) {
      console.error('Error loading buggymans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBuggyman) {
        await partnerService.update(editingBuggyman.id, formData);
      } else {
        await partnerService.create({ ...formData });
      }
      loadBuggymans();
      resetForm();
    } catch (error) {
      console.error('Error saving buggymans:', error);
    }
  };

  const toggleActive = async (buggyman: Partner) => {
    try {
      await partnerService.update(buggyman.id, { ...buggyman, active: !buggyman.active });
      loadBuggymans();
    } catch (error) {
      console.error('Error toggling buggyman status:', error);
    }
  };

  const startEdit = (buggyman: Partner) => {
    setEditingBuggyman(buggyman);
    setFormData({
      name: buggyman.name,
      pix_key: buggyman.pix_key || '',
      type: PartnerType.BUGGYMAN
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pix_key: '',
      type: PartnerType.BUGGYMAN
    });
    setEditingBuggyman(null);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingBuggyman ? 'Editar Bugueiro' : 'Novo Bugueiro'}
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

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave Pix
                  </label>
                  <input
                      type="text"
                      value={formData.pix_key}
                      onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                  />

              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingBuggyman ? 'Atualizar' : 'Criar'}
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
        {buggymans.map(buggyman => (
          <div
            key={buggyman.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              buggyman.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <User className={`w-8 h-8 ${buggyman.active ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedBuggymanForLoans(buggyman);
                    setIsLoansDrawerOpen(true);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Empréstimos"
                >
                  <Coins className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => startEdit(buggyman)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => toggleActive(buggyman)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Archive className={`w-4 h-4 ${buggyman.active ? 'text-gray-600' : 'text-red-600'}`} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">{buggyman.name}</h3>

            {!buggyman.active && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                Inativo
              </div>
            )}
          </div>
        ))}
      </div>
      <LoanDrawer
        isOpen={isLoansDrawerOpen}
        onClose={() => {
          setIsLoansDrawerOpen(false);
          setSelectedBuggymanForLoans(null);
        }}
        partner={selectedBuggymanForLoans}
      />
    </div>
  );
}
