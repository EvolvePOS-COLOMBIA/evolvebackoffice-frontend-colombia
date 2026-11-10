import { Pencil } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IDENTIFICATION_TYPE_LABELS, IdentificationType, getUserDisplayName } from "../types"
import type { UserResponseDto } from "../types"

type UserColumnActions = {
  onEdit: (user: UserResponseDto) => void
}

export function buildUserColumns(
  t: (key: string) => string,
  { onEdit }: UserColumnActions
): ColumnDef<UserResponseDto>[] {
  return [
    {
      key: "name",
      header: t("full_name"),
      minWidth: "min-w-[180px]",
      render: (user) => (
        <div>
          <p className="font-medium text-foreground">{getUserDisplayName(user)}</p>
          {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
        </div>
      ),
    },
    {
      key: "email",
      header: t("email"),
      minWidth: "min-w-[140px]",
      responsive: "sm",
      render: (user) => <span className="text-muted-foreground">{user.email ?? "—"}</span>,
    },
    {
      key: "document_type",
      header: t("document_type"),
      minWidth: "min-w-[100px]",
      responsive: "md",
      render: (user) => (
        <span className="text-muted-foreground">
          {IDENTIFICATION_TYPE_LABELS[user.identificationTypeId as IdentificationType] ?? "—"}
        </span>
      ),
    },
    {
      key: "document_number",
      header: t("document_number"),
      minWidth: "min-w-[120px]",
      responsive: "md",
      render: (user) => <span className="text-muted-foreground">{user.identificationNumber ?? "—"}</span>,
    },
    {
      key: "role",
      header: t("role"),
      minWidth: "min-w-[100px]",
      render: (user) => <Badge tone={getRoleTone(user.role)}>{getRoleLabel(user.role, t)}</Badge>,
    },
    {
      key: "status",
      header: t("status"),
      minWidth: "min-w-[80px]",
      responsive: "lg",
      render: (user) => (
        <Badge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? t("active") : t("inactive")}</Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[80px]",
      align: "right",
      stickyRight: true,
      render: (user) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(user)}
            aria-label={t("edit_user")}
            title={t("edit_user")}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}

function getRoleTone(role: string | null): "primary" | "warning" | "info" | "neutral" {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "primary"
    case "MANAGER":
      return "warning"
    case "CASHIER":
      return "info"
    default:
      return "neutral"
  }
}

function getRoleLabel(role: string | null, t: (key: string) => string): string {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return t("role_admin")
    case "MANAGER":
      return t("role_manager")
    case "CASHIER":
      return t("role_cashier")
    case "DELIVERY":
      return t("role_delivery")
    default:
      return role ?? "—"
  }
}
