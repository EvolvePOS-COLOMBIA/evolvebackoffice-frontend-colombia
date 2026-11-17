import { Pencil, Trash2 } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format"
import { modifierTypeLabelKey, type ItemModifier, type ModifierGroup } from "../types"

type ModifierGroupColumnActions = {
  isMutating: boolean
  onEdit: (group: ModifierGroup) => void
  onDelete: (group: ModifierGroup) => void
}

export function buildModifierGroupColumns(
  t: (key: string) => string,
  { isMutating, onEdit, onDelete }: ModifierGroupColumnActions
): ColumnDef<ModifierGroup>[] {
  return [
    {
      key: "name",
      header: t("name_label"),
      minWidth: "min-w-[220px]",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.description ? (
            <p className="hidden max-w-64 truncate text-xs text-muted-foreground sm:block">{row.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "selection",
      header: t("selection_label"),
      minWidth: "min-w-[120px]",
      responsive: "sm",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.minSelection}–{row.maxSelection}
        </span>
      ),
    },
    {
      key: "sortOrder",
      header: t("sort_order_label"),
      minWidth: "min-w-[90px]",
      responsive: "md",
      render: (row) => <span className="text-muted-foreground">{row.sortOrder}</span>,
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
            variant="destructive"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => onDelete(row)}
            disabled={isMutating}
            aria-label={t("delete")}
            title={t("delete")}
          >
            <Trash2 className="size-3.5 sm:size-4" />
          </Button>
        </div>
      ),
    },
  ]
}

type ItemModifierColumnActions = {
  isMutating: boolean
  onEdit: (modifier: ItemModifier) => void
  onDelete: (modifier: ItemModifier) => void
}

export function buildItemModifierColumns(
  t: (key: string) => string,
  { isMutating, onEdit, onDelete }: ItemModifierColumnActions
): ColumnDef<ItemModifier>[] {
  return [
    {
      key: "childItem",
      header: t("child_item_header"),
      minWidth: "min-w-[220px]",
      render: (row) => (
        <div>
          <p className="font-medium">{row.childItemName ?? row.childItemSku ?? "—"}</p>
          <p className="hidden font-mono text-xs text-muted-foreground sm:block">{row.childItemSku ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "group",
      header: t("group_label"),
      minWidth: "min-w-[140px]",
      responsive: "sm",
      render: (row) => <span className="text-muted-foreground">{row.modifierGroupName ?? t("no_group")}</span>,
    },
    {
      key: "modifierType",
      header: t("modifier_type_label"),
      minWidth: "min-w-[130px]",
      render: (row) => (
        <Badge tone={modifierTypeTone(row.modifierTypeCode)}>{t(modifierTypeLabelKey(row.modifierTypeCode))}</Badge>
      ),
    },
    {
      key: "quantity",
      header: t("quantity_label"),
      minWidth: "min-w-[110px]",
      responsive: "md",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.minQuantity}–{row.maxQuantity}
        </span>
      ),
    },
    {
      key: "extraPrice",
      header: t("extra_price_label"),
      minWidth: "min-w-[110px]",
      responsive: "md",
      render: (row) => <span className="text-muted-foreground">{formatCurrency(row.extraPrice)}</span>,
    },
    {
      key: "status",
      header: t("status_label"),
      minWidth: "min-w-[90px]",
      responsive: "sm",
      render: (row) => (
        <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? t("active") : t("inactive")}</Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[90px]",
      align: "right",
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
            variant="destructive"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => onDelete(row)}
            disabled={isMutating}
            aria-label={t("delete")}
            title={t("delete")}
          >
            <Trash2 className="size-3.5 sm:size-4" />
          </Button>
        </div>
      ),
    },
  ]
}

/** Tono del badge según el tipo de modificador. */
function modifierTypeTone(code: string | number): "info" | "warning" | "purple" | "orange" {
  switch (modifierTypeLabelKey(code)) {
    case "modifier_required":
      return "warning"
    case "modifier_group_single":
      return "purple"
    case "modifier_group_multiple":
      return "orange"
    default:
      return "info"
  }
}
