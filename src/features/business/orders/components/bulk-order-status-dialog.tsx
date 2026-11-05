import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/i18n/use-i18n"
import { useDeliveryOperations } from "../hooks/use-delivery-operations"
import { bulkUpdateOrderStatus, checkOrderStock } from "../services/orders.service"
import { KANBAN_COLUMNS, ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem, OrderStatus, OrderStockItem } from "../types/api"
import type { BulkOrderStatusResult } from "../types/bulk-status"
import { bulkStockWarnings, isDeliveryOrder } from "../utils/bulk-status"
import { getApiErrorMessage } from "../utils/order-helpers"

interface Props {
  orders: OrderListItem[]
  initialStatus?: OrderStatus
  onClose: () => void
  onResults: (result: BulkOrderStatusResult) => void
}

function CourierField({
  branchId,
  value,
  onChange,
}: {
  branchId: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation("business-orders")
  const { data, isLoading } = useDeliveryOperations(branchId)
  return (
    <label className="block space-y-1 text-sm">
      <span>{t("courier_select")}</span>
      <select
        aria-label={t("courier_select")}
        className="w-full rounded-md border bg-background p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
      >
        <option value="">{t("bulk_keep_couriers")}</option>
        {data?.couriers.map((courier) => (
          <option key={courier.id} value={courier.id}>
            {courier.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function BulkOrderStatusDialog({ orders, initialStatus, onClose, onResults }: Props) {
  const { t } = useTranslation("business-orders")
  const qc = useQueryClient()
  const [status, setStatus] = useState<OrderStatus>(initialStatus ?? "Confirmed")
  const [courierId, setCourierId] = useState("")
  const [checking, setChecking] = useState(false)
  const [warnings, setWarnings] = useState<OrderStockItem[]>([])
  const [checkedStock, setCheckedStock] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkOrderStatusResult | null>(null)
  const activeOrders = result
    ? orders.filter((order) => result.results.some((r) => r.orderId === order.id && !r.succeeded))
    : orders
  const branches = [...new Set(activeOrders.map((order) => order.branchId))]
  const branchId = branches.length === 1 ? branches[0] : null
  const needsCourier =
    status === "Shipped" && activeOrders.some((order) => isDeliveryOrder(order) && !order.courierId) && !courierId
  const mutation = useMutation({
    mutationFn: bulkUpdateOrderStatus,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] })
      void qc.invalidateQueries({ queryKey: ["delivery-operations"] })
      void qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
  const busy = checking || mutation.isPending
  const submit = async () => {
    if (busy || needsCourier || (warnings.length > 0 && !acknowledged)) return
    setError(null)
    if (status === "Confirmed" && !checkedStock) {
      setChecking(true)
      try {
        const checks = await Promise.all(activeOrders.map((order) => checkOrderStock(order.id)))
        const missing = bulkStockWarnings(activeOrders, checks)
        setWarnings(missing)
        setCheckedStock(true)
        if (missing.length > 0) return
      } catch (err) {
        setError(getApiErrorMessage(err, t("bulk_stock_failed")))
        return
      } finally {
        setChecking(false)
      }
    }
    try {
      const next = await mutation.mutateAsync({
        orderIds: activeOrders.map((order) => order.id),
        status,
        courierId: status === "Shipped" ? courierId || null : null,
      })
      setResult(next)
      onResults(next)
      // Fallidos conservan su selección. Nunca se reenvían los éxitos al reintentar.
      setCheckedStock(false)
      setWarnings([])
      setAcknowledged(false)
      if (next.failureCount === 0) onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, t("bulk_network_failed")))
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (busy) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("bulk_title", { count: activeOrders.length })}</DialogTitle>
          <DialogDescription>{t("bulk_description")}</DialogDescription>
        </DialogHeader>
        <fieldset disabled={busy} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>{t("bulk_target")}</span>
            <select
              aria-label={t("bulk_target")}
              className="w-full rounded-md border bg-background p-2"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as OrderStatus)
                setWarnings([])
                setCheckedStock(false)
                setAcknowledged(false)
                setError(null)
              }}
            >
              {KANBAN_COLUMNS.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_CONFIG[value].label}
                </option>
              ))}
            </select>
          </label>
          {status === "Shipped" && branchId && (
            <CourierField branchId={branchId} value={courierId} onChange={setCourierId} />
          )}
          {status === "Shipped" && !branchId && <p className="text-sm text-amber-700">{t("bulk_multiple_branches")}</p>}
          {needsCourier && <p className="text-sm text-amber-700">{t("bulk_need_courier")}</p>}
          {warnings.length > 0 && (
            <div className="space-y-2 rounded-md border border-amber-300 p-3">
              <p className="text-sm font-medium">{t("stock_warning_title")}</p>
              <ul className="text-sm">
                {warnings.map((item, i) => (
                  <li key={i}>
                    {item.name}: {t("stock_warning_line", { requested: item.requested, available: item.available })}
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
                {t("bulk_stock_acknowledge")}
              </label>
            </div>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {result && (
          <div role="alert" className="space-y-2 rounded-md border border-amber-300 p-3 text-sm">
            <p>{t("bulk_result", { success: result.successCount, failed: result.failureCount })}</p>
            <ul>
              {result.results
                .filter((r) => !r.succeeded)
                .map((r) => (
                  <li key={r.orderId}>
                    #{orders.find((order) => order.id === r.orderId)?.externalOrderId ?? r.orderId.slice(0, 8)}:{" "}
                    {r.message}
                  </li>
                ))}
            </ul>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={busy || needsCourier || (warnings.length > 0 && !acknowledged)}
            onClick={() => void submit()}
          >
            {busy ? t("bulk_processing") : result ? t("bulk_retry") : t("bulk_apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
