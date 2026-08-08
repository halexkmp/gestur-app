import { LoanPeriodSummaryPartner } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import PartnerProgress from './PartnerProgress';

interface PartnerBreakdownCardsProps {
  partners: LoanPeriodSummaryPartner[];
  onSelectPartner: (partner: LoanPeriodSummaryPartner) => void;
}

/** Stacked card layout used below the `sm` breakpoint, where a table would
 *  force the page to scroll sideways. */
export default function PartnerBreakdownCards({
  partners,
  onSelectPartner,
}: PartnerBreakdownCardsProps) {
  return (
    <ul className="sm:hidden divide-y divide-gray-200">
      {partners.map((partner) => (
        <li key={partner.partner_id}>
          <button
            onClick={() => onSelectPartner(partner)}
            className="w-full text-left p-4 hover:bg-gray-50 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium text-gray-900">{partner.partner_name}</span>
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                {formatCurrency(partner.scheduled_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">
                Recebido {formatCurrency(partner.received_amount)}
              </span>
              <span className="text-amber-700">
                Em aberto {formatCurrency(partner.outstanding_amount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                {partner.installments_count} parcela(s)
              </span>
              <div className="w-32">
                <PartnerProgress partner={partner} />
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
