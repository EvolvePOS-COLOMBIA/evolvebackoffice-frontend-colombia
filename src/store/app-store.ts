import { create } from "zustand"
import { persist } from "zustand/middleware"
import i18n from "i18next"

import { defaultTenantClients } from "@/features/platform/clients/data/default-clients"
import type { TenantClient } from "@/features/platform/clients/types"
import type { AuthSession } from "@/features/auth/types"

type ThemeMode = "light" | "dark" | "system"
type Locale = "es" | "en"

type AppState = {
  session: AuthSession | null
  theme: ThemeMode
  locale: Locale
  platformClients: TenantClient[]
  setSession: (session: AuthSession | null) => void
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: Locale) => void
  setAppLocale: (lang: Locale) => void
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
      platformClients: defaultTenantClients,

      setSession: (session) => {
        set({ session })
      },

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => set({ locale }),

      setAppLocale: (lang: Locale) => {
        set({ locale: lang })
        i18n.changeLanguage(lang)
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
        set({ platformClients: filteredClients })
      },

      logout: () => {
        set({ session: null })
      },
    }),
    {
      name: "pos-manager-storage",
      partialize: (state) => ({
        session: state.session,
        theme: state.theme,
        locale: state.locale,
        platformClients: state.platformClients,
      }),
    }
  )
)
