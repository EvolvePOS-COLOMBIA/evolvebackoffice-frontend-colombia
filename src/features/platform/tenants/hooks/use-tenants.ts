import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getTenants,
  createTenant,
  updateTenant,
  activateTenant,
  deactivateTenant,
  deleteTenant,
} from "@/features/platform/tenants/services/tenant.service"
import type { CreateTenantDto, UpdateTenantDto } from "@/features/platform/tenants/types/api"
import type { TenantFormValues } from "@/features/platform/tenants/types"

function toCreateDto(values: TenantFormValues): CreateTenantDto {
  return {
    name: values.name,
    contactEmail: values.contactEmail,
    phone: values.phone || null,
    address: values.address || null,
    maxRegisters: values.maxRegisters,
  }
}

function toUpdateDto(values: TenantFormValues): UpdateTenantDto {
  return {
    name: values.name,
    contactEmail: values.contactEmail,
    phone: values.phone || null,
    address: values.address || null,
  }
}

export function useTenants(page: number, pageSize: number) {
  return useQuery({
    queryKey: ["tenants", page, pageSize],
    queryFn: () => getTenants(page, pageSize),
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TenantFormValues) => createTenant(toCreateDto(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TenantFormValues }) =>
      updateTenant(id, toUpdateDto(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useActivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
    },
  })
}
