import { useEffect } from "react"

import { expireSession } from "@/features/auth/services/session-expiry"
import { useAppStore } from "@/store/app-store"

// setTimeout takes a 32-bit signed integer (~24.8 days). Longer deadlines must
// be re-armed in chunks, otherwise the delay overflows and fires immediately.
// This matters because expiresAtUtc falls back to the refresh-token lifetime,
// which can exceed the limit.
const MAX_TIMEOUT_DELAY = 2_147_483_647

/**
 * Ends the session the moment `session.expiresAtUtc` passes, without waiting
 * for a navigation or a new network request: an interval-style re-armed timer
 * plus a visibilitychange listener (background tabs throttle timers, so the
 * deadline can fire minutes late).
 */
export function useSessionExpiry() {
  const expiresAtUtc = useAppStore((state) => state.session?.expiresAtUtc)

  useEffect(() => {
    if (!expiresAtUtc) {
      return
    }

    const target = new Date(expiresAtUtc).getTime()
    if (!Number.isFinite(target)) {
      return
    }

    // Already expired at (re)evaluation time: end the session right away.
    if (target <= Date.now()) {
      expireSession()
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined

    const arm = () => {
      const remaining = target - Date.now()

      if (remaining <= 0) {
        expireSession()
        return
      }

      timer = setTimeout(arm, Math.min(remaining, MAX_TIMEOUT_DELAY))
    }

    arm()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && target <= Date.now()) {
        expireSession()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [expiresAtUtc])
}
