import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, Ban, PackagePlus, Plus, ShoppingCart, Truck } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { EntityListLayout } from "@/components/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { InventoryPagination } from "../../components/inventory-pagination"
import { useInventoryInbox } from "../../hooks/use-inventory"
import { useInventoryBranch } from "../../hooks/use-inventory-branch"
import { useGoodsReceipts, usePurchaseOrders, useVoidGoodsReceipt } from "../../hooks/use-purchasing"
import { INVENTORY_PAGE_SIZE } from "../../services/inventory.service"
import type { GoodsReceiptDto } from "../../types/purchasing"
import { formatDateTime } from "../../utils/status"
import { formatMoney } from "../../utils/units"
import { TransferDetailDialog } from "../../transfers/components/transfer-detail-dialog"
import { GoodsReceiptDialog } from "../components/goods-receipt-dialog"
import { NewOrderDialog } from "../components/new-order-dialog"
import { OrderDetailDialog } from "../components/order-detail-dialog"
import { OrdersTable } from "../components/orders-table"

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
          // El fragmento es un React element: entra por la ruta de nodo personalizado y sus hijos quedan como lados izquierdo/derecho de <Toolbar>. No simplificar a objeto.
          branchId ? (
            <>
              <div className="flex flex-1 items-center gap-2">
                {activeTab === "mine" ? (
                  <>
                    <Switch
                      id="pedidos-abiertos"
                      checked={openOnly}
                      onCheckedChange={(checked) => {
                        setOpenOnly(checked)
                        setPage(1)
                      }}
                    />
                    <Label htmlFor="pedidos-abiertos">{t("orders_open_only")}</Label>
                  </>
                ) : null}
              </div>
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
          ) : undefined
        }
      >
        {/* Cada pestaña maneja su propio scroll: el Card del layout recorta lo que sobresalga. */}
        {branch ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {activeTab === "mine" ? (
                <OrdersTable
                  query={orders}
                  counterpartLabel={t("receipt_supplier")}
                  counterpart="supplier"
                  emptyLabel={t("po_empty")}
                  onOpen={setOrderId}
                />
              ) : receipts.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (receipts.data?.items ?? []).length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{t("receipts_empty")}</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("document")}</TableHead>
                        <TableHead>{t("receipt_supplier")}</TableHead>
                        <TableHead>{t("receive_invoice")}</TableHead>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead className="text-right">{t("value")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(receipts.data?.items ?? []).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{r.number}</p>
                            {r.purchaseOrderNumber ? (
                              <p className="text-xs text-muted-foreground">{r.purchaseOrderNumber}</p>
                            ) : null}
                          </TableCell>
                          <TableCell>{r.supplierName ?? t("receipt_no_supplier")}</TableCell>
                          <TableCell className="text-muted-foreground">{r.invoiceNumber ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                          <TableCell className="text-right">{formatMoney(r.total)}</TableCell>
                          <TableCell className="text-right">
                            {r.status === "Voided" ? (
                              <Badge tone="danger">{t("receipt_voided")}</Badge>
                            ) : (
                              <Button type="button" size="sm" variant="outline" onClick={() => setVoiding(r)}>
                                <Ban className="mr-2 size-4" />
                                {t("void")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <InventoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
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
