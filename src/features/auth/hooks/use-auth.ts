import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { loginBusinessAdmin, loginPlatformAdmin } from "@/features/auth/services/auth.service"
import type { AppRole, AppSession, BusinessLoginFormValues, PlatformLoginFormValues } from "@/features/auth/types"
import { useAppStore } from "@/store/app-store"

/**
 * Custom Hook: useAuth
 * Actúa como Fachada (Facade Pattern) centralizando la infraestructura de autenticación.
 * Aísla la UI de los detalles de implementación de Zustand, React Query y el Router.
 */
export function useAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const session = useAppStore((state) => state.session)
  const activeTenant = useAppStore((state) => state.activeTenant)
  const platformClients = useAppStore((state) => state.platformClients)
  const setActiveTenant = useAppStore((state) => state.setActiveTenant)
  const setSession = useAppStore((state) => state.setSession)
  const storeLogout = useAppStore((state) => state.logout)

  const token = session?.accessToken
  const role = session?.user.role
  const isPlatformAdmin = role === "PlatformAdmin"
  const isBusinessAdmin = role === "BusinessAdmin"
  const managedTenantIds = session?.managedTenantIds ?? []
  const availableTenants = platformClients.filter((client) => managedTenantIds.includes(client.id))
  const currentTenant = availableTenants.find((client) => client.id === activeTenant) ?? availableTenants[0] ?? null

  const platformLoginMutation = useMutation({
    mutationFn: (payload: PlatformLoginFormValues) => loginPlatformAdmin(payload),
  })

  interface LoginOptions {
    onSuccess?: (sessionData: AppSession) => void
    onError?: (error: unknown) => void
  }

  const businessLoginMutation = useMutation({
    mutationFn: (payload: BusinessLoginFormValues) => loginBusinessAdmin(payload, platformClients),
  })

  const handlePlatformLogin = (payload: PlatformLoginFormValues, options?: LoginOptions) => {
    platformLoginMutation.mutate(payload, {
      onSuccess: (sessionData) => {
        setSession(sessionData)
        queryClient.setQueryData(["authSession"], sessionData)
        options?.onSuccess?.(sessionData)
      },
      onError: (error) => {
        options?.onError?.(error)
      },
    })
  }

  const handleBusinessLogin = (payload: BusinessLoginFormValues, options?: LoginOptions) => {
    businessLoginMutation.mutate(payload, {
      onSuccess: (sessionData) => {
        setSession(sessionData)
        queryClient.setQueryData(["authSession"], sessionData)
        options?.onSuccess?.(sessionData)
      },
      onError: (error) => {
        options?.onError?.(error)
      },
    })
  }

  const logout = () => {
    storeLogout()
    queryClient.clear()
    navigate("/login")
  }

  const defaultRoute = getDefaultRoute(role)

  return {
    session,
    activeTenant,
    currentTenant,
    availableTenants,
    isAuthenticated: Boolean(token && session),
    isPlatformAdmin,
    isBusinessAdmin,
    defaultRoute,
    hasRole: (allowedRoles: AppRole[]) => (role ? allowedRoles.includes(role) : false),
    loginPlatform: handlePlatformLogin,
    loginBusiness: handleBusinessLogin,
    setActiveTenant,
    isLogging: platformLoginMutation.isPending || businessLoginMutation.isPending,
    isLoginError: platformLoginMutation.isError || businessLoginMutation.isError,
    logout,
  }
}

function getDefaultRoute(role?: AppRole) {
  if (role === "PlatformAdmin") {
    return "/platform/dashboard"
  }

  if (role === "BusinessAdmin") {
    return "/business/dashboard"
  }

  return "/login"
}
