import { useState } from "react"
import { CheckSquare, Square, Search, Store, Phone, Mail } from "lucide-react"

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
import { useTranslation } from "@/i18n/use-i18n"
import type { ItemResponseDto } from "../types"

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
  // For select-items mode: branches are pre-selected, user picks items
  availableBranches?: Branch[]
  targetItems?: ItemResponseDto[]
  onConfirm: (data: { items: ItemResponseDto[]; branchIds: string[] }) => void
  isSubmitting?: boolean
}

export function AssignItemDialog({
  open,
  onOpenChange,
  mode,
  items = [],
  branches = [],
  availableBranches = [],
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
    if (mode === "select-branch" && selectedBranchIds.size > 0) {
      onConfirm({ items, branchIds: Array.from(selectedBranchIds) })
    } else if (mode === "select-items" && availableBranches.length > 0) {
      const selected = targetItems?.filter((item) => selectedItemIds.has(item.id)) ?? []
      onConfirm({ items: selected, branchIds: availableBranches.map((b) => b.id) })
    }
  }

  const filteredBranches = branches.filter((branch) => branch.name?.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredItems =
    targetItems?.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? []

  const isConfirmDisabled = mode === "select-branch" ? selectedBranchIds.size === 0 : selectedItemIds.size === 0

  const title = mode === "select-branch" ? t("assign_to_branch") : t("assign_product")

  const description =
    mode === "select-branch"
      ? t("assign_items_to_branch_desc", { count: items.length })
      : t("assign_items_to_branch_desc", { count: selectedItemIds.size })

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
            <Table className="min-w-100">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("sku")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("plu")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className={selectedItemIds.has(item.id) ? "bg-primary/5" : undefined}>
                    <TableCell>
                      <button onClick={() => toggleItem(item.id)} className="flex items-center">
                        {selectedItemIds.has(item.id) ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{item.name ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{item.sku ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{item.plu}</TableCell>
                  </TableRow>
                ))}
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
