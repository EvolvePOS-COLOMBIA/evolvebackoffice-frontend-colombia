import type { ComponentType } from "react"
import { useNavigate } from "react-router-dom"
import { Lock, Ellipsis } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/i18n/use-i18n"

interface OrdersAction {
  key: string
  labelKey: string
  icon: ComponentType<{ className?: string }>
  to: string
}

/** Orders-section actions. Add new entries here and they show up in the menu. */
const ORDERS_ACTIONS: OrdersAction[] = [
  { key: "closing", labelKey: "closing_entry", icon: Lock, to: "/business/orders/closing" },
]

/** Overflow (⋯) button with the secondary actions of the Orders section. */
export function OrdersActionsMenu() {
  const { t } = useTranslation("business-orders")
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t("more_actions")} title={t("more_actions")}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {ORDERS_ACTIONS.map(({ key, labelKey, icon: Icon, to }) => (
          <DropdownMenuItem key={key} onSelect={() => navigate(to)}>
            <Icon className="size-4" />
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
