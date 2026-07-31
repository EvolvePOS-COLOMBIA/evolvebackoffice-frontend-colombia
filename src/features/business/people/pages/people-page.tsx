import { CalendarClock, CircleUser, Key, Users } from "lucide-react"

import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

const peopleLinks: ItemCardLink[] = [
  {
    name: "Customers",
    label: "Manage contact details, purchase history, and loyalty information for your clients.",
    icon: Users,
  },
  {
    name: "Users",
    label: "Control employee accounts, login credentials, and personal access settings for the system.",
    icon: CircleUser,
  },
  {
    name: "Roles",
    label: "Define permissions and access levels for different user groups (e.g., Manager, Cashier, Admin).",
    icon: Key,
  },
  {
    name: "Time Clock",
    label: "Tracks and manages cashiers' work hours, including clock-ins/outs, and hour adjustments.",
    icon: CalendarClock,
  },
]

export function PeoplePage() {
  return (
    <HubPageLayout
      badge="People"
      title="Team & Customers"
      description="Manage the people behind your business. From employee access to customer loyalty, everything is scoped to your store."
      icon={Users}
      iconClass={"-rotate-100 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-35 lg:size-89"}
    >
      {peopleLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
