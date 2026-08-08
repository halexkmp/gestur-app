import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { LoanPeriodSummaryPartner } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import PartnerProgress from './PartnerProgress';
import PartnerBreakdownCards from './PartnerBreakdownCards';

type SortKey = 'scheduled' | 'outstanding' | 'name';
type SortDirection = 'asc' | 'desc';

interface PartnerBreakdownTableProps {
  partners: LoanPeriodSummaryPartner[];
  onSelectPartner: (partner: LoanPeriodSummaryPartner) => void;
}

const SORTABLE: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Bugueiro', numeric: false },
  { key: 'scheduled', label: 'Previsto', numeric: true },
  { key: 'outstanding', label: 'Em aberto', numeric: true },
];

export default function PartnerBreakdownTable({
  partners,
  onSelectPartner,
}: PartnerBreakdownTableProps) {
  // A null sort key keeps the server's order: scheduled desc, then name asc.
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [nameFilter, setNameFilter] = useState('');

  const visiblePartners = useMemo(() => {
    const filtered = nameFilter
      ? partners.filter((p) =>
          p.partner_name.toLowerCase().includes(nameFilter.toLowerCase())
        )
      : partners;

    if (!sortKey) return filtered;

    const factor = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') {
        return a.partner_name.localeCompare(b.partner_name, 'pt-BR') * factor;
      }
      const field = sortKey === 'scheduled' ? 'scheduled_amount' : 'outstanding_amount';
      return (Number(a[field]) - Number(b[field])) * factor;
    });
  }, [partners, nameFilter, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    const Icon = sortDirection === 'asc' ? ArrowUp : ArrowDown;
    return <Icon className="w-3 h-3" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800">Por bugueiro</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar bugueiro..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {visiblePartners.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-gray-500">
          Nenhum bugueiro encontrado.
        </p>
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {SORTABLE.map(({ key, label, numeric }) => (
                    <th
                      key={key}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        numeric ? 'text-right' : 'text-left'
                      }`}
                    >
                      <button
                        onClick={() => toggleSort(key)}
                        className={`inline-flex items-center gap-1 hover:text-gray-700 ${
                          numeric ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {label}
                        {sortIcon(key)}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recebido
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parcelas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Progresso
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visiblePartners.map((partner) => (
                  <tr key={partner.partner_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectPartner(partner)}
                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                      >
                        {partner.partner_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(partner.scheduled_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700">
                      {formatCurrency(partner.outstanding_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {formatCurrency(partner.received_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {partner.installments_count}
                    </td>
                    <td className="px-4 py-3">
                      <PartnerProgress partner={partner} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PartnerBreakdownCards
            partners={visiblePartners}
            onSelectPartner={onSelectPartner}
          />
        </>
      )}
    </div>
  );
}
