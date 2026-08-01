import { useMemo, useState } from "react"
import { Building2, Plus, SquarePen } from "lucide-react"

import { AlertDeleteDialog } from "@/components/alert-delete-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClientFormDialog } from "@/features/platform/clients/components/client-form-dialog"
import { useTenantClients } from "@/features/platform/clients/hooks/use-tenant-clients"
import type { TenantClient, TenantClientFormValues } from "@/features/platform/clients/types"
import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

export function ClientsPage() {
  const { clients, createClient, removeClient, updateClient } = useTenantClients()
  const [query, setQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<TenantClient | null>(null)
  const { t } = useTranslation("platform-clients")

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return clients
    }

    return clients.filter((client) => {
      return (
        client.businessName.toLowerCase().includes(normalizedQuery) || client.slug.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [clients, query])

  const activeClients = clients.filter((client) => client.status === "active").length

  const handleSubmit = (values: TenantClientFormValues) => {
    try {
      if (selectedClient) {
        updateClient(selectedClient.id, values)
        notify.success(t("client_updated"))
      } else {
        createClient(values)
        notify.success(t("client_created"))
      }

      setIsDialogOpen(false)
      setSelectedClient(null)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t("unable_to_save"))
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("tenant_management")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("create_maintain_tenants")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("search_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label={t("total_clients")} value={clients.length} />
            <SummaryTile label={t("active_clients")} value={activeClients} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("clients")}</CardTitle>
              <CardDescription>{t("search_clients_placeholder")}</CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedClient(null)
                setIsDialogOpen(true)
              }}
            >
              <Plus className="size-4" />
              {t("create_client")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search_clients")} />
            </div>
            <Badge tone="neutral" className="w-fit">
              {filteredClients.length} {t("results")}
            </Badge>
          </div>

          <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("business_name")}</TableHead>
                  <TableHead>{t("slug")}</TableHead>
                  <TableHead>{t("administrator_email")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("created")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.businessName}</TableCell>
                    <TableCell className="text-muted-foreground">{client.slug}</TableCell>
                    <TableCell className="text-muted-foreground">{client.adminEmail}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                    <TableCell>
                      <Badge tone={client.status === "active" ? "success" : "warning"}>{client.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(client.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client)
                            setIsDialogOpen(true)
                          }}
                        >
                          <SquarePen className="size-4" />
                          {t("edit")}
                        </Button>
                        <AlertDeleteDialog
                          title={t("delete_tenant_client")}
                          selectedLabel={client.businessName}
                          onDelete={() => {
                            removeClient(client.id)
                            notify.success(t("client_deleted"))
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 xl:hidden">
            {filteredClients.map((client) => (
              <Card key={client.id} className="rounded-[24px] border-border/70 bg-background/45 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{client.businessName}</h3>
                        <Badge tone={client.status === "active" ? "success" : "warning"}>{client.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{client.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(client)
                          setIsDialogOpen(true)
                        }}
                      >
                        <SquarePen className="size-4" />
                        {t("edit")}
                      </Button>
                      <AlertDeleteDialog
                        title={t("delete_tenant_client")}
                        selectedLabel={client.businessName}
                        onDelete={() => {
                          removeClient(client.id)
                          notify.success(t("client_deleted"))
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <CompactMeta label={t("admin_email")} value={client.adminEmail} />
                    <CompactMeta label={t("phone")} value={client.phone} />
                    <CompactMeta label={t("created")} value={formatDateTime(client.createdAt)} />
                    <CompactMeta label={t("slug")} value={client.slug} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClients.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Building2 className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{t("no_clients_found")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("try_different_search")}</p>
            </Card>
          ) : null}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setSelectedClient(null)
          }
        }}
        clientToEdit={selectedClient}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function CompactMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium break-words text-foreground">{value}</p>
    </div>
  )
}
