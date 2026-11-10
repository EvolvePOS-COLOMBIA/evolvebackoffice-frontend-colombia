import { useState } from "react"
import { Ban, PackageCheck, Send, ShoppingCart, Truck, XCircle } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { BulkPercent, LinePriceInput } from "../../components/line-price-input"
import { ShareButton } from "../../components/share-dialog"
import {
  useCancelPurchaseOrder,
  useClosePurchaseOrder,
  useDispatchPurchaseOrder,
  usePurchaseOrder,
  useReceivePurchaseOrder,
  useSendPurchaseOrder,
} from "../../hooks/use-purchasing"
import type { PurchaseOrderDto } from "../../types/purchasing"
import {
  DEFAULT_LINE_PRICE,
  defaultLinePrice,
  type LinePrice,
  percentBase,
  priceBase,
  resolvePrice,
} from "../../utils/pricing"
import { isNonNegative } from "../../utils/lines"
import { purchaseOrderShareText } from "../../utils/share-text"
import { formatDateTime, OPEN_ORDER_STATUSES, ORDER_STATUS_TONE, TRANSFER_STATUS_TONE } from "../../utils/status"
import { formatInPackaging, formatMoney, formatQuantity, unitSymbol } from "../../utils/units"

type OrderDetailDialogProps = {
  orderId: string
  /** Sucursal con la que se está trabajando: define si se ve como quien pide o como proveedora. */
  branchId: string
  onOpenChange: (open: boolean) => void
  onOpenTransfer: (transferId: string) => void
}

type Mode = "view" | "dispatch" | "receive"
type Confirm = "cancel" | "close" | null

export function OrderDetailDialog({ orderId, branchId, onOpenChange, onOpenTransfer }: OrderDetailDialogProps) {
  const { t } = useTranslation("business-inventory")
  const { data: order, isLoading } = usePurchaseOrder(orderId)
  const [mode, setMode] = useState<Mode>("view")
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [costs, setCosts] = useState<Record<string, string>>({})
  // Despacho: precio de cada línea (precio de venta de quien despacha, + %, costo o especial).
  const [prices, setPrices] = useState<Record<string, LinePrice>>({})
  const [invoice, setInvoice] = useState("")

  const send = useSendPurchaseOrder()
  const dispatch = useDispatchPurchaseOrder()
  const receive = useReceivePurchaseOrder()
  const close = useClosePurchaseOrder()
  const cancel = useCancelPurchaseOrder()

  const fail = (error: unknown) => notify.error(getApiErrorMessage(error, t("save_error")))

  if (isLoading || !order) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("order_detail")}</DialogTitle>
          </DialogHeader>
          <Skeleton className="h-48 w-full" />
        </DialogContent>
      </Dialog>
    )
  }

  const isOwner = order.branchId === branchId
  const isSupplierSide = order.supplierBranchId === branchId
  const isInternal = Boolean(order.supplierBranchId)
  const canDispatch = isSupplierSide && (order.status === "Sent" || order.status === "PartiallyDispatched")
  const canReceive = isOwner && !isInternal && (order.status === "Sent" || order.status === "PartiallyReceived")
  const canCancel =
    isOwner &&
    (order.status === "Draft" || order.status === "Sent") &&
    order.lines.every((l) => l.quantityDispatched === 0 && l.quantityReceived === 0)
  const canClose = OPEN_ORDER_STATUSES.includes(order.status) && (isInternal ? isSupplierSide : isOwner)

  const pendingDispatch = (l: PurchaseOrderDto["lines"][number]) =>
    Math.max(0, l.quantityOrdered - l.quantityDispatched)
  const pendingReceipt = (l: PurchaseOrderDto["lines"][number]) => Math.max(0, l.quantityOrdered - l.quantityReceived)

  const startDispatch = () => {
    setAmounts(
      Object.fromEntries(
        order.lines.map((l) => [l.id, String(Math.min(pendingDispatch(l), Math.max(0, l.supplierStock ?? 0)))])
      )
    )
    setPrices(Object.fromEntries(order.lines.map((l) => [l.id, defaultLinePrice(baseOf(l))])))
    setMode("dispatch")
  }

  const startReceive = () => {
    setAmounts(Object.fromEntries(order.lines.map((l) => [l.id, String(pendingReceipt(l))])))
    setCosts(Object.fromEntries(order.lines.map((l) => [l.id, String(l.unitCost)])))
    setInvoice("")
    setMode("receive")
  }

  const confirmDispatch = () =>
    dispatch.mutate(
      {
        id: order.id,
        // Sin precio de venta ni costo → null: el backend lo envía al costo.
        lines: order.lines.map((l) => ({
          lineId: l.id,
          quantity: Number(amounts[l.id] || 0),
          unitPrice: resolvePrice(baseOf(l), prices[l.id] ?? DEFAULT_LINE_PRICE),
        })),
        notes: null,
      },
      {
        onSuccess: (transfer) => {
          notify.success(t("order_dispatched", { number: transfer.number }))
          setMode("view")
        },
        onError: fail,
      }
    )

  const confirmReceive = () =>
    receive.mutate(
      {
        id: order.id,
        invoiceNumber: invoice.trim() || null,
        notes: null,
        lines: order.lines
          .map((l) => ({ lineId: l.id, quantity: Number(amounts[l.id] || 0), unitCost: Number(costs[l.id] || 0) }))
          .filter((l) => l.quantity > 0),
      },
      {
        onSuccess: (receipt) => {
          notify.success(t("order_received", { number: receipt.number }))
          setMode("view")
        },
        onError: fail,
      }
    )

  const anyAmount = order.lines.some((l) => Number(amounts[l.id] || 0) > 0)
  // Un precio especial o un % sin valor válido no deja despachar.
  const pricesValid = order.lines.every((l) => {
    const price = prices[l.id] ?? DEFAULT_LINE_PRICE
    return price.mode === "sale" || price.mode === "cost" || resolvePrice(baseOf(l), price) !== null
  })
  // No se despacha más de lo que tiene la sucursal que despacha (la línea ya muestra el aviso).
  const withinStock = order.lines.every(
    (l) => l.supplierStock === null || Number(amounts[l.id] || 0) <= l.supplierStock
  )
  // Al recibir, cada línea con cantidad necesita su costo (0 se escribe a propósito), como en la entrada rápida.
  const costsValid = order.lines.every((l) => Number(amounts[l.id] || 0) <= 0 || isNonNegative(costs[l.id] ?? ""))
  const dispatchValue = order.lines.reduce((sum, l) => {
    const price = resolvePrice(baseOf(l), prices[l.id] ?? DEFAULT_LINE_PRICE)
    return sum + Number(amounts[l.id] || 0) * (price ?? 0)
  }, 0)

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {order.number}
                <Badge tone={ORDER_STATUS_TONE[order.status]}>{t(`order_status_${order.status}`)}</Badge>
              </DialogTitle>
              <DialogDescription>
                {t("order_direction", { branch: order.branchName, supplier: order.supplierName })} ·{" "}
                {formatDateTime(order.sentAt ?? order.createdAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {mode === "receive" ? (
          <div className="space-y-2">
            <Label htmlFor="recibir-factura">{t("receive_invoice")}</Label>
            <Input id="recibir-factura" value={invoice} maxLength={60} onChange={(e) => setInvoice(e.target.value)} />
          </div>
        ) : null}

        {mode === "dispatch" && order.lines.some((l) => percentBase(baseOf(l)) !== null) ? (
          <BulkPercent
            onApply={(percent) =>
              setPrices((current) =>
                Object.fromEntries(
                  order.lines.map((l) => [
                    l.id,
                    percentBase(baseOf(l)) !== null
                      ? { ...(current[l.id] ?? DEFAULT_LINE_PRICE), mode: "percent" as const, percent }
                      : (current[l.id] ?? DEFAULT_LINE_PRICE),
                  ])
                )
              )
            }
          />
        ) : null}

        <div className="w-full overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead className="text-right">{t("order_ordered")}</TableHead>
                {isInternal ? <TableHead className="text-right">{t("order_dispatched_col")}</TableHead> : null}
                <TableHead className="text-right">{t("order_received_col")}</TableHead>
                {isSupplierSide ? <TableHead className="text-right">{t("order_my_stock")}</TableHead> : null}
                {mode === "dispatch" ? (
                  <>
                    <TableHead className="w-40">{t("order_to_dispatch")}</TableHead>
                    <TableHead>{t("price_column")}</TableHead>
                  </>
                ) : null}
                {mode === "receive" ? (
                  <>
                    <TableHead className="w-36">{t("order_to_receive")}</TableHead>
                    <TableHead className="w-36">{t("receive_unit_cost")}</TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((l) => {
                const packaging =
                  l.packagingName && l.packagingFactor ? { name: l.packagingName, factor: l.packagingFactor } : null
                const amount = Number(amounts[l.id] || 0)
                const exceedsStock = mode === "dispatch" && l.supplierStock !== null && amount > l.supplierStock
                return (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{l.itemName}</p>
                      <p className="text-xs text-muted-foreground">{l.sku ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p>{formatQuantity(l.quantityOrdered, l.baseUnit)}</p>
                      {formatInPackaging(l.quantityOrdered, packaging) ? (
                        <p className="text-xs text-muted-foreground">
                          {formatInPackaging(l.quantityOrdered, packaging)}
                        </p>
                      ) : null}
                    </TableCell>
                    {isInternal ? (
                      <TableCell className="text-right text-muted-foreground">
                        {formatQuantity(l.quantityDispatched, l.baseUnit)}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-right text-muted-foreground">
                      {formatQuantity(l.quantityReceived, l.baseUnit)}
                    </TableCell>
                    {isSupplierSide ? (
                      <TableCell className="text-right text-muted-foreground">
                        {formatQuantity(l.supplierStock ?? 0, l.baseUnit)}
                      </TableCell>
                    ) : null}
                    {mode === "dispatch" ? (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            aria-label={t("order_to_dispatch")}
                            value={amounts[l.id] ?? ""}
                            onChange={(e) => setAmounts((a) => ({ ...a, [l.id]: e.target.value }))}
                          />
                          <span className="text-xs text-muted-foreground">{unitSymbol(l.baseUnit)}</span>
                        </div>
                        {exceedsStock ? (
                          <p className="mt-1 text-xs text-destructive">{t("order_exceeds_stock")}</p>
                        ) : null}
                      </TableCell>
                    ) : null}
                    {mode === "dispatch" ? (
                      <TableCell>
                        <LinePriceInput
                          base={baseOf(l)}
                          unitLabel={unitSymbol(l.baseUnit)}
                          value={prices[l.id] ?? DEFAULT_LINE_PRICE}
                          noBaseLabel={t("price_at_cost")}
                          onChange={(value) => setPrices((p) => ({ ...p, [l.id]: value }))}
                        />
                      </TableCell>
                    ) : null}
                    {mode === "receive" ? (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              aria-label={t("order_to_receive")}
                              value={amounts[l.id] ?? ""}
                              onChange={(e) => setAmounts((a) => ({ ...a, [l.id]: e.target.value }))}
                            />
                            <span className="text-xs text-muted-foreground">{unitSymbol(l.baseUnit)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            aria-label={t("receive_unit_cost")}
                            value={costs[l.id] ?? ""}
                            onChange={(e) => setCosts((c) => ({ ...c, [l.id]: e.target.value }))}
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("receive_per_unit", { unit: unitSymbol(l.baseUnit) })}
                          </p>
                        </TableCell>
                      </>
                    ) : null}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {t("order_estimated_total")}:{" "}
            <span className="font-medium text-foreground">{formatMoney(order.estimatedTotal)}</span>
          </span>
          {order.notes ? <span>{order.notes}</span> : null}
        </div>

        {order.transfers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t("order_transfers")}</p>
            <div className="flex flex-wrap gap-2">
              {order.transfers.map((tr) => (
                <button key={tr.id} type="button" onClick={() => onOpenTransfer(tr.id)}>
                  <Badge tone={TRANSFER_STATUS_TONE[tr.status]}>
                    <Truck className="size-3" />
                    {tr.number} · {t(`transfer_status_${tr.status}`)}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-wrap gap-2">
          {mode === "view" ? (
            <>
              <ShareButton title={order.number} text={purchaseOrderShareText(order, t)} phone={order.supplierPhone} />
              {canCancel ? (
                <Button type="button" variant="outline" onClick={() => setConfirm("cancel")}>
                  <Ban className="mr-2 size-4" />
                  {t("order_cancel")}
                </Button>
              ) : null}
              {canClose ? (
                <Button type="button" variant="outline" onClick={() => setConfirm("close")}>
                  <XCircle className="mr-2 size-4" />
                  {t("order_close")}
                </Button>
              ) : null}
              {isOwner && order.status === "Draft" ? (
                <Button
                  type="button"
                  onClick={() =>
                    send.mutate(order.id, {
                      onSuccess: () => notify.success(t("order_sent", { number: order.number })),
                      onError: fail,
                    })
                  }
                  disabled={send.isPending}
                >
                  <Send className="mr-2 size-4" />
                  {t("order_send")}
                </Button>
              ) : null}
              {canDispatch ? (
                <Button id="btn-despachar" type="button" onClick={startDispatch}>
                  <Truck className="mr-2 size-4" />
                  {t("order_dispatch")}
                </Button>
              ) : null}
              {canReceive ? (
                <Button id="btn-recibir-pedido" type="button" onClick={startReceive}>
                  <PackageCheck className="mr-2 size-4" />
                  {t("order_receive")}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {mode === "dispatch" ? (
                <span className="mr-auto self-center text-sm text-muted-foreground">
                  {t("dispatch_value")}:{" "}
                  <span className="font-medium text-foreground">{formatMoney(dispatchValue)}</span>
                </span>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setMode("view")}>
                {t("cancel")}
              </Button>
              {mode === "dispatch" ? (
                <Button
                  type="button"
                  onClick={confirmDispatch}
                  disabled={!anyAmount || !pricesValid || !withinStock || dispatch.isPending}
                >
                  {dispatch.isPending ? t("saving") : t("order_confirm_dispatch")}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={confirmReceive}
                  disabled={!anyAmount || !costsValid || receive.isPending}
                >
                  {receive.isPending ? t("saving") : t("order_confirm_receive")}
                </Button>
              )}
            </>
          )}
        </DialogFooter>

        <ConfirmActionDialog
          open={confirm !== null}
          onOpenChange={(open) => {
            if (!open) setConfirm(null)
          }}
          title={confirm === "cancel" ? t("order_cancel_title") : t("order_close_title")}
          description={confirm === "cancel" ? t("order_cancel_desc") : t("order_close_desc")}
          confirmLabel={confirm === "cancel" ? t("order_cancel") : t("order_close")}
          tone="destructive"
          isPending={cancel.isPending || close.isPending}
          onConfirm={() =>
            (confirm === "cancel" ? cancel : close).mutate(order.id, {
              onSuccess: () => setConfirm(null),
              onError: fail,
            })
          }
        />
      </DialogContent>
    </Dialog>
  )
}

/** Precio de venta y costo de quien despacha, por unidad base. */
function baseOf(line: { supplierPrice: number | null; supplierCost: number | null }) {
  return priceBase(line.supplierPrice, line.supplierCost)
}
