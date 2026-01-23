import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, Package } from 'lucide-react';
import { Product, ProductType } from '../types';
import { productService } from '../services/productService';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'DRINK' as ProductType,
    price: '',
    stock_quantity: '0'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      type: formData.type,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity) || 0,
    };

    if (editingProduct) {
      await productService.update(editingProduct.id, productData);
    } else {
      await productService.create({
        ...productData,
        active: true,
      });
    }

    resetForm();
    loadProducts();
  };

  const toggleActive = async (product: Product) => {
    await productService.update(product.id, { active: !product.active });
    loadProducts();
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      type: product.type,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString()
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'DRINK',
      price: '',
      stock_quantity: '0'
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const productTypeLabels: Record<ProductType, string> = {
    DRINK: 'Bebida',
    ZIPLINE: 'Tirolesa',
    PHOTO_COMBO: 'Combo Foto',
    DRONE_COMBO: 'Combo Drone'
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-600 mt-1">Gerencie o catálogo de produtos e serviços</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DRINK">Bebida</option>
                  <option value="ZIPLINE">Tirolesa</option>
                  <option value="PHOTO_COMBO">Combo Foto</option>
                  <option value="DRONE_COMBO">Combo Drone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Padrão (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade em Estoque
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingProduct ? 'Atualizar' : 'Criar'}
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
        {products.map(product => (
          <div
            key={product.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              product.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <Package className={`w-8 h-8 ${product.active ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(product)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => toggleActive(product)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Archive className={`w-4 h-4 ${product.active ? 'text-gray-600' : 'text-red-600'}`} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {productTypeLabels[product.type]}
            </p>
            <p className="text-lg font-bold text-blue-600 mb-2">
              R$ {product.price?.toFixed(2)}
            </p>

            <div className={`text-sm px-2 py-1 rounded ${
              product.stock_quantity > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              Estoque: {product.stock_quantity}
            </div>

            {!product.active && (
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
