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
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useTranslation } from "@/i18n/use-i18n"
import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

export function ItemsPage() {
  const { t } = useTranslation("business-items")
  const navigate = useNavigate()

  const itemLinks: ItemCardLink[] = [
    {
      name: t("product_catalog"),
      label: t("product_catalog_desc"),
      icon: ClipboardList,
      disabled: false,
      onClick: () => navigate("/business/items/catalog"),
    },
    {
      name: t("departments"),
      label: t("departments_desc"),
      icon: Building2,
      disabled: true,
    },
    {
      name: t("discounts_promos"),
      label: t("discounts_promos_desc"),
      icon: Tag,
      disabled: true,
    },
    {
      name: t("schedules"),
      label: t("schedules_desc"),
      icon: Clock,
      disabled: true,
    },
    {
      name: t("tax_rules"),
      label: t("tax_rules_desc"),
      icon: Receipt,
      disabled: true,
    },
    {
      name: t("brands_sizes"),
      label: t("brands_sizes_desc"),
      icon: SwatchBook,
      disabled: true,
    },
    {
      name: t("modifiers"),
      label: t("modifiers_desc"),
      icon: Pencil,
      disabled: true,
    },
    {
      name: t("bulk_editor"),
      label: t("bulk_editor_desc"),
      icon: Wrench,
      disabled: true,
    },
  ]

  return (
    <HubPageLayout
      badge={t("items")}
      title={t("product_hub")}
      description={t("product_hub_desc")}
      icon={Package}
    >
      {itemLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
