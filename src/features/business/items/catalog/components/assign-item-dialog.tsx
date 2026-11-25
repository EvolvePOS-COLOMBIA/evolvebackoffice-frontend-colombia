import { useState } from "react"
import { CheckCircle2, CheckSquare, Square, Search, Store, Phone, Mail } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"
import type { ItemResponseDto } from "../types"
import {
  buildAssignPayload,
  filterItems,
  getSelectableIds,
  splitAndSortItems,
  toggleSelectAll,
} from "../utils/assign-dialog"

type Branch = {
  id: string
  name: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

type AssignItemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "select-branch" | "select-items"
  // For select-branch mode: items are pre-selected, user picks branches
  items?: ItemResponseDto[]
  branches?: Branch[]
  // For select-items mode: la sucursal destino es fija, el usuario elige artículos
  targetBranchId?: string | null
  targetBranchName?: string | null
  assignedItemIds?: Set<string>
  targetItems?: ItemResponseDto[]
  onConfirm: (data: { items: ItemResponseDto[]; branchIds: string[] }) => void
  isSubmitting?: boolean
}

const EMPTY_SET: Set<string> = new Set()

export function AssignItemDialog({
  open,
  onOpenChange,
  mode,
  items = [],
  branches = [],
  targetBranchId = null,
  targetBranchName = null,
  assignedItemIds = EMPTY_SET,
  targetItems,
  onConfirm,
  isSubmitting = false,
}: AssignItemDialogProps) {
  const { t } = useTranslation("business-items-catalog")
  const [searchQuery, setSearchQuery] = useState("")

  // Multi-select mode for branches
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set())

  // Select-items mode: show items
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())

  // Reinicia el estado cada vez que el diálogo se abre (el componente sigue montado).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setSearchQuery("")
      setSelectedBranchIds(new Set())
      setSelectedItemIds(new Set())
    }
  }

  const toggleBranch = (id: string) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleItem = (id: string) => {
    if (assignedItemIds.has(id)) return
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const payload = buildAssignPayload(mode, {
      selectedItemIds,
      items: mode === "select-branch" ? items : (targetItems ?? []),
      targetBranchId,
      selectedBranchIds,
      assignedItemIds,
    })
    if (payload) onConfirm(payload)
  }

  const filteredBranches = branches.filter((branch) => branch.name?.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredItems = splitAndSortItems(filterItems(targetItems ?? [], searchQuery), assignedItemIds)
  const selectableIds = getSelectableIds(filteredItems, assignedItemIds)
  const allSelectableSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedItemIds.has(id))
  const assignedCount = (targetItems ?? []).filter((item) => assignedItemIds.has(item.id)).length
  const availableCount = (targetItems ?? []).length - assignedCount

  const isConfirmDisabled = mode === "select-branch" ? selectedBranchIds.size === 0 : selectedItemIds.size === 0

  const title = mode === "select-branch" ? t("assign_to_branch") : t("assign_product")

  const description =
    mode === "select-branch"
      ? t("assign_items_to_branch_desc", { count: items.length })
      : t("assign_items_to_target_branch_desc", { branch: targetBranchName ?? "—" })

  const confirmLabel =
    mode === "select-branch"
      ? t("confirm_assign", { count: selectedBranchIds.size })
      : t("confirm_assign", { count: selectedItemIds.size })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-8rem)] w-[calc(100%-2rem)] flex-col overflow-hidden lg:w-200">
        <DialogHeader className="shrink-0 pb-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>

        {/* Search - shrink-0 to prevent it from being scrollable */}
        <div className="relative shrink-0 pb-3">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={mode === "select-branch" ? t("search_branches") : t("search_items")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {mode === "select-items" && (
          <p className="shrink-0 pb-3 text-xs text-muted-foreground">
            {t("assign_counter", { assigned: assignedCount, available: availableCount })}
          </p>
        )}

        {/* Content - take full remaining height and scroll */}
        <div className="flex-1 overflow-y-auto pb-2">
          {mode === "select-branch" ? (
            // Show branches as cards with multi-select
            filteredBranches.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">{t("no_branches")}</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredBranches.map((branch) => {
                  const isSelected = selectedBranchIds.has(branch.id)
                  return (
                    <button
                      key={branch.id}
                      onClick={() => toggleBranch(branch.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border/50 bg-card hover:border-border hover:bg-accent/50"
                      } `}
                    >
                      {/* Icon */}
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"} `}
                      >
                        <Store className="size-5" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">{branch.name ?? "—"}</p>
                          {isSelected && <CheckSquare className="size-4 shrink-0 text-primary" />}
                        </div>
                        {branch.address && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{branch.address}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {branch.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {branch.phone}
                            </span>
                          )}
                          {branch.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="size-3" />
                              {branch.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          ) : // Show items as table
          filteredItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{t("no_items")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <button
                      type="button"
                      onClick={() => setSelectedItemIds((prev) => toggleSelectAll(prev, selectableIds))}
                      disabled={selectableIds.length === 0}
                      aria-label={t("assign_select_all_aria")}
                      aria-pressed={allSelectableSelected}
                      className="flex items-center disabled:opacity-50"
                    >
                      {allSelectableSelected ? (
                        <CheckSquare className="size-4 text-primary" />
                      ) : (
                        <Square className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("sku")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("plu")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("department")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const isAssigned = assignedItemIds.has(item.id)
                  const isSelected = selectedItemIds.has(item.id)
                  const cellMuted = isAssigned ? "opacity-60" : undefined
                  return (
                    <TableRow key={item.id} className={isSelected ? "bg-primary/5" : undefined}>
                      <TableCell>
                        {isAssigned ? (
                          <CheckCircle2
                            className="size-4 text-emerald-500"
                            role="img"
                            aria-label={t("assign_item_assigned_aria", { name: item.name ?? "—" })}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-label={t("assign_select_item_aria", { name: item.name ?? "—" })}
                            aria-pressed={isSelected}
                            className="flex items-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4 text-primary" />
                            ) : (
                              <Square className="size-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      {/* overflow-wrap:anywhere evita que un nombre largo sin espacios estire la tabla */}
                      <TableCell className={cn("font-medium [overflow-wrap:anywhere]", cellMuted)}>
                        {item.name ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn("hidden whitespace-nowrap text-muted-foreground sm:table-cell", cellMuted)}
                      >
                        {item.sku ?? "—"}
                      </TableCell>
                      <TableCell className={cn("hidden text-muted-foreground md:table-cell", cellMuted)}>
                        {item.plu}
                      </TableCell>
                      <TableCell className={cn("hidden text-muted-foreground sm:table-cell", cellMuted)}>
                        {item.departmentName ?? "—"}
                      </TableCell>
                      <TableCell>
                        {isAssigned && (
                          <Badge tone="success" className="sm:whitespace-nowrap">
                            {t("assign_already_in_branch")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirmDisabled || isSubmitting}>
            {isSubmitting ? t("saving") : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
