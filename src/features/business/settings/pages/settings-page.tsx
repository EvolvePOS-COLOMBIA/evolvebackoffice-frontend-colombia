import {
  ArrowLeftRight,
  ArchiveX,
  Building2,
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
import { useNavigate } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/i18n/use-i18n"
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

export function SettingsPage() {
  const { t } = useTranslation("business-settings")
  const navigate = useNavigate()

  const globalLinks: ItemCardLink[] = [
    {
      name: t("main_db"),
      label: t("main_db_desc"),
      icon: Server,
      disabled: true,
    },
    {
      name: t("registers"),
      label: t("registers_desc"),
      icon: MonitorCog,
      disabled: false,
      onClick: () => navigate("/business/settings/registers"),
    },
    {
      name: t("evolve_keyboard"),
      label: t("evolve_keyboard_desc"),
      icon: Keyboard,
      disabled: true,
    },
    {
      name: t("pole_display"),
      label: t("pole_display_desc"),
      icon: Tv,
      disabled: true,
    },
    {
      name: t("printers"),
      label: t("printers_desc"),
      icon: Printer,
      disabled: true,
    },
    {
      name: t("printer_group"),
      label: t("printer_group_desc"),
      icon: ListOrdered,
      disabled: true,
    },
    {
      name: t("resource_config_group"),
      label: t("resource_config_group_desc"),
      icon: Layers,
      disabled: true,
    },
  ]

  const storeLinks: ItemCardLink[] = [
    {
      name: t("branches"),
      label: t("branches_desc"),
      icon: Building2,
      disabled: false,
      onClick: () => navigate("/business/settings/branches"),
    },
    {
      name: t("store_information"),
      label: t("store_information_desc"),
      icon: Store,
      disabled: true,
    },
    {
      name: t("tenders"),
      label: t("tenders_desc"),
      icon: CreditCard,
      disabled: true,
    },
    {
      name: t("pos_options"),
      label: t("pos_options_desc"),
      icon: Settings,
      disabled: true,
    },
    {
      name: t("woocommerce_integration"),
      label: t("woocommerce_integration_desc"),
      icon: ArrowLeftRight,
      disabled: true,
    },
    {
      name: t("delete_transactions"),
      label: t("delete_transactions_desc"),
      icon: ArchiveX,
      disabled: true,
    },
    {
      name: t("gift_card"),
      label: t("gift_card_desc"),
      icon: CreditCard,
      disabled: true,
    },
    {
      name: t("media_resource"),
      label: t("media_resource_desc"),
      icon: Image,
      disabled: true,
    },
  ]

  return (
    <Card className="relative overflow-hidden shadow-none">
      <CardContent className="p-4 lg:p-8">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">{t("settings")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("settings_desc")}</p>
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
