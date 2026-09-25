import { useEffect, useMemo, useState } from "react"
import { Percent, Pencil, Plus, Power, RefreshCw, Save, SearchX, Tags } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import type { ItemResponseDto } from "../../catalog/types"
import { TaxRateFormDialog } from "../components/tax-rate-form-dialog"
import {
  useAssignItemTaxRates,
  useItemTaxRates,
  useItemsForTaxAssignment,
  useRemoveItemTaxRate,
  useSetTaxRateActive,
  useTaxRates,
} from "../hooks/use-tax-rates"
import { rateToPercent, taxTypeTextKey, type TaxRate } from "../types"

export function TaxesPage() {
  const { t } = useTranslation("business-items-taxes")

  const [tab, setTab] = useState("rates")
  const [query, setQuery] = useState("")
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

  if (isError && !isLoading) {
    return (
      <div className="space-y-6">
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("summary")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("page_title")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("page_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label={t("total_rates")} value={totalCount} loading={isLoading} />
            <SummaryTile label={t("active_rates")} value={activeCount} loading={isLoading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="space-y-1">
            <CardTitle>{t("page_title")}</CardTitle>
            <CardDescription>{t("card_desc")}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
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

            <TabsContent value="rates" className="mt-4 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl flex-1">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search_placeholder")}
                    className="h-8 w-full max-w-sm px-3 text-sm sm:h-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral" className="w-fit">
                    {filtered.length} {t("results")}
                  </Badge>
                  <Button
                    onClick={handleCreate}
                    disabled={isMutating}
                    size="sm"
                    className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                  >
                    <Plus className="size-4" />
                    {t("create")}
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <TaxesSkeleton />
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <SearchX className="mb-3 size-10 opacity-40" />
                  <p className="text-sm">{query ? t("no_results") : t("empty_desc")}</p>
                  {!query && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleCreate}>
                      {t("create")}
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name_label")}</TableHead>
                      <TableHead>{t("tax_type_label")}</TableHead>
                      <TableHead>{t("rate_label")}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t("country_label")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("is_default_label")}</TableHead>
                      <TableHead>{t("status_label")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Badge tone={taxTypeTone(r.taxType)}>{t(taxTypeTextKey(r.taxType))}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {rateToPercent(r.rate)}
                          {t("rate")}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {r.countryCode}
                          {r.regionCode ? ` / ${r.regionCode}` : ""}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {r.isDefault ? <Badge tone="warning">{t("is_default_label")}</Badge> : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge tone={r.isActive ? "success" : "neutral"}>
                            {r.isActive ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 text-right sm:px-4">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => handleEdit(r)}
                              disabled={isMutating}
                              aria-label={t("edit")}
                              title={t("edit")}
                            >
                              <Pencil className="size-3.5 sm:size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={r.isActive ? "destructive" : "secondary"}
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => handleToggleStatus(r)}
                              disabled={isMutating}
                              aria-label={r.isActive ? t("deactivate") : t("activate")}
                              title={r.isActive ? t("deactivate") : t("activate")}
                            >
                              <Power className="size-3.5 sm:size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="assign" className="mt-4">
              <AssignTaxSection itemId={assignItemId} onItemIdChange={setAssignItemId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
    </div>
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
  useEffect(() => {
    setCheckedIds(new Set((assignedQuery.data ?? []).map((x) => x.taxRateId)))
  }, [assignedQuery.data])

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
        <TaxesSkeleton />
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

/** Tono del badge según el tipo de impuesto. */
function taxTypeTone(taxType: number) {
  switch (taxType) {
    case 0:
      return "primary"
    case 1:
      return "info"
    case 2:
      return "warning"
    case 3:
      return "purple"
    case 4:
      return "neutral"
    default:
      return "orange"
  }
}

function SummaryTile({ label, value, loading = false }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-16" />
        ) : (
          <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

function TaxesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}
