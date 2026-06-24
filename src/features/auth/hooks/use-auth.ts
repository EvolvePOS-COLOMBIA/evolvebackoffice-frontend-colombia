import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/store/app-store"
import { login, type LoginRequest } from "@/features/auth/services/auth.service"
import { useNavigate } from "react-router-dom"
import type { LoginResponse } from "@/types/domain"

/**
 * Custom Hook: useAuth
 * Actúa como Fachada (Facade Pattern) centralizando la infraestructura de autenticación.
 * Aísla la UI de los detalles de implementación de Zustand, React Query y el Router.
 */
export function useAuth() {
  // 1. Instanciación de Hooks de Infraestructura
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 2. Selectores Atómicos de Zustand (Evitan re-renders innecesarios en la UI)
  const session = useAppStore((state) => state.session)
  const setSession = useAppStore((state) => state.setSession)
  const storeLogout = useAppStore((state) => state.logout)

  // Estado derivado en memoria RAM
  const token = session?.accessToken
  const isUserRole = session?.user.role === "user"

  /**
   * Operación de Escritura en Servidor (Mutación)
   * Gestiona el flujo asíncrono y side-effects del inicio de sesión.
   */
  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
  })

  // 3. Tipos de Opciones de Inicio de Sesión
  // Define las funciones de callback para el éxito y el error de inicio de sesión.
  interface LoginOptions {
    onSuccess?: (sessionData: LoginResponse) => void
    onError?: (error: unknown) => void
  }

  const handleLogin = (payload: LoginRequest, options?: LoginOptions) => {
    loginMutation.mutate(payload, {
      onSuccess: (sessionData) => {
        options?.onSuccess?.(sessionData)
        // Persist the session after the caller-specific side effects run.
        setSession(sessionData)
        queryClient.setQueryData(["authSession"], sessionData)
      },
      onError: (error) => {
        options?.onError?.(error)
      },
    })
  }

  /**
   * Orquestador de Cierre de Sesión
   * Garantiza la limpieza absoluta del entorno de ejecución (Seguridad multi-usuario).
   */
  const logout = () => {
    storeLogout() // Evacúa el estado del cliente y LocalStorage
    queryClient.clear() // Destruye la caché de React Query para evitar fugas de información
    navigate("/login") // Despacha la redirección de inicio de sesión
  }

  //  expuesto a los componentes de la UI
  return {
    session,
    isAuthenticated: Boolean(token && session), // Booleano derivado reactivo
    isUserRole,
    login: handleLogin,
    isLogging: loginMutation.isPending, // Flags semánticos mapeados para legibilidad
    isLoginError: loginMutation.isError,
    logout,
  }
}
