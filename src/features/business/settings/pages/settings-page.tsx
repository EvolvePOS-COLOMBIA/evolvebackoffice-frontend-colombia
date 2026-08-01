import {
  ArrowLeftRight,
  ArchiveX,
  Image,
  Keyboard,
  Layers,
  ListOrdered,
  MonitorCog,
  Printer,
  Server,
  Settings,
  Store,
  Tv,
  CreditCard,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/i18n/use-i18n"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

export function SettingsPage() {
  const { t } = useTranslation("business-settings")

  const globalLinks: ItemCardLink[] = [
    {
      name: t("main_db"),
      label: t("main_db_desc"),
      icon: Server,
    },
    {
      name: t("registers"),
      label: t("registers_desc"),
      icon: MonitorCog,
    },
    {
      name: t("evolve_keyboard"),
      label: t("evolve_keyboard_desc"),
      icon: Keyboard,
    },
    {
      name: t("pole_display"),
      label: t("pole_display_desc"),
      icon: Tv,
    },
    {
      name: t("printers"),
      label: t("printers_desc"),
      icon: Printer,
    },
    {
      name: t("printer_group"),
      label: t("printer_group_desc"),
      icon: ListOrdered,
    },
    {
      name: t("resource_config_group"),
      label: t("resource_config_group_desc"),
      icon: Layers,
    },
  ]

  const storeLinks: ItemCardLink[] = [
    {
      name: t("store_information"),
      label: t("store_information_desc"),
      icon: Store,
    },
    {
      name: t("tenders"),
      label: t("tenders_desc"),
      icon: CreditCard,
    },
    {
      name: t("pos_options"),
      label: t("pos_options_desc"),
      icon: Settings,
    },
    {
      name: t("woocommerce_integration"),
      label: t("woocommerce_integration_desc"),
      icon: ArrowLeftRight,
    },
    {
      name: t("delete_transactions"),
      label: t("delete_transactions_desc"),
      icon: ArchiveX,
    },
    {
      name: t("gift_card"),
      label: t("gift_card_desc"),
      icon: CreditCard,
    },
    {
      name: t("media_resource"),
      label: t("media_resource_desc"),
      icon: Image,
    },
  ]

  return (
    <Card className="relative overflow-hidden shadow-none">
      <CardContent className="p-4 lg:p-8">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">{t("settings")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">
            {t("settings_desc")}
          </p>
          <Settings
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </header>

        <Tabs defaultValue="store" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="store" className="flex-1">
              {t("store")}
            </TabsTrigger>
            <TabsTrigger value="global" className="flex-1">
              {t("global")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {storeLinks.map((item) => (
                <ItemCard key={item.name} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="global" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {globalLinks.map((item) => (
                <ItemCard key={item.name} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
