# Frontend Implementation Guide

This document defines how AI coding agents and developers must implement frontend features in the Gestur App.

The objective is to maximize consistency, maintainability, predictability, and code quality while minimizing architectural drift.

---

# Priority Order (Highest to Lowest)

When implementing a feature, always follow this priority order:

1. `requirements.md`
2. `agents.md`
3. Existing project patterns

If any conflict exists, always follow the document with the highest priority.

---

# Mandatory Workflow

For every new feature, ALWAYS follow this workflow.

1. Read and fully understand `requirements.md`.
2. Inspect similar implementations already present in the project.
3. Reuse existing components, hooks, services and UI patterns whenever possible.
4. Create `plan.md`.
5. Create `tasks.md`.
6. Implement the feature.
7. Mark completed tasks immediately.
8. Do not implement behavior not described in `requirements.md`.

Never skip any step.

---

# 1. Core Principles

Before writing code, validate all of the following.

- Every feature should integrate naturally with the existing UI.
- Prefer extending existing screens instead of creating new pages.
- Components should have a single responsibility.
- Business logic should not live inside components.
- Components should focus on rendering.
- Complex logic belongs in custom hooks.
- API communication belongs only in services.
- Types belong in `src/types`.
- Reuse existing components before creating new ones.
- Prefer consistency over introducing new abstractions.
- Minimize unrelated changes.

---

# 2. Project Structure

Files must follow these responsibilities.

```
src/
    assets/
    components/
    contexts/
    hooks/
    lib/
    services/
    types/
```

## Components

Reusable UI.

Large components should be split into smaller components.

---

## Hooks

Contain reusable logic.

Examples:

- data fetching
- state orchestration
- derived state
- side effects

Hooks should not render UI.

---

## Services

Contain API communication only.

Responsibilities:

- HTTP requests
- response parsing
- error propagation

Services must never contain UI logic.

---

## Types

Contain:

- Interfaces
- Enums
- Shared frontend models

Do not duplicate API models unnecessarily.

---

## Lib

Contains stable utilities.

Examples:

- API client
- formatters
- constants
- helpers

---

# 3. TypeScript Guidelines

Always use strict typing.

Rules:

- Never use `any`.
- Prefer `interface` for objects.
- Use `type` for unions.
- Explicitly type function parameters.
- Explicitly type return values.

Avoid unnecessary type assertions.

---

# 4. Component Guidelines

Components should be small and focused.

Preferred maximum size:

Approximately 150 lines.

If a component becomes too large:

- Extract child components.
- Extract hooks.
- Extract helper functions.

A component should primarily describe UI.

---

# 5. Hooks Guidelines

Create a custom hook whenever logic becomes reusable or complex.

Good candidates:

- Data fetching
- Pagination
- Filtering
- Form state
- Modal state
- Drawer state

Hooks should expose a simple API to components.

---

# 6. State Management

Prefer:

- Local state (`useState`)
- Memoization (`useMemo`)
- Callbacks (`useCallback`)

Use Context only for shared application state.

Avoid prop drilling whenever Context already exists.

---

# 7. Styling Guidelines

Use Tailwind CSS exclusively.

Rules:

- No inline styles.
- Group classes logically.
- Reuse existing design patterns.
- Keep spacing consistent.

Prefer existing UI patterns over inventing new ones.

---

# 8. API Communication

Services are the only layer allowed to communicate with the backend.

Components must never perform fetch requests directly.

Services should:

- Call API
- Return typed objects
- Throw descriptive errors

---

# 9. Error Handling

UI should display user-friendly feedback.

Services should throw descriptive errors.

Never:

- console.log
- debugger
- alert

Production code must not contain debugging statements.

---

# 10. Consistency First

When implementing a feature:

- Reuse existing UI.
- Reuse existing components.
- Reuse existing hooks.
- Reuse existing services.
- Preserve naming conventions.
- Keep changes minimal.

Consistency is preferred over cleverness.

---

# 11. Missing Requirements

If requirements are ambiguous:

1. Search the project for similar implementations.
2. Follow the existing pattern.
3. Document assumptions in `plan.md`.
4. Do not invent UX behavior.

---

# 12. User Experience

Always preserve user context.

Prefer:

- Modal
- Drawer
- Expandable panels

Avoid:

- Creating unnecessary pages.
- Breaking existing navigation flow.
- Introducing inconsistent UX patterns.

A new page should only be created when explicitly requested.

---

# 13. Performance

Avoid:

- Unnecessary re-renders.
- Duplicate API requests.
- Large component trees.
- Expensive calculations during render.

Prefer:

- useMemo
- useCallback
- Lazy loading
- Component composition

---

# 14. Testing

NOT CREATE ANY TEST

---

# 15. Documentation

Each feature must have its own documentation folder.

```
docs/
    feature-name/
        requirements.md
        plan.md
        tasks.md
```

---

## requirements.md

Written by the developer or another AI agent.

Contains:

- Business requirements
- UX requirements
- Acceptance criteria
- Functional requirements

This document is the source of truth.

---

## plan.md

Must be created before implementation.

Should describe:

- UI architecture
- Component structure
- Hook strategy
- Service changes
- State management
- Risks
- Assumptions

---

## tasks.md

Must also be created before implementation.

Tasks should:

- Be grouped by phase.
- Be granular.
- Use checkboxes.

Example:

```
## Phase 1 - Types

- [ ] Create Loan interfaces

## Phase 2 - Services

- [ ] Add loanService

## Phase 3 - Hooks

- [ ] Create useLoans

## Phase 4 - Components

- [ ] Create LoanDrawer
- [ ] Create LoanCard
- [ ] Create InstallmentList

## Phase 5 - Integration

- [ ] Integrate LoanDrawer into Buggyman page
```

Completed tasks become:

```
[x]
```

---

# 16. Definition of Done

A feature is complete only when:

- Requirements were fully implemented.
- Existing UX patterns were respected.
- Components remain focused.
- Business logic is outside components.
- Services contain only API communication.
- Hooks contain reusable logic.
- Types are strongly typed.
- Documentation was updated.
- `plan.md` was created.
- `tasks.md` was created.
- All tasks are completed.
- No unrelated files were modified.

---

# 17. Don't Be Smart

Unless explicitly requested:

- Do not create new pages.
- Do not change navigation.
- Do not refactor unrelated components.
- Do not rename files.
- Do not rename components.
- Do not reorganize folders.
- Do not introduce new UI libraries.
- Do not change the design system.
- Do not change coding style.

Implement exactly what is described in `requirements.md`.