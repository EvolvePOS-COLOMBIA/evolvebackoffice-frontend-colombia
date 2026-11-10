import { Pencil, UserCheck, UserX } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PaymentMethodCategory, PaymentMethodResponseDto } from "../types"
import { FlagChip } from "./flag-chip"

type PaymentMethodColumnActions = {
  onEdit: (method: PaymentMethodResponseDto) => void
  onToggleActive: (method: PaymentMethodResponseDto) => void
}

export function buildPaymentMethodColumns(
  t: (key: string) => string,
  { onEdit, onToggleActive }: PaymentMethodColumnActions
): ColumnDef<PaymentMethodResponseDto>[] {
  return [
    {
      key: "name",
      header: t("name"),
      minWidth: "min-w-[180px]",
      render: (method) => (
        <div>
          <p className="font-medium text-foreground">{method.name}</p>
          {method.isCountryDefault && (
            <span className="text-[10px] tracking-wide text-muted-foreground uppercase">{t("country_default")}</span>
          )}
        </div>
      ),
    },
    {
      key: "code",
      header: t("code"),
      minWidth: "min-w-[140px]",
      responsive: "md",
      render: (method) => <span className="font-mono text-xs text-muted-foreground">{method.code}</span>,
    },
    {
      key: "category",
      header: t("category"),
      minWidth: "min-w-[130px]",
      render: (method) => <Badge tone={categoryTone(method.category)}>{categoryLabel(method.category, t)}</Badge>,
    },
    {
      key: "rules",
      header: t("rules"),
      minWidth: "min-w-[220px]",
      responsive: "lg",
      render: (method) => (
        <div className="flex flex-wrap gap-1">
          {method.isCash && <FlagChip label={t("flag_cash")} />}
          {method.requiresReference && <FlagChip label={t("flag_reference")} />}
          {method.requiresAuthCode && <FlagChip label={t("flag_auth")} />}
          {!method.allowsOffline && <FlagChip label={t("flag_offline")} muted />}
        </div>
      ),
    },
    {
      key: "status",
      header: t("status"),
      minWidth: "min-w-[90px]",
      render: (method) => (
        <Badge tone={method.isActive ? "success" : "neutral"}>{method.isActive ? t("active") : t("inactive")}</Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[90px]",
      align: "right",
      stickyRight: true,
      render: (method) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onToggleActive(method)}
            aria-label={method.isActive ? t("deactivate_action") : t("activate_action")}
            title={method.isActive ? t("deactivate_action") : t("activate_action")}
          >
            {method.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(method)}
            aria-label={t("edit_action")}
            title={t("edit_action")}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}

function categoryTone(category: PaymentMethodCategory): "primary" | "success" | "warning" | "info" | "neutral" {
  switch (category) {
    case "Cash":
      return "success"
    case "Transfer":
      return "info"
    case "CardDebit":
    case "CardCredit":
      return "primary"
    case "Wallet":
      return "warning"
    case "Online":
      return "info"
    case "Credit":
      return "warning"
    case "Voucher":
    default:
      return "neutral"
  }
}

function categoryLabel(category: PaymentMethodCategory, t: (key: string) => string): string {
  const map: Record<PaymentMethodCategory, string> = {
    Cash: t("cat_cash"),
    Transfer: t("cat_transfer"),
    CardDebit: t("cat_card_debit"),
    CardCredit: t("cat_card_credit"),
    Wallet: t("cat_wallet"),
    Voucher: t("cat_voucher"),
    Online: t("cat_online"),
    Credit: t("cat_credit"),
  }
  return map[category] ?? category
}
