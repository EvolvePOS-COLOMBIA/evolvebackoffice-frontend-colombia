import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

import { useTranslation } from "@/i18n/use-i18n"
import { getItems } from "../../catalog/services/items.service"
import {
  assignItemTaxRates,
  createTaxRate,
  getItemTaxRates,
  getTaxRateDefaults,
  getTaxRates,
  removeItemTaxRate,
  setTaxRateActive,
  updateTaxRate,
} from "../services/tax-rates.service"
import type { CreateTaxRateDto, UpdateTaxRateDto } from "../types"

export const taxRatesKeys = {
  all: ["tax-rates"] as const,
  list: (page: number, pageSize: number) => ["tax-rates", "list", page, pageSize] as const,
  defaults: ["tax-rates", "defaults"] as const,
  item: (itemId: string, branchId?: string) => ["tax-rates", "item", itemId, branchId ?? "global"] as const,
}

/** Listado paginado de tasas de impuesto (incluye inactivas). */
export function useTaxRates(page = 1, pageSize = 200) {
  return useQuery({
    queryKey: taxRatesKeys.list(page, pageSize),
    queryFn: () => getTaxRates(page, pageSize),
  })
}

/** Tasas de impuesto "por defecto" (activas), para dropdowns. */
export function useTaxRateDefaults() {
  return useQuery({
    queryKey: taxRatesKeys.defaults,
    queryFn: getTaxRateDefaults,
  })
}

/** Ítems del catálogo global para el selector de la pestaña de asignación. */
export function useItemsForTaxAssignment() {
  return useQuery({
    queryKey: ["items", "tax-assignment"],
    queryFn: () => getItems({ pageNumber: 1, pageSize: 200 }),
  })
}

export function useCreateTaxRate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-taxes")

  return useMutation({
    mutationFn: (payload: CreateTaxRateDto) => createTaxRate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRatesKeys.all })
      toast.success(t("success_created"))
    },
    onError: () => {
      toast.error(t("error_create"))
    },
  })
}

export function useUpdateTaxRate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-taxes")

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaxRateDto }) => updateTaxRate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRatesKeys.all })
      toast.success(t("success_updated"))
    },
    onError: () => {
      toast.error(t("error_update"))
    },
  })
}

export function useSetTaxRateActive() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-taxes")

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setTaxRateActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRatesKeys.all })
      toast.success(t("success_status"))
    },
    onError: () => {
      toast.error(t("error_status"))
    },
  })
}

/** Impuestos asignados a un item, globalmente o en el ámbito de una sucursal (?branchId). */
export function useItemTaxRates(itemId?: string, branchId?: string) {
  return useQuery({
    queryKey: taxRatesKeys.item(itemId ?? "", branchId),
    queryFn: () => getItemTaxRates(itemId as string, branchId),
    enabled: Boolean(itemId),
  })
}

/**
 * Agrega impuestos a un item. El backend solo suma las tasas enviadas,
 * por eso las bajas se ejecutan con `useRemoveItemTaxRate`.
 */
export function useAssignItemTaxRates() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-taxes")

  return useMutation({
    mutationFn: ({ itemId, taxRateIds, branchId }: { itemId: string; taxRateIds: string[]; branchId?: string }) =>
      assignItemTaxRates(itemId, taxRateIds, branchId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taxRatesKeys.all })
      queryClient.invalidateQueries({ queryKey: ["items"] })
      if (variables.branchId) queryClient.invalidateQueries({ queryKey: ["branch-items"] })
    },
    onError: () => {
      toast.error(t("toast_assignment_error"))
    },
  })
}

/** Quita un impuesto específico de un item. */
export function useRemoveItemTaxRate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-taxes")

  return useMutation({
    mutationFn: ({ itemId, taxRateId, branchId }: { itemId: string; taxRateId: string; branchId?: string }) =>
      removeItemTaxRate(itemId, taxRateId, branchId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taxRatesKeys.all })
      queryClient.invalidateQueries({ queryKey: ["items"] })
      if (variables.branchId) queryClient.invalidateQueries({ queryKey: ["branch-items"] })
    },
    onError: () => {
      toast.error(t("toast_assignment_error"))
    },
  })
}
