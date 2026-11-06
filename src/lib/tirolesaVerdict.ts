import { TirolesaAuditDay } from '../types';
import { formatCurrency } from './formatters';

export type VerdictKind =
  | 'setup'
  | 'in-progress'
  | 'unverifiable'
  | 'unexplained'
  | 'sold-above'
  | 'no-activity'
  | 'clock-suspect'
  | 'balanced';

export type VerdictTone = 'grey' | 'blue' | 'amber' | 'red' | 'green';

export interface AuditVerdict {
  kind: VerdictKind;
  tone: VerdictTone;
  title: string;
  detail?: string;
}

const passengers = (count: number): string => `${count} ${count === 1 ? 'passageiro' : 'passageiros'}`;

const trips = (count: number): string => `${count} ${count === 1 ? 'descida' : 'descidas'}`;

const suspectTrips = (count: number): string =>
  `${trips(count)} com horário suspeito`;

export const getAuditVerdict = (
  day: TirolesaAuditDay | null,
  { isToday, setupPending }: { isToday: boolean; setupPending: boolean },
): AuditVerdict | null => {
  if (setupPending) {
    return { kind: 'setup', tone: 'grey', title: 'Configuração pendente' };
  }
  if (!day) return null;

  if (isToday) {
    return {
      kind: 'in-progress',
      tone: 'blue',
      title: 'Dia em andamento',
      detail: 'O resultado final sai quando o dia terminar',
    };
  }
  if (day.device_hours === 0 && day.passengers_detected === 0) {
    return {
      kind: 'unverifiable',
      tone: 'amber',
      title: 'Não foi possível conferir',
      detail: 'O dispositivo não foi visto neste dia',
    };
  }
  if (day.status === 'UNEXPLAINED') {
    return {
      kind: 'unexplained',
      tone: 'red',
      title: `${passengers(day.unexplained)} sem explicação`,
      detail: `Valor estimado: ${formatCurrency(day.estimated_unpaid_value)}`,
    };
  }
  if (day.status === 'SOLD_ABOVE_DETECTED') {
    return {
      kind: 'sold-above',
      tone: 'amber',
      title: 'Vendas acima do detectado',
      detail: `${passengers(day.sold_above_detected)}: verifique o sensor ou vendas sem descida`,
    };
  }
  if (day.passengers_detected === 0 && day.passengers_sold === 0 && day.passengers_justified === 0) {
    return { kind: 'no-activity', tone: 'grey', title: 'Sem movimento neste dia' };
  }
  if (day.clock_suspect_trips > 0) {
    return {
      kind: 'clock-suspect',
      tone: 'amber',
      title: 'Confira os horários',
      detail: `${suspectTrips(day.clock_suspect_trips)} entraram neste dia`,
    };
  }
  return { kind: 'balanced', tone: 'green', title: 'Dia conferido' };
};

export const getDeviceWarnings = (
  day: TirolesaAuditDay,
  isToday: boolean,
  verdictKind: VerdictKind,
): string[] => {
  const warnings: string[] = [];
  if (day.device_hours === 0 && !isToday && verdictKind !== 'unverifiable') {
    warnings.push('Dispositivo não visto neste dia');
  }
  if (day.clock_suspect_trips > 0 && verdictKind !== 'clock-suspect') {
    warnings.push(suspectTrips(day.clock_suspect_trips));
  }
  return warnings;
};

export const canSubmitJustification = (quantity: number, reason: string): boolean =>
  Number.isInteger(quantity) && quantity >= 1 && reason.trim().length > 0;
