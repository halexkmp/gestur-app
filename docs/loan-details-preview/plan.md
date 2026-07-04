# Implementation Plan - Loan Details Preview

## Objective
Implement dynamic preview calculations for loan end date and total amount in `LoanFormModal.tsx`.

## UI Architecture
- `src/components/LoanFormModal.tsx`:
  - Add logic to calculate `estimatedEndDate` and `estimatedTotalAmount` based on `formData`.
  - Display these two values in a dedicated, styled preview block below the form inputs and above the action buttons.
  - Apply professional Tailwind CSS classes (such as a highlighted info box) that naturally blend with the existing UI design.

## Calculation Strategy
- **End Date**:
  - Parse `formData.start_date` (format: `YYYY-MM-DD`).
  - Parse `formData.installments_qty` as an integer.
  - Calculate `end_date = start_date + (installments_qty * 7) days`.
  - Format the result back into Brazilian date format `DD/MM/YYYY`.
- **Total Amount**:
  - Parse `formData.principal_amount` as a float.
  - Parse `formData.interest_rate` as a float.
  - Parse `formData.installments_qty` as an integer.
  - Formula: `principal_amount * (1 + (interest_rate / 100) * installments_qty)`.
  - Format the result as Brazilian Real (BRL) currency.

## Risks & Assumptions
- **Timezones**:
  - Constructing Date objects from `YYYY-MM-DD` strings can cause timezone offsets if constructed as UTC or midnight local.
  - *Mitigation*: Parse the string by splitting `"-"` and using `new Date(year, month - 1, day)` to guarantee stable local date operations.
- **Form Validity**:
  - During input, values might be empty, invalid (such as negative installments), or in the middle of being typed.
  - *Mitigation*: Perform fallback checks and display `-` gracefully for empty or invalid inputs.
