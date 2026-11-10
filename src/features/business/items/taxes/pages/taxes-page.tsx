import { useMemo, useState } from "react"
import { CheckCircle2, Percent, Plus, RefreshCw, SearchX, Save, Tags } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import type { ItemResponseDto } from "../../catalog/types"
import { TaxRateFormDialog } from "../components/tax-rate-form-dialog"
import { buildTaxRateColumns, taxTypeTone } from "../components/taxes-columns"
import {
  useAssignItemTaxRates,
  useItemTaxRates,
  useItemsForTaxAssignment,
  useRemoveItemTaxRate,
  useSetTaxRateActive,
  useTaxRates,
} from "../hooks/use-tax-rates"
import { rateToPercent, taxTypeTextKey, type TaxRate } from "../types"

const PAGE_SIZE = 20

export function TaxesPage() {
  const { t } = useTranslation("business-items-taxes")

  const [tab, setTab] = useState("rates")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<TaxRate | null>(null)
  // Vive en la página para no perder el producto seleccionado al cambiar de pestaña
  const [assignItemId, setAssignItemId] = useState("")

  const { data, isLoading, isError, refetch } = useTaxRates(1, 500)
  const setStatusMutation = useSetTaxRateActive()

  const taxRates = useMemo(() => data?.data ?? [], [data?.data])
  const totalCount = data?.totalCount ?? 0
  const activeCount = useMemo(() => taxRates.filter((r) => r.isActive).length, [taxRates])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return taxRates
    return taxRates.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.countryCode.toLowerCase().includes(q) ||
        (r.regionCode ?? "").toLowerCase().includes(q) ||
        r.taxTypeName.toLowerCase().includes(q)
    )
  }, [taxRates, query])

  const hasQuery = query.trim().length > 0
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRows = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  )

  const handleCreate = () => {
    setSelectedTaxRate(null)
    setFormOpen(true)
  }

  const handleEdit = (taxRate: TaxRate) => {
    setSelectedTaxRate(taxRate)
    setFormOpen(true)
  }

  // Activar es directo; desactivar pide confirmación visual.
  const handleToggleStatus = (taxRate: TaxRate) => {
    if (taxRate.isActive) {
      setDeactivateTarget(taxRate)
    } else {
      setStatusMutation.mutate({ id: taxRate.id, active: true })
    }
  }

  const isMutating = setStatusMutation.isPending

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  const columns = buildTaxRateColumns(t, {
    isMutating,
    onEdit: handleEdit,
    onToggle: handleToggleStatus,
  })

  if (isError && !isLoading) {
    return (
      <ErrorState
        eyebrow={t("page_title")}
        title={t("error_load_title")}
        description={t("error_load_desc")}
        action={
          <Button onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            {t("retry")}
          </Button>
        }
      />
    )
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/items", label: t("back_to_items") }}
        title={t("page_title")}
        description={t("page_desc")}
        stats={[
          { icon: Percent, tone: "primary", label: t("total_rates"), value: totalCount },
          { icon: CheckCircle2, tone: "success", label: t("active_rates"), value: activeCount },
        ]}
        tabs={
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="rates" className="gap-1.5">
                <Percent className="size-4" />
                {t("tab_rates")}
              </TabsTrigger>
              <TabsTrigger value="assign" className="gap-1.5">
                <Tags className="size-4" />
                {t("tab_assign")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        toolbar={
          tab === "rates"
            ? {
                search: { value: query, onChange: handleSearchChange, placeholder: t("search_placeholder") },
                actions: (
                  <Button onClick={handleCreate} disabled={isMutating} className="relative shadow-sm shadow-primary/20">
                    <Plus className="size-4" />
                    {t("create")}
                  </Button>
                ),
              }
            : undefined
        }
      >
        {tab === "rates" ? (
          <DataTable
            columns={columns}
            data={visibleRows}
            isLoading={isLoading}
            page={safePage}
            totalPages={totalPages}
            totalCount={filtered.length}
            onPageChange={setPage}
            skeletonRows={5}
            emptyState={{
              icon: hasQuery ? SearchX : Percent,
              title: hasQuery ? t("no_results") : t("empty_title"),
              description: hasQuery ? t("search_desc") : t("empty_desc"),
              action: hasQuery ? null : (
                <Button onClick={handleCreate}>
                  <Plus className="size-4" />
                  {t("create")}
                </Button>
              ),
            }}
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) => t("list_total", { total: count }),
              paginationProgress: (count, total) => t("list_progress", { count, total }),
            }}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AssignTaxSection itemId={assignItemId} onItemIdChange={setAssignItemId} />
          </div>
        )}
      </EntityListLayout>

      <TaxRateFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedTaxRate(null)
        }}
        taxRateToEdit={selectedTaxRate}
      />

      {/* Confirmación visual: desactivar tasa de impuesto */}
      <ConfirmActionDialog
        open={deactivateTarget !== null}
        onOpenChange={(openValue) => {
          if (!openValue) setDeactivateTarget(null)
        }}
        title={t("deactivate_title")}
        description={t("confirm_deactivate", { name: deactivateTarget?.name ?? "" })}
        confirmLabel={t("deactivate")}
        tone="destructive"
        isPending={isMutating}
        onConfirm={() => {
          if (!deactivateTarget) return
          setStatusMutation.mutate(
            { id: deactivateTarget.id, active: false },
            { onSuccess: () => setDeactivateTarget(null) }
          )
        }}
      />
    </>
  )
}

/**
 * Pestaña "Asignar a producto": permite marcar qué tasas de impuesto activas
 * aplican a un producto. El POST del backend solo agrega, así que las bajas se
 * ejecutan una a una con DELETE.
 */
function AssignTaxSection({ itemId, onItemIdChange }: { itemId: string; onItemIdChange: (itemId: string) => void }) {
  const { t } = useTranslation("business-items-taxes")

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const itemsQuery = useItemsForTaxAssignment()
  const ratesQuery = useTaxRates(1, 500)
  const assignedQuery = useItemTaxRates(itemId)
  const assignMutation = useAssignItemTaxRates()
  const removeMutation = useRemoveItemTaxRate()

  const items = useMemo(() => itemsQuery.data?.data ?? [], [itemsQuery.data?.data])
  const activeRates = useMemo(() => (ratesQuery.data?.data ?? []).filter((r) => r.isActive), [ratesQuery.data?.data])
  const assignedIds = useMemo(() => new Set((assignedQuery.data ?? []).map((x) => x.taxRateId)), [assignedQuery.data])

  // Sincroniza los checks con las asignaciones actuales del producto
  const [prevAssignedIds, setPrevAssignedIds] = useState<Set<string> | null>(null)
  if (assignedIds !== prevAssignedIds) {
    setPrevAssignedIds(assignedIds)
    setCheckedIds(new Set(assignedIds))
  }

  const isDirty = useMemo(() => {
    if (checkedIds.size !== assignedIds.size) return true
    for (const id of checkedIds) {
      if (!assignedIds.has(id)) return true
    }
    return false
  }, [assignedIds, checkedIds])

  const isSaving = assignMutation.isPending || removeMutation.isPending

  const toggleRate = (taxRateId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taxRateId)) next.delete(taxRateId)
      else next.add(taxRateId)
      return next
    })
  }

  const handleSave = async () => {
    if (!itemId) return
    const adds = activeRates.filter((r) => checkedIds.has(r.id) && !assignedIds.has(r.id)).map((r) => r.id)
    const removes = activeRates.filter((r) => assignedIds.has(r.id) && !checkedIds.has(r.id)).map((r) => r.id)
    if (adds.length === 0 && removes.length === 0) return

    try {
      // El backend solo suma tasas en el POST: primero agregar y luego quitar una a una
      if (adds.length > 0) {
        await assignMutation.mutateAsync({ itemId, taxRateIds: adds })
      }
      if (removes.length > 0) {
        await Promise.all(removes.map((taxRateId) => removeMutation.mutateAsync({ itemId, taxRateId })))
      }
      notify.success(t("toast_assignment_saved"))
    } catch {
      // El error ya se notifica desde los hooks
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tax-assign-item">{t("product_label")}</Label>
        {itemsQuery.isLoading ? (
          <Skeleton className="h-11 w-full" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_items")}</p>
        ) : (
          <Select value={itemId} onValueChange={onItemIdChange}>
            <SelectTrigger id="tax-assign-item" className="w-full sm:w-96">
              <SelectValue placeholder={t("select_item")} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {itemLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">{t("assign_hint")}</p>
      </div>

      {!itemId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-muted-foreground">
          <Tags className="mb-3 size-8 opacity-40" />
          <p className="text-sm">{t("no_item_selected")}</p>
        </div>
      ) : assignedQuery.isLoading || ratesQuery.isLoading ? (
        <AssignTaxSkeleton />
      ) : assignedQuery.isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-muted-foreground">
          <p className="text-sm">{t("error_load_desc")}</p>
        </div>
      ) : activeRates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-muted-foreground">
          <SearchX className="mb-3 size-8 opacity-40" />
          <p className="text-sm">{t("no_active_rates")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge tone="primary" className="w-fit">
              {t("assigned_taxes")}
            </Badge>
            <Badge tone="neutral" className="w-fit">
              {checkedIds.size} {t("selected_count")}
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t("assign_column")}</TableHead>
                <TableHead>{t("name_label")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("tax_type_label")}</TableHead>
                <TableHead className="text-right">{t("rate_label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="size-4"
                      aria-label={t("assign_toggle", { name: r.name })}
                      checked={checkedIds.has(r.id)}
                      disabled={isSaving}
                      onChange={() => toggleRate(r.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge tone={taxTypeTone(r.taxType)}>{t(taxTypeTextKey(r.taxType))}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {rateToPercent(r.rate)}
                    {t("rate")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!isDirty || isSaving}>
              <Save className="size-4" />
              {isSaving ? t("saving") : t("save_assignment")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Nombre visible del ítem para el selector (con fallback a SKU/id). */
function itemLabel(item: ItemResponseDto): string {
  const name = item.name?.trim()
  const sku = item.sku?.trim()
  if (name && sku) return `${name} · ${sku}`
  return name || sku || item.id
}

/** Filas de esqueleto de la pestaña de asignación (la lista de tasas usa el de DataTable). */
function AssignTaxSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}
