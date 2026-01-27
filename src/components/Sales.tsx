import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Minus, Trash2, DollarSign, Check, AlertCircle } from 'lucide-react';
import { Product, Partner, PartnerType, PaymentMethod, PartnerCustomer, PartnerCustomerShift } from '../types';
import { productService } from '../services/productService';
import { partnerService } from '../services/partnerService';
import { saleService } from '../services/saleService';

type ShiftType = PartnerCustomerShift;

interface CartItem {
  product: Product;
  quantity: number;
  default_price: number;
}

interface PaymentSplit {
  method: PaymentMethod;
  amount: string;
}

export default function Sales() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [buggymans, setBuggymans] = useState<Partner[]>([]);
  const [businesses, setBusinesses] = useState<Partner[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBuggyman, setSelectedBuggyman] = useState<string>('');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [shift, setShift] = useState<ShiftType>('MORNING');
  const [clientCount, setClientCount] = useState(1);
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { method: 'PIX', amount: '' }
  ]);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, partnersData] = await Promise.all([
        productService.getAll(),
        partnerService.getAll()
      ]);
      setProducts(productsData.filter(product => product.active));
      setBuggymans(partnersData.filter(buggyman => buggyman.active && buggyman.type === PartnerType.BUGGYMAN));
      setBusinesses(partnersData.filter(business => business.active && business.type === PartnerType.BUSINESS));
    } catch (error) {
      console.error('General error in loadData:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    let newCart;
    if (existing) {
      newCart = cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { product, quantity: 1, default_price: product.default_price }];
    }
    setCart(newCart);
    
    // Automatically update PIX payment if it's the only one or if we're simplifying
    const newTotal = newCart.reduce((sum, item) => sum + (item.default_price * item.quantity), 0);
    if (payments.length === 1 && payments[0].method === 'PIX') {
      setPayments([{ method: 'PIX', amount: newTotal.toString() }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: item.quantity + delta }
        : item
    ).filter(item => item.quantity > 0);
    setCart(newCart);

    const newTotal = newCart.reduce((sum, item) => sum + (item.default_price * item.quantity), 0);
    if (payments.length === 1 && payments[0].method === 'PIX') {
      setPayments([{ method: 'PIX', amount: newTotal.toString() }]);
    }
  };

  const updatePrice = (productId: string, newPrice: string) => {
    const default_price = parseFloat(newPrice) || 0;
    const newCart = cart.map(item =>
      item.product.id === productId
        ? { ...item, default_price }
        : item
    );
    setCart(newCart);

    const newTotal = newCart.reduce((sum, item) => sum + (item.default_price * item.quantity), 0);
    if (payments.length === 1 && payments[0].method === 'PIX') {
      setPayments([{ method: 'PIX', amount: newTotal.toString() }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    setCart(newCart);

    const newTotal = newCart.reduce((sum, item) => sum + (item.default_price * item.quantity), 0);
    if (payments.length === 1 && payments[0].method === 'PIX') {
      setPayments([{ method: 'PIX', amount: newTotal.toString() }]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.default_price * item.quantity), 0);
  };

  const calculatePaymentTotal = () => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const addPaymentMethod = () => {
    setPayments([...payments, { method: 'PIX', amount: '' }]);
  };

  const updatePayment = (index: number, field: 'method' | 'amount', value: string) => {
    setPayments(payments.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const validateSale = () => {
    if (cart.length === 0) {
      setError('Adicione produtos ao carrinho');
      return false;
    }

    const total = calculateTotal();
    const paymentTotal = calculatePaymentTotal();

    if (!selectedBusiness && Math.abs(total - paymentTotal) > 0.01) {
      setError(`Total dos pagamentos (R$ ${paymentTotal.toFixed(2)}) não corresponde ao total da venda (R$ ${total.toFixed(2)})`);
      return false;
    }

    if (selectedBuggyman && clientCount < 1) {
      setError('Informe a quantidade de clientes');
      return false;
    }

    // Check stock
    for (const item of cart) {
      if (item.product.type === 'CONSUMABLE' && item.product.stock_quantity < item.quantity) {
        setError(`Estoque insuficiente para ${item.product.name}. Disponível: ${item.product.stock_quantity}`);
        return false;
      }
    }

    return true;
  };

  const completeSale = async () => {
    if (!validateSale()) return;

    setLoading(true);
    setError('');

    try {
      const saleData = {
        partner_id: selectedBusiness || selectedBuggyman || undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.default_price
        })),
        payments: !selectedBusiness ? payments
          .filter(p => parseFloat(p.amount) > 0)
          .map(p => ({
            payment_method: p.method,
            amount: parseFloat(p.amount)
          })) : [],
        observations: observations || undefined,
        partner_customer_shift: selectedBuggyman ? shift : undefined,
        partner_customer_date: selectedBuggyman ? new Date().toISOString().split('T')[0] : undefined,
      };

      await saleService.create(saleData);

      // Refresh data to get updated stock quantities
      await loadData();

      setSuccess(true);
      setTimeout(() => {
        resetForm();
        setSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error completing sale:', err);
      setError(err.response?.data?.message || 'Erro ao finalizar venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setSelectedBuggyman('');
    setSelectedBusiness('');
    setShift('MORNING');
    setClientCount(1);
    setPayments([{ method: 'PIX', amount: '' }]);
    setObservations('');
    setError('');
  };

  const total = calculateTotal();
  const paymentTotal = calculatePaymentTotal();
  const paymentDiff = total - paymentTotal;

  const paymentTotalsByType = payments.reduce((acc, p) => {
    const amount = parseFloat(p.amount) || 0;
    if (amount > 0) {
      acc[p.method] = (acc[p.method] || 0) + amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const paymentMethodLabels: Record<string, string> = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão'
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Nova Venda</h1>
        <p className="text-gray-600 mt-1">Registre vendas de forma rápida e prática</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5" />
          Venda registrada com sucesso!
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Produtos</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {products.map(product => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left relative"
                  >
                    {quantity > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {quantity}
                      </div>
                    )}
                    <div className="font-medium text-gray-800">{product.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      R$ {product.default_price.toFixed(2)}
                    </div>
                    {product.type === 'CONSUMABLE' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Estoque: {product.stock_quantity}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Carrinho</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.product.name}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="mx-2">×</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.default_price}
                          onChange={(e) => updatePrice(item.product.id, e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        R$ {(item.default_price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="mt-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buggyman (opcional)
                </label>
                <select
                  value={selectedBuggyman}
                  onChange={(e) => setSelectedBuggyman(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Nenhum</option>
                  {buggymans.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {selectedBuggyman && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Turno
                    </label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value as ShiftType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="manha">Manhã</option>
                      <option value="tarde">Tarde</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade de clientes
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={clientCount}
                      onChange={(e) => setClientCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comissão: R$ {(clientCount * 10).toFixed(2)}
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Negócio Parceiro (opcional)
                </label>
                <select
                  value={selectedBusiness}
                  onChange={(e) => setSelectedBusiness(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pagamento direto</option>
                  {businesses.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Alguma observação sobre a venda..."
                />
              </div>
            </div>
          </div>

          {!selectedBusiness && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Pagamento</h2>

              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={payment.method}
                      onChange={(e) => updatePayment(index, 'method', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={payment.amount}
                      onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {payments.length > 1 && (
                      <button
                        onClick={() => removePayment(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addPaymentMethod}
                className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
              >
                + Adicionar forma de pagamento
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {Object.entries(paymentTotalsByType).map(([method, amount]) => (
                  <div key={method} className="flex justify-between text-sm">
                    <span className="text-gray-600">Total {paymentMethodLabels[method] || method}:</span>
                    <span className="font-medium">R$ {amount.toFixed(2)}</span>
                  </div>
                ))}
                {paymentDiff !== 0 && (
                  <div className={`flex justify-between text-sm ${paymentDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>{paymentDiff > 0 ? 'Faltando:' : 'Troco:'}</span>
                    <span className="font-medium">R$ {Math.abs(paymentDiff).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-800">Total</span>
              <span className="text-2xl font-bold text-blue-600">
                R$ {total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={completeSale}
              disabled={loading || cart.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              {loading ? 'Processando...' : 'Finalizar Venda'}
            </button>

            {cart.length > 0 && (
              <button
                onClick={resetForm}
                className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
