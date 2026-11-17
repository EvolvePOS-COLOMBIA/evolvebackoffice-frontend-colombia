import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueries } from "@tanstack/react-query"
import { Bike, Timer, Users, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/share/empty-state"
import { StatTile } from "@/components/share/stat-tile"
import { BranchSelector } from "@/features/business/items/catalog/components/branch-selector"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { branchModulesKeys } from "@/features/business/branches/hooks/use-branch-modules"
import { getBranchModules } from "@/features/business/branches/services/branch-modules.service"
import { useOrders } from "@/features/business/orders/hooks/use-orders"
import type { OrderListItem } from "@/features/business/orders/types/api"
import { notify } from "@/hooks/use-notify"
import { getApiErrorMessage } from "@/utils/api-error"
import { formatCurrency, formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

import { ActivateDomiciliarioDialog } from "../components/activate-domiciliario-dialog"
import { CloseShiftDialog, ShiftSettlementDialog } from "../components/close-shift-dialog"
import { DeliverOrderDialog } from "../components/deliver-order-dialog"
import { ShiftDetailDialog } from "../components/shift-detail-dialog"
import { ShiftMovementDialog } from "../components/shift-movement-dialog"
import { ShiftOrdersDialog } from "../components/shift-orders-dialog"
import {
  useActivateDomiciliario,
  useAddShiftMovement,
  useBranchDeliverySettings,
  useCloseShift,
  useDomiciliarios,
  useShifts,
} from "../hooks/use-delivery"
import { ADVANCE_MODE, type DeliveryDomiciliarioDto, type DeliveryShiftDto } from "../types"

const DELIVERY_BRANCH_STORAGE_KEY = "delivery_branch_id"

/**
 * Gestión de domicilios: domiciliarios (activación con base y turno), turnos con
 * su libro de efectivo (más base, recogidas, cuadre de cierre) y registro de
 * entrega de los pedidos en camino. Requiere el módulo DOMICILIOS asignado a la
 * sucursal seleccionada.
 */
export function DeliveryPage() {
  const { t } = useTranslation("business-delivery")
  const { t: tCommon } = useTranslation()
  const navigate = useNavigate()

  // Sucursal seleccionada (persistida) limitada a las que tienen DOMICILIOS.
  // Si la guardada ya no aplica, se usa la primera con el módulo (valor derivado,
  // sin sincronizar estado en un efecto).
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() =>
    localStorage.getItem(DELIVERY_BRANCH_STORAGE_KEY)
  )
  const { data: branchesData } = useBranches(1, 50)
  const branches = useMemo(() => branchesData?.data ?? [], [branchesData])

  const moduleQueries = useQueries({
    queries: branches.map((b) => ({
      queryKey: branchModulesKeys.list(b.id),
      queryFn: () => getBranchModules(b.id),
      staleTime: 60_000,
    })),
  })
  const branchesWithDeliveryModule = branches.filter(
    (_, i) => moduleQueries[i]?.data?.some((m) => m.moduleCode === "DOMICILIOS" && m.isEnabled) ?? false
  )

  const branchId =
    selectedBranchId && branchesWithDeliveryModule.some((b) => b.id === selectedBranchId)
      ? selectedBranchId
      : (branchesWithDeliveryModule[0]?.id ?? "")

  const handleBranchChange = (id: string | null) => {
    if (!id) return
    localStorage.setItem(DELIVERY_BRANCH_STORAGE_KEY, id)
    setSelectedBranchId(id)
  }

  // Datos de la sucursal seleccionada.
  const { data: domiciliarios = [], isLoading: couriersLoading } = useDomiciliarios(branchId || undefined)
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts(branchId || undefined)
  const { data: settings } = useBranchDeliverySettings(branchId || null)
  const { data: shippedData } = useOrders(1, 1, { branchId, status: "Shipped" }, Boolean(branchId))

  const openShifts = useMemo(() => shifts.filter((s) => s.status === "Open"), [shifts])
  const expectedCash = useMemo(() => openShifts.reduce((sum, s) => sum + s.expectedCash, 0), [openShifts])

  // Filtros locales de las secciones.
  const [courierFilter, setCourierFilter] = useState<"all" | "active" | "inactive">("all")
  const [shiftFilter, setShiftFilter] = useState<"open" | "closed">("open")
  const filteredCouriers = useMemo(
    () =>
      domiciliarios.filter((d) =>
        courierFilter === "all" ? true : courierFilter === "active" ? d.status === "active" : d.status === "inactive"
      ),
    [domiciliarios, courierFilter]
  )
  const filteredShifts = useMemo(
    () => shifts.filter((s) => s.status === (shiftFilter === "open" ? "Open" : "Closed")),
    [shifts, shiftFilter]
  )

  // Mutaciones del módulo.
  const activateMutation = useActivateDomiciliario()
  const movementMutation = useAddShiftMovement("extra-base")
  const pickupMutation = useAddShiftMovement("pickup")
  const closeMutation = useCloseShift()

  // Estado de diálogos.
  const [activateTarget, setActivateTarget] = useState<DeliveryDomiciliarioDto | null>(null)
  const [movementTarget, setMovementTarget] = useState<{
    kind: "extra-base" | "pickup"
    shift: DeliveryShiftDto
  } | null>(null)
  const [closeTarget, setCloseTarget] = useState<DeliveryShiftDto | null>(null)
  const [settlementShift, setSettlementShift] = useState<DeliveryShiftDto | null>(null)
  const [detailShiftId, setDetailShiftId] = useState<string | null>(null)
  const [ordersShift, setOrdersShift] = useState<DeliveryShiftDto | null>(null)
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false)
  const [deliverOrder, setDeliverOrder] = useState<OrderListItem | null>(null)

  /** Turno abierto de un domiciliario (para las acciones de la tarjeta). */
  const shiftOf = (courier: DeliveryDomiciliarioDto) =>
    courier.shiftId ? (shifts.find((s) => s.id === courier.shiftId) ?? null) : null

  const handleActivate = (baseAmount: number | null) => {
    if (!activateTarget || !branchId) return
    activateMutation.mutate(
      { userId: activateTarget.userId, payload: { branchId, baseAmount } },
      {
        onSuccess: () => {
          notify.success(t("activate_success"))
          setActivateTarget(null)
        },
        onError: (err) => notify.error(getApiErrorMessage(err, t("action_failed"))),
      }
    )
  }

  const handleMovement = (amount: number, notes: string | null) => {
    if (!movementTarget) return
    const mutation = movementTarget.kind === "extra-base" ? movementMutation : pickupMutation
    mutation.mutate(
      { shiftId: movementTarget.shift.id, payload: { amount, notes } },
      {
        onSuccess: () => {
          notify.success(t("movement_success"))
          setMovementTarget(null)
        },
        onError: (err) => notify.error(getApiErrorMessage(err, t("action_failed"))),
      }
    )
  }

  const handleCloseShift = () => {
    if (!closeTarget) return
    closeMutation.mutate(closeTarget.id, {
      onSuccess: (closed) => {
        notify.success(t("close_success"))
        setCloseTarget(null)
        setDetailShiftId(null)
        setSettlementShift(closed)
      },
      onError: (err) => notify.error(getApiErrorMessage(err, t("action_failed"))),
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("desc")}</p>
        </div>
        <BranchSelector
          options={branchesWithDeliveryModule.map((b) => ({ id: b.id as string | null, name: b.name }))}
          selectedId={branchId || null}
          onSelect={handleBranchChange}
        />
      </header>

      {branches.length > 0 && branchesWithDeliveryModule.length === 0 ? (
        <EmptyState
          icon={Bike}
          title={t("no_branches")}
          description={t("no_branches_desc")}
          action={<Button onClick={() => navigate("/business/settings/branches")}>{t("go_to_branches")}</Button>}
        />
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
            <StatTile
              label={t("stat_active_couriers")}
              value={domiciliarios.filter((d) => d.status === "active").length}
              icon={Users}
              tone="primary"
            />
            <StatTile label={t("stat_open_shifts")} value={openShifts.length} icon={Timer} />
            <StatTile
              label={t("stat_expected_cash")}
              value={formatCurrency(expectedCash)}
              icon={Wallet}
              tone="success"
            />
            <StatTile label={t("stat_shipped_orders")} value={shippedData?.totalCount ?? 0} icon={Bike} tone="info" />
          </div>

          {/* Domiciliarios */}
          <Card className="border-border/80 bg-card/70 shadow-none">
            <CardHeader className="border-b border-border/70 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{t("couriers_title")}</CardTitle>
                  <CardDescription>{t("couriers_desc")}</CardDescription>
                </div>
                <div className="flex gap-1.5">
                  {(["all", "active", "inactive"] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={courierFilter === f ? "default" : "outline"}
                      onClick={() => setCourierFilter(f)}
                    >
                      {f === "all" ? t("filter_all") : f === "active" ? t("filter_active") : t("filter_inactive")}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {couriersLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                  ))}
                </div>
              ) : filteredCouriers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("couriers_empty")}
                  <br />
                  <span className="text-xs">{t("couriers_empty_hint")}</span>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredCouriers.map((courier) => {
                    const shift = shiftOf(courier)
                    const isActive = courier.status === "active"
                    // Con turno: la base del turno abierto. Sin turno: la base
                    // configurada en la sucursal, que es la que se precarga al
                    // activar (el `baseAmount` del DTO es la del último turno
                    // cerrado, solo visible en Turnos → Cerrados).
                    const baseAmount = isActive ? courier.baseAmount : (settings?.baseAmount ?? null)
                    return (
                      <div
                        key={courier.userId}
                        className="rounded-2xl border border-border/70 bg-background/45 p-4 transition-colors hover:border-primary/20"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Bike className="size-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{courier.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {courier.phoneNumber ?? t("courier_no_phone")}
                              </p>
                            </div>
                          </div>
                          <Badge tone={isActive ? "success" : "neutral"}>
                            {isActive ? t("filter_active") : t("filter_inactive")}
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">{isActive ? t("shift_base") : t("default_base")}</p>
                            <p className="font-semibold">{baseAmount != null ? formatCurrency(baseAmount) : "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{isActive ? t("opened_at") : t("last_shift")}</p>
                            <p className="font-semibold">{courier.openedAt ? formatDateTime(courier.openedAt) : "—"}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {isActive && shift ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setDetailShiftId(shift.id)}>
                                {t("view_shift")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMovementTarget({ kind: "extra-base", shift })}
                              >
                                {t("extra_base")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMovementTarget({ kind: "pickup", shift })}
                              >
                                {t("pickup")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setOrdersShift(shift)
                                  setOrdersDialogOpen(true)
                                }}
                              >
                                {t("deliver_orders")}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setCloseTarget(shift)}>
                                {t("close_shift")}
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" onClick={() => setActivateTarget(courier)}>
                              {t("activate")}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Turnos */}
          <Card className="border-border/80 bg-card/70 shadow-none">
            <CardHeader className="border-b border-border/70 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{t("shifts_title")}</CardTitle>
                  <CardDescription>{t("shifts_desc")}</CardDescription>
                </div>
                <div className="flex gap-1.5">
                  {(["open", "closed"] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={shiftFilter === f ? "default" : "outline"}
                      onClick={() => setShiftFilter(f)}
                    >
                      {f === "open" ? t("shift_filter_open") : t("shift_filter_closed")}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {shiftsLoading ? (
                <Skeleton className="h-40 w-full rounded-2xl" />
              ) : filteredShifts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("shifts_empty")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("shift_courier")}</TableHead>
                        <TableHead>{t("shift_branch")}</TableHead>
                        <TableHead className="text-right">{t("shift_base")}</TableHead>
                        <TableHead className="text-right">{t("shift_expected_cash")}</TableHead>
                        <TableHead>{t("shift_opened_at")}</TableHead>
                        <TableHead>{t("shift_closed_at")}</TableHead>
                        <TableHead>{tCommon("status")}</TableHead>
                        <TableHead className="text-right">{t("view_shift")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShifts.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium">{shift.domiciliarioName ?? "—"}</TableCell>
                          <TableCell>{shift.branchName ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(shift.baseAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(shift.expectedCash)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                            {formatDateTime(shift.openedAt)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                            {shift.closedAt ? formatDateTime(shift.closedAt) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge tone={shift.status === "Open" ? "success" : "neutral"}>
                              {shift.status === "Open" ? t("shift_open") : t("shift_closed")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => setDetailShiftId(shift.id)}>
                              {t("view_shift")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ───── Diálogos ───── */}
      <ActivateDomiciliarioDialog
        open={Boolean(activateTarget)}
        onOpenChange={(open) => !open && setActivateTarget(null)}
        domiciliario={activateTarget}
        defaultBase={settings?.baseAmount ?? null}
        onConfirm={handleActivate}
        isPending={activateMutation.isPending}
      />

      <ShiftMovementDialog
        open={Boolean(movementTarget)}
        onOpenChange={(open) => !open && setMovementTarget(null)}
        kind={movementTarget?.kind ?? "extra-base"}
        shift={movementTarget?.shift ?? null}
        onConfirm={handleMovement}
        isPending={movementMutation.isPending || pickupMutation.isPending}
      />

      <CloseShiftDialog
        open={Boolean(closeTarget)}
        onOpenChange={(open) => !open && setCloseTarget(null)}
        shift={closeTarget}
        onConfirm={handleCloseShift}
        isPending={closeMutation.isPending}
      />

      <ShiftSettlementDialog
        open={Boolean(settlementShift)}
        onOpenChange={(open) => !open && setSettlementShift(null)}
        shift={settlementShift}
      />

      <ShiftDetailDialog
        open={Boolean(detailShiftId)}
        onOpenChange={(open) => !open && setDetailShiftId(null)}
        shiftId={detailShiftId}
        onExtraBase={(shift) => setMovementTarget({ kind: "extra-base", shift })}
        onPickup={(shift) => setMovementTarget({ kind: "pickup", shift })}
        onDeliverOrders={(shift) => {
          setOrdersShift(shift)
          setOrdersDialogOpen(true)
        }}
        onCloseShift={(shift) => setCloseTarget(shift)}
      />

      <ShiftOrdersDialog
        open={ordersDialogOpen}
        onOpenChange={setOrdersDialogOpen}
        branchId={branchId || null}
        shift={ordersShift}
        onDeliver={(order) => {
          setOrdersDialogOpen(false)
          setDeliverOrder(order)
        }}
      />

      <DeliverOrderDialog
        open={Boolean(deliverOrder)}
        onOpenChange={(open) => !open && setDeliverOrder(null)}
        order={deliverOrder}
        advanceMode={settings?.advanceMode ?? ADVANCE_MODE.Advance}
      />
    </div>
  )
}
