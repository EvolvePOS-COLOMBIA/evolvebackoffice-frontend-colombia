import { Building2, ClipboardCheck, ShoppingCart, Truck } from "lucide-react"

import { useTranslation } from "@/i18n/use-i18n"
import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

export function InventoryPage() {
  const { t } = useTranslation("business-inventory")

  const inventoryLinks: ItemCardLink[] = [
    {
      name: t("suppliers"),
      label: t("suppliers_desc"),
      icon: Truck,
    },
    {
      name: t("purchase_orders"),
      label: t("purchase_orders_desc"),
      icon: ShoppingCart,
    },
    {
      name: t("physical_inventory"),
      label: t("physical_inventory_desc"),
      icon: ClipboardCheck,
    },
  ]

  return (
    <HubPageLayout
      badge={t("inventory")}
      title={t("stock_control")}
      description={t("stock_control_desc")}
      icon={Building2}
      iconClass={"-rotate-20 md:-top-10 md:-right-10 md:size-70 lg:-top-25 lg:-right-35 lg:size-100"}
    >
      {inventoryLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
