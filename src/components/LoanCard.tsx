import { ChevronDown, ChevronUp, Calendar, Percent, Loader2 } from 'lucide-react';
import { Loan } from '../types';
import InstallmentList from './InstallmentList';

interface LoanCardProps {
  loan: Loan;
  isExpanded: boolean;
  onToggle: () => void;
  onPayInstallment: (installmentId: string, loanId: string) => Promise<void>;
  loadingDetails: boolean;
}

export default function LoanCard({
  loan,
  isExpanded,
  onToggle,
  onPayInstallment,
  loadingDetails,
}: LoanCardProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FINISHED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEFAULTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'FINISHED':
        return 'Finalizado';
      case 'DEFAULTED':
        return 'Inadimplente';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between gap-4 transition"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Valor Bruto</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(loan.principal_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Empréstimo</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(loan.total_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Parcelas</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{loan.installments_qty}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 ${getStatusBadgeClass(loan.status)}`}>
              {getStatusText(loan.status)}
            </span>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 bg-white p-3 rounded-lg border border-gray-150">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Taxa de Juros</p>
                <p className="text-sm font-medium text-gray-800">{loan.interest_rate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Início</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(loan.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Término</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(loan.end_date)}</p>
              </div>
            </div>
          </div>

          {loadingDetails && !loan.installments ? (
            <div className="flex justify-center items-center py-6 gap-2 text-sm text-gray-500 font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Carregando parcelas...
            </div>
          ) : loan.installments && loan.installments.length > 0 ? (
            <InstallmentList
              installments={loan.installments}
              onPay={(installmentId) => onPayInstallment(installmentId, loan.id)}
            />
          ) : (
            <p className="text-xs text-gray-500 py-2 text-center">Nenhuma parcela disponível.</p>
          )}
        </div>
      )}
    </div>
  );
}
