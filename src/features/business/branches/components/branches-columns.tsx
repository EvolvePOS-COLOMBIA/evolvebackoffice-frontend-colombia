import { Building2, CircleEllipsis, MonitorCog, Power, Settings2, SquarePen } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Branch } from "../types"

export type BranchPendingAction = "activate" | "deactivate"

type BranchColumnActions = {
  isMutating: boolean
  onEdit: (branch: Branch) => void
  onNavigate: (path: string) => void
  onRequestAction: (branch: Branch, type: BranchPendingAction) => void
}

export function buildBranchColumns(
  t: (key: string) => string,
  { isMutating, onEdit, onNavigate, onRequestAction }: BranchColumnActions
): ColumnDef<Branch>[] {
  return [
    {
      key: "branch",
      header: t("branch_label"),
      minWidth: "min-w-[220px]",
      render: (branch) => (
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/5">
            <Building2 className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{branch.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{branch.identification || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: t("contact_label"),
      minWidth: "min-w-[200px]",
      responsive: "md",
      render: (branch) => (
        <div className="space-y-1 text-muted-foreground">
          <p>{branch.email || branch.phone || "—"}</p>
          {branch.address ? <p className="max-w-64 truncate text-xs">{branch.address}</p> : null}
        </div>
      ),
    },
    {
      key: "admin",
      header: t("admin_label"),
      minWidth: "min-w-[150px]",
      responsive: "lg",
      render: (branch) => <span className="text-muted-foreground">{branch.adminUserName || "—"}</span>,
    },
    {
      key: "status",
      header: t("status_label"),
      minWidth: "min-w-[90px]",
      render: (branch) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={branch.isActive ? "success" : "neutral"}>
            {branch.isActive ? t("status_active") : t("status_inactive")}
          </Badge>
          {branch.isSupplier ? <Badge tone="primary">{t("supplier_badge")}</Badge> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[150px]",
      align: "right",
      stickyRight: true,
      render: (branch) => (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(branch)} disabled={isMutating}>
            <SquarePen className="size-4" />
            {t("edit")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t("more_actions")}
                disabled={isMutating}
              >
                <CircleEllipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => onNavigate(`/business/branches/${branch.id}/config`)}>
                <Settings2 className="size-4" />
                {t("configure")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNavigate(`/business/branches/${branch.id}/settings/terminals`)}>
                <MonitorCog className="size-4" />
                {t("terminals")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant={branch.isActive ? "destructive" : "default"}
                onSelect={() => onRequestAction(branch, branch.isActive ? "deactivate" : "activate")}
              >
                <Power className="size-4" />
                {branch.isActive ? t("deactivate") : t("activate")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}
