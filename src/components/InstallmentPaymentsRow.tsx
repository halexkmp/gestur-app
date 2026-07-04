import { useState, useEffect, useCallback } from 'react';
import { LoanInstallment, LoanInstallmentPayment } from '../types';
import { loanService } from '../services/loanService';
import { Loader2, Plus, Calendar, DollarSign, MessageSquare, AlertCircle } from 'lucide-react';

interface InstallmentPaymentsRowProps {
  installment: LoanInstallment;
  onPaymentSuccess: () => Promise<void>;
}

export default function InstallmentPaymentsRow({
  installment,
  onPaymentSuccess,
}: InstallmentPaymentsRowProps) {
  const [payments, setPayments] = useState<LoanInstallmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loanService.getInstallmentPayments(installment.id);
      setPayments(data);
      
      // Calculate remaining amount to pre-fill the form
      const totalPaid = data.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, installment.amount - totalPaid);
      setAmount(remaining > 0 ? remaining.toFixed(2) : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar histórico de pagamentos.');
    } finally {
      setLoading(false);
    }
  }, [installment.id, installment.amount]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Por favor, insira um valor válido maior que zero.');
      return;
    }
    if (!paymentDate) {
      setSubmitError('Por favor, insira uma data válida.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await loanService.createInstallmentPayment(installment.id, {
        amount: parsedAmount,
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
      });
      
      setNotes('');
      // Refresh local payments history
      await fetchPayments();
      // Notify parent to refresh installment status/loan details
      await onPaymentSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Falha ao registrar pagamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, installment.amount - totalPaid);
  const isFullyPaid = installment.paid || remainingAmount <= 0 || installment.status === 'PAID';

  return (
    <div className="p-4 bg-gray-50 border-y border-gray-200 text-gray-750">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment History Section */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h5 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            Histórico de Pagamentos (Parcela #{installment.installment_number})
          </h5>

          {loading ? (
            <div className="flex justify-center items-center py-6 gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Carregando...
            </div>
          ) : error ? (
            <div className="text-xs text-red-500 p-2 bg-red-50 rounded border border-red-100 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4">Nenhum pagamento registrado.</p>
          ) : (
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="py-1.5 font-semibold">Data</th>
                    <th className="py-1.5 font-semibold">Valor</th>
                    <th className="py-1.5 font-semibold">Anotações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-2 text-gray-600">{formatDate(p.payment_date)}</td>
                      <td className="py-2 text-gray-900 font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="py-2 text-gray-500 max-w-[150px] truncate" title={p.notes}>
                        {p.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Total Pago:</span>
                <span className="text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Register Payment Form Section */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h5 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
            Registrar Pagamento
          </h5>

          {isFullyPaid ? (
            <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-lg p-4 font-medium text-center">
              Esta parcela está totalmente paga!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Valor (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 pointer-events-none">
                      <DollarSign className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={submitting}
                      placeholder="0,00"
                      className="w-full text-xs bg-white border border-gray-300 rounded-lg pl-7 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Data do Pagamento
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 pointer-events-none">
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      disabled={submitting}
                      className="w-full text-xs bg-white border border-gray-300 rounded-lg pl-7 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Observações (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute top-2.5 left-0 pl-2.5 flex items-center text-gray-400 pointer-events-none">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                    placeholder="Ex: Pagamento parcial em dinheiro"
                    className="w-full text-xs bg-white border border-gray-300 rounded-lg pl-7 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium disabled:bg-gray-100"
                  />
                </div>
              </div>

              {submitError && (
                <div className="text-xs text-red-500 p-2 bg-red-50 rounded border border-red-100 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded-lg font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Registrar Pagamento
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}