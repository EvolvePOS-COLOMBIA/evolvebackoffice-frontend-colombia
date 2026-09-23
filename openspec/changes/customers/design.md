# Design: Customers Feature

## Technical Approach

Mirror the `users/` feature pattern exactly under `src/features/business/people/customers/`. Self-contained module with its own types, service, hooks, schemas, components, pages, and i18n. No shared abstractions with users — the fields diverge too much (city/department vs. role/credentials). Enable the existing disabled Customers card on the People page and register the `/business/people/customers` route.

## Architecture Decisions

| Decision           | Choice                                      | Alternatives                       | Rationale                                                                                                           |
| ------------------ | ------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Module structure   | Self-contained `customers/`                 | Shared PersonTable/Form components | Fields diverge (customers: city/dept; users: role/credentials). Shared components add coupling without DRY benefit. |
| Pagination         | Client-side state, server-side query params | Infinite scroll, cursor-based      | API supports `pageNumber`/`pageSize`. Matches existing backend contract.                                            |
| Search             | Server-side via `searchField`/`searchValue` | Client-side filter                 | API supports it natively. Better for large datasets.                                                                |
| IdentificationType | Reuse from `users/types`                    | Duplicate enum                     | Same CC/CE values. Import keeps single source of truth.                                                             |
| Soft-delete UX     | Confirmation dialog before DELETE           | Inline toggle                      | Spec requires confirmation. Prevents accidental data loss.                                                          |
| i18n namespace     | `business-customers-catalog`                | `business-customers`               | Matches `business-users-catalog` naming convention.                                                                 |

## Data Flow

```
PeoplePage (enable card) → navigate("/business/people/customers")
                                ↓
                        CustomersCatalogPage
                          ├── useCustomers(page, search) → GET /api/Customers
                          ├── useCreateCustomer()       → POST /api/Customers
                          ├── useUpdateCustomer()       → PUT /api/Customers/{id}
                          └── useDeleteCustomer()       → DELETE /api/Customers/{id}
                                ↓
                        TanStack Query cache invalidation on all mutations
```

## File Changes

| File                                                                          | Action | Description                                                                                                                    |
| ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/business/people/customers/types/index.ts`                       | Create | `CustomerResponseDto`, `CreateCustomerDto`, `UpdateCustomerDto` interfaces + `IdentificationType` re-export                    |
| `src/features/business/people/customers/services/customers.service.ts`        | Create | `getCustomers(params)`, `getCustomerById(id)`, `createCustomer(payload)`, `updateCustomer(id, payload)`, `deleteCustomer(id)`  |
| `src/features/business/people/customers/hooks/use-customers.ts`               | Create | `useCustomers(page, pageSize, search)`, `useCustomer(id)`, `useCreateCustomer()`, `useUpdateCustomer()`, `useDeleteCustomer()` |
| `src/features/business/people/customers/schemas/customer-schema.ts`           | Create | `createCustomerSchema(t)`, `updateCustomerSchema(t)` with Zod                                                                  |
| `src/features/business/people/customers/components/customers-table.tsx`       | Create | Responsive table: name, identification, email, phone, city, status, actions (edit/delete)                                      |
| `src/features/business/people/customers/components/customer-form-dialog.tsx`  | Create | Shared create/edit Dialog with react-hook-form + zodResolver                                                                   |
| `src/features/business/people/customers/components/delete-confirm-dialog.tsx` | Create | Confirmation dialog for soft-delete                                                                                            |
| `src/features/business/people/customers/pages/customers-catalog-page.tsx`     | Create | Page layout: badge, title, search, pagination, table, form dialog                                                              |
| `src/features/business/people/customers/i18n/en.json`                         | Create | English translations                                                                                                           |
| `src/features/business/people/customers/i18n/es.json`                         | Create | Spanish translations                                                                                                           |
| `src/features/business/people/pages/people-page.tsx`                          | Modify | Remove `disabled: true` from Customers card, add `onClick: () => navigate("/business/people/customers")`                       |
| `src/routes/app-routes.tsx`                                                   | Modify | Add `Route` for `/business/people/customers` → `CustomersCatalogPage` under BusinessAdmin guard                                |
| `src/i18n/index.ts`                                                           | Modify | Import + register `business-customers-catalog` namespace                                                                       |
| `src/i18n/use-i18n.ts`                                                        | Modify | Add `"business-customers-catalog"` to `Namespace` union                                                                        |

## Interfaces / Contracts

**CustomerResponseDto** (12 fields):

```ts
interface CustomerResponseDto {
  id: string // GUID
  personPublicId: string | null
  firstName: string | null
  lastName: string | null
  identificationTypeId: number
  identificationNumber: string | null
  address: string | null
  phoneNumber: string | null
  emailAddress: string | null
  city: string | null
  department: string | null
  isActive: boolean
  createdAt: string
}
```

**CreateCustomerDto** (9 fields): `firstName`, `lastName`, `identificationTypeId`, `identificationNumber`, `address`, `phoneNumber`, `emailAddress`, `city`, `department`.

**UpdateCustomerDto**: Same as Create, all fields optional/nullable.

**Service params**: `getCustomers({ pageNumber, pageSize, searchField?, searchValue? })` — returns `CustomerResponseDto[]` (defensive: normalize array or paged envelope).

## Testing Strategy

| Layer       | What to Test                                              | Approach                                         |
| ----------- | --------------------------------------------------------- | ------------------------------------------------ |
| Unit        | Zod schemas validate required fields, reject invalid data | Vitest + schema.parse assertions                 |
| Unit        | `getCustomerDisplayName()` helper                         | Pure function test                               |
| Integration | `useCustomers` hook returns paginated data                | Mock `customers.service`, test with `renderHook` |
| Integration | Form dialog validates and submits                         | `@testing-library/react` with MSW mock           |
| E2E         | Full CRUD flow: create → list → edit → delete             | Playwright against mock API                      |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Feature is additive — new route, new module, new i18n namespace. Enable card on People page activates navigation.

## Open Questions

- [ ] GET `/api/Customers` response shape: array or paged envelope? Service should handle both defensively (same as branches).
- [ ] Backend role requirement is Manager/Admin, but frontend only has BusinessAdmin. UI hides mutations for non-BusinessAdmin; backend enforces independently.
