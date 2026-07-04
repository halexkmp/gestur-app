import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, Edit, AlertCircle } from 'lucide-react';
import { Product, StockChange } from '../types';
import { productService } from '../services/productService';

export default function StockControl() {
  const { isSuperAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockHistory, setStockHistory] = useState<StockChange[]>([]);
  const [filterProductId, setFilterProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    change_type: 'IN' as 'IN' | 'OUT',
    quantity: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products from API
      const productsData = await productService.getAll();
      setProducts(productsData
        .filter(p => p.active && p.type === 'CONSUMABLE')
        .sort((a, b) => a.name.localeCompare(b.name))
      );

      // Load history
      const historyData = await productService.getStockChanges();
      setStockHistory(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSuperAdmin) {
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
      
      await productService.updateStock([{
        product_id: selectedProduct,
        change_type: formData.change_type,
        quantity_change: quantity
      }]);

      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Error updating stock:', err);
      setError(err.message || 'Erro ao atualizar estoque');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      change_type: 'IN',
      quantity: '',
      reason: ''
    });
    setSelectedProduct('');
    setShowModal(false);
    setError('');
  };

  const changeTypeLabels: Record<string, string> = {
    IN: 'Entrada',
    OUT: 'Saída',
  };

  const filteredHistory = filterProductId
    ? stockHistory.filter(change => change.product.id === filterProductId)
    : stockHistory;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Controle de Estoque</h1>
          <p className="text-gray-600 mt-1">Gerencie o estoque de produtos</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Alterar Estoque
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          Apenas administradores podem alterar o estoque
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-auto">
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
                  <option value="IN">Entrada</option>
                  <option value="OUT">Saída</option>
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
          <button
            key={product.id}
            onClick={() => setFilterProductId(filterProductId === product.id ? null : product.id)}
            className={`bg-white rounded-xl shadow-sm border p-6 text-left transition ${
              filterProductId === product.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <Package className={`w-8 h-8 mb-3 ${
              filterProductId === product.id ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
            <p className={`text-2xl font-bold ${
              product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.stock_quantity}
            </p>
            <p className="text-sm text-gray-600 mt-1">unidades</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Histórico de Alterações
            {filterProductId && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                (Filtrado por: {products.find(p => p.id === filterProductId)?.name})
              </span>
            )}
          </h2>
          {filterProductId && (
            <button
              onClick={() => setFilterProductId(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpar Filtro
            </button>
          )}
        </div>

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
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredHistory.map(change => (
                  <tr key={change.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {new Date(change.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {change.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        change.change_type === 'IN' ? 'bg-green-100 text-green-700' :
                        change.change_type === 'OUT' ? 'bg-red-100 text-red-700' :
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
                      {change.reason || (change.sale ? `Venda: ${change.sale.sale_code}` : '-')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {change.user.name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
