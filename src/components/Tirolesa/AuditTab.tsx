import { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTirolesaAudit } from '../../hooks/useTirolesaAudit';
import { useTirolesaSetup } from '../../hooks/useTirolesaSetup';
import { TirolesaJustification, TirolesaJustificationType } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { getAuditVerdict, getDeviceWarnings } from '../../lib/tirolesaVerdict';
import AuditVerdict from './AuditVerdict';
import JustifyRidesModal from './JustifyRidesModal';

interface AuditTabProps {
  audit: ReturnType<typeof useTirolesaAudit>;
  setup: ReturnType<typeof useTirolesaSetup>;
  onOpenSetup: () => void;
}

const TYPE_LABELS: Record<TirolesaJustificationType, string> = {
  TEST: 'Teste',
  COURTESY: 'Cortesia',
  OTHER: 'Outro',
};

const longDate = (date: string): string => {
  const label = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const time = (value: string): string =>
  new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function AuditTab({ audit, setup, onOpenSetup }: AuditTabProps) {
  const [justifying, setJustifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { day } = audit;
  const loadError = audit.error ?? setup.error;
  const stillLoading = audit.loading || (!setup.loaded && setup.loading);

  const handleRetry = () => {
    if (audit.error) audit.reload();
    if (setup.error) setup.reload();
  };

  const handleRemove = async (justification: TirolesaJustification) => {
    if (!window.confirm('Remover esta justificativa? Isso altera o resultado do dia.')) return;
    setActionError(null);
    try {
      await audit.removeJustification(justification.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao remover a justificativa');
    }
  };

  const verdict =
    stillLoading || loadError
      ? null
      : getAuditVerdict(day, { isToday: audit.isToday, setupPending: setup.setupPending });
  const showDetails = day !== null && verdict !== null && verdict.kind !== 'setup';

  const cards = day
    ? [
        { label: 'Detectadas', value: day.descents_detected },
        { label: 'Vendidas', value: day.descents_sold },
        { label: 'Justificadas', value: day.descents_justified },
        {
          label: 'Abaixo do preço',
          value: day.descents_below_default_price,
          hint: 'Vendas abaixo do preço padrão',
          warn: day.descents_below_default_price > 0,
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      {setup.loaded && setup.devices.length > 0 && !setup.hasActiveDevice && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> Nenhum dispositivo ativo
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={audit.goToPreviousDay}
            aria-label="Dia anterior"
            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-gray-800 text-center">{longDate(audit.selectedDate)}</span>
          <button
            onClick={audit.goToNextDay}
            disabled={audit.isToday}
            aria-label="Próximo dia"
            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={audit.goToYesterday}
          disabled={audit.isYesterday}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm disabled:opacity-40"
        >
          Ontem
        </button>
      </div>

      {stillLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Carregando auditoria...
        </div>
      )}

      {!stillLoading && loadError && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
          <p className="text-red-600">{loadError}</p>
          <button onClick={handleRetry} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Tentar novamente
          </button>
        </div>
      )}

      {verdict && showDetails && day &&
        getDeviceWarnings(day, audit.isToday, verdict.kind).map((warning) => (
          <div key={warning} className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {warning}
          </div>
        ))}

      {verdict && <AuditVerdict verdict={verdict} onOpenSetup={onOpenSetup} />}

      {showDetails && day && (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className={`rounded-xl shadow-sm border p-4 ${card.warn ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}
              >
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {card.warn && <p className="text-xs text-amber-800 mt-1">{card.hint}</p>}
              </div>
            ))}
          </div>

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-800">Justificativas</h2>
              <button
                onClick={() => setJustifying(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Justificar
              </button>
            </div>
            {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            {day.justifications.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma justificativa neste dia.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {day.justifications.map((justification) => (
                  <li key={justification.id} className="flex items-start justify-between gap-3 py-2">
                    <div className="text-sm">
                      <p className="text-gray-800">
                        {justification.quantity} × {TYPE_LABELS[justification.type]}: {justification.reason}
                      </p>
                      <p className="text-xs text-gray-500">
                        {justification.created_by.name} · {time(justification.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(justification)}
                      aria-label="Remover justificativa"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-sm text-gray-500">
            Vendas: {formatCurrency(day.sales_amount)} · Dispositivo online: {day.device_hours} h
          </p>
        </>
      )}

      {justifying && (
        <JustifyRidesModal
          date={audit.selectedDate}
          onSave={audit.addJustification}
          onClose={() => setJustifying(false)}
        />
      )}
    </div>
  );
}
