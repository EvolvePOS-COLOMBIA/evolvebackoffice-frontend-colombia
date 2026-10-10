import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/use-i18n"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { notify } from "@/hooks/use-notify"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { getItems } from "@/features/business/items/catalog/services/items.service"
import { getActivePaymentMethods } from "@/features/business/payment-methods/services/payment-methods.service"
import { useCanManageDeliveries, useDeliveryAction, useDeliveryOperations } from "../hooks/use-delivery-operations"
import { getApiErrorMessage } from "../utils/order-helpers"
import type { UnlinkedProduct, WebhookHealth } from "../types/operations"

export function DeliveryOperationsPage() {
  const { t } = useTranslation("business-orders")
  const { formatCurrency } = useLocaleFormat()
  const navigate = useNavigate()
  const canManage = useCanManageDeliveries()
  const { data: branches } = useBranches(1, 100)
  const [branchId, setBranch] = useState("")
  const { data, isError } = useDeliveryOperations(branchId || null)
  const action = useDeliveryAction()
  const [courier, setCourier] = useState("")
  const [base, setBase] = useState("0")
  const [returned, setReturned] = useState<Record<string, string>>({})
  const run = (path: string, payload?: unknown, method?: "post" | "put") =>
    action.mutate(
      { path, payload, method },
      {
        onSuccess: () => notify.success(t("phase2_saved")),
        onError: (e) => notify.error(getApiErrorMessage(e, t("status_update_failed"))),
      }
    )
  if (!canManage) return <p role="alert">{t("phase2_manager_only")}</p>
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => navigate("/business/orders/deliveries")}>
          {t("deliveries_title")}
        </Button>
        <Button variant="outline" onClick={() => navigate("/business/people/users")}>
          {t("couriers_title")}
        </Button>
        <h1 className="text-xl font-semibold">{t("phase2_operations")}</h1>
      </div>
      <label className="block max-w-sm">
        {t("branch")}
        <select
          aria-label={t("branch")}
          className="mt-1 h-10 w-full rounded-md border bg-background px-3"
          value={branchId}
          onChange={(e) => setBranch(e.target.value)}
        >
          <option value="">{t("all_branches")}</option>
          {branches?.data.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      {isError && <p role="alert">{t("status_update_failed")}</p>}
      <Card>
        <CardHeader>
          <CardTitle>{t("phase2_shifts")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              run("shifts", { courierId: courier, branchId, openingCash: Number(base) })
            }}
          >
            <label>
              {t("courier_select")}
              <select
                aria-label={t("courier_select")}
                className="mt-1 block h-10 rounded-md border bg-background px-3"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
              >
                <option value="">{t("courier_select")}</option>
                {data?.couriers
                  .filter((c) => !c.onDuty)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("phase2_opening_cash")}
              <Input
                aria-label={t("phase2_opening_cash")}
                type="number"
                min="0"
                step="0.01"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                required
              />
            </label>
            <Button disabled={!courier || !branchId || action.isPending} type="submit">
              {t("phase2_start_shift")}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">{t("phase2_cash_formula")}</p>
          {data?.shifts.map((s) => (
            <div key={s.id} className="space-y-2 rounded-lg border p-3">
              <p className="font-semibold">
                {s.courierName} · {t(s.settledAt ? "phase2_settled" : "phase2_on_duty")}
              </p>
              <p className="text-sm">
                {t("phase2_opening_cash")}: {formatCurrency(s.openingCash)} · {t("phase2_expected")}:{" "}
                {formatCurrency(s.expectedCash)} · {t("phase2_tip")}: {formatCurrency(s.tipsTotal)}
              </p>
              <p className="text-sm">
                {s.deliveredCount} {t("settlement_delivered")} · {t("phase2_average")}:{" "}
                {s.averageDeliveryMinutes ?? "—"} min
              </p>
              {s.settledAt ? (
                <p>
                  {t("phase2_difference")}: {formatCurrency((s.returnedCash ?? 0) - s.expectedCash)}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Input
                    className="max-w-48"
                    aria-label={`${t("phase2_returned_cash")} ${s.courierName}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t("phase2_returned_cash")}
                    value={returned[s.id] ?? ""}
                    onChange={(e) => setReturned({ ...returned, [s.id]: e.target.value })}
                  />
                  <Button
                    disabled={action.isPending || returned[s.id] == null || returned[s.id] === ""}
                    onClick={() => run(`shifts/${s.id}/settle`, { returnedCash: Number(returned[s.id]) })}
                  >
                    {t("phase2_settle")}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("phase2_unlinked")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!data?.unlinkedProducts.length && <p>{t("phase2_all_linked")}</p>}
          {data?.unlinkedProducts.map((p) => (
            <ProductLink
              key={`${p.integrationId}/${p.externalItemId}`}
              product={p}
              pending={action.isPending}
              onLink={(itemId) =>
                run(
                  "products/link",
                  { integrationId: p.integrationId, externalItemId: p.externalItemId, itemId },
                  "put"
                )
              }
            />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("phase2_cluvi_health")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.webhooks.map((w) => (
            <div key={w.integrationId} className="space-y-3 rounded-lg border p-3">
              <p className="font-semibold">
                {w.branchName} ·{" "}
                {t(
                  w.storeActive == null
                    ? "phase2_unknown"
                    : w.storeActive
                      ? "phase2_store_active"
                      : "phase2_store_paused"
                )}
              </p>
              <p className="text-sm">
                {t("phase2_last_webhook")}:{" "}
                {w.lastReceivedAt ? new Date(w.lastReceivedAt).toLocaleString() : t("phase2_never")}
              </p>
              {w.quiet && (
                <p role="alert" className="text-amber-600">
                  {t("phase2_webhook_quiet")}
                </p>
              )}
              <Button
                disabled={action.isPending}
                variant="outline"
                onClick={() =>
                  run(`integrations/${w.integrationId}/availability`, { active: w.storeActive !== true }, "put")
                }
              >
                {t(w.storeActive ? "phase2_pause_store" : "phase2_resume_store")}
              </Button>
              <PaymentMapping
                health={w}
                pending={action.isPending}
                onSave={(mappings) => run(`integrations/${w.integrationId}/payments`, { mappings }, "put")}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ProductLink({
  product,
  pending,
  onLink,
}: {
  product: UnlinkedProduct
  pending: boolean
  onLink: (id: string) => void
}) {
  const { t } = useTranslation("business-orders")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState("")
  const { data } = useQuery({
    queryKey: ["items", "delivery-link", search],
    queryFn: () => getItems({ pageSize: 100, searchField: "name", searchValue: search }),
  })
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p>
        {product.name} · {product.externalItemId} · {product.ordersCount} {t("orders")}
      </p>
      <Input
        aria-label={`${t("phase2_search_item")} ${product.name}`}
        placeholder={t("phase2_search_item")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex gap-2">
        <select
          aria-label={`${t("phase2_link_item")} ${product.name}`}
          className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">{t("phase2_link_item")}</option>
          {data?.data.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} · {i.sku}
            </option>
          ))}
        </select>
        <Button disabled={!selected || pending} onClick={() => onLink(selected)}>
          {t("phase2_link")}
        </Button>
      </div>
    </div>
  )
}

function PaymentMapping({
  health,
  pending,
  onSave,
}: {
  health: WebhookHealth
  pending: boolean
  onSave: (m: Record<string, string>) => void
}) {
  const { t } = useTranslation("business-orders")
  const { data } = useQuery({ queryKey: ["payment-methods", "active"], queryFn: getActivePaymentMethods })
  const [raw, setRaw] = useState("cash")
  const [code, setCode] = useState("")
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{t("phase2_payment_mapping")}</p>
      {Object.entries(health.paymentMethodMappings).map(([source, target]) => (
        <p className="text-sm" key={source}>
          {source} → {target}
        </p>
      ))}
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-40"
          aria-label={t("phase2_external_payment")}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <select
          className="h-10 rounded-md border bg-background px-3"
          aria-label={t("phase2_local_payment")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        >
          <option value="">{t("phase2_local_payment")}</option>
          {data?.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
        <Button
          disabled={!raw.trim() || !code || pending}
          onClick={() => onSave({ ...health.paymentMethodMappings, [raw.trim().toLowerCase()]: code })}
        >
          {t("save")}
        </Button>
      </div>
    </div>
  )
}
