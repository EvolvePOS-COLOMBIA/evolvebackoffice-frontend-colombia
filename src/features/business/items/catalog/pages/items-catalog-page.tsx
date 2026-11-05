import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, DollarSign, Package, PowerOff } from "lucide-react"
import toast from "react-hot-toast"

import { EntityListLayout, type StatConfig } from "@/components/share"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { useItems } from "../hooks/use-items"
import { useBranchItems } from "../hooks/use-branch-items"
import { createBranchItem } from "../services/branch-items.service"
import { BranchSelector, type BranchSelectorOption } from "../components/branch-selector"
import { GlobalCatalogView } from "../components/global-catalog-view"
import { BranchCatalogView } from "../components/branch-catalog-view"
import { AssignItemDialog } from "../components/assign-item-dialog"
import type { ItemResponseDto, CreateBranchItemDto } from "../types"

export function ItemsCatalogPage() {
  const { t } = useTranslation("business-items-catalog")
  const queryClient = useQueryClient()
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<"select-branch" | "select-items">("select-branch")
  const [itemsToAssign, setItemsToAssign] = useState<ItemResponseDto[]>([])

  // Fetch branches for the selector
  const { data: branchesData, isLoading: branchesLoading } = useBranches(1, 100)
  const branches = branchesData?.data ?? []

  // Fetch all global items (for assign-from-branch flow)
  const { data: globalItemsData } = useItems({ pageNumber: 1, pageSize: 200 })
  const allGlobalItems = globalItemsData?.data ?? []

  // Build selector options: Global + all branches
  const selectorOptions: BranchSelectorOption[] = [
    { id: null, name: t("global_catalog") },
    ...branches.map((b) => ({ id: b.id, name: b.name })),
  ]

  const selectedBranch = branches.find((b) => b.id === selectedBranchId)
  const isGlobalView = selectedBranchId === null

  // Stats del catálogo global: total (con inactivos) e activos (query por defecto).
  const { data: totalItemsData } = useItems({ pageNumber: 1, pageSize: 1, includeInactive: true })
  const totalItems = totalItemsData?.totalCount ?? 0
  const activeItems = globalItemsData?.totalCount ?? 0
  const inactiveItems = Math.max(totalItems - activeItems, 0)

  // Stats de la sucursal: asignados, sin precio y bajo mínimo sobre la lista completa (tope 200).
  const { data: branchStatsData } = useBranchItems(selectedBranchId, { pageNumber: 1, pageSize: 200 })
  const branchStatsItems = branchStatsData?.data ?? []
  const noPriceCount = branchStatsItems.filter((item) => item.price === 0).length
  const lowStockCount = branchStatsItems.filter((item) => item.quantity <= item.reorderPoint).length

  const stats: StatConfig[] = isGlobalView
    ? [
        { icon: Package, tone: "primary", label: t("stat_products"), value: totalItems },
        { icon: CheckCircle2, tone: "success", label: t("stat_active"), value: activeItems },
        { icon: PowerOff, tone: "muted", label: t("stat_inactive"), value: inactiveItems },
      ]
    : [
        { icon: Package, tone: "primary", label: t("stat_assigned"), value: branchStatsData?.totalCount ?? 0 },
        { icon: DollarSign, tone: "warning", label: t("stat_no_price"), value: noPriceCount },
        { icon: AlertTriangle, tone: "danger", label: t("stat_low_stock"), value: lowStockCount },
      ]

  // Mutation for creating branch items — dynamic branchId
  const createBranchItemMutation = useMutation({
    mutationFn: ({ branchId, payload }: { branchId: string; payload: CreateBranchItemDto }) =>
      createBranchItem(branchId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branch-items", variables.branchId] })
    },
  })

  // From Global view: select items → pick branch
  const handleAssignToBranch = (items: ItemResponseDto[]) => {
    setItemsToAssign(items)
    setAssignMode("select-branch")
    setAssignDialogOpen(true)
  }

  // From Branch view: pick items from global → assign to this branch
  const handleAssignFromBranch = () => {
    setItemsToAssign(allGlobalItems)
    setAssignMode("select-items")
    setAssignDialogOpen(true)
  }

  const handleAssignConfirm = async (data: { items: ItemResponseDto[]; branchIds: string[] }) => {
    const { items, branchIds } = data

    // Create branch items for each selected item and each selected branch
    for (const branchId of branchIds) {
      for (const item of items) {
        createBranchItemMutation.mutate({
          branchId,
          payload: {
            branchPublicId: branchId,
            itemPublicId: item.id,
            price: 0,
            priceA: 0,
            priceB: 0,
            priceC: 0,
            salePrice: 0,
            cost: 0,
            quantity: 0,
            reorderPoint: 0,
            restockLevel: 0,
            binLocation: null,
          },
        })
      }
    }

    setAssignDialogOpen(false)
    setItemsToAssign([])

    const totalCreated = branchIds.length * items.length
    if (totalCreated > 0) {
      toast.success(
        totalCreated === 1 ? t("toast_item_assigned") : t("toast_items_assigned_count", { count: totalCreated })
      )
    }
  }

  const handleBranchSelect = (branchId: string | null) => {
    setSelectedBranchId(branchId)
  }

  return (
    <EntityListLayout
      back={{ to: "/business/items", label: t("back_to_items") }}
      title={selectedBranch ? t("product_catalog_in_branch", { name: selectedBranch.name }) : t("product_catalog")}
      description={selectedBranch ? t("branch_catalog_desc") : t("product_catalog_desc")}
      tabs={
        branchesLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : branches.length === 0 ? undefined : (
          <BranchSelector options={selectorOptions} selectedId={selectedBranchId} onSelect={handleBranchSelect} />
        )
      }
      stats={stats}
    >
      {/* Content - children handle their own scroll */}
      <div className="min-h-0 flex-1">
        {isGlobalView ? (
          <GlobalCatalogView onAssignToBranch={handleAssignToBranch} />
        ) : selectedBranchId ? (
          <BranchCatalogView
            key={selectedBranchId}
            branchId={selectedBranchId}
            onAssignClick={handleAssignFromBranch}
          />
        ) : null}
      </div>

      {/* Assign Dialog */}
      <AssignItemDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        mode={assignMode}
        items={assignMode === "select-branch" ? itemsToAssign : undefined}
        branches={assignMode === "select-branch" ? branches : undefined}
        availableBranches={assignMode === "select-items" ? branches : undefined}
        targetItems={assignMode === "select-items" ? itemsToAssign : undefined}
        onConfirm={handleAssignConfirm}
        isSubmitting={createBranchItemMutation.isPending}
      />
    </EntityListLayout>
  )
}
