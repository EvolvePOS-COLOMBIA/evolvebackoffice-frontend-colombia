import { Building2, Power, Settings2 } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Branch } from "../types"

export type BranchPendingAction = "activate" | "deactivate"

type BranchColumnActions = {
  isMutating: boolean
  onConfigure: (branch: Branch) => void
  onRequestAction: (branch: Branch, type: BranchPendingAction) => void
}

export function buildBranchColumns(
  t: (key: string) => string,
  { isMutating, onConfigure, onRequestAction }: BranchColumnActions
): ColumnDef<Branch>[] {
  return [
    {
      key: "branch",
      header: t("branch_label"),
      minWidth: "min-w-[200px]",
      render: (branch) => (
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/5 transition-transform duration-200 hover:scale-110 hover:-rotate-3">
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
      minWidth: "min-w-[180px]",
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
      minWidth: "min-w-[140px]",
      responsive: "lg",
      render: (branch) => <span className="text-muted-foreground">{branch.adminUserName || "—"}</span>,
    },
    {
      key: "status",
      header: t("status_label"),
      minWidth: "min-w-[90px]",
      render: (branch) => (
        <div className="flex flex-wrap gap-1">
          {branch.isActive ? (
            <Badge live tone="success">
              {t("status_active")}
            </Badge>
          ) : (
            <Badge tone="neutral">{t("status_inactive")}</Badge>
          )}
          {branch.isSupplier ? <Badge tone="primary">{t("supplier_badge")}</Badge> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[270px]",
      align: "right",
      render: (branch) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => onConfigure(branch)} disabled={isMutating}>
            <Settings2 className="size-4" />
            {t("configure")}
          </Button>
          <Button
            type="button"
            variant={branch.isActive ? "destructive" : "outline"}
            size="sm"
            onClick={() => onRequestAction(branch, branch.isActive ? "deactivate" : "activate")}
            disabled={isMutating}
          >
            <Power className="size-4" />
            {branch.isActive ? t("deactivate") : t("activate")}
          </Button>
        </div>
      ),
    },
  ]
}
