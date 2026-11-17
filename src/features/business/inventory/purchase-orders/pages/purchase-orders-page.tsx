import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, PackagePlus, Plus, SearchX, ShoppingCart, Truck } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useInventoryInbox } from "../../hooks/use-inventory"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { useGoodsReceipts, usePurchaseOrders, useVoidGoodsReceipt } from "../../hooks/use-purchasing"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import type { GoodsReceiptDto } from "../../types/purchasing"
import { TransferDetailDialog } from "../../transfers/components/transfer-detail-dialog"
import { GoodsReceiptDialog } from "../components/goods-receipt-dialog"
import { NewOrderDialog } from "../components/new-order-dialog"
import { OrderDetailDialog } from "../components/order-detail-dialog"
import { buildOrderColumns, buildReceiptColumns } from "../components/purchase-orders-columns"
import { filterGoodsReceipts, filterPurchaseOrders } from "../utils/search"

type Tab = "mine" | "receipts"

/**
 * Órdenes de compra a proveedores externos (OC) y entradas de mercancía.
 * Los pedidos entre sucursales están en Transferencia entre sucursales.
 */
export function PurchaseOrdersPage() {
  const { t } = useTranslation("business-inventory")
  const { branches, branch, branchId, selectBranch, isLoading: branchesLoading } = useInventoryBranch()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => (searchParams.get("tab") === "receipts" ? "receipts" : "mine"))
  const [openOnly, setOpenOnly] = useState(false)
  // Búsqueda client-side: filtra los ítems ya cargados porque el backend no
  // expone parámetro de búsqueda. Al escribir se vuelve a la página 1.
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState<"order" | "receipt" | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [transferId, setTransferId] = useState<string | null>(null)
  const [voiding, setVoiding] = useState<GoodsReceiptDto | null>(null)

  const activeTab = tab
  const orders = usePurchaseOrders({
    branchId: activeTab === "receipts" ? null : branchId,
    direction: "outgoing",
    kind: "external",
    status: openOnly ? "open" : undefined,
    pageNumber: page,
  })
  const receipts = useGoodsReceipts(activeTab === "receipts" ? branchId : null, page)
  const voidReceipt = useVoidGoodsReceipt()
  // Bandeja del servidor: son agregados reales de la sucursal. No se pueden sumar desde
  // la página porque pageSize = 10 y la suma cubriría solo una fracción del total.
  const { data: inbox } = useInventoryInbox(branchId)
  // Query aparte para tener el total de OC abiertas aunque "Solo abiertos" esté apagado
  // (solo se lee totalCount; con el switch activo comparte caché con la query principal).
  const openOrders = usePurchaseOrders({
    branchId,
    direction: "outgoing",
    kind: "external",
    status: "open",
    pageNumber: 1,
  })

  const current = activeTab === "receipts" ? receipts : orders
  const totalPages = Math.ceil((current.data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)
  // Con filtro activo la tabla colapsa a los coincidentes de la página cargada:
  // el pie deja de contar el total del servidor y la paginación se oculta.
  const isFiltering = search.trim().length > 0
  const orderItems = filterPurchaseOrders(orders.data?.items ?? [], search)
  const receiptItems = filterGoodsReceipts(receipts.data?.items ?? [], search)

  const changeTab = (value: string) => {
    setTab(value as Tab)
    setPage(1)
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/inventory", label: t("back_to_inventory") }}
        title={t("purchase_orders")}
        description={t("orders_page_desc")}
        stats={
          branchId
            ? [
                {
                  icon: ShoppingCart,
                  tone: "primary",
                  label: t("stat_open_orders"),
                  value: openOrders.data?.totalCount ?? 0,
                },
                {
                  icon: Truck,
                  tone: "info",
                  label: t("stat_to_receive"),
                  value: inbox?.transfersToReceive ?? 0,
                },
                {
                  icon: AlertTriangle,
                  tone: "warning",
                  label: t("stat_differences"),
                  value: inbox?.differencesToResolve ?? 0,
                },
              ]
            : undefined
        }
        tabs={
          branchesLoading ? (
            <Skeleton className="h-10 w-80" />
          ) : branches.length === 0 ? undefined : (
            <div className="flex flex-wrap items-center gap-2">
              <BranchSelector
                options={branches.map((b) => ({ id: b.id, name: b.name }))}
                selectedId={branchId}
                onSelect={(id) => {
                  if (!id) return
                  selectBranch(id)
                  setPage(1)
                }}
              />
            </div>
          )
        }
        heroFooter={
          branch ? (
            <Tabs value={activeTab} onValueChange={changeTab}>
              <TabsList>
                <TabsTrigger value="mine">{t("po_tab_orders")}</TabsTrigger>
                <TabsTrigger value="receipts">{t("orders_tab_receipts")}</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : undefined
        }
        toolbar={
          branchId
            ? {
                search: {
                  value: search,
                  onChange: (value) => {
                    setSearch(value)
                    setPage(1)
                  },
                  placeholder: activeTab === "mine" ? t("search_purchase_orders") : t("search_receipts"),
                },
                actions: (
                  <>
                    {activeTab === "mine" ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="pedidos-abiertos"
                          checked={openOnly}
                          onCheckedChange={(checked) => {
                            setOpenOnly(checked)
                            setPage(1)
                          }}
                        />
                        <Label htmlFor="pedidos-abiertos">{t("orders_open_only")}</Label>
                      </div>
                    ) : null}
                    <div className="flex w-fit shrink-0 items-center gap-2 max-sm:[&_button]:h-8 max-sm:[&_button]:px-2.5 max-sm:[&_button]:text-xs">
                      <Button type="button" variant="outline" onClick={() => setCreating("receipt")}>
                        <PackagePlus className="mr-2 size-4" />
                        {t("receipt_new_title")}
                      </Button>
                      <Button id="btn-nuevo-pedido" type="button" onClick={() => setCreating("order")}>
                        <Plus className="mr-2 size-4" />
                        {t("po_new_title")}
                      </Button>
                    </div>
                  </>
                ),
              }
            : undefined
        }
      >
        {/* Cada pestaña maneja su propio scroll: el Card del layout recorta lo que sobresalga. */}
        {branch ? (
          activeTab === "mine" ? (
            <DataTable
              columns={buildOrderColumns(t, {
                counterpartLabel: t("receipt_supplier"),
                counterpart: "supplier",
                onOpen: (order) => setOrderId(order.id),
              })}
              data={orderItems}
              isLoading={orders.isLoading}
              page={page}
              totalPages={isFiltering ? 1 : Math.max(1, totalPages)}
              totalCount={isFiltering ? orderItems.length : (orders.data?.totalCount ?? 0)}
              onPageChange={setPage}
              skeletonRows={6}
              minWidth="min-w-[680px]"
              emptyState={
                isFiltering
                  ? { icon: SearchX, title: t("po_no_results"), description: t("po_no_results_desc") }
                  : {
                      icon: ShoppingCart,
                      title: t("po_empty"),
                      description: t("po_empty_desc"),
                      action: (
                        <Button type="button" onClick={() => setCreating("order")}>
                          <Plus className="size-4" />
                          {t("po_new_title")}
                        </Button>
                      ),
                    }
              }
              labels={{
                previous: t("previous"),
                next: t("next"),
                paginationTotal: (count) => t("po_count", { count }),
                paginationProgress: (count, total) => t("po_progress", { count, total }),
              }}
            />
          ) : (
            <DataTable
              columns={buildReceiptColumns(t, { onVoid: setVoiding })}
              data={receiptItems}
              isLoading={receipts.isLoading}
              page={page}
              totalPages={isFiltering ? 1 : Math.max(1, totalPages)}
              totalCount={isFiltering ? receiptItems.length : (receipts.data?.totalCount ?? 0)}
              onPageChange={setPage}
              skeletonRows={6}
              minWidth="min-w-[640px]"
              emptyState={
                isFiltering
                  ? { icon: SearchX, title: t("receipts_no_results"), description: t("receipts_no_results_desc") }
                  : {
                      icon: PackagePlus,
                      title: t("receipts_empty"),
                      description: t("receipts_empty_desc"),
                      action: (
                        <Button type="button" onClick={() => setCreating("receipt")}>
                          <Plus className="size-4" />
                          {t("receipt_new_title")}
                        </Button>
                      ),
                    }
              }
              labels={{
                previous: t("previous"),
                next: t("next"),
                paginationTotal: (count) => t("receipts_count", { count }),
                paginationProgress: (count, total) => t("receipts_progress", { count, total }),
              }}
            />
          )
        ) : branches.length === 0 && !branchesLoading ? (
          <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
        ) : null}
      </EntityListLayout>

      {branch && creating === "order" ? (
        <NewOrderDialog
          kind="supplier"
          branch={branch}
          branches={branches}
          onOpenChange={(open) => !open && setCreating(null)}
          onCreated={(order) => {
            setCreating(null)
            setOrderId(order.id)
          }}
        />
      ) : null}
      {branch && creating === "receipt" ? (
        <GoodsReceiptDialog branch={branch} onOpenChange={(open) => !open && setCreating(null)} />
      ) : null}
      {branchId && orderId ? (
        <OrderDetailDialog
          orderId={orderId}
          branchId={branchId}
          onOpenChange={(open) => !open && setOrderId(null)}
          onOpenTransfer={(id) => {
            setOrderId(null)
            setTransferId(id)
          }}
        />
      ) : null}
      {branchId && transferId ? (
        <TransferDetailDialog
          transferId={transferId}
          branchId={branchId}
          onOpenChange={(open) => !open && setTransferId(null)}
        />
      ) : null}

      <ConfirmActionDialog
        open={voiding !== null}
        onOpenChange={(open) => !open && setVoiding(null)}
        title={t("receipt_void_title")}
        description={t("receipt_void_desc", { number: voiding?.number ?? "" })}
        confirmLabel={t("void")}
        tone="destructive"
        isPending={voidReceipt.isPending}
        onConfirm={() =>
          voiding &&
          voidReceipt.mutate(voiding.id, {
            onSuccess: () => setVoiding(null),
            onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
          })
        }
      />
    </>
  )
}
