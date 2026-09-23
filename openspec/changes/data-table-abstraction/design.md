# Design: Shared Data Table Component Library

## Technical Approach

Column-config-driven data table module. Each feature defines a `ColumnDef<T>[]` array; the `DataTable` component consumes this config to render headers, rows, skeletons, and pagination. This eliminates ~200 duplicated lines across three table implementations and establishes a single source of truth.

The module wraps existing shadcn/ui primitives (`Table`, `Pagination`, `Skeleton`) — no new UI primitives. Feature layers retain full control over toolbar, row actions, selection, dialogs, and i18n.

## Architecture Decisions

### Decision: ColumnDef over slot-based composition

| Option                            | Tradeoff                                                                                | Decision   |
| --------------------------------- | --------------------------------------------------------------------------------------- | ---------- |
| `ColumnDef<T>[]` config array     | Simple, declarative, auto-generates skeleton; limited to column-level customization     | **Chosen** |
| Slot-based (`<DataTable.Column>`) | More flexible for complex layouts; higher API surface, harder to auto-generate skeleton | Rejected   |

**Rationale**: All three existing tables are column-oriented with uniform row structure. Slot-based adds complexity without benefit for current use cases.

### Decision: Skeleton from div-based layout, not `<Table>` elements

| Option                                      | Tradeoff                                                              | Decision   |
| ------------------------------------------- | --------------------------------------------------------------------- | ---------- |
| `<Table>` with hidden columns for skeleton  | Matches real DOM; verbose, loses flex-based width control             | Rejected   |
| `<div>` flex layout mirroring column widths | Matches existing skeleton pattern; simpler, better responsive control | **Chosen** |

**Rationale**: Both `TableSkeleton` and `BranchTableSkeleton` already use div-based flex layouts. This gives precise `min-w-*` control and responsive `hidden/{bp}:block` without fighting `<Table>` semantics.

### Decision: Pagination wraps shadcn primitives directly

| Option                               | Tradeoff                                             | Decision   |
| ------------------------------------ | ---------------------------------------------------- | ---------- |
| Custom pagination component          | Full control; duplicates shadcn work                 | Rejected   |
| Wrap shadcn `Pagination*` components | Consistent with existing design system; thin wrapper | **Chosen** |

**Rationale**: shadcn pagination primitives are already in the codebase and visually consistent. `DataTablePagination` is a thin composition, not a replacement.

### Decision: CustomersService returns `PaginatedResponse<T>` with interim fallback

| Option                                                      | Tradeoff                                      | Decision   |
| ----------------------------------------------------------- | --------------------------------------------- | ---------- |
| Return raw array, estimate totalCount                       | Works now; inaccurate pagination              | Rejected   |
| Return `PaginatedResponse<T>`, fallback if API lacks fields | Accurate when available; graceful degradation | **Chosen** |

**Rationale**: The items service already returns `{ data, totalCount }`. Customers API response shape is unconfirmed — the service normalizes both array and object responses. We'll extract `totalCount`/`totalPages` from the response when present, fall back to `data.length` when not.

## Data Flow

```
Feature Layer (GlobalCatalogView)
  │
  ├─ defines columns: ColumnDef<ItemResponseDto>[]
  ├─ fetches data via useItems() → PaginatedResponse<T>
  ├─ passes toolbar, emptyState, rowActions as render props
  │
  ▼
DataTable<T>
  ├─ renders TableHeader from columns (responsive visibility)
  ├─ renders TableBody: maps data → rows via column.render()
  ├─ shows DataTableSkeleton when isLoading
  ├─ shows DataTableEmpty when data.length === 0
  └─ renders DataTablePagination footer
       └─ generatePageNumbers() → (number | "...")[]
```

## File Changes

| File                                                                      | Action | Description                                                                        |
| ------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `src/components/data-table/types.ts`                                      | Create | `ColumnDef<T>`, `DataTableProps<T>`, `PaginatedResponse<T>`, `DataTableEmptyProps` |
| `src/components/data-table/data-table.tsx`                                | Create | Main component: Table + skeleton + empty + pagination composition                  |
| `src/components/data-table/data-table-skeleton.tsx`                       | Create | Auto-generated skeleton from `ColumnDef[]`                                         |
| `src/components/data-table/data-table-pagination.tsx`                     | Create | Pagination footer with `generatePageNumbers()`                                     |
| `src/components/data-table/index.ts`                                      | Create | Barrel exports                                                                     |
| `src/features/business/items/catalog/types/index.ts`                      | Modify | Re-export `PaginatedResponse` from data-table module                               |
| `src/features/business/people/customers/services/customers.service.ts`    | Modify | Return `PaginatedResponse<CustomerResponseDto>` with fallback                      |
| `src/features/business/people/customers/hooks/use-customers.ts`           | Modify | Return type updates to match `PaginatedResponse`                                   |
| `src/features/business/people/customers/pages/customers-catalog-page.tsx` | Modify | Use `DataTable` component, remove inline pagination                                |
| `src/features/business/people/customers/components/customers-table.tsx`   | Modify | Replace with column config + `DataTable`                                           |
| `src/features/business/items/catalog/components/global-catalog-view.tsx`  | Modify | Replace inline skeleton/pagination/generatePageNumbers with `DataTable`            |
| `src/features/business/items/catalog/components/branch-catalog-view.tsx`  | Modify | Same refactor as global-catalog-view                                               |

## Interfaces / Contracts

### `ColumnDef<T>` — Column configuration

```typescript
type ResponsiveBreakpoint = "always" | "sm" | "md" | "lg"

interface ColumnDef<T> {
  key: string
  header: string
  minWidth?: string // Tailwind min-w token, e.g. "min-w-25"
  responsive?: ResponsiveBreakpoint // default: 'always'
  align?: "left" | "right" // default: 'left'
  render: (row: T) => React.ReactNode
  skeletonWidth?: number // px width for skeleton placeholder
}
```

### `PaginatedResponse<T>` — Unified pagination shape

```typescript
interface PaginatedResponse<T> {
  data: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}
```

Moved from items catalog `types/index.ts` to shared module. Items types re-exports from here.

### `DataTableProps<T>` — Main component props

```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading: boolean
  page: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void

  // Optional
  search?: string
  emptyIcon?: React.ReactNode
  emptyMessage?: string
  emptyAction?: React.ReactNode
  toolbar?: React.ReactNode
  selectedCount?: number
  skeletonRows?: number // default: 10
  containerClassName?: string
  tableClassName?: string
}
```

### `generatePageNumbers` — Shared utility

```typescript
function generatePageNumbers(current: number, total: number): (number | "...")[]
```

Single implementation in `data-table-pagination.tsx`. Identical logic to the current duplicated function.

## Integration: Before / After

### GlobalCatalogView (before → after)

**Before** (393 lines): Inline `TableSkeleton` (64 lines), `generatePageNumbers` (33 lines), pagination footer markup (43 lines).

**After**: ~120 lines. Defines `columns` array, passes toolbar/emptyState as render props.

```tsx
// Column config replaces 150+ lines of inline table markup
const columns: ColumnDef<ItemResponseDto>[] = [
  { key: 'name', header: t('name'), minWidth: 'min-w-0 sm:min-w-37.5', responsive: 'always',
    render: (item) => (/* name + description JSX */) },
  { key: 'sku', header: t('sku'), responsive: 'sm', minWidth: 'min-w-25', skeletonWidth: 64,
    render: (item) => item.sku ?? '—' },
  // ... more columns
]

// Component body
<DataTable
  columns={columns}
  data={filteredItems}
  isLoading={isLoading}
  page={page}
  totalPages={data?.totalPages ?? 1}
  totalCount={data?.totalCount ?? 0}
  onPageChange={setPage}
  search={search}
  emptyIcon={hasSearch ? <SearchX /> : <Package />}
  emptyMessage={hasSearch ? t('no_results_for_search', { search }) : t('no_items')}
  emptyAction={!hasSearch ? <Button onClick={() => setFormOpen(true)}>{t('new_item')}</Button> : undefined}
  toolbar={/* search input + multi-select buttons */}
  selectedCount={isMultiSelectMode ? selectedIds.size : undefined}
/>
```

### CustomersTable (before → after)

**Before** (94 lines): Raw `<Table>` with inline columns, no skeleton, no pagination, receives `CustomerResponseDto[]`.

**After**: ~30 lines. Defines columns, `DataTable` handles skeleton + empty + pagination.

```tsx
const columns: ColumnDef<CustomerResponseDto>[] = [
  { key: 'name', header: t('full_name'), minWidth: 'min-w-[180px]',
    render: (c) => <p className="font-medium">{getCustomerDisplayName(c)}</p> },
  { key: 'docType', header: t('document_type'), responsive: 'md', minWidth: 'min-w-[140px]',
    render: (c) => IDENTIFICATION_TYPE_LABELS[c.identificationTypeId] ?? '—' },
  // ...
]

// DataTable handles skeleton, empty, pagination internally
<DataTable
  columns={columns}
  data={customers}
  isLoading={isLoading}
  page={page}
  totalPages={paginatedData?.totalPages ?? 1}
  totalCount={paginatedData?.totalCount ?? 0}
  onPageChange={setPage}
  emptyIcon={<Users />}
  emptyMessage={t('no_customers')}
/>
```

### CustomersService (before → after)

**Before**: Returns `CustomerResponseDto[]` (raw array).

**After**: Returns `PaginatedResponse<CustomerResponseDto>` with fallback.

```typescript
export async function getCustomers(params: GetCustomersParams): Promise<PaginatedResponse<CustomerResponseDto>> {
  const { data } = await api.get<CustomerResponseDto[] | { data: CustomerResponseDto[]; totalCount?: number }>(
    "/api/Customers",
    { params: { pageNumber: params.pageNumber, pageSize: params.pageSize, ... } }
  )

  const items = Array.isArray(data) ? data : (data?.data ?? [])
  const totalCount = Array.isArray(data) ? data.length : (data?.totalCount ?? items.length)

  return {
    data: items,
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / params.pageSize),
  }
}
```

## Testing Strategy

| Layer       | What to Test                                | Approach                                                                                          |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Unit        | `generatePageNumbers()` edge cases          | Pure function tests: total ≤ 7, current at boundaries, ellipsis placement                         |
| Unit        | `DataTableSkeleton` renders correct columns | Render with mock ColumnDef[], assert skeleton count and responsive classes                        |
| Unit        | `DataTable` conditional rendering           | isLoading → skeleton, empty data → empty state, data → rows                                       |
| Integration | Full table with pagination                  | Render DataTable with mock PaginatedResponse, click page numbers, verify onPageChange called      |
| E2E         | Existing playbooks                          | Verify GlobalCatalogView, BranchCatalogView, CustomersTable visually identical to before refactor |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. All changes are refactoring — existing table behavior is preserved 1:1. The `PaginatedResponse<T>` type moves from `items/catalog/types` to `data-table/types` with a re-export from the old location for backward compatibility.

Rollback: Revert individual commits per feature area. The `data-table/` module is additive; feature refactors are independent git diffs.

## Open Questions

- [ ] Does the Customers API endpoint return `totalCount` in its response, or only the array? (Mitigated by fallback logic in service)
- [ ] Should `DataTable` support a `stickyHeader` prop? Current tables use `sticky top-0 z-10` on `TableHead` — may want to make this configurable.
- [ ] The proposal mentions `DataTableEmpty` as a separate file. Design absorbs empty state into `DataTable` via props (`emptyIcon`, `emptyMessage`, `emptyAction`) to reduce component count. Confirm this aligns with intent.
