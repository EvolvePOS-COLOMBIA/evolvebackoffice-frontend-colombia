import { Building2, ClipboardCheck, Package, ShoppingCart, Truck, type LucideIcon } from "lucide-react"

import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

const inventoryLinks: ItemCardLink[] = [
  {
    name: "Suppliers",
    label: "Manage contact information, price agreements, and terms for all product providers.",
    icon: Truck,
  },
  {
    name: "Purchase Orders",
    label: "Create, track, and manage incoming orders to replenish stock and control costs.",
    icon: ShoppingCart,
  },
  {
    name: "Physical Inventory",
    label: "Perform actual stock counts and reconcile discrepancies between the system and physical goods.",
    icon: ClipboardCheck,
  },
]

export function InventoryPage() {
  return (
    <HubPageLayout
      badge="Inventory"
      title="Stock Control"
      description="Track every unit that enters or leaves your store. Monitor stock levels, manage suppliers, and keep costs under control."
      icon={Building2}
      iconClass={"-rotate-20 md:-top-10 md:-right-10 md:size-70 lg:-top-25 lg:-right-35 lg:size-100"}
    >
      {inventoryLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
