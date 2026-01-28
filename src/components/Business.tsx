import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, Building2 } from 'lucide-react';
import { Partner, PartnerType } from '../types';
import { partnerService } from '../services/partnerService';

export default function Business() {
  const [businesses, setBusinesses] = useState<Partner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '', type: PartnerType.BUSINESS
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await partnerService.getByType(PartnerType.BUSINESS);
      setBusinesses(data);
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBusiness) {
        await partnerService.update(editingBusiness.id, formData);
      } else {
        await partnerService.create({ ...formData, type: PartnerType.BUSINESS });
      }
      loadBusinesses();
      resetForm();
    } catch (error) {
      console.error('Error saving business:', error);
    }
  };

  const toggleActive = async (business: Partner) => {
    try {
      await partnerService.update(business.id, { ...business, active: !business.active });
      loadBusinesses();
    } catch (error) {
      console.error('Error toggling business status:', error);
    }
  };

  const startEdit = (business: Partner) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: ''
    });
    setEditingBusiness(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Business</h1>
          <p className="text-gray-600 mt-1">Gerencie empresas com pagamento diferido</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Empresa
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingBusiness ? 'Editar Empresa' : 'Nova Empresa'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
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
                  {editingBusiness ? 'Atualizar' : 'Criar'}
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
        {businesses.map(business => (
          <div
            key={business.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              business.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <Building2 className={`w-8 h-8 ${business.active ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(business)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => toggleActive(business)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Archive className={`w-4 h-4 ${business.active ? 'text-gray-600' : 'text-red-600'}`} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">{business.name}</h3>

            {!business.active && (
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
