import { useEffect, useRef } from "react"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { api } from "@/config/axios-client"
import { playOrderChime } from "@/utils/order-chime"

/** Queries que muestran órdenes: se refrescan cuando llega o cambia una. */
export function invalidateOrderViews(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["orders"] }),
    qc.invalidateQueries({ queryKey: ["order-closing-preview"] }),
    qc.invalidateQueries({ queryKey: ["delivery-operations"] }),
    qc.invalidateQueries({ queryKey: ["delivery-runs"] }),
    qc.invalidateQueries({ queryKey: ["dashboard"] }),
  ])
}

/**
 * Long-poll de `GET /api/orders/updates?includeChanges=true`: cualquier orden
 * nueva o con cambios (webhook de Cluvi, otro usuario, domiciliario) refresca
 * las vistas abiertas. Con `chimeOnReady` suena cuando un pedido queda Listo.
 */
export function useOrderUpdates(branchId: string | null, { chimeOnReady = false }: { chimeOnReady?: boolean } = {}) {
  const qc = useQueryClient()
  const ready = useRef(new Set<string>())
  useEffect(() => {
    const controller = new AbortController()
    let cursor: string | undefined
    const loop = async () => {
      while (!controller.signal.aborted) {
        try {
          const result = await api.get<{
            data: { id: string; status: string; branchId: string | null }[]
            nowUtc: string
          }>("/api/orders/updates", {
            params: { sinceUtc: cursor, waitSeconds: 25, includeChanges: true },
            signal: controller.signal,
          })
          cursor = result.data.nowUtc
          let sound = false
          for (const order of result.data.data) {
            if (branchId && order.branchId !== branchId) continue
            if (order.status === "Ready" && !ready.current.has(order.id)) {
              ready.current.add(order.id)
              sound = true
            } else if (order.status !== "Ready") ready.current.delete(order.id)
          }
          if (sound && chimeOnReady) playOrderChime()
          if (result.data.data.length) await invalidateOrderViews(qc)
        } catch {
          if (controller.signal.aborted) return
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 8000)
            controller.signal.addEventListener(
              "abort",
              () => {
                window.clearTimeout(timer)
                resolve()
              },
              { once: true }
            )
          })
        }
      }
    }
    void loop()
    return () => controller.abort()
  }, [qc, branchId, chimeOnReady])
}
