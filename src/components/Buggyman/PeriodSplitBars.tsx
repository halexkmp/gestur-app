import { LoanPeriodSummary } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface PeriodSplitBarsProps {
  summary: LoanPeriodSummary;
}

interface Segment {
  label: string;
  value: string;
  color: string;
}

const share = (value: string, total: number): number =>
  total > 0 ? (Number(value) / total) * 100 : 0;

function SplitBar({
  title,
  segments,
  total,
}: {
  title: string;
  segments: Segment[];
  total: number;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {total > 0 &&
          segments.map(({ label, value, color }) => (
            <div
              key={label}
              className={color}
              style={{ width: `${share(value, total)}%` }}
              title={`${label}: ${formatCurrency(value)}`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
        {segments.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PeriodSplitBars({ summary }: PeriodSplitBarsProps) {
  const total = Number(summary.expected_revenue);
  const hasRevenue = Number.isFinite(total) && total > 0;
  const collectionRate = hasRevenue
    ? Math.round((Number(summary.received_amount) / total) * 100)
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-800">Composição do período</h3>
        <div className="text-right">
          <span className="text-xs text-gray-500">% recebido</span>
          <p className="text-xl font-bold text-gray-900">
            {collectionRate === null ? '—' : `${collectionRate}%`}
          </p>
        </div>
      </div>

      <SplitBar
        title="Capital x lucro"
        total={total}
        segments={[
          { label: 'Retorno de capital', value: summary.expected_capital, color: 'bg-blue-500' },
          { label: 'Lucro previsto', value: summary.expected_profit, color: 'bg-violet-500' },
        ]}
      />

      <SplitBar
        title="Recebido x em aberto"
        total={total}
        segments={[
          { label: 'Já recebido', value: summary.received_amount, color: 'bg-green-500' },
          { label: 'Em aberto', value: summary.outstanding_amount, color: 'bg-amber-500' },
        ]}
      />
    </div>
  );
}
