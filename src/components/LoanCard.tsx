import { useState } from 'react';
import { ChevronDown,
  ChevronUp,
  Calendar,
  Percent,
  Loader2,
  Copy,
  Check } from 'lucide-react';
import { Loan, LoanStatus } from '../types';
import InstallmentList from './InstallmentList';
import { loanService } from '../services/loanService';

interface LoanCardProps {
  loan: Loan;
  isExpanded: boolean;
  onToggle: () => void;
  loadingDetails: boolean;
  onUpdateStatus: (loanId: string, status: LoanStatus) => Promise<Loan>;
  onRefresh: () => Promise<void>;
}

export default function LoanCard({
  loan,
  isExpanded,
  onToggle,
  loadingDetails,
  onUpdateStatus,
  onRefresh,
}: LoanCardProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);  const formatCurrency = (amount: string | number) => {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getInstallmentStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';

      case 'PARTIALLY_PAID':
        return 'Parcialmente Pago';

      case 'PAID':
        return 'Pago';

      default:
        return status;
    }
  };
  const handleCopyReport = async (
      e: React.MouseEvent<HTMLButtonElement>
  ) => {

    e.stopPropagation();

    try {

      setCopying(true);

      const summary = await loanService.getSummary(loan.id);

      const history = summary.installments.map(installment => {

        let text =
            `📌 Parcela ${installment.installment_number}
Vencimento: ${formatDate(installment.due_date)}
Valor: ${formatCurrency(installment.amount)}
Status: ${getInstallmentStatus(installment.status)}
`;

        if (installment.payments.length === 0) {

          text += "\n   Nenhum pagamento realizado.";

        } else {

          text += "\n   Pagamentos:\n";

          installment.payments.forEach(payment => {

            text += `   • ${formatDate(payment.payment_date)} — ${formatCurrency(payment.amount)}\n`;

          });

        }

        return text;

      }).join("\n━━━━━━━━━━━━━━━\n\n");

      const report =
          `📋 Atualização do seu empréstimo – CredBugueiro

👤 Cliente: ${summary.partner_name}

💵 Valor emprestado: ${formatCurrency(summary.principal_amount)}
💰 Valor total do contrato: ${formatCurrency(summary.total_amount)}

📅 Início: ${formatDate(summary.start_date)}
📅 Vencimento: ${formatDate(summary.end_date)}

📈 Juros: ${summary.interest_rate}%

━━━━━━━━━━━━━━━

📊 Resumo

• Parcelas: ${summary.installments_qty}

• Pagas: ${summary.paid_installments}

• Parciais: ${summary.partially_paid_installments}

• Pendentes: ${summary.pending_installments}

• Pagamentos realizados: ${summary.total_payments}

━━━━━━━━━━━━━━━

${history}

━━━━━━━━━━━━━━━

💰 Total pago: ${formatCurrency(summary.total_paid)}

💳 Saldo devedor: ${formatCurrency(summary.remaining_balance)}

${summary.remaining_balance === "0.00"
              ? "✅ Empréstimo quitado."
              : summary.status === "DEFAULTED"
                  ? "🚨 Contrato vencido."
                  : "📌 Empréstimo em andamento."
          }

🤝 Qualquer dúvida, estou à disposição.`;

      await navigator.clipboard.writeText(report);

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);

    } finally {

      setCopying(false);

    }

  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FINISHED':
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEFAULTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED':
      case 'CANCELED':
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
      case 'PAID':
        return 'Pago';
      case 'DEFAULTED':
        return 'Inadimplente';
      case 'CANCELLED':
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as LoanStatus;
    setUpdatingStatus(true);
    setStatusError(null);
    try {
      await onUpdateStatus(loan.id, newStatus);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    } finally {
      setUpdatingStatus(false);
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
        <div className="flex items-center gap-2">
          <button
              onClick={handleCopyReport}
              disabled={copying}
              className="p-1 rounded hover:bg-blue-100 disabled:opacity-50"
          >

            {copying ? (

                <Loader2 className="w-4 h-4 animate-spin text-blue-600"/>

            ) : copied ? (

                <Check className="w-4 h-4 text-green-600"/>

            ) : (

                <Copy className="w-4 h-4 text-blue-600"/>

            )}

          </button>

          <div className="text-gray-400">
            {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
            ) : (
                <ChevronDown className="w-5 h-5" />
            )}
          </div>
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

          <div className="bg-white p-3 rounded-lg border border-gray-150 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alterar Status:</span>
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 sm:justify-end">
              <select
                value={loan.status}
                disabled={updatingStatus}
                onChange={handleStatusChange}
                className="text-sm bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 disabled:bg-gray-100 transition"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="PAID">Pago</option>
                <option value="CANCELED">Cancelado</option>
                {loan.status === 'FINISHED' && <option value="FINISHED">Finalizado</option>}
                {loan.status === 'DEFAULTED' && <option value="DEFAULTED">Inadimplente</option>}
                {loan.status === 'CANCELLED' && <option value="CANCELLED">Cancelado (Antigo)</option>}
              </select>
              {statusError && (
                <span className="text-xs text-red-600 font-medium">{statusError}</span>
              )}
            </div>
          </div>

          {loadingDetails && !loan.installments ? (
            <div className="flex justify-center items-center py-6 gap-2 text-sm text-gray-500 font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Carregando parcelas...
            </div>
          ) : loan.installments && loan.installments.length > 0 ? (
            <InstallmentList
              installments={loan.installments}
              onRefresh={onRefresh}
            />
          ) : (
            <p className="text-xs text-gray-500 py-2 text-center">Nenhuma parcela disponível.</p>
          )}
        </div>
      )}
    </div>
  );
}
