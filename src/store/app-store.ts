import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { LoginResponse } from "@/types/domain"

// tipo del estado de la aplicación
type AppState = {
  // Datos del usuario conectado (si no hay nadie, es null)
  session: LoginResponse | null
  setSession: (session: LoginResponse | null) => void

  // Aspecto visual de la aplicación: Claro, Oscuro o el del Sistema
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void

  // Función para cerrar la sesión por completo
  logout: () => void
}

// El "hook" de Zustand para el estado de la aplicación
export const useAppStore = create<AppState>()(
  // Con "persist" logramos que los datos no se borren al recargar la página (F5)
  persist(
    (set) => ({
      // Valores iniciales (Cómo arranca la app la primera vez)
      session: null,
      theme: "system",

      // Guarda los datos del usuario y asegura el token de acceso para las peticiones
      setSession: (session) => {
        set({ session })
      },

      // Cambia el modo visual (Claro / Oscuro)
      setTheme: (theme) => set({ theme }),

      // Limpia los datos de la app y del navegador al salir
      logout: () => {
        set({ session: null })
      },
    }),
    {
      // El nombre de la caja donde el navegador guardará estos datos en secreto
      name: "evolve-app-storage",

      // Le dice a la app que guarde únicamente la sesión y el tema visual
      partialize: (state) => ({ session: state.session, theme: state.theme }),
    }
  )
)
