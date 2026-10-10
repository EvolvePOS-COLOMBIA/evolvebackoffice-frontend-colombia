import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useTranslation } from "@/i18n/use-i18n"
import type { DeliveryOrder } from "../types/delivery"
import type { DeliveryZone } from "../types/enhancements"

interface Props {
  orders?: DeliveryOrder[]
  zones?: DeliveryZone[]
  onPick?: (lat: number, lon: number) => void
}
const emptyOrders: DeliveryOrder[] = []
const emptyZones: DeliveryZone[] = []
export function DeliveryMap({ orders = emptyOrders, zones = emptyZones, onPick }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation("business-orders")
  useEffect(() => {
    if (!container.current) return
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([4.61, -74.08], 12)
    L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      referrerPolicy: "strict-origin-when-cross-origin",
      attribution:
        import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    const bounds = L.latLngBounds([])
    for (const zone of zones.filter((z) => z.isActive)) {
      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radiusMeters,
        color: "#7c3aed",
        weight: 1,
      })
      const text = document.createElement("span")
      text.textContent = `${zone.name} · ${zone.shippingCost}`
      circle.bindTooltip(text).addTo(map)
      bounds.extend(circle.getBounds())
    }
    const grouped = new Map<
      string,
      { orders: { order: DeliveryOrder; position: number }[]; latitude: number; longitude: number }
    >()
    for (const [index, order] of orders.entries()) {
      if (
        order.shippingLatitude == null ||
        order.shippingLongitude == null ||
        !Number.isFinite(order.shippingLatitude) ||
        !Number.isFinite(order.shippingLongitude) ||
        Math.abs(order.shippingLatitude) > 90 ||
        Math.abs(order.shippingLongitude) > 180
      )
        continue
      const key = `${order.shippingLatitude},${order.shippingLongitude}`
      const entry = grouped.get(key) ?? {
        orders: [],
        latitude: order.shippingLatitude,
        longitude: order.shippingLongitude,
      }
      entry.orders.push({ order, position: index + 1 })
      grouped.set(key, entry)
    }
    for (const entry of grouped.values()) {
      const popup = document.createElement("div")
      for (const item of entry.orders) {
        const row = document.createElement("p")
        row.textContent = `${item.position}. #${item.order.reference} · ${item.order.shippingStreet ?? ""}`
        popup.appendChild(row)
      }
      const label = document.createElement("span")
      label.textContent = entry.orders.map((item) => item.position).join(", ")
      L.circleMarker([entry.latitude, entry.longitude], {
        radius: 9,
        color: entry.orders.some((item) => item.order.status === "Ready") ? "#d97706" : "#2563eb",
        fillOpacity: 0.85,
      })
        .bindTooltip(label, { permanent: true, direction: "top" })
        .bindPopup(popup)
        .addTo(map)
      bounds.extend([entry.latitude, entry.longitude])
    }
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.15), { maxZoom: 15, animate: false })
    if (onPick)
      map.on("click", (e: L.LeafletMouseEvent) =>
        onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)))
      )
    const resize = new ResizeObserver(() => map.invalidateSize())
    resize.observe(container.current)
    return () => {
      resize.disconnect()
      map.remove()
    }
  }, [orders, zones, onPick])
  const missing = orders.filter((o) => o.shippingLatitude == null || o.shippingLongitude == null).length
  return (
    <section className="space-y-2">
      <div
        ref={container}
        role="region"
        aria-label={t("e_map")}
        className="relative z-0 h-80 w-full rounded-lg border"
      />
      {missing > 0 && <p className="text-sm text-amber-700">{t("e_no_coordinates", { count: missing })}</p>}
      {onPick && <p className="text-xs text-muted-foreground">{t("e_map_pick")}</p>}
    </section>
  )
}
