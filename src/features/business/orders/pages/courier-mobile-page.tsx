import { useCallback, useState } from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { collectDelivery, getCourierMobile } from "../services/delivery-operations.service"
import { DeliveryOrderCard } from "../components/delivery-order-card"
import { getApiErrorMessage } from "../utils/order-helpers"
import type { DeliveryOrder } from "../types/delivery"
import type { DeliveryProofInput } from "../types/enhancements"
import { DeliveryProofCapture } from "../components/delivery-proof-input"
import { DeliveryMap } from "../components/delivery-map"

export function CourierMobilePage() {
  const { session, logout } = useAuth()
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const qc = useQueryClient()
  const key = ["delivery-me", session?.tenantId, session?.user.id]
  const { data, error, isLoading, dataUpdatedAt } = useQuery({
    queryKey: key,
    queryFn: () => getCourierMobile(),
    enabled: !!session && !session.forcePasswordChange,
    retry: false,
    refetchInterval: 15_000,
  })
  const [selected, setSelected] = useState<DeliveryOrder | null>(null)
  const [cash, setCash] = useState("")
  const [proof, setProof] = useState<DeliveryProofInput | null>(null)
  const [proofValid, setProofValid] = useState(true)
  const onProofChange = useCallback((value: DeliveryProofInput | null, valid: boolean) => {
    setProof(value)
    setProofValid(valid)
  }, [])
  const deliver = useMutation({
    mutationFn: () =>
      collectDelivery(selected!.id, selected!.paymentConfirmed || selected!.isReconciled ? null : Number(cash), proof),
    onSuccess: async () => {
      setSelected(null)
      await qc.invalidateQueries({ queryKey: key })
    },
  })
  if (session?.forcePasswordChange)
    return <ChangePasswordDialog open onPasswordChanged={() => void qc.invalidateQueries({ queryKey: key })} />
  if (!session || error)
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t("phase2_my_deliveries")}</h1>
        <p role="alert">{getApiErrorMessage(error, t("phase2_no_shift"))}</p>
        <Button variant="outline" onClick={logout}>
          {t("delivery_logout")}
        </Button>
      </main>
    )
  if (isLoading || !data) return <p className="p-6">{t("loading")}</p>
  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <Button variant="outline" onClick={logout}>
        {t("delivery_logout")}
      </Button>
      <h1 className="text-xl font-semibold">
        {data.courierName} · {t("phase2_my_deliveries")}
      </h1>
      <p>
        {t("phase2_expected")}: {formatCurrency(data.shift.expectedCash)}
      </p>
      <DeliveryMap orders={data.orders.filter((o) => o.status === "Shipped")} />
      {data.orders.map((order) => (
        <DeliveryOrderCard
          key={order.id}
          order={order}
          now={dataUpdatedAt}
          showStatus
          courierName={data.courierName}
          notifyCustomer={false}
          actions={
            order.status === "Shipped" && !order.deliveryFailureReason ? (
              <Button
                onClick={() => {
                  setSelected(order)
                  setProof(null)
                  setProofValid(true)
                  setCash(order.cashTenderedAmount?.toString() ?? "")
                  deliver.reset()
                }}
              >
                {t("delivery_mark_delivered")}
              </Button>
            ) : undefined
          }
        />
      ))}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="break-all">
              {t("delivery_mark_delivered")} · #{selected.reference}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected.paymentConfirmed || selected.isReconciled ? (
              <p className="font-semibold text-emerald-600">
                {t(selected.paymentConfirmed ? "phase2_paid" : "phase2_collected")}
              </p>
            ) : (
              <label className="block">
                {t("phase2_received_cash")}
                <Input
                  aria-label={t("phase2_received_cash")}
                  type="number"
                  min={selected.total}
                  step="0.01"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                />
              </label>
            )}
            {!selected.paymentConfirmed && !selected.isReconciled && (
              <p>{t("phase2_change", { amount: formatCurrency(Math.max(0, Number(cash) - selected.total)) })}</p>
            )}
            {deliver.error && (
              <p role="alert" className="text-red-600">
                {getApiErrorMessage(deliver.error, t("status_update_failed"))}
              </p>
            )}
            <DeliveryProofCapture key={selected.id} onChange={onProofChange} />
            <div className="flex gap-2">
              <Button
                disabled={
                  deliver.isPending ||
                  !proofValid ||
                  (!selected.paymentConfirmed &&
                    !selected.isReconciled &&
                    (!cash || !Number.isFinite(Number(cash)) || Number(cash) < selected.total))
                }
                onClick={() => deliver.mutate()}
              >
                {t("phase2_confirm_delivery")}
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>
                {t("cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
