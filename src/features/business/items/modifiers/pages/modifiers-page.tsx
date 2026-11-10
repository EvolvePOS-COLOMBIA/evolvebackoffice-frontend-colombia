import { useMemo, useState } from "react"
import { CheckCircle2, Layers, Package, Plus, RefreshCw, SearchX } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { ItemModifierFormDialog } from "../components/item-modifier-form-dialog"
import { ModifierGroupFormDialog } from "../components/modifier-group-form-dialog"
import { buildItemModifierColumns, buildModifierGroupColumns } from "../components/modifiers-columns"
import {
  useDeleteItemModifier,
  useDeleteModifierGroup,
  useItemModifiers,
  useItemsForPicker,
  useModifierGroups,
} from "../hooks/use-modifiers"
import type { ItemModifier, ModifierGroup } from "../types"

const PAGE_SIZE = 20
const TAB_GROUPS = "groups"
const TAB_BY_ITEM = "by-item"

export function ModifiersPage() {
  const { t } = useTranslation("business-items-modifiers")

  const [activeTab, setActiveTab] = useState(TAB_GROUPS)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [byItemPage, setByItemPage] = useState(1)

  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupToEdit, setGroupToEdit] = useState<ModifierGroup | null>(null)

  // Vive en la página para no perder el producto seleccionado al cambiar de pestaña
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

  const hasQuery = query.trim().length > 0
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleGroups = useMemo(
    () => filteredGroups.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredGroups, safePage]
  )

  const byItemTotalPages = Math.max(1, Math.ceil(modifiers.length / PAGE_SIZE))
  const byItemSafePage = Math.min(byItemPage, byItemTotalPages)
  const visibleModifiers = useMemo(
    () => modifiers.slice((byItemSafePage - 1) * PAGE_SIZE, byItemSafePage * PAGE_SIZE),
    [modifiers, byItemSafePage]
  )

  const isMutating = deleteGroupMutation.isPending || deleteModifierMutation.isPending

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  const handleParentItemChange = (value: string) => {
    setParentItemId(value)
    setByItemPage(1)
  }

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

  const groupColumns = buildModifierGroupColumns(t, {
    isMutating,
    onEdit: openEditGroup,
    onDelete: handleDeleteGroup,
  })

  const modifierColumns = buildItemModifierColumns(t, {
    isMutating,
    onEdit: openEditModifier,
    onDelete: handleDeleteModifier,
  })

  if (groupsQuery.isError && !groupsQuery.isLoading) {
    return (
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
    )
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/items", label: t("back_to_items") }}
        title={t("page_title")}
        description={t("page_desc")}
        stats={[
          { icon: Layers, tone: "primary", label: t("total_groups"), value: totalCount },
          { icon: CheckCircle2, tone: "success", label: t("active_groups"), value: activeCount },
        ]}
        tabs={
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value={TAB_GROUPS} className="gap-1.5">
                <Layers className="size-4" />
                {t("tab_groups")}
              </TabsTrigger>
              <TabsTrigger value={TAB_BY_ITEM} className="gap-1.5">
                <Package className="size-4" />
                {t("tab_by_item")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        toolbar={
          activeTab === TAB_GROUPS
            ? {
                search: { value: query, onChange: handleSearchChange, placeholder: t("search_placeholder") },
                actions: (
                  <Button
                    onClick={openCreateGroup}
                    disabled={isMutating}
                    className="relative shadow-sm shadow-primary/20"
                  >
                    <Plus className="size-4" />
                    {t("create_group")}
                  </Button>
                ),
              }
            : undefined
        }
      >
        {activeTab === TAB_GROUPS ? (
          <DataTable
            columns={groupColumns}
            data={visibleGroups}
            isLoading={groupsQuery.isLoading}
            page={safePage}
            totalPages={totalPages}
            totalCount={filteredGroups.length}
            onPageChange={setPage}
            skeletonRows={5}
            emptyState={{
              icon: hasQuery ? SearchX : Layers,
              title: hasQuery ? t("no_results") : t("empty_title"),
              description: hasQuery ? t("search_desc") : t("empty_desc"),
              action: hasQuery ? null : (
                <Button variant="outline" onClick={openCreateGroup}>
                  <Plus className="size-4" />
                  {t("create_group")}
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
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="w-full space-y-1.5 md:max-w-xl">
                <label htmlFor="modifier-parent-item" className="text-sm font-medium text-foreground">
                  {t("product_label")}
                </label>
                <Select value={parentItemId} onValueChange={handleParentItemChange} disabled={itemsQuery.isLoading}>
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

              <Button
                onClick={handleAddModifier}
                disabled={isMutating}
                size="sm"
                className="h-8 w-fit px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
              >
                <Plus className="size-4" />
                {t("add_modifier")}
              </Button>
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
              <DataTable
                columns={modifierColumns}
                data={[]}
                isLoading
                page={1}
                totalPages={1}
                totalCount={0}
                onPageChange={() => undefined}
                skeletonRows={5}
              />
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
              <DataTable
                columns={modifierColumns}
                data={[]}
                isLoading
                page={1}
                totalPages={1}
                totalCount={0}
                onPageChange={() => undefined}
                skeletonRows={5}
              />
            ) : (
              <DataTable
                columns={modifierColumns}
                data={visibleModifiers}
                isLoading={false}
                page={byItemSafePage}
                totalPages={byItemTotalPages}
                totalCount={modifiers.length}
                onPageChange={setByItemPage}
                skeletonRows={5}
                emptyState={{
                  icon: Layers,
                  title: t("empty_modifiers_desc"),
                  action: (
                    <Button variant="outline" onClick={handleAddModifier}>
                      <Plus className="size-4" />
                      {t("add_modifier")}
                    </Button>
                  ),
                }}
                labels={{
                  previous: t("previous"),
                  next: t("next"),
                  paginationTotal: (count) => t("list_total_modifiers", { total: count }),
                  paginationProgress: (count, total) => t("list_progress_modifiers", { count, total }),
                }}
              />
            )}
          </div>
        )}
      </EntityListLayout>

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
    </>
  )
}
