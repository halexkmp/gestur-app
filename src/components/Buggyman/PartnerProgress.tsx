import { LoanPeriodSummaryPartner } from '../../types';

const isSettled = (partner: LoanPeriodSummaryPartner): boolean =>
  Number(partner.outstanding_amount) === 0;

const progressOf = (partner: LoanPeriodSummaryPartner): number => {
  const scheduled = Number(partner.scheduled_amount);
  if (!Number.isFinite(scheduled) || scheduled <= 0) return 0;
  return Math.min(100, Math.round((Number(partner.received_amount) / scheduled) * 100));
};

/** Per-partner collection progress, with a distinct settled state. */
export default function PartnerProgress({
  partner,
}: {
  partner: LoanPeriodSummaryPartner;
}) {
  const progress = progressOf(partner);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[3rem]">
        <div
          className={isSettled(partner) ? 'h-full bg-green-500' : 'h-full bg-blue-500'}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isSettled(partner) ? (
        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          Quitado
        </span>
      ) : (
        <span className="text-xs text-gray-500 w-9 text-right">{progress}%</span>
      )}
    </div>
  );
}
