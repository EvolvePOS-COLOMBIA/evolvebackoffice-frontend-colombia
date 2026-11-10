import { useQuery } from "@tanstack/react-query"

import { getAuthLoginConfig } from "@/features/auth/services/auth.service"

/**
 * Config pública de login: consumida por el formulario de acceso para ocultar
 * la pestaña de plataforma cuando el host actual no es el autorizado
 * (`PLATFORM_ADMIN_HOST` en el backend). Sin restricción (null) → visible.
 */
export function useAuthLoginConfig() {
  return useQuery({
    queryKey: ["auth-login-config"],
    queryFn: getAuthLoginConfig,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
