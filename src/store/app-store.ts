import { create } from "zustand"
import { persist } from "zustand/middleware"
import i18n from "i18next"

import type { AuthSession } from "@/features/auth/types"
import type { OnboardingDraft } from "@/features/business/onboarding/types"

type ThemeMode = "light" | "dark" | "system"
type Locale = "es" | "en"

type AppState = {
  session: AuthSession | null
  theme: ThemeMode
  locale: Locale
  /**
   * Caché local de "este tenant ya hizo el onboarding", por tenantId.
   * Provisional hasta que el backend persista el estado en el tenant
   * (ver `features.onboardingStateApi`). Evita consultar sucursales en cada
   * arranque de sesión.
   */
  onboardingCompleted: Record<string, boolean>
  /** Borrador del wizard por tenant. Nunca contiene contraseñas. */
  onboardingDrafts: Record<string, OnboardingDraft>
  /**
   * Contraseña con la que el usuario acaba de iniciar sesión.
   * Solo en memoria (fuera de `partialize`), y solo para poder llamar a
   * `change-password`, que exige `currentPassword`. Se limpia al usarla,
   * al cerrar sesión y al recargar la página.
   */
  pendingPassword: string | null

  setSession: (session: AuthSession | null) => void
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: Locale) => void
  setAppLocale: (lang: Locale) => void
  setPendingPassword: (password: string | null) => void
  markOnboardingCompleted: (tenantId: string) => void
  resetOnboardingCompleted: (tenantId: string) => void
  setOnboardingDraft: (tenantId: string, draft: OnboardingDraft) => void
  clearOnboardingDraft: (tenantId: string) => void
  clearForcePasswordChange: () => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      theme: "system",
      locale: "es",
      onboardingCompleted: {},
      onboardingDrafts: {},
      pendingPassword: null,

      setSession: (session) => {
        set({ session })
      },

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => set({ locale }),

      setAppLocale: (lang: Locale) => {
        set({ locale: lang })
        i18n.changeLanguage(lang)
      },

      setPendingPassword: (password) => set({ pendingPassword: password }),

      markOnboardingCompleted: (tenantId) =>
        set((state) => ({
          onboardingCompleted: { ...state.onboardingCompleted, [tenantId]: true },
        })),

      resetOnboardingCompleted: (tenantId) =>
        set((state) => {
          const next = { ...state.onboardingCompleted }
          delete next[tenantId]
          return { onboardingCompleted: next }
        }),

      setOnboardingDraft: (tenantId, draft) =>
        set((state) => ({
          onboardingDrafts: { ...state.onboardingDrafts, [tenantId]: draft },
        })),

      clearOnboardingDraft: (tenantId) =>
        set((state) => {
          const next = { ...state.onboardingDrafts }
          delete next[tenantId]
          return { onboardingDrafts: next }
        }),

      clearForcePasswordChange: () =>
        set((state) => (state.session ? { session: { ...state.session, forcePasswordChange: false } } : {})),

      logout: () => {
        set({ session: null, pendingPassword: null })
      },
    }),
    {
      name: "pos-manager-storage",
      partialize: (state) => ({
        session: state.session,
        theme: state.theme,
        locale: state.locale,
        onboardingCompleted: state.onboardingCompleted,
        onboardingDrafts: state.onboardingDrafts,
      }),
    }
  )
)
