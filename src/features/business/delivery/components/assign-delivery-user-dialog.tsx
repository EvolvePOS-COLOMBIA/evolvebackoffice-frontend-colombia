import { useMemo } from "react"
import { Bike } from "lucide-react"

import { OptionPickerDialog, type PickerOption } from "@/components/share/option-picker-dialog"
import { useTranslation } from "@/i18n/use-i18n"
import { useActiveDomiciliarios } from "../hooks/use-delivery"

export type AssignableOrder = {
  id: string
  /** Sucursal del pedido; la asignación solo admite una sucursal por operación. */
  branchId: string | null
}

type AssignDeliveryUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pedidos seleccionados (1 = asignación individual, N = asignación múltiple). */
  orders: AssignableOrder[]
  /** Devuelve el domiciliario elegido; quien llama hace la mutación. */
  onConfirm: (userId: string) => void
  isPending?: boolean
}

/**
 * Diálogo para elegir el domiciliario (con turno abierto) que llevará uno o
 * varios pedidos. Delgado sobre `OptionPickerDialog`: carga los domiciliarios
 * activos y valida que los pedidos seleccionados sean de una sola sucursal
 * (el endpoint bulk acepta un único `deliveryUserId`).
 *
 * Usado por la vista de órdenes (arrastre a «En camino» y asignación múltiple
 * desde la columna «Listo»).
 */
export function AssignDeliveryUserDialog({
  open,
  onOpenChange,
  orders,
  onConfirm,
  isPending = false,
}: AssignDeliveryUserDialogProps) {
  const { t } = useTranslation("business-delivery")
  const { data: domiciliarios = [], isLoading } = useActiveDomiciliarios(open)

  const branchIds = useMemo(() => Array.from(new Set(orders.map((o) => o.branchId ?? ""))), [orders])
  const singleBranch = branchIds.length === 1
  const branchId = singleBranch ? branchIds[0] : null

  const options: PickerOption[] = useMemo(() => {
    // Una sola sucursal por operación: el endpoint bulk acepta un único
    // domiciliario y su turno es de una sucursal.
    if (!singleBranch) return []
    return domiciliarios
      .filter((d) => d.status === "active" && (!branchId || d.branchId === branchId))
      .map((d) => ({
        value: d.userId,
        label: d.fullName,
        description: d.phoneNumber ?? undefined,
        badge: d.branchName ? { label: d.branchName, tone: "info" as const } : null,
        icon: Bike,
      }))
  }, [domiciliarios, branchId, singleBranch])

  return (
    <OptionPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("assign_title")}
      description={orders.length > 1 ? t("assign_desc_many", { count: orders.length }) : t("assign_desc_one")}
      options={options}
      loading={isLoading}
      emptyMessage={singleBranch ? t("assign_empty") : t("assign_multi_branch")}
      confirmLabel={t("assign_confirm")}
      onConfirm={onConfirm}
      isPending={isPending}
    />
  )
}
