import { useCallback, useEffect, useRef, useState } from 'react';
import { partnerService } from '../services/partnerService';
import { LoanPeriodSummaryPartner, Partner, PartnerType } from '../types';

/**
 * Turns a period-summary row into the full `Partner` that LoanDrawer requires.
 *
 * The buggyman list is loaded once and matched by id; a partner missing from it
 * falls back to GET /partners/{id}. A partial `Partner` is never constructed —
 * `types/partner.ts` requires `loans`, `pix_key`, `type`, `active` and
 * `created_at`, and `active` in particular drives the drawer's Ativo/Inativo
 * badge, which the period summary rows cannot supply.
 */
export const usePartnerLoanDrawer = () => {
  const partnersRef = useRef<Partner[]>([]);
  const [drawerPartner, setDrawerPartner] = useState<Partner | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let active = true;
    partnerService
      .getByType(PartnerType.BUGGYMAN)
      .then((data) => {
        if (active) partnersRef.current = data;
      })
      .catch(() => {
        // Non-fatal: drill-through falls back to a per-id lookup.
        if (active) partnersRef.current = [];
      });
    return () => {
      active = false;
    };
  }, []);

  const openFor = useCallback(async (row: LoanPeriodSummaryPartner) => {
    const known = partnersRef.current.find((p) => p.id === row.partner_id);
    if (known) {
      setDrawerPartner(known);
      return;
    }

    setResolving(true);
    try {
      const fetched = await partnerService.getById(row.partner_id);
      setDrawerPartner(fetched);
    } catch {
      setDrawerPartner(null);
    } finally {
      setResolving(false);
    }
  }, []);

  const close = useCallback(() => {
    setDrawerPartner(null);
  }, []);

  return { drawerPartner, resolving, openFor, close };
};
