import { CreditCard, Pencil, UserCheck, UserX } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { identificationTypeLabel } from "../../persons/types"
import type { CustomerResponseDto } from "../types"

type CustomerColumnActions = {
  onEdit: (customer: CustomerResponseDto) => void
  onToggleActive: (customer: CustomerResponseDto) => void
  onCredit: (customer: CustomerResponseDto) => void
}

export function buildCustomerColumns(
  t: (key: string) => string,
  { onEdit, onToggleActive, onCredit }: CustomerColumnActions
): ColumnDef<CustomerResponseDto>[] {
  return [
    {
      key: "name",
      header: t("first_name"),
      minWidth: "min-w-[180px]",
      render: (customer) => (
        <p className="font-medium text-foreground">
          {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"}
        </p>
      ),
    },
    {
      key: "document_type",
      header: t("document_type"),
      minWidth: "min-w-[140px]",
      responsive: "md",
      render: (customer) => (
        <span className="text-muted-foreground">{identificationTypeLabel(customer.identificationTypeId)}</span>
      ),
    },
    {
      key: "document_number",
      header: t("document_number"),
      minWidth: "min-w-[120px]",
      responsive: "md",
      render: (customer) => <span className="text-muted-foreground">{customer.identificationNumber ?? "—"}</span>,
    },
    {
      key: "phone",
      header: t("phone"),
      minWidth: "min-w-[130px]",
      responsive: "sm",
      render: (customer) => <span className="text-muted-foreground">{customer.phoneNumber ?? "—"}</span>,
    },
    {
      key: "email",
      header: t("email"),
      minWidth: "min-w-[180px]",
      responsive: "lg",
      render: (customer) => <span className="text-muted-foreground">{customer.emailAddress ?? "—"}</span>,
    },
    {
      key: "city",
      header: t("city"),
      minWidth: "min-w-[150px]",
      responsive: "lg",
      render: (customer) => (
        <span className="text-muted-foreground">
          {[customer.city, customer.department].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      minWidth: "min-w-[90px]",
      render: (customer) => (
        <Badge tone={customer.isActive ? "success" : "neutral"}>
          {customer.isActive ? t("active") : t("inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[90px]",
      align: "right",
      stickyRight: true,
      render: (customer) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onToggleActive(customer)}
            aria-label={customer.isActive ? t("deactivate_customer_action") : t("activate_customer_action")}
            title={customer.isActive ? t("deactivate_customer_action") : t("activate_customer_action")}
          >
            {customer.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onCredit(customer)}
            aria-label={t("credit_action")}
            title={t("credit_action")}
          >
            <CreditCard className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(customer)}
            aria-label={t("edit_customer_action")}
            title={t("edit_customer_action")}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}
