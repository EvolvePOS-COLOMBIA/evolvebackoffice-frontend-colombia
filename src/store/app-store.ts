import { create } from "zustand"
import { persist } from "zustand/middleware"
import i18n from "i18next"

import type { AuthSession } from "@/features/auth/types"

type ThemeMode = "light" | "dark" | "system"
type Locale = "es" | "en"

type AppState = {
  session: AuthSession | null
  theme: ThemeMode
  locale: Locale
  setSession: (session: AuthSession | null) => void
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: Locale) => void
  setAppLocale: (lang: Locale) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      theme: "system",
      locale: "es",

      setSession: (session) => {
        set({ session })
      },

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => set({ locale }),

      setAppLocale: (lang: Locale) => {
        set({ locale: lang })
        i18n.changeLanguage(lang)
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
      }),
    }
  )
)
