import { BarChart3, BookOpen, ClipboardList, CurlyBraces, Logs } from "lucide-react"

import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

const reportsLinks: ItemCardLink[] = [
  {
    name: "Reports (Standard - Dynamic - Custom)",
    label: "Generate, print and download reports of your store operation system.",
    icon: ClipboardList,
  },
  {
    name: "Journal",
    label: "View a detailed chronological log of all transactions and system activities.",
    icon: BookOpen,
  },
  {
    name: "Update Batch Info",
    label: "Review and manage groups of processed transactions for daily closing and reconciliation.",
    icon: CurlyBraces,
  },
  {
    name: "WooCommerce Orders",
    label: "Review and manage WooCommerce orders of WooCommerce store.",
    icon: Logs,
  },
]

export function ReportsPage() {
  return (
    <HubPageLayout
      badge="Reports"
      title="Insights & Analytics"
      description="Track your store performance, review transactions, and generate the reports that keep your business in shape."
      icon={BarChart3}
    >
      {reportsLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
