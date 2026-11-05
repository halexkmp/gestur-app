import { describe, it, expect } from 'vitest';
import { canSubmitJustification, getAuditVerdict, getDeviceWarnings } from './tirolesaVerdict';
import { TirolesaAuditDay } from '../types';

const day = (overrides: Partial<TirolesaAuditDay> = {}): TirolesaAuditDay => ({
  date: '2026-11-04',
  descents_detected: 10,
  descents_sold: 10,
  descents_below_default_price: 0,
  descents_justified: 0,
  unexplained: 0,
  sold_above_detected: 0,
  sales_amount: 500,
  estimated_unpaid_value: 0,
  status: 'BALANCED',
  device_hours: 8,
  clock_suspect_trips: 0,
  sensor_warning: false,
  justifications: [],
  ...overrides,
});

const past = { isToday: false, setupPending: false };

describe('getAuditVerdict', () => {
  it('setup wins over any status', () => {
    const verdict = getAuditVerdict(day({ status: 'UNEXPLAINED', unexplained: 2 }), {
      isToday: false,
      setupPending: true,
    });
    expect(verdict).toMatchObject({ kind: 'setup', tone: 'grey', title: 'Configuração pendente' });
  });

  it('setup applies with no day loaded', () => {
    expect(getAuditVerdict(null, { isToday: false, setupPending: true })?.kind).toBe('setup');
  });

  it('returns null with no day and setup done', () => {
    expect(getAuditVerdict(null, past)).toBeNull();
  });

  it('today is in progress before any result', () => {
    const verdict = getAuditVerdict(day({ status: 'UNEXPLAINED', unexplained: 2 }), {
      isToday: true,
      setupPending: false,
    });
    expect(verdict).toEqual({
      kind: 'in-progress',
      tone: 'blue',
      title: 'Dia em andamento',
      detail: 'O resultado final sai quando o dia terminar',
    });
  });

  it('no contact and no rides cannot be verified, even with sales', () => {
    const verdict = getAuditVerdict(
      day({
        device_hours: 0,
        descents_detected: 0,
        descents_sold: 3,
        sold_above_detected: 3,
        status: 'SOLD_ABOVE_DETECTED',
      }),
      past,
    );
    expect(verdict).toEqual({
      kind: 'unverifiable',
      tone: 'amber',
      title: 'Não foi possível conferir',
      detail: 'O dispositivo não foi visto neste dia',
    });
  });

  it('unexplained shows count and value', () => {
    const verdict = getAuditVerdict(
      day({ status: 'UNEXPLAINED', unexplained: 2, estimated_unpaid_value: 100 }),
      past,
    );
    expect(verdict?.kind).toBe('unexplained');
    expect(verdict?.tone).toBe('red');
    expect(verdict?.title).toBe('2 descidas sem explicação');
    expect(verdict?.detail).toMatch(/^Valor estimado: R\$\s100,00$/);
  });

  it('uses the singular for one descent', () => {
    const verdict = getAuditVerdict(day({ status: 'UNEXPLAINED', unexplained: 1 }), past);
    expect(verdict?.title).toBe('1 descida sem explicação');
  });

  it('sold above detected', () => {
    const verdict = getAuditVerdict(
      day({ status: 'SOLD_ABOVE_DETECTED', sold_above_detected: 2 }),
      past,
    );
    expect(verdict).toEqual({
      kind: 'sold-above',
      tone: 'amber',
      title: 'Vendas acima do detectado',
      detail: '2 descidas: verifique o sensor ou vendas sem descida',
    });
  });

  it('no activity', () => {
    const verdict = getAuditVerdict(
      day({ descents_detected: 0, descents_sold: 0, descents_justified: 0 }),
      past,
    );
    expect(verdict).toMatchObject({
      kind: 'no-activity',
      tone: 'grey',
      title: 'Sem movimento neste dia',
    });
  });

  it('clock suspect stops a green result', () => {
    const verdict = getAuditVerdict(day({ clock_suspect_trips: 2 }), past);
    expect(verdict).toEqual({
      kind: 'clock-suspect',
      tone: 'amber',
      title: 'Confira os horários',
      detail: '2 descidas com horário suspeito entraram neste dia',
    });
  });

  it('balanced', () => {
    expect(getAuditVerdict(day(), past)).toMatchObject({
      kind: 'balanced',
      tone: 'green',
      title: 'Dia conferido',
    });
  });
});

describe('getDeviceWarnings', () => {
  it('warns when the device was not seen', () => {
    expect(getDeviceWarnings(day({ device_hours: 0 }), false, 'unexplained')).toEqual([
      'Dispositivo não visto neste dia',
    ]);
  });

  it('does not repeat what the verdict says about the device', () => {
    expect(getDeviceWarnings(day({ device_hours: 0 }), false, 'unverifiable')).toEqual([]);
  });

  it('has no device warning on today', () => {
    expect(getDeviceWarnings(day({ device_hours: 0 }), true, 'in-progress')).toEqual([]);
  });

  it('warns about suspect clocks', () => {
    expect(getDeviceWarnings(day({ clock_suspect_trips: 2 }), false, 'sold-above')).toEqual([
      '2 descidas com horário suspeito',
    ]);
  });

  it('does not repeat what the verdict says about clocks', () => {
    expect(getDeviceWarnings(day({ clock_suspect_trips: 2 }), false, 'clock-suspect')).toEqual([]);
  });
});

describe('canSubmitJustification', () => {
  it('accepts a whole quantity and a reason', () => {
    expect(canSubmitJustification(1, 'x')).toBe(true);
  });

  it.each([
    [0, 'x'],
    [1.5, 'x'],
    [1, ''],
    [1, '   '],
  ])('rejects quantity %s with reason "%s"', (quantity, reason) => {
    expect(canSubmitJustification(quantity, reason)).toBe(false);
  });
});
