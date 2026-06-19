import { useEffect } from "react"
import { useAppStore } from "@/store/app-store"

export function useThemeManager() {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  // Cambia las clases en el HTML según el tema seleccionado
  useEffect(() => {
    const root = window.document.documentElement

    const resolvedTheme =
      theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme

    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
  }, [theme])

  // Activa el atajo de teclado con la tecla 'd'
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return
      }

      if (event.key.toLowerCase() === "d") {
        const root = window.document.documentElement
        const isCurrentlyDark = root.classList.contains("dark")

        setTheme(isCurrentlyDark ? "light" : "dark")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setTheme])
}
