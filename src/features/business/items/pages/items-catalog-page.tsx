import { useState } from "react"
import { Package, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/i18n/use-i18n"
import { useItems, useCreateItem, useUpdateItem, useAdjustStock } from "../hooks/use-items"
import type { ItemResponseDto } from "../types"
import { ItemsTable } from "../components/items-table"
import { ItemFormDialog } from "../components/item-form-dialog"
import { AdjustStockDialog } from "../components/adjust-stock-dialog"
import type { CreateItemFormValues } from "../schemas/item-schema"

export function ItemsCatalogPage() {
  const { t } = useTranslation("business-items")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemResponseDto | null>(null)

  const { data, isLoading } = useItems({ pageNumber: page, pageSize: 20 })
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const adjustStock = useAdjustStock()

  const items = data?.data ?? []
  const filteredItems = search
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.sku?.toLowerCase().includes(search.toLowerCase()) ||
          item.category?.toLowerCase().includes(search.toLowerCase())
      )
    : items

  const lowStockCount = items.filter((item) => item.stock <= item.minStockLevel).length

  const handleCreate = (values: CreateItemFormValues) => {
    createItem.mutate(values, {
      onSuccess: () => setFormOpen(false),
    })
  }

  const handleEdit = (values: CreateItemFormValues) => {
    if (!selectedItem) return
    updateItem.mutate(
      { id: selectedItem.id, payload: values },
      {
        onSuccess: () => {
          setFormOpen(false)
          setSelectedItem(null)
        },
      }
    )
  }

  const handleAdjustStock = (delta: number) => {
    if (!selectedItem) return
    adjustStock.mutate(
      { id: selectedItem.id, delta },
      {
        onSuccess: () => {
          setStockDialogOpen(false)
          setSelectedItem(null)
        },
      }
    )
  }

  const openEditDialog = (item: ItemResponseDto) => {
    setSelectedItem(item)
    setFormOpen(true)
  }

  const openStockDialog = (item: ItemResponseDto) => {
    setSelectedItem(item)
    setStockDialogOpen(true)
  }

  const handleDialogClose = () => {
    setFormOpen(false)
    setSelectedItem(null)
  }

  const handleStockDialogClose = () => {
    setStockDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="relative flex flex-col gap-2">
          <Badge className="max-w-fit" tone="primary">
            {t("items")}
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("product_catalog")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">
            {t("product_catalog_desc")}
          </p>
          <Package
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 opacity-5 animate-float md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        {lowStockCount > 0 && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">
              {t("low_stock_alert", { count: lowStockCount })}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search_items")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 size-4" />
            {t("new_item")}
          </Button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : (
            <ItemsTable
              items={filteredItems}
              onEdit={openEditDialog}
              onAdjustStock={openStockDialog}
            />
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {t("page_info", { current: page, total: data.totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        )}

        <ItemFormDialog
          open={formOpen}
          onOpenChange={handleDialogClose}
          itemToEdit={selectedItem}
          onSubmit={selectedItem ? handleEdit : handleCreate}
          isSubmitting={createItem.isPending || updateItem.isPending}
        />

        <AdjustStockDialog
          open={stockDialogOpen}
          onOpenChange={handleStockDialogClose}
          item={selectedItem}
          onSubmit={handleAdjustStock}
          isSubmitting={adjustStock.isPending}
        />
      </CardContent>
    </Card>
  )
}
