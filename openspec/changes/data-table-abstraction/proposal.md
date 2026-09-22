# Proposal: Shared Data Table Component Library

## Intent

The codebase contains three independent data table implementations (GlobalCatalogView, BranchCatalogView, CustomersTable) sharing ~200 lines of duplicated logic: identical `generatePageNumbers()` functions, structurally identical table skeletons with different column configs, near-identical pagination footers, and the same responsive column-hiding pattern. Each new table forces copy-paste of all four patterns, compounding debt with every feature.

A column-config-driven shared data-table module eliminates this duplication, reduces onboarding time for new tables from hours to minutes, and establishes a single source of truth for pagination, skeleton rendering, and responsive behavior.

## Scope

### In Scope

- `src/components/data-table/` — shared module with DataTable, DataTableSkeleton, DataTablePagination, DataTableEmpty
- Column config type with responsive visibility prop
- Auto-generated skeletons from column definitions
- Shared `generatePageNumbers()` in pagination utility
- Pagination footer accepting server-side `totalCount`
- Empty state variants (no data, search no results) via text props
- Refactor GlobalCatalogView and BranchCatalogView to use shared module
- Refactor CustomersTable to use shared module
- Fix CustomersService to return `PaginatedResponse<T>` instead of raw array

### Out of Scope

- Virtual scrolling or row virtualization (future optimization)
- Column sorting/filtering (already handled per-feature)
- Export/CSV functionality
- Row selection or bulk actions
- Internationalization within the component (i18n stays in feature layer)

## Capabilities

### New Capabilities

- `data-table-core`: Shared DataTable component with column-config-driven rendering, skeleton generation, pagination footer, empty states, and responsive column visibility

### Modified Capabilities

None — existing feature-specific tables are refactored to consume the new shared module but their spec behavior is unchanged.

## Approach

Column-config architecture over slot-based: each table defines a `columns` array with accessor, header, width, responsive breakpoint, and render function. The DataTable component consumes this config to render headers, rows, skeletons, and pagination. This maps directly to existing table patterns and avoids API complexity.

**File structure:**

```
src/components/data-table/
├── data-table.tsx          # Main component (table + header + row rendering)
├── data-table-skeleton.tsx # Auto-generated skeleton from column config
├── data-table-pagination.tsx # Shared pagination footer
├── data-table-empty.tsx    # Empty state variants
├── types.ts               # ColumnConfig, DataTableProps, PaginatedResponse<T>
└── utils.ts               # generatePageNumbers()
```

**Component API sketch:**

```tsx
<DataTable
  columns={columns}
  data={items}
  pagination={{ page, totalPages, onPageChange }}
  emptyText={t("items.noResults")}
  emptyIcon={<SearchIcon />}
  isLoading={isPending}
/>
```

**Pagination contract:** Feature layers pass `page`, `totalPages`, `totalCount`, and `onPageChange`. The shared component renders server-derived values only — no client-side totalCount guessing.

## Affected Areas

| Area                                                                      | Impact   | Description                                                                        |
| ------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `src/components/data-table/`                                              | New      | New shared module (5 files)                                                        |
| `src/features/business/items/catalog/components/global-catalog-view.tsx`  | Modified | Replace inline skeleton, pagination, generatePageNumbers with shared module        |
| `src/features/business/items/catalog/components/branch-catalog-view.tsx`  | Modified | Same refactor as global-catalog-view                                               |
| `src/features/business/people/customers/components/customers-table.tsx`   | Modified | Replace inline implementation with shared DataTable                                |
| `src/features/business/people/customers/pages/customers-catalog-page.tsx` | Modified | Update to pass PaginatedResponse shape to CustomersTable                           |
| `src/features/business/people/customers/services/customers.service.ts`    | Modified | Update to return PaginatedResponse<CustomerResponseDto> with totalCount/totalPages |

## Risks

| Risk                                                         | Likelihood | Mitigation                                                                        |
| ------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------- |
| CustomersService API doesn't return totalCount               | Medium     | Verify endpoint response shape; add totalCount/totalPages if backend needs update |
| Skeleton fidelity drifts from real table layout              | Low        | Generate skeleton from same column config; visual diff in verify phase            |
| Feature-layer refactors break existing table behavior        | Low        | Test with existing playbooks; 1:1 functional parity before merging                |
| Shared Pagination component conflicts with shadcn pagination | Low        | Wrap shadcn Pagination internally; feature layers use shared footer               |
| Performance regression from config-driven rendering          | Low        | Column config is static; no additional renders vs current inline approach         |

## Rollback Plan

1. Revert the `src/components/data-table/` module addition (git checkout prior commit for that path)
2. Revert each feature file refactoring individually — they are independent git diffs
3. Revert CustomersService change if backend pagination update was applied
4. All changes are additive or refactoring — no destructive data operations

## Dependencies

- Backend CustomersService must support `totalCount` and `totalPages` in response (or frontend wraps raw array with estimated values as interim)
- Existing shadcn/ui table, pagination, skeleton components (no version change needed)

## Success Criteria

- [ ] `generatePageNumbers()` exists in exactly one file (`data-table/utils.ts`)
- [ ] Table skeletons in GlobalCatalogView, BranchCatalogView, and CustomersTable are removed — skeleton comes from DataTableSkeleton
- [ ] Pagination footer is shared — no duplicate footer markup in feature files
- [ ] Adding a new data table requires only defining a columns array + data source (no copy-paste of skeleton/pagination/empty patterns)
- [ ] CustomersTable receives `{ data, totalCount, totalPages }` shape matching ItemsPaginatedResponse
- [ ] All existing table functionality preserved (column visibility, row rendering, loading states, empty states)
