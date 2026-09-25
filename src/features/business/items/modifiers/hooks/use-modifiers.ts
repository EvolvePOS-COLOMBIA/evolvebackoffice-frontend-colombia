import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

import { useTranslation } from "@/i18n/use-i18n"
import {
  createItemModifier,
  createModifierGroup,
  deleteItemModifier,
  deleteModifierGroup,
  getItemsForPicker,
  getItemModifiers,
  getModifierGroups,
  updateItemModifier,
  updateModifierGroup,
} from "../services/modifiers.service"
import type {
  CreateItemModifierDto,
  CreateModifierGroupDto,
  UpdateItemModifierDto,
  UpdateModifierGroupDto,
} from "../types"

/** Fábrica de claves de react-query del módulo de modificadores. */
export const modifierKeys = {
  all: ["item-modifiers"] as const,
  groups: ["item-modifiers", "groups"] as const,
  itemModifiers: (parentItemId: string, branchId?: string) =>
    ["item-modifiers", "by-item", parentItemId, branchId ?? "global"] as const,
  pickerItems: ["item-modifiers", "picker-items"] as const,
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** Grupos de modificadores (para tablas y dropdowns). */
export function useModifierGroups() {
  return useQuery({
    queryKey: modifierKeys.groups,
    queryFn: getModifierGroups,
  })
}

/** Artículos para el selector de producto (hijos y padre). */
export function useItemsForPicker() {
  return useQuery({
    queryKey: modifierKeys.pickerItems,
    queryFn: getItemsForPicker,
  })
}

/** Modificadores de un producto padre, global o en el ámbito de una sucursal (?branchId). */
export function useItemModifiers(parentItemId?: string, branchId?: string) {
  const enabled = Boolean(parentItemId)
  return useQuery({
    queryKey: modifierKeys.itemModifiers(parentItemId ?? "", branchId),
    queryFn: () => getItemModifiers(parentItemId as string, branchId),
    enabled,
  })
}

// ─── Grupos: mutaciones ─────────────────────────────────────────────────────

export function useCreateModifierGroup() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-modifiers")

  return useMutation({
    mutationFn: (payload: CreateModifierGroupDto) => createModifierGroup(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.groups })
      toast.success(t("toast_group_created", { name: created.name }))
    },
    onError: () => {
      toast.error(t("toast_error_create"))
    },
  })
}

export function useUpdateModifierGroup() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-modifiers")

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModifierGroupDto }) => updateModifierGroup(id, payload),
    onSuccess: (_data, variables) => {
      // El nombre del grupo aparece en las tablas de modificadores: refrescar todo.
      queryClient.invalidateQueries({ queryKey: modifierKeys.all })
      toast.success(t("toast_group_updated", { name: variables.payload.name }))
    },
    onError: () => {
      toast.error(t("toast_error_update"))
    },
  })
}

export function useDeleteModifierGroup() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-modifiers")

  return useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => deleteModifierGroup(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.all })
      toast.success(t("toast_group_deleted", { name: variables.name }))
    },
    onError: () => {
      toast.error(t("toast_error_delete"))
    },
  })
}

// ─── Modificadores: mutaciones ──────────────────────────────────────────────

export function useCreateItemModifier(branchId?: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-modifiers")

  return useMutation({
    mutationFn: (payload: CreateItemModifierDto) => createItemModifier(payload, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.all })
      if (branchId) queryClient.invalidateQueries({ queryKey: ["branch-items"] })
      toast.success(t("toast_modifier_created"))
    },
    onError: () => {
      toast.error(t("toast_error_create"))
    },
  })
}

export function useUpdateItemModifier() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-modifiers")

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemModifierDto; parentItemId?: string }) =>
      updateItemModifier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.all })
      queryClient.invalidateQueries({ queryKey: ["branch-items"] })
      toast.success(t("toast_modifier_updated"))
    },
    onError: () => {
      toast.error(t("toast_error_update"))
    },
  })
}

export function useDeleteItemModifier() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("business-items-modifiers")

  return useMutation({
    mutationFn: ({ id }: { id: string; parentItemId?: string }) => deleteItemModifier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.all })
      queryClient.invalidateQueries({ queryKey: ["branch-items"] })
      toast.success(t("toast_modifier_deleted"))
    },
    onError: () => {
      toast.error(t("toast_error_delete"))
    },
  })
}
