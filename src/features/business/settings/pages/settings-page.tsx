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
import { ItemCard, type ItemCardLink } from "@/features/business/components/item-card"

const globalLinks: ItemCardLink[] = [
  {
    name: "Main DB",
    label: "Configure core system settings and manage database configuration parameters.",
    icon: Server,
  },
  {
    name: "Registers",
    label: "Set up, configure, and manage Point of Sale (POS) terminals and workstations.",
    icon: MonitorCog,
  },
  {
    name: "Evolve Keyboard",
    label: "Create and manage POS keyboard layouts.",
    icon: Keyboard,
  },
  {
    name: "Pole Display",
    label: "Define settings and communication protocols for customer-facing display devices.",
    icon: Tv,
  },
  {
    name: "Printers",
    label: "Configure, and manage individual receipt and label printers.",
    icon: Printer,
  },
  {
    name: "Printer Group",
    label: "Create and manage groups of printers for efficient printing distribution and routing.",
    icon: ListOrdered,
  },
  {
    name: "Resource Configuration Group",
    label: "Create and manage groups of resource configurations for efficient resource allocation and routing.",
    icon: Layers,
  },
]

const storeLinks: ItemCardLink[] = [
  {
    name: "Store Information",
    label: "Edit essential details, physical address, and contact information for your location.",
    icon: Store,
  },
  {
    name: "Tenders",
    label: "Manage accepted payment methods, cash rounding rules, and tender configurations.",
    icon: CreditCard,
  },
  {
    name: "Pos Options",
    label: "Configure operational settings for the Point of Sale interface and transaction flow.",
    icon: Settings,
  },
  {
    name: "WooCommerce Integration",
    label: "Manage data synchronization and field mapping for your online sales channels.",
    icon: ArrowLeftRight,
  },
  {
    name: "Delete transactions",
    label: "Delete transactions from closed or pending batches to keep your system data organized.",
    icon: ArchiveX,
  },
  {
    name: "Gift Card",
    label: "Configure gift card settings and options for your store.",
    icon: CreditCard,
  },
  {
    name: "Media Resource",
    label: "Create and manage media resources for efficient resource allocation and routing.",
    icon: Image,
  },
]

export function SettingsPage() {
  return (
    <Card className="relative overflow-hidden shadow-none">
      <CardContent className="p-4 lg:p-8">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">
            Configure your store preferences, hardware, and system-wide settings from one place.
          </p>
          <Settings
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </header>

        <Tabs defaultValue="store" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="store" className="flex-1">
              Store
            </TabsTrigger>
            <TabsTrigger value="global" className="flex-1">
              Global
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
