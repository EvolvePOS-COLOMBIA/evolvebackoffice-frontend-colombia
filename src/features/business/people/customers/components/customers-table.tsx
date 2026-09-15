import { Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import type { CustomerResponseDto } from "../types"
import { IDENTIFICATION_TYPE_LABELS, IdentificationType, getCustomerDisplayName } from "../types"

type CustomersTableProps = {
  customers: CustomerResponseDto[]
  onEdit: (customer: CustomerResponseDto) => void
  onDelete: (customer: CustomerResponseDto) => void
}

export function CustomersTable({ customers, onEdit, onDelete }: CustomersTableProps) {
  const { t } = useTranslation("business-customers-catalog")

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{t("no_customers")}</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">{t("full_name")}</TableHead>
            <TableHead className="hidden min-w-[140px] md:table-cell">{t("document_type")}</TableHead>
            <TableHead className="hidden min-w-[120px] md:table-cell">{t("document_number")}</TableHead>
            <TableHead className="hidden min-w-[140px] sm:table-cell">{t("email")}</TableHead>
            <TableHead className="hidden min-w-[100px] sm:table-cell">{t("phone")}</TableHead>
            <TableHead className="hidden min-w-[100px] lg:table-cell">{t("city")}</TableHead>
            <TableHead className="hidden min-w-[80px] lg:table-cell">{t("status")}</TableHead>
            <TableHead className="min-w-[100px] text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <p className="font-medium text-foreground">{getCustomerDisplayName(customer)}</p>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {IDENTIFICATION_TYPE_LABELS[customer.identificationTypeId as IdentificationType] ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {customer.identificationNumber ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {customer.emailAddress ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {customer.phoneNumber ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{customer.city ?? "—"}</TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge tone={customer.isActive ? "success" : "neutral"}>
                  {customer.isActive ? t("active") : t("inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(customer)}
                    aria-label={t("edit_customer")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(customer)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
