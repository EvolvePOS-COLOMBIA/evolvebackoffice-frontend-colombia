import { useState, useMemo } from "react"
import { useTranslation } from "@/i18n/use-i18n"
import { useNotify } from "@/hooks/use-notify"
import Spinner from "@/components/Spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Truck, Settings, Plus, Store, ShoppingCart, AlertTriangle } from "lucide-react"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { useBranchModules } from "@/features/business/branches/hooks/use-branch-modules"
import { useOrders, useBranchIntegrations, useUpdateOrderStatus } from "../hooks/use-orders"
import { OrdersKanban } from "../components/orders-kanban"
import { OrderDetailDialog } from "../components/order-detail-dialog"
import { IntegrationConfigDialog } from "../components/integration-config-dialog"
import { KANBAN_COLUMNS, ORDER_STATUS_CONFIG } from "../types"
import type { OrderListItem, OrderStatus } from "../types/api"

type PlatformFilter = "all" | "CLUVI" | "WOOCOMMERCE" | "POSCO"

export function OrdersPage() {
  const { t } = useTranslation("business-orders")
  const notify = useNotify()
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [configPlatform, setConfigPlatform] = useState<string>("CLUVI")
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all")

  const { data: branchesData } = useBranches(1, 1)
  const branchId = branchesData?.data?.[0]?.id ?? ""

  const { data: branchModules } = useBranchModules(branchId)
  const hasOrdersModule = branchModules?.some((m) => m.moduleCode === "ORDERS" && m.isEnabled)

  const { data: integrations } = useBranchIntegrations(branchId)
  const hasCluviIntegration = integrations?.some((i) => i.platformCode === "CLUVI" && i.isActive)
  const hasWooIntegration = integrations?.some((i) => i.platformCode === "WOOCOMMERCE" && i.isActive)

  const { data: ordersData, isLoading, refetch } = useOrders(1, 500)
  const updateStatusMutation = useUpdateOrderStatus()

  const allOrders = ordersData?.data ?? []

  const filteredOrders = useMemo(() => {
    if (platformFilter === "all") return allOrders
    return allOrders.filter((o) => o.platformCode === platformFilter)
  }, [allOrders, platformFilter])

  const ordersByStatus = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = filteredOrders.filter((o) => o.statusCode === status)
      return acc
    },
    {} as Record<string, OrderListItem[]>
  )

  const platformCounts = useMemo(
    () => ({
      all: allOrders.length,
      CLUVI: allOrders.filter((o) => o.platformCode === "CLUVI").length,
      WOOCOMMERCE: allOrders.filter((o) => o.platformCode === "WOOCOMMERCE").length,
      POSCO: allOrders.filter((o) => o.platformCode === "POSCO").length,
    }),
    [allOrders]
  )

  const handleDragEnd = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate(
      { id: orderId, status: newStatus },
      {
        onSuccess: () => notify.success(t("status") + " → " + (ORDER_STATUS_CONFIG[newStatus]?.label ?? newStatus)),
        onError: () => notify.error(t("sync_failed")),
      }
    )
  }

  const handleViewDetail = (order: OrderListItem) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  const openConfig = (platform: string) => {
    setConfigPlatform(platform)
    setConfigOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("orders")}</h1>
          <p className="text-muted-foreground">{t("orders_desc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => openConfig("CLUVI")} disabled={!hasOrdersModule}>
            <Truck className="mr-2 h-4 w-4" />
            Cluvi
          </Button>
          <Button variant="outline" size="sm" onClick={() => openConfig("WOOCOMMERCE")} disabled={!hasOrdersModule}>
            <Store className="mr-2 h-4 w-4" />
            WooCommerce
          </Button>
        </div>
      </div>

      {/* Warning if ORDERS module not active */}
      {!hasOrdersModule && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">Módulo Órdenes no activo</p>
              <p className="text-xs text-amber-700">
                Activa el módulo "Órdenes" en la configuración de la sucursal para habilitar integraciones con Cluvi y
                WooCommerce.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Status */}
      <div className="flex gap-3">
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-3">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Cluvi</p>
              <p className="text-xs text-muted-foreground">
                {hasCluviIntegration
                  ? `Activo — ${integrations?.find((i) => i.platformCode === "CLUVI")?.settingsJson ? JSON.parse(integrations.find((i) => i.platformCode === "CLUVI")!.settingsJson!).storeId : ""}`
                  : "No configurado"}
              </p>
            </div>
            <Badge variant={hasCluviIntegration ? "success" : "neutral"}>
              {hasCluviIntegration ? t("active") : t("inactive")}
            </Badge>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-3">
            <Store className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">WooCommerce</p>
              <p className="text-xs text-muted-foreground">{hasWooIntegration ? "Activo" : "No configurado"}</p>
            </div>
            <Badge variant={hasWooIntegration ? "success" : "neutral"}>
              {hasWooIntegration ? t("active") : t("inactive")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Platform Filter Tabs */}
      <Tabs value={platformFilter} onValueChange={(v) => setPlatformFilter(v as PlatformFilter)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            Todas
            <Badge variant="outline" className="ml-1 text-[10px]">
              {platformCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="POSCO" className="gap-1.5">
            Local
            <Badge variant="outline" className="ml-1 text-[10px]">
              {platformCounts.POSCO}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="CLUVI" className="gap-1.5">
            Cluvi
            <Badge variant="outline" className="ml-1 text-[10px]">
              {platformCounts.CLUVI}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="WOOCOMMERCE" className="gap-1.5">
            WooCommerce
            <Badge variant="outline" className="ml-1 text-[10px]">
              {platformCounts.WOOCOMMERCE}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-5">
        {KANBAN_COLUMNS.map((status) => {
          const config = ORDER_STATUS_CONFIG[status]
          return (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium">{config?.label}</CardTitle>
                <Badge variant={config?.color as "warning" | "info" | "purple" | "success"}>
                  {ordersByStatus[status]?.length ?? 0}
                </Badge>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <OrdersKanban ordersByStatus={ordersByStatus} onDragEnd={handleDragEnd} onViewDetail={handleViewDetail} />
      )}

      <OrderDetailDialog open={detailOpen} onOpenChange={setDetailOpen} order={selectedOrder} />
      <IntegrationConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        branchId={branchId}
        platform={configPlatform}
      />
    </div>
  )
}
