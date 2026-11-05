import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { BellRing } from "lucide-react"

import { fetchNewOrders } from "../services/orders.service"
import type { NewOrderNotice } from "../types/api"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { playOrderChime } from "@/utils/order-chime"

const ORDERS_ROUTE = "/business/orders"
const RETRY_DELAY_MS = 8_000

function prettyPlatform(code: string): string {
  const upper = code.toUpperCase()
  if (upper === "CLUVI") return "Cluvi"
  if (upper === "WOOCOMMERCE") return "WooCommerce"
  if (upper === "MANUAL" || upper === "POSCO") return "Manual"
  return code
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * Escucha en tiempo real la llegada de órdenes nuevas (Cluvi, WooCommerce o
 * manuales) mediante long-poll contra `GET /api/orders/updates`:
 *
 * - **Sonido** (ding-dong Web Audio) siempre que llega una orden.
 * - **Toast dentro de la página** → clic navega a `/business/orders`.
 * - **Notificación de escritorio** cuando la pestaña está minimizada/oculta
 *   (si el permiso fue concedido; se solicita al montar).
 *
 * El cursor parte de "ahora" para no disparar notificaciones por órdenes
 * históricas, y avanza con el `nowUtc` de cada respuesta (semántica sin
 * pérdida ni duplicados definida en el backend). En error se reintenta con
 * backoff; al desmontar se aborta la petición en vuelo.
 */
export function useNewOrderNotifications(enabled: boolean): void {
  const navigate = useNavigate()
  const { t } = useTranslation("business-orders")

  // Establecer en refs para no reiniciar el loop por cambios de identidad.
  const navigateRef = useRef(navigate)
  const tRef = useRef(t)
  useEffect(() => {
    navigateRef.current = navigate
    tRef.current = t
  }, [navigate, t])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const controller = new AbortController()
    let cursor = new Date().toISOString()

    // Permiso de escritorio: una sola petición mientras sea "default".
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined)
    }

    const handleOrders = (orders: NewOrderNotice[]) => {
      const platforms = [...new Set(orders.map((o) => prettyPlatform(o.platformCode)))].join(", ")
      const tt = tRef.current

      playOrderChime()

      // Toast visual dentro de la página: clic → secciones de órdenes.
      notify.custom(
        (toastItem) => (
          <button
            type="button"
            onClick={() => {
              notify.dismiss(toastItem.id)
              navigateRef.current(ORDERS_ROUTE)
            }}
            className="group flex w-full max-w-sm items-start gap-3 rounded-2xl border border-primary/30 bg-background px-4 py-3 text-left shadow-lg transition-colors hover:bg-accent"
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <BellRing className="size-4 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {tt("new_order_toast", { count: orders.length, platform: platforms })}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{tt("new_order_open_orders")}</span>
            </span>
          </button>
        ),
        { duration: 10_000 }
      )

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const desktop = new Notification(tt("new_order_desktop_title"), {
            body: tt("new_order_desktop_body", { platform: platforms }),
            tag: "new-order",
          })
          desktop.onclick = () => {
            window.focus()
            desktop.close()
            navigateRef.current(ORDERS_ROUTE)
          }
        } catch {
          // Algunos navegores exigen una acción de usuario previa: el toast
          // y el sonido siguen siendo la vía principal.
        }
      }
    }

    const loop = async () => {
      while (!cancelled) {
        try {
          const result = await fetchNewOrders(cursor, controller.signal)
          if (cancelled) return
          cursor = result.nowUtc
          if (result.data.length > 0) handleOrders(result.data)
        } catch {
          if (cancelled || controller.signal.aborted) return
          // Error de red,401 por sesión vencida, etc. → backoff y reintento.
          await sleep(RETRY_DELAY_MS)
        }
      }
    }

    void loop()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [enabled])
}
