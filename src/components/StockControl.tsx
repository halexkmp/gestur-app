import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  limit, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Package, Edit, AlertCircle } from 'lucide-react';
import { Product, StockChange } from '../types';

type StockChangeWithRelations = StockChange & {
  products: { name: string } | null;
  profiles: { full_name: string } | null;
};

export default function StockControl() {
  const { profile, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockHistory, setStockHistory] = useState<StockChangeWithRelations[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    change_type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load products
      let productsData: Product[] = [];
      try {
        const productsQuery = query(
          collection(db, 'products'), 
          where('has_stock', '==', true),
          where('active', '==', true),
          orderBy('name')
        );
        const productsSnapshot = await getDocs(productsQuery);
        productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
      } catch (error) {
        console.error('Error loading products with filters and orderBy:', error);
        // Fallback: simple query and manual filter
        const productsSnapshot = await getDocs(collection(db, 'products'));
        productsData = productsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.has_stock === true && p.active === true)
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      setProducts(productsData);

      // Load history
      let historyDocs: any[] = [];
      try {
        const historyQuery = query(
          collection(db, 'stock_changes'),
          orderBy('created_at', 'desc'),
          limit(50)
        );
        const historySnapshot = await getDocs(historyQuery);
        historyDocs = historySnapshot.docs;
      } catch (error) {
        console.error('Error loading stock history with orderBy:', error);
        // Fallback: simple query, manual sort and limit
        const historySnapshot = await getDocs(collection(db, 'stock_changes'));
        historyDocs = historySnapshot.docs
          .sort((a, b) => {
            const dateA = a.data().created_at?.toDate() || 0;
            const dateB = b.data().created_at?.toDate() || 0;
            return dateB - dateA;
          })
          .slice(0, 50);
      }
      
      const historyData = await Promise.all(historyDocs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        // Fetch related product
        let productName = '-';
        if (data.product_id) {
          const productDoc = await getDoc(doc(db, 'products', data.product_id));
          if (productDoc.exists()) {
            productName = productDoc.data().name;
          }
        }

        // Fetch related profile
        let fullName = '-';
        if (data.user_id) {
          const profileDoc = await getDoc(doc(db, 'user', data.user_id));
          if (profileDoc.exists()) {
            fullName = profileDoc.data().full_name;
          }
        }

        return {
          id: docSnapshot.id,
          ...data,
          products: { name: productName },
          profiles: { full_name: fullName },
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        } as StockChangeWithRelations;
      }));

      setStockHistory(historyData);
    } catch (error) {
      console.error('General error in loadData:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAdmin) {
      setError('Apenas administradores podem alterar o estoque');
      return;
    }

    if (!selectedProduct) {
      setError('Selecione um produto');
      return;
    }

    setLoading(true);

    try {
      const quantity = parseInt(formData.quantity);
      const quantityChange = formData.change_type === 'saida' ? -quantity : quantity;

      await addDoc(collection(db, 'stock_changes'), {
        product_id: selectedProduct,
        change_type: formData.change_type,
        quantity_change: quantityChange,
        reason: formData.reason,
        user_id: profile!.id,
        created_at: serverTimestamp()
      });

      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        const newQuantity = product.stock_quantity + quantityChange;
        const productRef = doc(db, 'products', selectedProduct);
        await updateDoc(productRef, {
          stock_quantity: newQuantity,
          updated_at: serverTimestamp()
        });
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Erro ao atualizar estoque');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      change_type: 'entrada',
      quantity: '',
      reason: ''
    });
    setSelectedProduct('');
    setShowModal(false);
    setError('');
  };

  const changeTypeLabels = {
    entrada: 'Entrada',
    saida: 'Saída',
    ajuste: 'Ajuste',
    venda: 'Venda'
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Controle de Estoque</h1>
          <p className="text-gray-600 mt-1">Gerencie o estoque de produtos</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Alterar Estoque
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          Apenas administradores podem alterar o estoque
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Alterar Estoque
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produto
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Alteração
                </label>
                <select
                  value={formData.change_type}
                  onChange={(e) => setFormData({ ...formData, change_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Confirmar'}
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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Package className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
            <p className={`text-2xl font-bold ${
              product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.stock_quantity}
            </p>
            <p className="text-sm text-gray-600 mt-1">unidades</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Histórico de Alterações
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data/Hora</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Produto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantidade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Motivo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stockHistory.map(change => (
                <tr key={change.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {new Date(change.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {change.products?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      change.change_type === 'entrada' ? 'bg-green-100 text-green-700' :
                      change.change_type === 'saida' ? 'bg-red-100 text-red-700' :
                      change.change_type === 'venda' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {changeTypeLabels[change.change_type]}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    change.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change.quantity_change > 0 ? '+' : ''}{change.quantity_change}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {change.reason || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {change.profiles?.full_name || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
