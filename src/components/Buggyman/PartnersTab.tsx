import { useState, useEffect } from 'react';
import { Plus,
  Edit2,
  User,
  Coins,
  Search,
  Trash2,
  } from 'lucide-react';
import { Partner, PartnerType } from '../../types';
import { partnerService } from '../../services/partnerService';
import { useAuth } from '../../contexts/AuthContext';
import LoanDrawer from '../LoanDrawer';

export default function PartnersTab() {
  const { isSuperAdmin } = useAuth();
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
  const [search, setSearch] = useState('');
  const [onlyWithLoans, setOnlyWithLoans] = useState(false);

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
  const deleteBuggyman = async (buggyman: Partner) => {
    const confirmed = window.confirm(
        `Deseja realmente excluir "${buggyman.name}"?`
    );

    if (!confirmed) return;

    try {
      await partnerService.delete(buggyman.id);
      loadBuggymans();
    } catch (error) {
      console.error('Error deleting buggyman:', error);
    }
  };

  const filteredBuggymans = buggymans.filter((buggyman) => {
    const matchesName = buggyman.name
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesLoan =
        !onlyWithLoans || (buggyman.loans && buggyman.loans.length > 0);

    return matchesName && matchesLoan;
  });

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
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Bugueiro
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
                type="text"
                placeholder="Pesquisar bugueiro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 whitespace-nowrap">
            <input
                type="checkbox"
                checked={onlyWithLoans}
                onChange={(e) => setOnlyWithLoans(e.target.checked)}
                className="rounded"
            />

            <span className="text-sm text-gray-700">
        Apenas com empréstimos
      </span>
          </label>

        </div>
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
        {filteredBuggymans.map(buggyman => (
          <div
            key={buggyman.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              buggyman.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <User className={`w-8 h-8 ${buggyman.active ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex gap-2">
                {isSuperAdmin && (
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
                )}
                <button
                  onClick={() => startEdit(buggyman)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                    onClick={() => deleteBuggyman(buggyman)}
                    className="p-1 hover:bg-red-50 rounded"
                    title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
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
