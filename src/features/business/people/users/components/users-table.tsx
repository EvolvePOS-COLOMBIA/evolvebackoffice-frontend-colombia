import { Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import type { UserResponseDto } from "../types"
import { IDENTIFICATION_TYPE_LABELS, IdentificationType, getUserDisplayName } from "../types"

type UsersTableProps = {
  users: UserResponseDto[]
  onEdit: (user: UserResponseDto) => void
}

export function UsersTable({ users, onEdit }: UsersTableProps) {
  const { t } = useTranslation("business-users-catalog")

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{t("no_users")}</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">{t("full_name")}</TableHead>
            <TableHead className="hidden min-w-[140px] sm:table-cell">{t("email")}</TableHead>
            <TableHead className="hidden min-w-[100px] md:table-cell">{t("document_type")}</TableHead>
            <TableHead className="hidden min-w-[120px] md:table-cell">{t("document_number")}</TableHead>
            <TableHead className="min-w-[100px]">{t("role")}</TableHead>
            <TableHead className="hidden min-w-[80px] lg:table-cell">{t("status")}</TableHead>
            <TableHead className="min-w-[80px] text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{getUserDisplayName(user)}</p>
                  {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{user.email ?? "—"}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {IDENTIFICATION_TYPE_LABELS[user.identificationTypeId as IdentificationType] ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {user.identificationNumber ?? "—"}
              </TableCell>
              <TableCell>
                <Badge tone={getRoleTone(user.role)}>{getRoleLabel(user.role, t)}</Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge tone={user.isActive ? "success" : "neutral"}>
                  {user.isActive ? t("active") : t("inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onEdit(user)}
                  aria-label={t("edit_user")}
                >
                  <Pencil className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getRoleTone(role: string | null): "primary" | "warning" | "info" | "neutral" {
  switch (role) {
    case "Admin":
      return "primary"
    case "Manager":
      return "warning"
    case "Cashier":
      return "info"
    default:
      return "neutral"
  }
}

function getRoleLabel(role: string | null, t: ReturnType<typeof useTranslation>["t"]): string {
  switch (role) {
    case "Admin":
      return t("role_admin")
    case "Manager":
      return t("role_manager")
    case "Cashier":
      return t("role_cashier")
    default:
      return role ?? "—"
  }
}
