import {
  Building2,
  ClipboardList,
  Clock,
  Package,
  Pencil,
  Receipt,
  SwatchBook,
  Tag,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

const itemLinks: ItemCardLink[] = [
  {
    name: "Product Catalog",
    label: "Browse, search, and manage every product in your store.",
    icon: ClipboardList,
  },
  {
    name: "Departments",
    label: "Group your products into departments and sub-departments for cleaner reporting.",
    icon: Building2,
  },
  {
    name: "Discounts & Promos",
    label: "Create deals, happy hours, and volume discounts to drive sales.",
    icon: Tag,
  },
  {
    name: "Schedules",
    label: "Set time-based pricing and availability for seasonal or hourly items.",
    icon: Clock,
  },
  {
    name: "Tax Rules",
    label: "Define tax rates and apply them to the right products and transactions.",
    icon: Receipt,
  },
  {
    name: "Brands & Sizes",
    label: "Organize products by brand and manage size variants in one place.",
    icon: SwatchBook,
  },
  {
    name: "Modifiers",
    label: "Add-ons, flavors, extras — let customers customize their orders.",
    icon: Pencil,
  },
  {
    name: "Bulk Editor",
    label: "Update prices, categories, or attributes across hundreds of items at once.",
    icon: Wrench,
  },
]

export function ItemsPage() {
  return (
    <HubPageLayout
      badge="Items"
      title="Product Hub"
      description="Everything your store sells starts here. Build your catalog, set prices, and keep your offerings sharp."
      icon={Package}
    >
      {itemLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
