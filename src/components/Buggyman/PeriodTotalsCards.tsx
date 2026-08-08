import { TrendingUp, CheckCircle2, AlertCircle, Coins, PiggyBank, Users } from 'lucide-react';
import { LoanPeriodSummary } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface PeriodTotalsCardsProps {
  summary: LoanPeriodSummary;
}

export default function PeriodTotalsCards({ summary }: PeriodTotalsCardsProps) {
  const primary = [
    {
      label: 'Previsto a receber',
      hint: 'vencimentos no período',
      value: summary.expected_revenue,
      icon: TrendingUp,
      tone: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Já recebido',
      hint: 'pago nas parcelas do período',
      value: summary.received_amount,
      icon: CheckCircle2,
      tone: 'text-green-600 bg-green-50',
    },
    {
      label: 'Em aberto',
      hint: 'ainda a receber',
      value: summary.outstanding_amount,
      icon: AlertCircle,
      tone: 'text-amber-600 bg-amber-50',
    },
  ];

  const secondary = [
    { label: 'Retorno de capital', value: formatCurrency(summary.expected_capital), icon: Coins },
    { label: 'Lucro previsto', value: formatCurrency(summary.expected_profit), icon: PiggyBank },
    { label: 'Parcelas', value: String(summary.installments_count), icon: TrendingUp },
    { label: 'Bugueiros', value: String(summary.partners_count), icon: Users },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {primary.map(({ label, hint, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
              </div>
              <span className={`p-2 rounded-lg ${tone}`}>
                <Icon className="w-5 h-5" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {secondary.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
