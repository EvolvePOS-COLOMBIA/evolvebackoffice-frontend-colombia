import { AppRoutes } from "@/routes/app-routes"
import { useThemeManager } from "./hooks/use-theme-manager"

export default function App() {
  // Inicializa el controlador del tema visual y sus atajos de teclado
  useThemeManager()

  return <AppRoutes />
}
