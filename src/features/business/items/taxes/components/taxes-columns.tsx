import { Pencil, Power } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { rateToPercent, taxTypeTextKey, type TaxRate } from "../types"

type TaxRateColumnActions = {
  isMutating: boolean
  onEdit: (taxRate: TaxRate) => void
  onToggle: (taxRate: TaxRate) => void
}

export function buildTaxRateColumns(
  t: (key: string) => string,
  { isMutating, onEdit, onToggle }: TaxRateColumnActions
): ColumnDef<TaxRate>[] {
  return [
    {
      key: "name",
      header: t("name_label"),
      minWidth: "min-w-[220px]",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "taxType",
      header: t("tax_type_label"),
      minWidth: "min-w-[130px]",
      render: (row) => <Badge tone={taxTypeTone(row.taxType)}>{t(taxTypeTextKey(row.taxType))}</Badge>,
    },
    {
      key: "rate",
      header: t("rate_label"),
      minWidth: "min-w-[90px]",
      render: (row) => (
        <span className="font-mono">
          {rateToPercent(row.rate)}
          {t("rate")}
        </span>
      ),
    },
    {
      key: "country",
      header: t("country_label"),
      minWidth: "min-w-[110px]",
      responsive: "sm",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.countryCode}
          {row.regionCode ? ` / ${row.regionCode}` : ""}
        </span>
      ),
    },
    {
      key: "isDefault",
      header: t("is_default_label"),
      minWidth: "min-w-[120px]",
      responsive: "md",
      render: (row) => (row.isDefault ? <Badge tone="warning">{t("is_default_label")}</Badge> : "—"),
    },
    {
      key: "status",
      header: t("status_label"),
      minWidth: "min-w-[90px]",
      render: (row) => (
        <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? t("active") : t("inactive")}</Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[90px]",
      align: "right",
      stickyRight: true,
      render: (row) => (
        <div className="flex justify-end gap-1 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => onEdit(row)}
            disabled={isMutating}
            aria-label={t("edit")}
            title={t("edit")}
          >
            <Pencil className="size-3.5 sm:size-4" />
          </Button>
          <Button
            type="button"
            variant={row.isActive ? "destructive" : "secondary"}
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => onToggle(row)}
            disabled={isMutating}
            aria-label={row.isActive ? t("deactivate") : t("activate")}
            title={row.isActive ? t("deactivate") : t("activate")}
          >
            <Power className="size-3.5 sm:size-4" />
          </Button>
        </div>
      ),
    },
  ]
}

/** Tono del badge según el tipo de impuesto. */
export function taxTypeTone(taxType: number) {
  switch (taxType) {
    case 0:
      return "primary"
    case 1:
      return "info"
    case 2:
      return "warning"
    case 3:
      return "purple"
    case 4:
      return "neutral"
    default:
      return "orange"
  }
}
