import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import type { ProductMarginDto } from "../../types/sales"
import { formatMoney, formatUnitCost, unitSymbol } from "../../utils/units"

type MarginColumnActions = {
  isSupplier: boolean
}

export function buildMarginsColumns(
  t: (key: string, options?: Record<string, unknown>) => string,
  { isSupplier }: MarginColumnActions
): ColumnDef<ProductMarginDto>[] {
  // Definida dentro de la fábrica: el lint de react-refresh no permite
  // componentes locales en un archivo cuyo único export no es un componente.
  const MarginValue = ({ sold, margin, percent }: { sold: boolean; margin: number | null; percent: number | null }) => {
    if (!sold || margin === null) return <span className="text-muted-foreground">—</span>
    return (
      <>
        <p className={margin < 0 ? "font-medium text-destructive" : "font-medium text-foreground"}>
          {formatMoney(margin)}
        </p>
        {percent !== null ? (
          <p className={percent < 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{percent} %</p>
        ) : null}
      </>
    )
  }

  const columns: ColumnDef<ProductMarginDto>[] = [
    {
      key: "product",
      header: t("product"),
      minWidth: "min-w-[240px]",
      render: (m) => (
        <div>
          <p className="font-medium text-foreground">{m.itemName}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone="neutral">{m.kind === "recipe" ? t("margins_kind_recipe") : t("margins_kind_stock")}</Badge>
            {!m.sellsHere ? <Badge tone="neutral">{t("margins_not_sold_here")}</Badge> : null}
            {m.sellHereOverride === true && !m.productIsSellable ? (
              <Badge tone="info">{t("margins_sold_only_here")}</Badge>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: t("margins_price"),
      align: "right",
      render: (m) => (m.sellsHere || m.transferPrice !== null ? formatMoney(m.price) : "—"),
    },
    {
      key: "net_price",
      header: t("margins_net_price"),
      align: "right",
      render: (m) => (
        <>
          <span className="text-muted-foreground">{m.sellsHere ? formatMoney(m.netPrice) : "—"}</span>
          {m.sellsHere && m.taxRate > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("margins_tax", { rate: Math.round(m.taxRate * 1000) / 10 })}
            </p>
          ) : null}
        </>
      ),
    },
    {
      key: "cost",
      header: t("cost"),
      align: "right",
      render: (m) => (
        <span className="text-muted-foreground">
          {m.cost === null ? "—" : `${formatUnitCost(m.cost)} / ${unitSymbol(m.baseUnit)}`}
        </span>
      ),
    },
    {
      key: "margin",
      header: t("margins_margin"),
      align: "right",
      render: (m) => <MarginValue sold={m.sellsHere} margin={m.margin} percent={m.marginPercent} />,
    },
  ]

  if (isSupplier) {
    columns.push({
      key: "transfer_price",
      header: t("margins_transfer_price"),
      align: "right",
      render: (m) =>
        m.transferPrice === null ? (
          "—"
        ) : (
          <>
            <p className="text-foreground">
              {formatUnitCost(m.transferPrice)} / {unitSymbol(m.baseUnit)}
            </p>
            <p className="text-xs text-muted-foreground">
              {m.transferAtCost ? t("margins_transfer_at_cost") : t("margins_transfer_sale_price")}
            </p>
          </>
        ),
    })
  }

  return columns
}
