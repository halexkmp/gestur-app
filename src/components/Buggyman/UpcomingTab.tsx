import { useUpcomingInstallments } from '../../hooks/useUpcomingInstallments';
import { usePartnerLoanDrawer } from '../../hooks/usePartnerLoanDrawer';
import LoanDrawer from '../LoanDrawer';
import PeriodRangeFilter from './PeriodRangeFilter';
import UpcomingFiltersBar from './UpcomingFiltersBar';
import UpcomingSummaryBar from './UpcomingSummaryBar';
import UpcomingInstallmentsTable from './UpcomingInstallmentsTable';
import UpcomingInstallmentsCards from './UpcomingInstallmentsCards';
import UpcomingTabStates from './UpcomingTabStates';

export default function UpcomingTab() {
  const {
    installments,
    rowCount,
    totalOutstanding,
    overdueCount,
    startDate,
    endDate,
    preset,
    includeOverdue,
    setRange,
    applyPreset,
    setIncludeOverdue,
    invalidRange,
    isEmpty,
    loading,
    refreshing,
    error,
    refetch,
  } = useUpcomingInstallments();

  const { drawerPartner, resolving, openFor, close } = usePartnerLoanDrawer();

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

      <UpcomingFiltersBar
        startDate={startDate}
        endDate={endDate}
        includeOverdue={includeOverdue}
        overdueCount={overdueCount}
        refreshing={refreshing || loading}
        resolving={resolving}
        disabled={invalidRange || loading || refreshing}
        onIncludeOverdueChange={setIncludeOverdue}
        onRefresh={refetch}
      />

      {loading || error || !installments || isEmpty ? (
        <UpcomingTabStates
          loading={loading}
          error={error}
          isEmpty={isEmpty}
          includeOverdue={includeOverdue}
          onRetry={refetch}
        />
      ) : (
        <div className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="space-y-4">
            <UpcomingSummaryBar
              rowCount={rowCount}
              totalOutstanding={totalOutstanding}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <UpcomingInstallmentsTable
                installments={installments}
                onSelectPartner={openFor}
              />
              <UpcomingInstallmentsCards
                installments={installments}
                onSelectPartner={openFor}
              />
            </div>
          </div>
        </div>
      )}

      <LoanDrawer isOpen={!!drawerPartner} onClose={close} partner={drawerPartner} />
    </div>
  );
}
