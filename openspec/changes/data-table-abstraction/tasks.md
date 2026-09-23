# Tasks: Data Table Abstraction

## Review Workload Forecast

| Field                   | Value                |
| ----------------------- | -------------------- |
| Estimated changed lines | 500–750              |
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

| Unit | Goal                                                       | Likely PR | Focused test command                                  | Runtime harness                                                 | Rollback boundary                                                |
| ---- | ---------------------------------------------------------- | --------- | ----------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Shared data-table module (types + components + index)      | PR 1      | `npx tsc --noEmit`                                    | Manual render in Storybook or isolated page                     | Revert `src/components/data-table/` directory                    |
| 2    | Customers refactor (service + hook + page + i18n)          | PR 2      | `npx vitest run --reporter=verbose` (customers tests) | Navigate to /customers, verify table + pagination + empty state | Revert `src/features/business/people/customers/` changes         |
| 3    | Items refactor (global-catalog-view + branch-catalog-view) | PR 3      | `npx vitest run --reporter=verbose` (items tests)     | Navigate to /items, verify global + branch table views          | Revert `src/features/business/items/catalog/components/` changes |

## Phase 1: Foundation — Shared Module

- [ ] 1.1 Create `src/components/data-table/types.ts` — export `ColumnDef<T>`, `ResponsiveBreakpoint`, `DataTableProps<T>`, `PaginatedResponse<T>`, `DataTableEmptyProps` per design interfaces
- [ ] 1.2 Create `src/components/data-table/data-table-skeleton.tsx` — render skeleton from `ColumnDef[]` using div-based flex layout with responsive visibility and `skeletonWidth` per column
- [ ] 1.3 Create `src/components/data-table/data-table-pagination.tsx` — implement `generatePageNumbers(current, total)` utility + `DataTablePagination` component wrapping shadcn `Pagination*` primitives; accepts `totalCount`, `currentPage`, `totalPages`, `selectedCount`, `onPageChange`
- [ ] 1.4 Create `src/components/data-table/data-table.tsx` — main component: render TableHeader from columns, map data to rows via `column.render()`, show `DataTableSkeleton` when `isLoading`, show empty state via props (`emptyIcon`, `emptyMessage`, `emptyAction`), render `DataTablePagination` footer; support optional multi-select checkbox column when `onSelectionChange` provided
- [ ] 1.5 Create `src/components/data-table/index.ts` — barrel re-exports for all public types and components

## Phase 2: Customers Refactor

- [ ] 2.1 Update `src/features/business/people/customers/services/customers.service.ts` — change `getCustomers` return type to `PaginatedResponse<CustomerResponseDto>`; extract `totalCount`/`totalPages` from API response when present, fallback to `data.length` when absent
- [ ] 2.2 Update `src/features/business/people/customers/hooks/use-customers.ts` — `useCustomers` return type becomes `PaginatedResponse<CustomerResponseDto>`; ensure `queryKey` includes page/pageSize for proper cache invalidation
- [ ] 2.3 Add missing i18n keys to `src/features/business/people/customers/i18n/en.json` — add `pagination_total: "{{count}} item(s)"`, `selected: "selected"`, `no_results_for_search: "No results found for \"{{search}}\"."`
- [ ] 2.4 Add missing i18n keys to `src/features/business/people/customers/i18n/es.json` — matching Spanish translations for the same keys
- [ ] 2.5 Refactor `src/features/business/people/customers/pages/customers-catalog-page.tsx` — replace inline `CustomersTable` + manual pagination with `DataTable` using column config; pass `toolbar` (search + new button), `emptyIcon`, `emptyMessage`, pagination props from `PaginatedResponse`
- [ ] 2.6 Delete `src/features/business/people/customers/components/customers-table.tsx` — replaced by `DataTable` column config in the page

## Phase 3: Items Refactor

- [ ] 3.1 Refactor `src/features/business/items/catalog/components/global-catalog-view.tsx` — extract `ColumnDef<ItemResponseDto>[]` config, replace inline `TableSkeleton`/`generatePageNumbers`/pagination markup with `DataTable`; preserve multi-select, toolbar, and action button patterns in column `render` functions
- [ ] 3.2 Refactor `src/features/business/items/catalog/components/branch-catalog-view.tsx` — extract `ColumnDef<BranchItemResponseDto>[]` config, replace inline `BranchTableSkeleton`/`generatePageNumbers`/pagination markup with `DataTable`; preserve `StockBadge` usage in column render
- [ ] 3.3 Update `src/features/business/items/catalog/types/index.ts` — re-export `PaginatedResponse<T>` from `@/components/data-table` instead of defining locally

## Phase 4: Cleanup & Verification

- [ ] 4.1 Run `npx tsc --noEmit` to verify no type errors across all modified files
- [ ] 4.2 Run full test suite `npx vitest run` to verify no regressions
- [ ] 4.3 Grep for orphaned `generatePageNumbers` definitions in feature layers — should find zero after refactor
- [ ] 4.4 Verify `src/components/data-table/` has no duplicate `PaginatedResponse` definition (single source of truth)
