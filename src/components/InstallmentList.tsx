import React, { useState } from 'react';
import { LoanInstallment, InstallmentStatus } from '../types';
import { Check, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import InstallmentPaymentsRow from './InstallmentPaymentsRow';

interface InstallmentListProps {
  installments: LoanInstallment[];
  onRefresh: () => Promise<void>;
}

export default function InstallmentList({ installments, onRefresh }: InstallmentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getStatusBadge = (status: InstallmentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <Check className="w-3.5 h-3.5" /> Pago
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pago Parcial
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-gray-500 font-medium text-xs bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
            <Clock className="w-3.5 h-3.5" /> Pendente
          </span>
        );
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
              <th className="py-2 font-medium text-right text-xs">Ações / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedInstallments.map((inst) => {
              const isExpanded = expandedId === inst.id;
              const status: InstallmentStatus = inst.status || (inst.paid ? 'PAID' : 'PENDING');

              return (
                <React.Fragment key={inst.id}>
                  <tr className="hover:bg-gray-50">
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
                      <div className="inline-flex items-center justify-end gap-2.5">
                        {getStatusBadge(status)}
                        <button
                          onClick={() => handleToggleExpand(inst.id)}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                            isExpanded
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          {isExpanded ? (
                            <>
                              <span>Fechar</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Pagar / Ver</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="p-0 border-none">
                        <InstallmentPaymentsRow
                          installment={inst}
                          onPaymentSuccess={onRefresh}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}