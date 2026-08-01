import { BarChart3, BookOpen, ClipboardList, CurlyBraces, Logs } from "lucide-react"

import { useTranslation } from "@/i18n/use-i18n"
import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

export function ReportsPage() {
  const { t } = useTranslation("business-reports")

  const reportsLinks: ItemCardLink[] = [
    {
      name: t("standard_dynamic_custom"),
      label: t("standard_dynamic_custom_desc"),
      icon: ClipboardList,
    },
    {
      name: t("journal"),
      label: t("journal_desc"),
      icon: BookOpen,
    },
    {
      name: t("update_batch_info"),
      label: t("update_batch_info_desc"),
      icon: CurlyBraces,
    },
    {
      name: t("woocommerce_orders"),
      label: t("woocommerce_orders_desc"),
      icon: Logs,
    },
  ]

  return (
    <HubPageLayout
      badge={t("reports")}
      title={t("insights_analytics")}
      description={t("insights_analytics_desc")}
      icon={BarChart3}
    >
      {reportsLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
