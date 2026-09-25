import { useMemo, useState } from "react"
import { Layers, Package, Pencil, Plus, RefreshCw, SearchX, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { formatCurrency } from "@/utils/format"
import { ItemModifierFormDialog } from "../components/item-modifier-form-dialog"
import { ModifierGroupFormDialog } from "../components/modifier-group-form-dialog"
import {
  useDeleteItemModifier,
  useDeleteModifierGroup,
  useItemModifiers,
  useItemsForPicker,
  useModifierGroups,
} from "../hooks/use-modifiers"
import { modifierTypeLabelKey, type ItemModifier, type ModifierGroup } from "../types"

const TAB_GROUPS = "groups"
const TAB_BY_ITEM = "by-item"

export function ModifiersPage() {
  const { t } = useTranslation("business-items-modifiers")

  const [activeTab, setActiveTab] = useState(TAB_GROUPS)
  const [query, setQuery] = useState("")

  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupToEdit, setGroupToEdit] = useState<ModifierGroup | null>(null)

  const [parentItemId, setParentItemId] = useState("")
  const [modifierDialogOpen, setModifierDialogOpen] = useState(false)
  const [modifierToEdit, setModifierToEdit] = useState<ItemModifier | null>(null)

  // Objetivos de eliminación (confirmación visual, sin confirm() nativo)
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<ModifierGroup | null>(null)
  const [deleteModifierTarget, setDeleteModifierTarget] = useState<ItemModifier | null>(null)

  const groupsQuery = useModifierGroups()
  const itemsQuery = useItemsForPicker()
  const modifiersQuery = useItemModifiers(parentItemId)
  const deleteGroupMutation = useDeleteModifierGroup()
  const deleteModifierMutation = useDeleteItemModifier()

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data])
  const totalCount = groups.length
  const activeCount = useMemo(() => groups.filter((g) => g.isActive).length, [groups])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => g.name.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q))
  }, [groups, query])

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])
  const modifiers = useMemo(() => modifiersQuery.data ?? [], [modifiersQuery.data])

  const isMutating = deleteGroupMutation.isPending || deleteModifierMutation.isPending

  const openCreateGroup = () => {
    setGroupToEdit(null)
    setGroupDialogOpen(true)
  }

  const openEditGroup = (group: ModifierGroup) => {
    setGroupToEdit(group)
    setGroupDialogOpen(true)
  }

  const handleDeleteGroup = (group: ModifierGroup) => {
    setDeleteGroupTarget(group)
  }

  const handleAddModifier = () => {
    if (!parentItemId) {
      notify.error(t("select_product_first"))
      return
    }
    setModifierToEdit(null)
    setModifierDialogOpen(true)
  }

  const openEditModifier = (modifier: ItemModifier) => {
    setModifierToEdit(modifier)
    setModifierDialogOpen(true)
  }

  const handleDeleteModifier = (modifier: ItemModifier) => {
    setDeleteModifierTarget(modifier)
  }

  if (groupsQuery.isError && !groupsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <ErrorState
          eyebrow={t("page_title")}
          title={t("error_load_title")}
          description={t("error_load_desc")}
          action={
            <Button onClick={() => groupsQuery.refetch()}>
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
            <SummaryTile label={t("total_groups")} value={totalCount} loading={groupsQuery.isLoading} />
            <SummaryTile label={t("active_groups")} value={activeCount} loading={groupsQuery.isLoading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("page_title")}</CardTitle>
              <CardDescription>{t("card_desc")}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-5">
              <TabsTrigger value={TAB_GROUPS} className="gap-1.5">
                <Layers className="size-4" />
                {t("tab_groups")}
              </TabsTrigger>
              <TabsTrigger value={TAB_BY_ITEM} className="gap-1.5">
                <Package className="size-4" />
                {t("tab_by_item")}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Grupos ─────────────────────────────────────────── */}
            <TabsContent value={TAB_GROUPS} className="space-y-4">
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
                    {filteredGroups.length} {t("results")}
                  </Badge>
                  <Button
                    onClick={openCreateGroup}
                    disabled={isMutating}
                    size="sm"
                    className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                  >
                    <Plus className="size-4" />
                    {t("create_group")}
                  </Button>
                </div>
              </div>

              {groupsQuery.isLoading ? (
                <ModifiersSkeleton />
              ) : filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <SearchX className="mb-3 size-10 opacity-40" />
                  <p className="text-sm">{query ? t("no_results") : t("empty_desc")}</p>
                  {!query && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={openCreateGroup}>
                      {t("create_group")}
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name_label")}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t("selection_label")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("sort_order_label")}</TableHead>
                      <TableHead>{t("status_label")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <p className="font-medium">{group.name}</p>
                          {group.description ? (
                            <p className="hidden max-w-64 truncate text-xs text-muted-foreground sm:block">
                              {group.description}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {group.minSelection}–{group.maxSelection}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{group.sortOrder}</TableCell>
                        <TableCell>
                          <Badge tone={group.isActive ? "success" : "neutral"}>
                            {group.isActive ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 text-right sm:px-4">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => openEditGroup(group)}
                              disabled={isMutating}
                              aria-label={t("edit")}
                              title={t("edit")}
                            >
                              <Pencil className="size-3.5 sm:size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => handleDeleteGroup(group)}
                              disabled={isMutating}
                              aria-label={t("delete")}
                              title={t("delete")}
                            >
                              <Trash2 className="size-3.5 sm:size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* ── Tab: Por producto ───────────────────────────────────── */}
            <TabsContent value={TAB_BY_ITEM} className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="w-full space-y-1.5 md:max-w-xl">
                  <label htmlFor="modifier-parent-item" className="text-sm font-medium text-foreground">
                    {t("product_label")}
                  </label>
                  <Select value={parentItemId} onValueChange={setParentItemId} disabled={itemsQuery.isLoading}>
                    <SelectTrigger id="modifier-parent-item" className="w-full">
                      <SelectValue placeholder={t("product_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name ?? item.sku ?? item.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {parentItemId ? (
                    <Badge tone="neutral" className="w-fit">
                      {modifiers.length} {t("results")}
                    </Badge>
                  ) : null}
                  <Button
                    onClick={handleAddModifier}
                    disabled={isMutating}
                    size="sm"
                    className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                  >
                    <Plus className="size-4" />
                    {t("add_modifier")}
                  </Button>
                </div>
              </div>

              {itemsQuery.isError && !itemsQuery.isLoading ? (
                <ErrorState
                  variant="inline"
                  eyebrow={t("tab_by_item")}
                  title={t("error_items_load_title")}
                  description={t("error_items_load_desc")}
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={() => itemsQuery.refetch()}>
                      <RefreshCw className="size-4" />
                      {t("retry")}
                    </Button>
                  }
                />
              ) : itemsQuery.isLoading ? (
                <ModifiersSkeleton />
              ) : !parentItemId ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package className="mb-3 size-10 opacity-40" />
                  <p className="text-sm">{t("select_product_desc")}</p>
                </div>
              ) : modifiersQuery.isError && !modifiersQuery.isLoading ? (
                <ErrorState
                  variant="inline"
                  eyebrow={t("tab_by_item")}
                  title={t("error_modifiers_load_title")}
                  description={t("error_modifiers_load_desc")}
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={() => modifiersQuery.refetch()}>
                      <RefreshCw className="size-4" />
                      {t("retry")}
                    </Button>
                  }
                />
              ) : modifiersQuery.isLoading ? (
                <ModifiersSkeleton />
              ) : modifiers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Layers className="mb-3 size-10 opacity-40" />
                  <p className="text-sm">{t("empty_modifiers_desc")}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={handleAddModifier}>
                    {t("add_modifier")}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("child_item_header")}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t("group_label")}</TableHead>
                      <TableHead>{t("modifier_type_label")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("quantity_label")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("extra_price_label")}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t("status_label")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modifiers.map((modifier) => (
                      <TableRow key={modifier.id}>
                        <TableCell>
                          <p className="font-medium">{modifier.childItemName ?? modifier.childItemSku ?? "—"}</p>
                          <p className="hidden font-mono text-xs text-muted-foreground sm:block">
                            {modifier.childItemSku ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {modifier.modifierGroupName ?? t("no_group")}
                        </TableCell>
                        <TableCell>
                          <Badge tone={modifierTypeTone(modifier.modifierTypeCode)}>
                            {t(modifierTypeLabelKey(modifier.modifierTypeCode))}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {modifier.minQuantity}–{modifier.maxQuantity}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatCurrency(modifier.extraPrice)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge tone={modifier.isActive ? "success" : "neutral"}>
                            {modifier.isActive ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 text-right sm:px-4">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => openEditModifier(modifier)}
                              disabled={isMutating}
                              aria-label={t("edit")}
                              title={t("edit")}
                            >
                              <Pencil className="size-3.5 sm:size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => handleDeleteModifier(modifier)}
                              disabled={isMutating}
                              aria-label={t("delete")}
                              title={t("delete")}
                            >
                              <Trash2 className="size-3.5 sm:size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ModifierGroupFormDialog
        open={groupDialogOpen}
        onOpenChange={(open) => {
          setGroupDialogOpen(open)
          if (!open) setGroupToEdit(null)
        }}
        groupToEdit={groupToEdit}
      />

      <ItemModifierFormDialog
        open={modifierDialogOpen}
        onOpenChange={(open) => {
          setModifierDialogOpen(open)
          if (!open) setModifierToEdit(null)
        }}
        parentItemId={parentItemId}
        modifierToEdit={modifierToEdit}
        items={items}
      />

      {/* Confirmación visual: eliminar grupo */}
      <ConfirmActionDialog
        open={deleteGroupTarget !== null}
        onOpenChange={(openValue) => {
          if (!openValue) setDeleteGroupTarget(null)
        }}
        title={t("delete_group_title")}
        description={t("confirm_delete_group", { name: deleteGroupTarget?.name ?? "" })}
        confirmLabel={t("delete")}
        tone="destructive"
        isPending={deleteGroupMutation.isPending}
        onConfirm={() => {
          if (!deleteGroupTarget) return
          deleteGroupMutation.mutate(
            { id: deleteGroupTarget.id, name: deleteGroupTarget.name },
            { onSuccess: () => setDeleteGroupTarget(null) }
          )
        }}
      />

      {/* Confirmación visual: eliminar modificador */}
      <ConfirmActionDialog
        open={deleteModifierTarget !== null}
        onOpenChange={(openValue) => {
          if (!openValue) setDeleteModifierTarget(null)
        }}
        title={t("delete_modifier_title")}
        description={t("confirm_delete_modifier")}
        confirmLabel={t("delete")}
        tone="destructive"
        isPending={deleteModifierMutation.isPending}
        onConfirm={() => {
          if (!deleteModifierTarget) return
          deleteModifierMutation.mutate(
            { id: deleteModifierTarget.id, parentItemId: deleteModifierTarget.parentItemId },
            { onSuccess: () => setDeleteModifierTarget(null) }
          )
        }}
      />
    </div>
  )
}

function modifierTypeTone(code: string | number): "info" | "warning" | "purple" | "orange" {
  switch (modifierTypeLabelKey(code)) {
    case "modifier_required":
      return "warning"
    case "modifier_group_single":
      return "purple"
    case "modifier_group_multiple":
      return "orange"
    default:
      return "info"
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

function ModifiersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}
