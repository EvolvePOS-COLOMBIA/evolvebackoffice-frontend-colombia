import { queryClient } from "@/config/react-query"
import { notify } from "@/hooks/use-notify"
import i18n from "@/i18n"
import { useAppStore } from "@/store/app-store"

/**
 * Ends the current session exactly once: shows the "session expired" toast,
 * clears the store session (ProtectedRoute then redirects to /login on its own)
 * and drops the React Query cache, mirroring `useAuth().logout`.
 *
 * Safe to call from parallel sources (the expiry timer and concurrent 401
 * responses): it is a no-op when there is no session, so only the first call
 * ever notifies and logs out.
 */
export function expireSession() {
  if (!useAppStore.getState().session) {
    return
  }

  const t = i18n.getFixedT(null, "auth")
  notify.info(t("session_expired"))
  useAppStore.getState().logout()
  queryClient.clear()
}
