# Tasks: Customers Feature

## Review Workload Forecast

| Field                   | Value                |
| ----------------------- | -------------------- |
| Estimated changed lines | 550–650              |
| 400-line budget risk    | High                 |
| Chained PRs recommended | Yes                  |
| Suggested split         | PR 1 → PR 2 → PR 3   |
| Delivery strategy       | auto-chain           |
| Chain strategy          | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                              | Likely PR | Focused test command                | Runtime harness                             | Rollback boundary                                                             |
| ---- | ------------------------------------------------- | --------- | ----------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Types, service, hooks, schemas, i18n registration | PR 1      | `npx tsc --noEmit`                  | N/A — pure types/utils, no runtime          | types/, services/, hooks/, schemas/, i18n/ files + i18n index/namespace edits |
| 2    | UI components: table, form dialog, delete dialog  | PR 2      | `npx vitest run --reporter=verbose` | N/A — no routing/page wiring yet            | components/ directory only                                                    |
| 3    | Page, routing, People page card enablement        | PR 3      | `npx vite build`                    | Manual: navigate /business/people/customers | pages/, app-routes.tsx, people-page.tsx                                       |

## Phase 1: Foundation — Types, Service, Schemas, i18n

- [ ] 1.1 Create `src/features/business/people/customers/types/index.ts`: `CustomerResponseDto` (13 fields per design), `CreateCustomerDto`, `UpdateCustomerDto`. Add `getCustomerDisplayName()` helper. Re-export `IdentificationType` and `IDENTIFICATION_TYPE_LABELS` from `@/features/business/people/users/types`.
- [ ] 1.2 Create `src/features/business/people/customers/services/customers.service.ts`: `getCustomers({ pageNumber, pageSize, searchField?, searchValue? })`, `getCustomerById(id)`, `createCustomer(payload)`, `updateCustomer(id, payload)`, `deleteCustomer(id)` using `@/config/axios-client`. Handle array-or-envelope response defensively.
- [ ] 1.3 Create `src/features/business/people/customers/schemas/customer-schema.ts`: `createCustomerSchema(t)` — firstName, lastName, identificationTypeId (1-2), identificationNumber, phoneNumber, emailAddress, address, city, department. `updateCustomerSchema(t)` — all fields optional. Export `CreateCustomerFormValues`, `UpdateCustomerFormValues`.
- [ ] 1.4 Create `src/features/business/people/customers/hooks/use-customers.ts`: `useCustomers(page, pageSize, search)` with queryKey `["customers", page, pageSize, search]`. `useCustomer(id)` gated by `!!id`. `useCreateCustomer()`, `useUpdateCustomer()`, `useDeleteCustomer()` — all invalidate `["customers"]` on success.
- [ ] 1.5 Create `src/features/business/people/customers/i18n/en.json` and `es.json`: keys for page title, table columns, form labels, validation messages, empty state, confirm dialog, toasts. Namespace: `business-customers-catalog`.
- [ ] 1.6 Register i18n namespace: import customer i18n files in `src/i18n/index.ts`, add `"business-customers-catalog"` to both `resources.es` and `resources.en`, and add to `ns` array.
- [ ] 1.7 Add `"business-customers-catalog"` to the `Namespace` union type in `src/i18n/use-i18n.ts`.

## Phase 2: UI Components — Table, Form Dialog, Delete Dialog

- [ ] 2.1 Create `src/features/business/people/customers/components/customers-table.tsx`: responsive table with columns — name, identification (type+number), email, phone, city, status (active badge), actions (edit button, delete button). Empty state when list is empty. Accept `customers: CustomerResponseDto[]`, `onEdit`, `onDelete` props.
- [ ] 2.2 Create `src/features/business/people/customers/components/customer-form-dialog.tsx`: shared create/edit Dialog using `react-hook-form` + `zodResolver`. Pre-populate on edit. Fields: firstName, lastName, identificationTypeId (select CC/CE), identificationNumber, phoneNumber, emailAddress, address, city, department. Accept `customerToEdit?`, `onSubmit`, `isSubmitting` props. Use `business-customers-catalog` namespace.
- [ ] 2.3 Create `src/features/business/people/customers/components/delete-confirm-dialog.tsx`: Confirmation dialog with customer name displayed. Accept `open`, `onOpenChange`, `customerName`, `onConfirm`, `isPending` props. Cancel + Confirm buttons.

## Phase 3: Page, Routing, Integration

- [ ] 3.1 Create `src/features/business/people/customers/pages/customers-catalog-page.tsx`: Badge, title, description, search Input, pagination controls (page number + page size), CustomersTable, CustomerFormDialog, DeleteConfirmDialog. Wire `useCustomers` with server-side search (`searchField: "name"`, `searchValue`). Wire create/edit/delete mutations. Conditionally render create button based on `BusinessAdmin` role from `useAuth`.
- [ ] 3.2 Modify `src/routes/app-routes.tsx`: add `import { CustomersCatalogPage }` and `<Route path="/business/people/customers" element={<CustomersCatalogPage />} />` inside the `BusinessAdmin` + `OnboardingGate` block, after the users route.
- [ ] 3.3 Modify `src/features/business/people/pages/people-page.tsx`: remove `disabled: true` from the Customers card, add `onClick: () => navigate("/business/people/customers")`.

## Phase 4: Verification

- [ ] 4.1 Run `npx tsc --noEmit` — confirm zero type errors across all new and modified files.
- [ ] 4.2 Run `npx vite build` — confirm clean build with no warnings from customer module.
- [ ] 4.3 Manual smoke test: navigate to People → Customers card is enabled and clickable → catalog page loads → search filters results → pagination works → create/edit/delete flows function (BusinessAdmin role).
