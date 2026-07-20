# Phase 0 Research: HR Journey Tab

No `[NEEDS CLARIFICATION]` markers were carried over from `spec.md`. Research here covers
the relocation-specific decisions needed to execute the plan.

## Decision: Move (not wrap or duplicate) `AdminJourney.tsx` into `HR/JourneyTab.tsx`

**Decision**: Rename/relocate `src/components/Journey/AdminJourney.tsx` to
`src/components/HR/JourneyTab.tsx`, keeping its internals (state, handlers, JSX, the
`useJourney`/`useLatenessConfig`/`userService` calls, the edit and selfie modals) unchanged.
Only the export name changes (`AdminJourney` → `JourneyTab`, keeping the default-export
convention already used by `SalaryTab.tsx`, `LatenessConfigPanel.tsx`, etc.) and its file
location.

**Rationale**: The component is already shaped exactly like the other HR tab-content
components confirmed during exploration — prop-less, self-contained, driven by its own
hook(s). `specs/003-hr-salary-tab` already established `components/HR/` as the home for
HR-tab content; keeping journey moderation in `components/Journey/` while every other
HR-owned tab lives in `components/HR/` would split ownership of "things the HR page renders"
across two folders for no benefit. A move (not a wrapper importing the old component) also
lets `App.tsx`/`Layout.tsx` cleanly drop all references to the old page, satisfying spec
FR-001's requirement that there be exactly one way to reach this feature afterward.

**Alternatives considered**:
- *Leave `AdminJourney.tsx` in `Journey/` and just `import` it as HR tab content*: rejected
  — works functionally, but perpetuates a confusing split (is journey moderation an "HR
  thing" or a "Journey thing"?) and leaves the old top-level-page-shaped file sitting next to
  `EmployeeJourney.tsx` even though it no longer is a top-level page.
- *Extract the component into several smaller pieces while moving it (filters, table, edit
  modal, selfie modal)*: rejected for this plan — see Constitution Check's Principle IV note;
  not requested by the spec, and bundling a structural refactor into a relocation increases
  regression risk without a requirement driving it. Left as a *possible* future improvement,
  not part of this change.

## Decision: Tab order — Jornadas inserted before Configuração de Atrasos

**Decision**: HR tab order becomes Funcionários → Salário → Jornadas → Configuração de
Atrasos.

**Rationale**: Directly specified by the user ("the configuration tab is always the last
one"). This also happens to match a standard UX convention: settings/configuration tabs are
conventionally placed last, after the tabs a user works with day-to-day (records, data,
transactions) — grouping Jornadas with Funcionários/Salário (all three are "look at/manage
employee data" tabs) ahead of the system-wide Configuração de Atrasos settings tab reinforces
that distinction rather than fighting it.

**Alternatives considered**:
- *Jornadas as the first tab*: rejected — no stated reason to prioritize it over Funcionários
  (the page's original anchor tab), and the user only constrained the *last* position, not
  the first.

## Decision: Distinct tab icon (`MapPin`) instead of reusing `Clock`

**Decision**: The new Jornadas tab uses the `MapPin` icon from `lucide-react`, not `Clock`
(which HR.tsx's "Configuração de Atrasos" tab already uses).

**Rationale**: Journey records are fundamentally location check-ins (latitude/longitude +
selfie); `MapPin` communicates that directly. More importantly, reusing `Clock` would put two
visually-identical icons on adjacent tabs in the same bar (Jornadas and Configuração de
Atrasos), which hurts at-a-glance tab recognition — a concrete, checkable instance of the
user's explicit ask to apply UX best practices to this refactor.

**Alternatives considered**:
- *Reuse `Clock`, matching the icon `Layout.tsx` used for both the removed `journey` and
  `admin-journey` menu entries today*: rejected — that icon choice made sense when the two
  entries were on separate top-level menus (never seen side by side); once relocated into the
  same tab bar as Configuração de Atrasos, the collision becomes a real, visible problem.

## Decision: Visibility gate stays exactly where it already is (`HR.tsx`'s `canAccess`)

**Decision**: No new permission logic is added. `HR.tsx` already gates the whole page on
`isSuperAdmin || isHR`; since `Layout.tsx`'s removed `admin-journey` menu item used the
identical rule, the Jornadas tab is simply covered by the page-level gate that already
existed — nothing new to write, nothing to keep in sync between two places anymore.

**Rationale**: Directly satisfies spec FR-003/FR-009 ("keep the same permissions"). Confirmed
during the spec phase that both gates were already textually identical
(`isSuperAdmin || isHR`), so unifying them is risk-free — there is no case where a user could
see one but not the other today, so no user's visibility changes.

**Alternatives considered**:
- *Add a per-tab visibility check inside `HR.tsx` for the Jornadas tab specifically*:
  rejected — unnecessary, since the page-level gate already exactly matches; adding a
  redundant, separately-maintained check would only create a future opportunity for the two
  to drift apart.
