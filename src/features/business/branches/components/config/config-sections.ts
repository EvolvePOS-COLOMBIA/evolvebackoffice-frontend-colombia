import { Bike, Clock, Info, Monitor, Puzzle, Store, Truck, type LucideIcon } from "lucide-react"

export type ConfigSectionId = "info" | "schedule" | "modules" | "delivery" | "terminals" | "woocommerce" | "cluvi"
export type ConfigGroupId = "general" | "operation" | "integrations"

export interface ConfigSectionDef {
  id: ConfigSectionId
  group: ConfigGroupId
  icon: LucideIcon
  /** Only offered when the tenant license includes this module. */
  licenseModule?: string
  /** Usable only once the branch has this module assigned. */
  requiresModule?: string
}

export const CONFIG_GROUPS: ConfigGroupId[] = ["general", "operation", "integrations"]

/**
 * Registry of the branch settings. A new setting is one more entry here plus its section component:
 * the navigation, the deep link (`?tab=`) and the group headings pick it up from this list.
 */
export const CONFIG_SECTIONS: ConfigSectionDef[] = [
  { id: "info", group: "general", icon: Info },
  { id: "schedule", group: "general", icon: Clock },
  { id: "modules", group: "operation", icon: Puzzle },
  { id: "delivery", group: "operation", icon: Bike, licenseModule: "DOMICILIOS", requiresModule: "DOMICILIOS" },
  { id: "terminals", group: "operation", icon: Monitor },
  { id: "woocommerce", group: "integrations", icon: Store },
  { id: "cluvi", group: "integrations", icon: Truck },
]

/** Deep links from before the redesign. */
const LEGACY_SECTIONS: Record<string, ConfigSectionId> = { serials: "terminals" }

export function parseConfigSection(param: string | null): ConfigSectionId {
  if (!param) return "info"
  if (param in LEGACY_SECTIONS) return LEGACY_SECTIONS[param]
  return CONFIG_SECTIONS.some((section) => section.id === param) ? (param as ConfigSectionId) : "info"
}

export function sectionsForLicense(hasDeliveryLicense: boolean): ConfigSectionDef[] {
  return CONFIG_SECTIONS.filter((section) => section.licenseModule !== "DOMICILIOS" || hasDeliveryLicense)
}
