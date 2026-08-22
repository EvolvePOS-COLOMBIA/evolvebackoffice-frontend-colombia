import { Pencil, PackageMinus, PackagePlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import type { ItemResponseDto } from "../types"

type ItemsTableProps = {
  items: ItemResponseDto[]
  onEdit: (item: ItemResponseDto) => void
  onAdjustStock: (item: ItemResponseDto) => void
}

export function ItemsTable({ items, onEdit, onAdjustStock }: ItemsTableProps) {
  const { t } = useTranslation("business-items-catalog")

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="mb-3 size-10 opacity-40" />
        <p className="text-sm">{t("no_items")}</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">{t("name")}</TableHead>
            <TableHead className="hidden min-w-[120px] sm:table-cell">{t("sku")}</TableHead>
            <TableHead className="hidden min-w-[120px] md:table-cell">{t("category")}</TableHead>
            <TableHead className="min-w-[100px] text-right">{t("sale_price")}</TableHead>
            <TableHead className="min-w-[80px] text-right">{t("stock")}</TableHead>
            <TableHead className="hidden min-w-[80px] lg:table-cell">{t("status")}</TableHead>
            <TableHead className="min-w-[100px] text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  {item.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">{item.sku ?? "—"}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">{item.category ?? "—"}</TableCell>
              <TableCell className="text-right font-medium">
                ${item.salePrice.toLocaleString("es-CO")}
              </TableCell>
              <TableCell className="text-right">
                <StockBadge stock={item.stock} minStockLevel={item.minStockLevel} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge tone={item.isActive ? "success" : "neutral"}>
                  {item.isActive ? t("active") : t("inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(item)}
                    aria-label={t("edit_item")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onAdjustStock(item)}
                    aria-label={t("adjust_stock")}
                  >
                    {item.stock > 0 ? (
                      <PackageMinus className="size-4" />
                    ) : (
                      <PackagePlus className="size-4" />
                    )}
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

function StockBadge({ stock, minStockLevel }: { stock: number; minStockLevel: number }) {
  const isLow = stock <= minStockLevel

  return (
    <Badge
      tone={isLow ? "danger" : "neutral"}
      className="font-mono text-xs"
    >
      {stock}
    </Badge>
  )
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
      <path d="m7.5 4.27 9 5.15" />
    </svg>
  )
}
