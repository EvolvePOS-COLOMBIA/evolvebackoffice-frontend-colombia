import { useMutation } from "@tanstack/react-query"

import { useAppStore } from "@/store/app-store"
import { changeOwnPassword } from "@/features/auth/services/auth.service"

/**
 * Hook para cambiar la contraseña del usuario autenticado.
 * Usa POST /api/Auth/change-password que requiere currentPassword y newPassword.
 *
 * Al cambiarse exitosamente:
 * 1. Limpia forcePasswordChange de la sesión
 * 2. Limpia pendingPassword (ya no se necesita)
 */
export function useChangePassword() {
  const clearForcePasswordChange = useAppStore((state) => state.clearForcePasswordChange)
  const setPendingPassword = useAppStore((state) => state.setPendingPassword)

  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      await changeOwnPassword(payload)
    },
    onSuccess: () => {
      clearForcePasswordChange()
      setPendingPassword(null)
    },
  })
}
