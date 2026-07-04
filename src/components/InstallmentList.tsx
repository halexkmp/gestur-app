import { useState } from 'react';
import { LoanInstallment } from '../types';
import { Check, Clock, Loader2 } from 'lucide-react';

interface InstallmentListProps {
  installments: LoanInstallment[];
  onPay: (installmentId: string) => Promise<void>;
}

export default function InstallmentList({ installments, onPay }: InstallmentListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePayClick = (id: string) => {
    setConfirmingId(id);
    setErrorId(null);
  };

  const handleCancelConfirm = () => {
    setConfirmingId(null);
  };

  const handleConfirmPay = async (id: string) => {
    setConfirmingId(null);
    setPayingId(id);
    setErrorId(null);
    try {
      await onPay(id);
    } catch (err) {
      setErrorId(id);
    } finally {
      setPayingId(null);
    }
  };

  const sortedInstallments = [...installments].sort(
    (a, b) => a.installment_number - b.installment_number
  );

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Cronograma de Parcelas</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 font-medium">Nº</th>
              <th className="py-2 font-medium">Valor</th>
              <th className="py-2 font-medium">Vencimento</th>
              <th className="py-2 font-medium">Pagamento</th>
              <th className="py-2 font-medium text-right">Status / Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedInstallments.map((inst) => (
              <tr key={inst.id} className="hover:bg-gray-50">
                <td className="py-3 text-gray-900 font-medium">
                  {inst.installment_number}
                </td>
                <td className="py-3 text-gray-900 font-semibold">
                  {formatCurrency(inst.amount)}
                </td>
                <td className="py-3 text-gray-600">
                  {formatDate(inst.due_date)}
                </td>
                <td className="py-3 text-gray-600">
                  {formatDate(inst.payment_date)}
                </td>
                <td className="py-3 text-right">
                  {inst.paid ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" /> Pago
                    </span>
                  ) : (
                    <div className="inline-flex items-center justify-end gap-2">
                      {confirmingId === inst.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 mr-1">Confirmar?</span>
                          <button
                            onClick={() => handleConfirmPay(inst.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1 rounded font-medium transition"
                          >
                            Sim
                          </button>
                          <button
                            onClick={handleCancelConfirm}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded font-medium transition"
                          >
                            Não
                          </button>
                        </div>
                      ) : payingId === inst.id ? (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Processando
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <button
                            onClick={() => handlePayClick(inst.id)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition"
                          >
                            <Clock className="w-3.5 h-3.5" /> Marcar Pago
                          </button>
                          {errorId === inst.id && (
                            <span className="text-[10px] text-red-500 mt-0.5 font-medium">
                              Erro ao pagar
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
