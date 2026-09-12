import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Package } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { useItems } from "../hooks/use-items"
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
  const { data: branchesData } = useBranches(1, 100)
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
  }

  const handleBranchSelect = (branchId: string | null) => {
    setSelectedBranchId(branchId)
  }

  return (
    <Card className="flex h-[calc(100vh-8rem)] flex-col gap-4 overflow-hidden p-4 shadow-none sm:p-6 lg:p-8">
      {/* Header - fixed, not scrollable */}
      <header className="relative flex shrink-0 flex-row items-end justify-between gap-2 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            {selectedBranch ? t("product_catalog_in_branch", { name: selectedBranch.name }) : t("product_catalog")}
          </h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("product_catalog_desc")}</p>
        </div>

        {/* Branch Selector */}
        <BranchSelector options={selectorOptions} selectedId={selectedBranchId} onSelect={handleBranchSelect} />

        <Package
          color="#58626b"
          className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
        />
      </header>

      {/* Content - children handle their own scroll */}
      <div className="min-h-0 flex-1">
        {isGlobalView ? (
          <GlobalCatalogView onAssignToBranch={handleAssignToBranch} />
        ) : selectedBranchId ? (
          <BranchCatalogView branchId={selectedBranchId} onAssignClick={handleAssignFromBranch} />
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
    </Card>
  )
}
