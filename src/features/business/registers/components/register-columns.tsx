import { ChevronsUpDown, CircleEllipsis, Printer, Settings2, SquarePen } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Register, SerialCodeSummaryDto } from "@/features/business/registers/types"
import { registerStatusKey, registerStatusTone, serialStatusKey, serialStatusTone } from "../utils/register-status"
import { formatDateTime } from "@/utils/format"

type RegisterColumnActions = {
  onEdit: (register: Register) => void
  onSetStatus: (register: Register) => void
  onPrintSettings: (register: Register) => void
  onBranchSettings: (branchId: string) => void
  disabled?: boolean
}

export function buildRegisterColumns(
  t: (key: string) => string,
  { onEdit, onSetStatus, onPrintSettings, onBranchSettings, disabled }: RegisterColumnActions
): ColumnDef<Register>[] {
  return [
    {
      key: "name",
      header: t("name_label"),
      minWidth: "min-w-[200px]",
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.code}</p>
        </div>
      ),
    },
    {
      key: "branch",
      header: t("branch_label"),
      responsive: "sm",
      render: (r) => <span className="text-muted-foreground">{r.branchName || "—"}</span>,
    },
    {
      key: "serial",
      header: t("serial_label"),
      responsive: "lg",
      render: (r) => (
        <div>
          <p className="font-mono text-sm text-foreground">{r.serialCode || "—"}</p>
          {r.deviceIdentifier ? <p className="text-xs text-muted-foreground">{r.deviceIdentifier}</p> : null}
        </div>
      ),
    },
    {
      key: "status",
      header: t("status_label"),
      render: (r) => <Badge tone={registerStatusTone(r.status)}>{t(registerStatusKey(r.status))}</Badge>,
    },
    {
      key: "last_activity",
      header: t("last_activity"),
      responsive: "md",
      render: (r) => (
        <span className="text-muted-foreground">{r.lastActivityAt ? formatDateTime(r.lastActivityAt) : "—"}</span>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      align: "right",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={t("actions")} disabled={disabled}>
              <CircleEllipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onEdit(r)}>
              <SquarePen className="size-4" />
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSetStatus(r)}>
              <ChevronsUpDown className="size-4" />
              {t("set_status_title")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onPrintSettings(r)}>
              <Printer className="size-4" />
              {t("print_settings_action")}
            </DropdownMenuItem>
            {r.branchPublicId ? (
              <DropdownMenuItem onSelect={() => onBranchSettings(r.branchPublicId)}>
                <Settings2 className="size-4" />
                {t("go_to_branch_settings")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export function buildSerialColumns(t: (key: string) => string): ColumnDef<SerialCodeSummaryDto>[] {
  return [
    {
      key: "serial",
      header: t("serial_label"),
      minWidth: "min-w-[200px]",
      render: (s) => <span className="font-mono text-sm font-medium text-foreground">{s.serialCode}</span>,
    },
    {
      key: "status",
      header: t("status_label"),
      render: (s) => <Badge tone={serialStatusTone(s.status)}>{t(serialStatusKey(s.status))}</Badge>,
    },
    {
      key: "device",
      header: t("device_label"),
      responsive: "md",
      render: (s) => <span className="text-muted-foreground">{s.deviceName || "—"}</span>,
    },
    {
      key: "register",
      header: t("serials_pool_register"),
      responsive: "sm",
      render: (s) => (
        <span className="text-muted-foreground">
          {s.isAssignedToRegister ? s.registerName || s.registerCode || "—" : "—"}
        </span>
      ),
    },
    {
      key: "last_seen",
      header: t("last_activity"),
      responsive: "lg",
      render: (s) => <span className="text-muted-foreground">{s.lastSeenAt ? formatDateTime(s.lastSeenAt) : "—"}</span>,
    },
    {
      key: "created",
      header: t("created"),
      responsive: "lg",
      render: (s) => <span className="text-muted-foreground">{formatDateTime(s.createdAt)}</span>,
    },
  ]
}
