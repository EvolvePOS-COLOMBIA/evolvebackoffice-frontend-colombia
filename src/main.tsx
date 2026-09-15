import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"

import { AppToaster } from "@/components/ui/app-toaster"
import { I18nProvider } from "@/i18n/I18nProvider"
import "./index.css"
import "@/i18n"
import App from "./App.tsx"
import { queryClient } from "@/config/react-query"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <App />
        <AppToaster />
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>
)
