import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, TrendingUp, Download, Edit2, Eye, X } from 'lucide-react';
import { Sale as BaseSale, SaleItem, SalePayment, User } from '../types';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { partnerService } from '../services/partnerService';
import { userService } from '../services/userService';

type Sale = BaseSale & {
  buggyman: { name: string } | null;
  business: { name: string } | null;
  user: User | null;
};

type SaleDetails = {
  sale: Sale;
  items: (SaleItem & { product_name: string })[];
  user: User;
  payments: SalePayment[];
};

type PaymentSummary = {
  method: string;
  total: number;
};

type ProductRevenue = {
  product_id: string;
  product_name: string;
  total: number;
  quantity: number;
};

type BuggymanCommission = {
  buggyman_id: string;
  buggyman_name: string;
  pix_key: string | null;
  client_count: number;
  commission: number;
};

export default function Reports() {
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date()),
    end: getLocalDateString(new Date())
  });
  const [sales, setSales] = useState<Sale[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([]);
  const [productRevenue, setProductRevenue] = useState<ProductRevenue[]>([]);
  const [commissions, setCommissions] = useState<BuggymanCommission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editObservations, setEditObservations] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewingSale, setViewingSale] = useState<SaleDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadReport()
  }, [dateRange, selectedUserId]);

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadReport = async () => {
    setLoading(true);

    try {
      const date_from = new Date(`${dateRange.start}T00:00:00`).toISOString();
      const date_to = new Date(`${dateRange.end}T23:59:59`).toISOString();

      const salesData = await saleService.getReport({
        date_from,
        date_to,
        user_id: selectedUserId || undefined
      });

      setSales(salesData as Sale[]);

      // Totais
      const revenue = salesData.reduce((acc, sale) => acc + sale.total_amount, 0);
      setTotalRevenue(revenue);
      setTotalSales(salesData.length);

      // Resumo por Pagamento
      const paymentsMap: Record<string, number> = {};
      salesData.forEach(sale => {
        sale.payments?.forEach(payment => {
          const method = payment.payment_method;
          paymentsMap[method] = (paymentsMap[method] || 0) + payment.amount;
        });
      });

      const paymentSummaryData: PaymentSummary[] = Object.entries(paymentsMap).map(([method, total]) => ({
        method,
        total
      }));
      setPaymentSummary(paymentSummaryData);

      // Receita por Produto
      const productsMap: Record<string, ProductRevenue> = {};
      salesData.forEach(sale => {
        sale.items?.forEach(item => {
          if (!productsMap[item.product_id]) {
            productsMap[item.product_id] = {
              product_id: item.product_id,
              product_name: 'Carregando...',
              total: 0,
              quantity: 0
            };
          }
          productsMap[item.product_id].total += item.total_price;
          productsMap[item.product_id].quantity += item.quantity;
        });
      });

      const productRevenueData = Object.values(productsMap);
      setProductRevenue(productRevenueData);

      // Carregar nomes dos produtos
      try {
        const products = await productService.getAll();
        setProductRevenue(prev => prev.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            ...item,
            product_name: product ? product.name : 'Produto não encontrado'
          };
        }));
      } catch (error) {
        console.error('Error loading product names:', error);
      }

      // Comissões
      if (salesData.length > 0) {
        try {
          const saleIds = salesData.map(s => s.id);
          const [partnerCustomers, allPartners] = await Promise.all([
            partnerService.getPartnerCustomerReport(saleIds),
            partnerService.getAll()
          ]);

          const commissionMap: Record<string, BuggymanCommission> = {};

          partnerCustomers.forEach(pc => {
            const partner = allPartners.find(p => p.id === pc.partner_id);
            if (!partner) return;

            if (!commissionMap[pc.partner_id]) {
              commissionMap[pc.partner_id] = {
                buggyman_id: pc.partner_id,
                buggyman_name: partner.name,
                pix_key: partner.pix_key,
                client_count: 0,
                commission: 0
              };
            }

            commissionMap[pc.partner_id].client_count += pc.quantity;
            commissionMap[pc.partner_id].commission += pc.quantity * 10;
          });

          setCommissions(Object.values(commissionMap));
        } catch (error) {
          console.error('Error loading commissions:', error);
          setCommissions([]);
        }
      } else {
        setCommissions([]);
      }

    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      start: getLocalDateString(start),
      end: getLocalDateString(end)
    });
  };

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setEditObservations(sale.observations || '');
  };

  const handleViewDetails = async (sale: Sale) => {
    setLoadingDetails(true);
    try {
      const [items, partner] = await Promise.all([
        Promise.all(sale.items.map(async (item) => {
          const products = await productService.getAll();
          const product = products.find(p => p.id === item.product_id);
          const productName = product ? product.name : 'Produto Removido';
          return {
            ...item,
            product_name: productName
          } as SaleItem & { product_name: string };
        })),
        sale.partner_id ? partnerService.getById(sale.partner_id) : Promise.resolve(null)
      ]);

      const updatedSale = { ...sale };
      if (partner) {
        if (partner.type === 'BUGGYMAN') {
          updatedSale.buggyman = { name: partner.name };
          updatedSale.business = null;
        } else {
          updatedSale.business = { name: partner.name };
          updatedSale.buggyman = null;
        }
      }

      setViewingSale({
        sale: updatedSale,
        items,
        payments: sale.payments
      });
    } catch (error) {
      console.error('Error loading sale details:', error);
      alert('Erro ao carregar detalhes da venda.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;

    setSavingEdit(true);
    try {
      await saleService.update(editingSale.id, {
        observations: editObservations
      });

      setSales(sales.map(s => 
        s.id === editingSale.id 
          ? { ...s, observations: editObservations } 
          : s
      ));
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale observations:', error);
      alert('Erro ao salvar alterações.');
    } finally {
      setSavingEdit(false);
    }
  };

  const paymentMethodLabels: Record<string, string> = {
    PIX: 'Pix',
    CURRENCY: 'Dinheiro',
    CREDIT_CARD: 'Cartão'
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-gray-600 mt-1">Visualize vendas, pagamentos e comissões</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {users.length > 1 && <option value="">Todos os usuários</option>}
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setQuickDate(0)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Hoje
            </button>
            <button
              onClick={() => setQuickDate(7)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              7 dias
            </button>
            <button
              onClick={() => setQuickDate(30)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              30 dias
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-2">Carregando...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Vendas</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{totalSales}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    R$ {totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Comissões</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    R$ {commissions.reduce((sum, c) => sum + c.commission, 0).toFixed(2)}
                  </p>
                </div>
                <Users className="w-10 h-10 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    R$ {totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Resumo por Forma de Pagamento
              </h2>
              {paymentSummary.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-3">
                  {paymentSummary.map(p => (
                    <div key={p.method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">
                        {paymentMethodLabels[p.method] || p.method}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        R$ {p.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Receita por Produto
              </h2>
              {productRevenue.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma venda registrada</p>
              ) : (
                <div className="space-y-3">
                  {productRevenue.map(p => (
                    <div key={p.product_id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">
                          {p.product_name}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          R$ {p.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {p.quantity} {p.quantity === 1 ? 'unidade vendida' : 'unidades vendidas'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Comissões de Bugueiros
              </h2>
              {commissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma comissão registrada</p>
              ) : (
                <div className="space-y-3">
                  {commissions.map(c => (
                    <div key={c.buggyman_id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{c.buggyman_name}</span>
                        <span className="text-lg font-bold text-orange-600">
                          R$ {c.commission.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{c.client_count} clientes</span>
                        {c.pix_key && <span className="text-xs">Pix: {c.pix_key}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Vendas Detalhadas</h2>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>

            {sales.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma venda encontrada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Número</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendedor</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {new Date(sale.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {sale.sale_code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {sale.user.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">
                          R$ {sale.total_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetails(sale)}
                              disabled={loadingDetails}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(sale)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar observações"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 my-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Editar Venda {editingSale.sale_code}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={editObservations}
                onChange={(e) => setEditObservations(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                rows={4}
                placeholder="Adicione observações sobre a venda..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingSale(null)}
                disabled={savingEdit}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingEdit ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-none sm:max-h-[90vh] overflow-hidden flex flex-col my-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Venda {viewingSale.sale.sale_code}
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date(viewingSale.sale.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button 
                onClick={() => setViewingSale(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Vendedor</p>
                  <p className="text-gray-800 font-medium">{viewingSale.sale.user.name || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Bugueiro</p>
                  <p className="text-gray-800 font-medium">{viewingSale.sale.buggyman?.name || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Empresa Parceira</p>
                  <p className="text-gray-800 font-medium">{viewingSale.sale.business?.name || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingSale.sale.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {viewingSale.sale.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-1">Itens da Venda</h3>
                <div className="space-y-2">
                  {viewingSale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{item.product_name}</p>
                        <p className="text-sm text-gray-500">{item.quantity} x R$ {item.unit_price.toFixed(2)}</p>
                      </div>
                      <p className="font-semibold text-gray-800">R$ {item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-1">Pagamentos</h3>
                <div className="space-y-2">
                  {viewingSale.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700 capitalize">
                        {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                      </span>
                      <span className="font-semibold text-gray-800">R$ {payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {viewingSale.sale.observations && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase mb-2 border-b pb-1">Observações</h3>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">
                    {viewingSale.sale.observations}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total da Venda</span>
              <span className="text-2xl font-bold text-blue-600">R$ {viewingSale.sale.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
