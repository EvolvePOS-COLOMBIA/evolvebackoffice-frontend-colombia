import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/i18n/use-i18n"
import { ORDER_STATUS_CONFIG } from "../types"
import { closingStatusCode } from "../utils/closing-summary"

/** Order status with the same label and color the orders board uses. */
export function ClosingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("business-orders")
  const code = closingStatusCode(status)
  const config = code ? ORDER_STATUS_CONFIG[code] : undefined
  return (
    <Badge tone={config?.color ?? "neutral"} className="whitespace-nowrap">
      {config ? t(config.labelKey) : status}
    </Badge>
  )
}
