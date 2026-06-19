import { useMemo, useSyncExternalStore } from "react"
import { Toaster, type ToastOptions } from "react-hot-toast"

import { useAppStore } from "@/store/app-store"

type ResolvedTheme = "light" | "dark"
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light"
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
  mediaQuery.addEventListener("change", onStoreChange)

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange)
  }
}

export function AppToaster() {
  const theme = useAppStore((state) => state.theme)
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, () => "light")
  const resolvedTheme = theme === "system" ? systemTheme : theme

  const toastOptions = useMemo<ToastOptions>(
    () => ({
      style: {
        background: "var(--card)",
        color: "var(--card-foreground)",
        border: "1px solid var(--border)",
        borderRadius: "calc(var(--radius) * 1.4)",
        boxShadow: resolvedTheme === "dark" ? "0 20px 50px rgba(0, 0, 0, 0.35)" : "0 16px 40px rgba(15, 23, 42, 0.12)",
        padding: "14px 16px",
        fontSize: "0.925rem",
        maxWidth: "420px",
      },
      success: {
        iconTheme: {
          primary: "var(--primary)",
          secondary: "var(--primary-foreground)",
        },
      },
      error: {
        iconTheme: {
          primary: "var(--destructive)",
          secondary: "var(--card)",
        },
      },
      info: {
        iconTheme: {
          primary: "var(--info)",
          secondary: "var(--info-foreground)",
        },
      },
      loading: {
        iconTheme: {
          primary: "var(--primary)",
          secondary: "var(--card)",
        },
      },
    }),
    [resolvedTheme]
  )

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerStyle={{
        top: 20,
        right: 20,
        left: 20,
      }}
      toastOptions={toastOptions}
    />
  )
}
