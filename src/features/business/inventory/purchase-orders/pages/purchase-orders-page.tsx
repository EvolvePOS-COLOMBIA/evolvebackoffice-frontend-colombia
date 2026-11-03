import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Ban, PackagePlus, Plus, ShoppingCart } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { BackLink } from "@/components/ui/back-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { InventoryPagination } from "../../components/inventory-pagination"
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

  const current = activeTab === "receipts" ? receipts : orders
  const totalPages = Math.ceil((current.data?.totalCount ?? 0) / INVENTORY_PAGE_SIZE)

  const changeTab = (value: string) => {
    setTab(value as Tab)
    setPage(1)
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
        <BackLink to="/business/inventory">{t("back_to_inventory")}</BackLink>
        <div className="relative flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("purchase_orders")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("orders_page_desc")}</p>
          <ShoppingCart
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        {branchesLoading ? (
          <Skeleton className="h-10 w-80" />
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_branches")}</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating("receipt")}>
                <PackagePlus className="mr-2 size-4" />
                {t("receipt_new_title")}
              </Button>
              <Button id="btn-nuevo-pedido" type="button" onClick={() => setCreating("order")}>
                <Plus className="mr-2 size-4" />
                {t("po_new_title")}
              </Button>
            </div>
          </div>
        )}

        {branch ? (
          <Tabs value={activeTab} onValueChange={changeTab}>
            <TabsList>
              <TabsTrigger value="mine">{t("po_tab_orders")}</TabsTrigger>
              <TabsTrigger value="receipts">{t("orders_tab_receipts")}</TabsTrigger>
            </TabsList>

            <TabsContent value="mine" className="space-y-4">
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
              <OrdersTable
                query={orders}
                counterpartLabel={t("receipt_supplier")}
                counterpart="supplier"
                emptyLabel={t("po_empty")}
                onOpen={setOrderId}
              />
            </TabsContent>

            <TabsContent value="receipts" className="space-y-4">
              {receipts.isLoading ? (
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
            </TabsContent>

            <InventoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </Tabs>
        ) : null}

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
      </CardContent>
    </Card>
  )
}
