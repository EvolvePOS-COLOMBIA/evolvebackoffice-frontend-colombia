# Data Table Abstraction Specification

## Purpose

Column-config-driven shared data-table module that eliminates ~200 lines of duplicated table logic across Items and Customers features. Replaces hand-crafted skeletons, inline pagination, and copy-pasted responsive patterns with a single reusable implementation.

## Requirements

### Requirement: Column-Config-Driven Table Rendering

The system SHALL render table headers and rows from a `columns: ColumnDef<T>[]` configuration array. Each column definition MUST specify `key`, `header`, `responsive` breakpoint, `minWidth`, `align`, and a `render` function. The DataTable component MUST accept `data: T[]` and render one row per item using the column config.

#### Scenario: Table renders with column config

- GIVEN a DataTable with 5 column definitions (name, sku, plu, price, status)
- WHEN data items are provided
- THEN the table renders headers matching each column's `header` value
- AND each row renders cells via the column's `render` function

#### Scenario: Empty data array

- GIVEN a DataTable with column definitions
- WHEN `data` is an empty array
- THEN the table renders headers but zero body rows
- AND the empty state component is displayed (see Requirement: Empty State Handling)

### Requirement: Responsive Column Visibility

The system MUST hide/show columns based on responsive breakpoints derived from column config. Each column's `responsive` field maps to Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`). Columns without a breakpoint are always visible. The responsive pattern MUST match the existing `hidden sm:table-cell` / `hidden md:table-cell` / `hidden lg:table-cell` convention.

#### Scenario: Column hidden on mobile

- GIVEN a column with `responsive: "sm"`
- WHEN the viewport is below the `sm` breakpoint
- THEN the column header and all corresponding cells are hidden

#### Scenario: Column visible on tablet

- GIVEN a column with `responsive: "sm"`
- WHEN the viewport is at or above the `sm` breakpoint
- THEN the column header and all corresponding cells are visible

#### Scenario: Column always visible

- GIVEN a column with no `responsive` value
- WHEN the viewport is any width
- THEN the column header and all corresponding cells are visible

### Requirement: Multi-Select Support

The system SHOULD support optional multi-select via a checkbox column prepended to the table. When `onSelectionChange` is provided, a checkbox column MUST appear as the first column. Selected state MUST be tracked externally via `selectedIds: Set<string|number>`.

#### Scenario: Multi-select enabled

- GIVEN a DataTable with `onSelectionChange` provided
- WHEN the table renders
- THEN a checkbox column appears as the first column
- AND clicking a row checkbox toggles the item in `selectedIds`

#### Scenario: Multi-select disabled

- GIVEN a DataTable without `onSelectionChange`
- WHEN the table renders
- THEN no checkbox column appears

### Requirement: Toolbar Slot

The system MUST accept an optional `toolbar` React node rendered above the table. The toolbar slot is used for search inputs and action buttons. The toolbar MUST render outside the scrollable table area.

#### Scenario: Toolbar renders above table

- GIVEN a DataTable with a `toolbar` prop containing a search input and action button
- WHEN the component renders
- THEN the toolbar appears above the table in a sticky or non-scrolling container

### Requirement: Empty State Handling

The system MUST display an empty state when `data` is empty. The component accepts `emptyText` and `emptyIcon` props. Two variants exist: "no data" (initial load with zero records) and "search no results" (filter returned nothing). Feature layers provide the appropriate text/icon via props; the component does not determine which variant to show.

#### Scenario: Empty state with custom text

- GIVEN a DataTable with `emptyText="No items found"` and `emptyIcon={<SearchIcon />}`
- WHEN `data` is empty
- THEN the empty state displays the provided text and icon

#### Scenario: No empty state when data exists

- GIVEN a DataTable with `emptyText` and `emptyIcon`
- WHEN `data` has items
- THEN no empty state is rendered

### Requirement: Auto-Generated Skeleton from Column Config

The DataTableSkeleton component MUST render a skeleton loading state derived from the same `columns` array used by DataTable. The skeleton MUST render one header row and N data rows (default 5) with skeleton widths from each column's `skeletonWidth`. The skeleton MUST use the same responsive visibility as the real table.

#### Scenario: Skeleton matches table layout

- GIVEN a DataTableSkeleton with the same column config as a DataTable
- WHEN displayed
- THEN skeleton headers appear in the same order with matching responsive visibility
- AND skeleton body rows have widths matching each column's `skeletonWidth`

#### Scenario: Skeleton row count

- GIVEN a DataTableSkeleton with `rows` prop (default 5)
- WHEN displayed
- THEN exactly N skeleton rows are rendered

### Requirement: Shared Pagination Footer

The DataTablePagination component MUST render a pagination footer with: "X items total" text, selected count (when multi-select active), page numbers with ellipsis, and Previous/Next buttons. Pagination MUST use server-derived `totalCount` — the component MUST NOT compute totals client-side. The footer MUST always be visible at the bottom, outside the scrollable table area.

#### Scenario: Pagination with server totalCount

- GIVEN a DataTablePagination with `totalCount=150`, `currentPage=2`, `totalPages=15`
- WHEN rendered
- THEN "150 items total" is displayed
- AND page numbers show current page highlighted with ellipsis for large ranges

#### Scenario: Single page of results

- GIVEN a DataTablePagination with `totalPages=1`
- WHEN rendered
- THEN page number controls are hidden and only the total count text shows

#### Scenario: Selected count display

- GIVEN a DataTablePagination with `selectedCount=3` and multi-select active
- WHEN rendered
- THEN "3 selected" text appears alongside the total count

### Requirement: generatePageNumbers Utility

The system MUST provide a single `generatePageNumbers(current, total)` function in `utils.ts` returning `(number | "...")[]`. When `total <= 7`, all pages are shown. When `total > 7`, the function shows: first page, ellipsis (if current > 3), pages around current (current ± 1), ellipsis (if current < total - 2), and last page. This function MUST exist in exactly one file — no duplicates in feature layers.

#### Scenario: Small page count

- GIVEN `generatePageNumbers(1, 5)`
- WHEN called
- THEN returns `[1, 2, 3, 4, 5]` (all pages, no ellipsis)

#### Scenario: Large page count, middle position

- GIVEN `generatePageNumbers(5, 20)`
- WHEN called
- THEN returns `[1, "...", 4, 5, 6, "...", 20]`

#### Scenario: Large page count, near start

- GIVEN `generatePageNumbers(2, 20)`
- WHEN called
- THEN returns `[1, 2, 3, "...", 20]`

### Requirement: PaginatedResponse Type

The system MUST export a `PaginatedResponse<T>` interface from `data-table/types.ts` with fields: `data: T[]`, `pageNumber: number`, `pageSize: number`, `totalCount: number`, `totalPages: number`. The existing `PaginatedResponse<T>` in `items/catalog/types` MUST be migrated to import from this shared location. CustomersService MUST be updated to return `PaginatedResponse<CustomerResponseDto>`.

#### Scenario: PaginatedResponse shape

- GIVEN the `PaginatedResponse<T>` type
- WHEN used as a return type
- THEN the shape includes data, pageNumber, pageSize, totalCount, and totalPages

#### Scenario: CustomersService returns PaginatedResponse

- GIVEN `getCustomers()` called with pagination params
- WHEN the response is received
- THEN it conforms to `PaginatedResponse<CustomerResponseDto>` with server-derived `totalCount` and `totalPages`

### Requirement: i18n Isolation in Feature Layer

The DataTable component MUST NOT perform any internationalization internally. All user-facing text (empty states, pagination labels, column headers) MUST be passed via props from the feature layer. The component accepts strings, not translation keys.

#### Scenario: Component receives translated text

- GIVEN a feature layer calling `t("pagination_total", { count: 100 })`
- WHEN passed as `emptyText` or pagination label to DataTable
- THEN the component renders the resolved string, not the key

### Requirement: Action Button Styling Compatibility

Action buttons within table rows MUST follow the existing Items pattern: secondary variant for edit, destructive variant for delete, responsive sizing (`size-7 sm:size-8` for buttons, `size-3.5 sm:size-4` for icons). The DataTable does not render action buttons itself — this is handled by the column `render` function — but the pattern MUST be preserved in feature-layer column configs.

#### Scenario: Action buttons match existing style

- GIVEN a column config with `render` returning edit/delete buttons
- WHEN rendered in a DataTable row
- THEN buttons use secondary (edit) and destructive (delete) variants
- AND icons use `size-3.5 sm:size-4` responsive sizing
