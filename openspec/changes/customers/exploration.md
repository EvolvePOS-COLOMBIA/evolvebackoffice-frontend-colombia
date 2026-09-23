# Exploration: Customers Feature

## Current State

No customer-specific code exists yet. The `PeoplePage` already has a disabled "Customers" card in the hub layout with i18n keys pre-populated in both `es.json` and `en.json` under the `business-people` namespace. The card is wired with `disabled: true` and no `onClick` handler.

The Swagger at `posco.ursposdemo.com` defines a complete Customer CRUD API under the `Customers` tag:

**Endpoints:**

- `GET /api/Customers` — paginated list (pageNumber, pageSize, searchField, searchValue)
- `POST /api/Customers` — create (requires Manager or Admin)
- `GET /api/Customers/{id}` — get by Guid
- `PUT /api/Customers/{id}` — update (requires Manager or Admin)
- `DELETE /api/Customers/{id}` — soft-delete (requires Manager or Admin)

**DTOs from Swagger:**

- `CustomerResponseDto`: id, personPublicId, firstName, lastName, identificationTypeId, identificationNumber, address, phoneNumber, emailAddress, city, department, isActive, createdAt
- `CreateCustomerDto`: firstName, identificationTypeId, lastName, identificationNumber, address, phoneNumber, emailAddress, city, department
- `UpdateCustomerDto`: all fields optional (nullable), same shape as Create minus no new fields
- `CustomerSyncDto`: id, name, documentNumber, email, phone, isActive, updatedAtUtc (used by delta sync, not UI)

**Note:** The GET endpoint response body is untyped in Swagger (same situation as Branches). The service must normalize defensively.

## Affected Areas

### New files to create (mirroring `users/` structure)

- `src/features/business/people/customers/types/api.ts` — DTOs
- `src/features/business/people/customers/types/index.ts` — UI model + re-exports
- `src/features/business/people/customers/schemas/customer-schema.ts` — Zod schemas
- `src/features/business/people/customers/services/customers.service.ts` — API calls + mappers
- `src/features/business/people/customers/hooks/use-customers.ts` — TanStack Query hooks
- `src/features/business/people/customers/components/customers-table.tsx` — table
- `src/features/business/people/customers/components/customer-form-dialog.tsx` — create/edit dialog
- `src/features/business/people/customers/pages/customers-catalog-page.tsx` — page
- `src/features/business/people/customers/i18n/es.json` — Spanish translations
- `src/features/business/people/customers/i18n/en.json` — English translations

### Existing files to modify

- `src/features/business/people/pages/people-page.tsx` — enable the Customers card
- `src/routes/app-routes.tsx` — add route `/business/people/customers`
- `src/i18n/index.ts` — register `business-customers` namespace
- `src/i18n/use-i18n.ts` — add `"business-customers"` to `Namespace` union

## Approaches

### 1. Follow `users/` pattern exactly

Same file structure, conventions, and testing approach.

- Pros: zero ambiguity, codebase consistency, easy review
- Cons: none meaningful
- Effort: Low

### 2. Extract shared PersonFormDialog/PersonTable

Create reusable components shared between users and customers.

- Pros: DRY if more person-like entities arrive
- Cons: premature abstraction, couples customers to users, adds complexity now
- Effort: Medium

## Recommendation

**Approach 1.** Customers has different fields (city, department, no role/credentials), so shared components would add coupling without reducing code. Keep it self-contained under `customers/`.

## Key Implementation Details

- **IdentificationType reuse**: Import `IdentificationType` enum and `IDENTIFICATION_TYPE_LABELS` from `users/types` — customers also use CC/CE.
- **Pagination**: GET supports `pageNumber`/`pageSize`/`searchField`/`searchValue`. Use defensive normalization (array or paged envelope).
- **Soft-delete**: DELETE returns 204. Hook should invalidate list query on success.
- **Authorization**: Create/Update/Delete require Manager or Admin. The frontend only exposes `BusinessAdmin`. Guard UI buttons with role check.
- **Form fields**: firstName, lastName, identificationTypeId, identificationNumber, phoneNumber, emailAddress, address, city, department — all nullable strings except identificationTypeId (int).
- **i18n namespace**: `business-customers`.

## Risks

- **Untyped GET response**: Swagger doesn't document exact shape. Service must handle both paged envelope and flat array.
- **Role gating gap**: Frontend only has `BusinessAdmin`. Backend requires Manager/Admin. UI should hide mutation buttons for Cashiers, backend enforces 403.
- **identificationTypeId**: Currently only `CedulaCiudadania = 1`. Customers need CC (1) and CE (2). Form should offer both.

## Ready for Proposal

Yes — the codebase is clean, the pattern is established, the API is fully documented, and there are no blocking dependencies. The People page is already wired to receive the Customers link.
