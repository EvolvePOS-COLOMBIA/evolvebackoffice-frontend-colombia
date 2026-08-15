import { create } from "zustand"
import { persist } from "zustand/middleware"
import i18n from "i18next"

import { defaultTenantClients } from "@/features/platform/clients/data/default-clients"
import type { TenantClient } from "@/features/platform/clients/types"
import type { AppSession } from "@/features/auth/types"

type ThemeMode = "light" | "dark" | "system"
type Locale = "es" | "en"

type AppState = {
  session: AppSession | null
  theme: ThemeMode
  locale: Locale
  activeTenant: string | null
  platformClients: TenantClient[]
  setSession: (session: AppSession | null) => void
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: Locale) => void
  setAppLocale: (lang: Locale) => void
  setActiveTenant: (tenantId: string) => void
  savePlatformClient: (client: TenantClient) => void
  deletePlatformClient: (clientId: string) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      theme: "system",
      locale: "es",
      activeTenant: null,
      platformClients: defaultTenantClients,

      setSession: (session) => {
        const normalizedSession: AppSession | null = session
          ? {
              ...session,
              managedTenantIds: session.managedTenantIds ?? [],
            }
          : null

        const availableTenantIds = normalizedSession?.managedTenantIds ?? []
        const currentActiveTenant = get().activeTenant
        const nextActiveTenant =
          normalizedSession?.user.role === "BusinessAdmin"
            ? availableTenantIds.includes(currentActiveTenant ?? "")
              ? currentActiveTenant
              : (availableTenantIds[0] ?? null)
            : null

        set({
          session: normalizedSession,
          activeTenant: nextActiveTenant,
        })
      },

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => set({ locale }),

      setAppLocale: (lang: Locale) => {
        set({ locale: lang })
        i18n.changeLanguage(lang)
      },

      setActiveTenant: (tenantId) => {
        const session = get().session
        const managedTenantIds = session?.managedTenantIds ?? []

        if (session?.user.role !== "BusinessAdmin") {
          return
        }

        if (!managedTenantIds.includes(tenantId)) {
          return
        }

        set({ activeTenant: tenantId })
      },

      savePlatformClient: (client) => {
        const platformClients = get().platformClients
        const existingIndex = platformClients.findIndex((item) => item.id === client.id)

        if (existingIndex === -1) {
          set({ platformClients: [client, ...platformClients] })
          return
        }

        const updatedClients = [...platformClients]
        updatedClients[existingIndex] = client
        set({ platformClients: updatedClients })
      },

      deletePlatformClient: (clientId) => {
        const filteredClients = get().platformClients.filter((client) => client.id !== clientId)
        const activeTenant = get().activeTenant
        const session = get().session
        const managedTenantIds = session?.managedTenantIds ?? []

        const fallbackTenant =
          session?.user.role === "BusinessAdmin"
            ? (managedTenantIds.find((tenantId) => tenantId !== clientId) ?? null)
            : null

        set({
          platformClients: filteredClients,
          activeTenant: activeTenant === clientId ? fallbackTenant : activeTenant,
        })
      },

      logout: () => {
        set({ session: null, activeTenant: null })
      },
    }),
    {
      name: "pos-manager-storage",
      partialize: (state) => ({
        session: state.session,
        theme: state.theme,
        locale: state.locale,
        activeTenant: state.activeTenant,
        platformClients: state.platformClients,
      }),
    }
  )
)
