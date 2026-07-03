# Feature Requirements

# Feature

Buggyman Loan Management

---

# Objective

Allow users to manage loans associated with Buggymans from the Buggyman page.

The feature must allow users to:

- View all loans for a selected Buggyman.
- Create a new loan.
- View loan details.
- View all installments of a loan.
- Register installment payments.

The feature must integrate with the existing backend API.

---

# User Stories

## US-01 - View Loans

As a user,

I want to view all loans belonging to a Buggyman,

So that I can track their financial obligations.

### Acceptance Criteria

- Every Buggyman card must provide access to its loans.
- Selecting a Buggyman opens a loan management interface.
- Loans are loaded from the API.
- Loading and empty states must be displayed appropriately.

---

## US-02 - Create Loan

As a user,

I want to register a new loan,

So that I can manage borrowed money.

### Acceptance Criteria

The loan form must collect:

- Principal amount
- Interest rate (%)
- Number of installments
- Due day
- Start date
- End date

The form must validate required fields before submission.

After successful creation:

- Close the form.
- Refresh the loan list.
- Display a success feedback.

---

## US-03 - View Loan Information

As a user,

I want to inspect the details of a loan,

So that I can understand its financial information.

### Acceptance Criteria

Each loan must display:

- Principal amount
- Interest rate
- Total amount
- Total installments
- Start date
- End date
- Loan status

---

## US-04 - View Installments

As a user,

I want to view all installments of a loan,

So that I can monitor upcoming and completed payments.

### Acceptance Criteria

Each installment must display:

- Installment number
- Amount
- Due date
- Payment date
- Payment status

Installments should be ordered by installment number.

---

## US-05 - Register Installment Payment

As a user,

I want to mark an installment as paid,

So that payment history remains accurate.

### Acceptance Criteria

Only unpaid installments can be marked as paid.

After confirmation:

- Update the installment status.
- Display the payment date.
- Refresh loan information.

---

# Functional Requirements

## FR-01

The feature must be accessible directly from the existing Buggyman page.

---

## FR-02

Loan management must be contextual to a single selected Buggyman.

---

## FR-03

The application must never mix loans from different Buggymans.

---

## FR-04

Creating a loan must not require leaving the current page.

---

## FR-05

The UI must remain responsive during API requests.

Loading indicators should be displayed while data is being fetched.

---

## FR-06

Errors returned by the API must be presented using the application's existing feedback pattern.

---

## FR-07

After any successful operation, displayed information must be refreshed automatically.

---

# UI Requirements

## Navigation

The user should access loans directly from the existing Buggyman page.

The interaction should feel like an extension of the current workflow rather than a separate module.

---

## Loan List

Each loan card should clearly display:

- Principal amount
- Total amount
- Number of installments
- Loan status

Actions should include:

- View details
- View installments

---

## Loan Form

The loan creation form should follow the existing modal design used in the application.

Fields:

- Principal amount
- Interest rate
- Installments
- Due day
- Start date
- End date

Required fields should be visually indicated.

---

## Installment List

Installments should be displayed in chronological order.

Paid installments should be visually distinguishable from unpaid ones.

Each unpaid installment should expose an action to register payment.

---

# Validation Rules

The UI must prevent submission when:

- Principal amount is empty.
- Principal amount is zero or negative.
- Interest rate is negative.
- Installments is less than one.
- Due day is outside the valid range defined by the backend.
- Start date is after end date.

Validation messages should be clear and field-specific.

---

# Non-Functional Requirements

- Follow the existing project architecture.
- Reuse existing UI patterns whenever possible.
- Follow the project's Tailwind CSS conventions.
- Follow the project's component organization rules.
- Avoid creating oversized components.
- Extract reusable logic into custom hooks when appropriate.
- Use TypeScript strict typing.
- Do not use `any`.
- Write tests for new business logic and UI interactions.

---

# UX Requirements

The loan management experience must extend the existing **Buggyman** page instead of introducing a new navigation flow.

## Buggyman Card

Each Buggyman card must include a new action for **Loans**.

The available actions become:

- Edit
- Activate / Deactivate
- Loans

The new action should use an icon consistent with the application's existing design language.

---

## Loan Management Panel

Selecting the **Loans** action must open a side panel (Drawer) or a large modal overlay.

The user must remain on the Buggyman page during the entire loan management workflow.

The preferred implementation is a **right-side Drawer**. If a Drawer component is not available in the project, a large modal may be used.

---

## Drawer Layout

The drawer should contain:

### Header

Display the selected Buggyman information:

- Name
- Current status (Active / Inactive)

Provide a primary action:

- New Loan

---

### Loan List

Display all loans belonging to the selected Buggyman.

Each loan should be presented as a collapsible card.

Collapsed state should display:

- Principal amount
- Total amount
- Installments
- Loan status

Expanded state should additionally display:

- Interest rate
- Start date
- End date
- Complete installment list

---

### Installments

Installments should appear only when a loan is expanded.

Each installment must display:

- Installment number
- Amount
- Due date
- Payment status
- Payment date (when applicable)

Unpaid installments must expose a **Mark as Paid** action.

Paid installments must be visually distinguishable.

---

## Loan Creation

Creating a loan must happen inside the loan management panel.

Selecting **New Loan** opens the existing application modal pattern without navigating away from the drawer.

After successful creation:

- Close the modal.
- Refresh the loan list.
- Keep the drawer open.
- Automatically display the newly created loan.

---

# API Contract

The frontend must integrate with the Loan API using the following endpoints.

---

## Create Loan

Creates a new loan for a Buggyman.

### Request

```http
POST /loans
```

Body

```json
{
  "partner_id": "uuid",
  "principal_amount": 1000.00,
  "interest_rate": 10,
  "installments": 5,
  "due_day": 10,
  "start_date": "2026-07-01",
  "end_date": "2026-12-01"
}
```

### Response

Returns the created loan.

---

## List Loans by Buggyman

Returns all loans belonging to a Buggyman.

### Request

```http
GET /loans?partner_id={partnerId}
```

### Response

Returns a list of Loan objects.

---

## Get Loan Details

Returns a single loan including its installments.

### Request

```http
GET /loans/{loanId}
```

### Response

Returns one Loan object with its Installments.

---

## Register Installment Payment

Marks an installment as paid.

### Request

```http
PATCH /loan-installments/{installmentId}/pay
```

Body

```json
{
  "payment_date": "2026-08-10"
}
```

### Response

Returns the updated installment.

---

# Data Models

## Loan

```ts
interface Loan {
    id: string;
    partner_id: string;

    principal_amount: number;
    interest_rate: number;
    total_amount: number;

    installments: number;
    due_day: number;

    start_date: string;
    end_date: string;

    status: LoanStatus;

    created_at: string;
    updated_at: string;

    installments_list?: LoanInstallment[];
}
```

---

## LoanInstallment

```ts
interface LoanInstallment {
    id: string;

    loan_id: string;

    installment_number: number;

    amount: number;

    due_date: string;

    payment_date: string | null;

    paid: boolean;

    created_at: string;

    updated_at: string;
}
```

---

## LoanStatus

```ts
type LoanStatus =
    | "ACTIVE"
    | "FINISHED"
    | "DEFAULTED"
    | "CANCELLED";
```

---

# Frontend Service Requirements

A dedicated `loanService` must be created.

It should expose the following methods:

```ts
getByPartner(partnerId: string): Promise<Loan[]>

getById(loanId: string): Promise<Loan>

create(data: CreateLoanRequest): Promise<Loan>

payInstallment(
    installmentId: string,
    paymentDate: string
): Promise<LoanInstallment>
```

The service must follow the same implementation pattern used by the existing services in the project.

## Navigation

The user must never leave the Buggyman page while managing loans.

No new page or route should be introduced for this feature unless explicitly requested in future requirements.

The complete loan management workflow should occur inside the contextual panel.

---

## User Experience Goals

The interface should provide a contextual workflow where users always know which Buggyman they are managing.

The interaction should feel like a natural extension of the existing Buggyman page, minimizing navigation and preserving user context.

# Out of Scope

The following features are NOT part of this implementation:

- Editing loans.
- Deleting loans.
- Loan renegotiation.
- Partial installment payments.
- Payment history.
- Loan reports.
- Loan search or filtering.
- Exporting loan data.