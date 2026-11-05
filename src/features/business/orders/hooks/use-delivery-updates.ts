import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/config/axios-client"
import { playOrderChime } from "@/utils/order-chime"

export function useDeliveryUpdates(branchId: string | null) {
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
          if (sound) playOrderChime()
          if (result.data.data.length) {
            await qc.invalidateQueries({ queryKey: ["orders", "deliveries"] })
            await qc.invalidateQueries({ queryKey: ["delivery-operations"] })
            await qc.invalidateQueries({ queryKey: ["delivery-runs"] })
          }
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
  }, [qc, branchId])
}
