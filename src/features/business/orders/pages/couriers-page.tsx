import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bike, Pencil, Plus, Search, UserCheck, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { useCouriers, useCreateCourier, useSetCourierActive, useUpdateCourier } from "../hooks/use-couriers"
import { CourierFormDialog } from "../components/courier-form-dialog"
import type { Courier, CourierPayload } from "../types/delivery"
import { getApiErrorMessage } from "../utils/order-helpers"

/** Catálogo de domiciliarios (repartidores) del negocio. */
export function CouriersPage() {
  const { t } = useTranslation("business-orders")
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Courier | null>(null)

  const { data: branchesData } = useBranches(1, 50)
  const branches = (branchesData?.data ?? []).map((b) => ({ id: b.id, name: b.name }))
  const { data, isLoading } = useCouriers(null, showInactive, search.trim())
  const couriers = data?.data ?? []

  const createMutation = useCreateCourier()
  const updateMutation = useUpdateCourier()
  const toggleMutation = useSetCourierActive()

  const handleSubmit = (payload: CourierPayload) => {
    const onError = (error: unknown) => notify.error(getApiErrorMessage(error, t("courier_save_error")))
    if (selected) {
      updateMutation.mutate(
        { id: selected.id, payload },
        {
          onSuccess: () => {
            setFormOpen(false)
            setSelected(null)
            notify.success(t("courier_updated"))
          },
          onError,
        }
      )
      return
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        setFormOpen(false)
        notify.success(t("courier_created"))
      },
      onError,
    })
  }

  const handleToggle = (courier: Courier) => {
    toggleMutation.mutate(
      { id: courier.id, active: !courier.isActive },
      {
        onSuccess: () => notify.success(courier.isActive ? t("courier_deactivated") : t("courier_activated")),
        onError: (error) => notify.error(getApiErrorMessage(error)),
      }
    )
  }

  const openCreate = () => {
    setSelected(null)
    setFormOpen(true)
  }

  const openEdit = (courier: Courier) => {
    setSelected(courier)
    setFormOpen(true)
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="relative flex flex-col gap-2">
          <Badge className="max-w-fit" tone="primary">
            {t("orders")}
          </Badge>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("couriers_title")}</h1>
          <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("couriers_desc")}</p>
          <Bike
            color="#58626b"
            className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("couriers_search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={showInactive} onCheckedChange={setShowInactive} />
              {t("couriers_show_inactive")}
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => navigate("/business/orders/deliveries")}>
              <ArrowLeft className="mr-2 size-4" />
              {t("deliveries_title")}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              {t("courier_new")}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : couriers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">{t("couriers_empty")}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">{t("courier_name")}</TableHead>
                    <TableHead>{t("phone")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("courier_document")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("courier_plate")}</TableHead>
                    <TableHead>{t("branch")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couriers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{c.name}</p>
                        {c.notes && <p className="max-w-60 truncate text-xs text-muted-foreground">{c.notes}</p>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {c.documentNumber ?? "—"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs md:table-cell">{c.vehiclePlate ?? "—"}</TableCell>
                      <TableCell>
                        <Badge tone={c.branchName ? "info" : "neutral"}>{c.branchName ?? t("all_branches")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge tone={c.isActive ? "success" : "neutral"}>
                          {c.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleToggle(c)}
                            aria-label={c.isActive ? t("courier_deactivate") : t("courier_activate")}
                            title={c.isActive ? t("courier_deactivate") : t("courier_activate")}
                          >
                            {c.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(c)}
                            aria-label={t("courier_edit")}
                            title={t("courier_edit")}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <CourierFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) setSelected(null)
          }}
          courierToEdit={selected}
          branches={branches}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
