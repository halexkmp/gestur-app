import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Plus, Edit2, Archive, Building2 } from 'lucide-react';
import { PartnerCompany } from '../types';

export default function Partners() {
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerCompany | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_info: ''
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const q = query(collection(db, 'partner_companies'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PartnerCompany[];
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
      try {
        const q = query(collection(db, 'partner_companies'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PartnerCompany[];
        setPartners(data);
      } catch (innerError) {
        console.error('Fallback error loading partners:', innerError);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPartner) {
      const partnerRef = doc(db, 'partner_companies', editingPartner.id);
      await updateDoc(partnerRef, formData);
    } else {
      await addDoc(collection(db, 'partner_companies'), {
        ...formData,
        active: true,
        created_at: serverTimestamp()
      });
    }

    resetForm();
    loadPartners();
  };

  const toggleActive = async (partner: PartnerCompany) => {
    const partnerRef = doc(db, 'partner_companies', partner.id);
    await updateDoc(partnerRef, { active: !partner.active });
    loadPartners();
  };

  const startEdit = (partner: PartnerCompany) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      contact_info: partner.contact_info || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_info: ''
    });
    setEditingPartner(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Empresas Parceiras</h1>
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
              {editingPartner ? 'Editar Empresa' : 'Nova Empresa'}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informações de Contato (opcional)
                </label>
                <textarea
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Telefone, email, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingPartner ? 'Atualizar' : 'Criar'}
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
        {partners.map(partner => (
          <div
            key={partner.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              partner.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <Building2 className={`w-8 h-8 ${partner.active ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(partner)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => toggleActive(partner)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Archive className={`w-4 h-4 ${partner.active ? 'text-gray-600' : 'text-red-600'}`} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">{partner.name}</h3>

            {partner.contact_info && (
              <div className="text-sm text-gray-600 mb-2">
                {partner.contact_info}
              </div>
            )}

            {!partner.active && (
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
