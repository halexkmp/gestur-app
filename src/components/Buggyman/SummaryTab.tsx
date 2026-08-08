import { CalendarRange, Loader2, RefreshCw } from 'lucide-react';
import { useLoanPeriodSummary } from '../../hooks/useLoanPeriodSummary';
import { usePartnerLoanDrawer } from '../../hooks/usePartnerLoanDrawer';
import { formatDateBR } from '../../lib/formatters';
import LoanDrawer from '../LoanDrawer';
import PeriodRangeFilter from './PeriodRangeFilter';
import PeriodTotalsCards from './PeriodTotalsCards';
import PeriodSplitBars from './PeriodSplitBars';
import PartnerBreakdownTable from './PartnerBreakdownTable';
import SummaryTabStates from './SummaryTabStates';

export default function SummaryTab() {
  const {
    summary,
    startDate,
    endDate,
    preset,
    setRange,
    applyPreset,
    invalidRange,
    loading,
    refreshing,
    error,
    refetch,
  } = useLoanPeriodSummary();

  const { drawerPartner, resolving, openFor, close } = usePartnerLoanDrawer();

  const isEmptyPeriod = !!summary && summary.installments_count === 0;

  return (
    <div className="space-y-6">
      <PeriodRangeFilter
        startDate={startDate}
        endDate={endDate}
        preset={preset}
        invalidRange={invalidRange}
        onPresetSelect={applyPreset}
        onDateChange={setRange}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarRange className="w-4 h-4 text-gray-400" />
          <span>
            Vencimentos de <strong>{formatDateBR(startDate)}</strong> a{' '}
            <strong>{formatDateBR(endDate)}</strong>
          </span>
          {resolving && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        </div>

        <button
          onClick={refetch}
          disabled={invalidRange || loading || refreshing}
          title="Atualizar"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading || error || !summary || isEmptyPeriod ? (
        <SummaryTabStates
          loading={loading}
          error={error}
          isEmptyPeriod={isEmptyPeriod}
          onRetry={refetch}
        />
      ) : (
        <div className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="space-y-6">
            <PeriodTotalsCards summary={summary} />
            <PeriodSplitBars summary={summary} />
            <PartnerBreakdownTable
              partners={summary.partners}
              onSelectPartner={openFor}
            />
          </div>
        </div>
      )}

      <LoanDrawer
        isOpen={!!drawerPartner}
        onClose={close}
        partner={drawerPartner}
      />
    </div>
  );
}
