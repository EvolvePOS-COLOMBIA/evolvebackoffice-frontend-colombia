import { Pencil, Truck, UserCheck, UserX } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { identificationTypeLabel } from "../../../people/persons/types"
import type { SupplierResponseDto } from "../types"

type SupplierColumnActions = {
  onEdit: (supplier: SupplierResponseDto) => void
  onToggleActive: (supplier: SupplierResponseDto) => void
}

export function buildSupplierColumns(
  t: (key: string) => string,
  { onEdit, onToggleActive }: SupplierColumnActions
): ColumnDef<SupplierResponseDto>[] {
  return [
    {
      key: "company",
      header: t("company"),
      minWidth: "min-w-[200px]",
      render: (supplier) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Truck className="size-4 text-muted-foreground" />
          </span>
          <div>
            <p className="font-medium text-foreground">{supplier.company || "—"}</p>
            <p className="text-xs text-muted-foreground">
              {[supplier.firstName, supplier.lastName].filter(Boolean).join(" ") || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "document_type",
      header: t("document_type"),
      minWidth: "min-w-[140px]",
      responsive: "md",
      render: (supplier) => (
        <span className="text-muted-foreground">{identificationTypeLabel(supplier.identificationTypeId)}</span>
      ),
    },
    {
      key: "document_number",
      header: t("document_number"),
      minWidth: "min-w-[120px]",
      responsive: "md",
      render: (supplier) => <span className="text-muted-foreground">{supplier.identificationNumber ?? "—"}</span>,
    },
    {
      key: "phone",
      header: t("phone"),
      minWidth: "min-w-[130px]",
      responsive: "sm",
      render: (supplier) => <span className="text-muted-foreground">{supplier.phoneNumber ?? "—"}</span>,
    },
    {
      key: "email",
      header: t("email"),
      minWidth: "min-w-[180px]",
      responsive: "lg",
      render: (supplier) => <span className="text-muted-foreground">{supplier.emailAddress ?? "—"}</span>,
    },
    {
      key: "code",
      header: t("code"),
      minWidth: "min-w-[130px]",
      responsive: "lg",
      render: (supplier) => <span className="text-muted-foreground">{supplier.code ?? "—"}</span>,
    },
    {
      key: "status",
      header: t("status"),
      minWidth: "min-w-[90px]",
      render: (supplier) => (
        <Badge tone={supplier.inactive ? "neutral" : "success"}>
          {supplier.inactive ? t("inactive") : t("active")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[90px]",
      align: "right",
      stickyRight: true,
      render: (supplier) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onToggleActive(supplier)}
            aria-label={supplier.inactive ? t("activate_supplier_action") : t("deactivate_supplier_action")}
            title={supplier.inactive ? t("activate_supplier_action") : t("deactivate_supplier_action")}
          >
            {supplier.inactive ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(supplier)}
            aria-label={t("edit_supplier_action")}
            title={t("edit_supplier_action")}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}
