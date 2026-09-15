import { CalendarClock, CircleUser, Key, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useTranslation } from "@/i18n/use-i18n"
import { HubPageLayout } from "@/features/business/components/hub-page-layout"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

export function PeoplePage() {
  const { t } = useTranslation("business-people")
  const navigate = useNavigate()

  const peopleLinks: ItemCardLink[] = [
    {
      name: t("customers"),
      label: t("customers_desc"),
      icon: Users,
      disabled: false,
      onClick: () => navigate("/business/people/customers"),
    },
    {
      name: t("users"),
      label: t("users_desc"),
      icon: CircleUser,
      disabled: false,
      onClick: () => navigate("/business/people/users"),
    },
    {
      name: t("roles"),
      label: t("roles_desc"),
      icon: Key,
      disabled: true,
    },
    {
      name: t("time_clock"),
      label: t("time_clock_desc"),
      icon: CalendarClock,
      disabled: true,
    },
  ]

  return (
    <HubPageLayout
      badge={t("people")}
      title={t("team_customers")}
      description={t("team_customers_desc")}
      icon={Users}
      iconClass={"-rotate-100 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-35 lg:size-89"}
    >
      {peopleLinks.map((item) => (
        <ItemCard key={item.name} item={item} />
      ))}
    </HubPageLayout>
  )
}
