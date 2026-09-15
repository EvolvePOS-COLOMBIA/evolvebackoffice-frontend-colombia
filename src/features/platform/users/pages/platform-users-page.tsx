import { useState } from "react"
import { Users, Plus, SquarePen, UserCheck, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlatformUserFormDialog } from "@/features/platform/users/components/platform-user-form-dialog"
import {
  usePlatformUsers,
  useActivatePlatformUser,
  useDeactivatePlatformUser,
} from "@/features/platform/users/hooks/use-platform-users"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"
import type { PlatformUser, AppRole } from "@/features/platform/users/types"

export function PlatformUsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const { isPlatformAdmin } = useAuth()
  const { t } = useTranslation("platform-users")

  const { data: users, isLoading } = usePlatformUsers()
  const activateMutation = useActivatePlatformUser()
  const deactivateMutation = useDeactivatePlatformUser()

  const handleToggleActive = (user: PlatformUser) => {
    if (user.isActive) {
      deactivateMutation.mutate(user.id, {
        onSuccess: () => notify.success(t("user_deactivated")),
        onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      })
    } else {
      activateMutation.mutate(user.id, {
        onSuccess: () => notify.success(t("user_activated")),
        onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      })
    }
  }

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "PlatformAdmin":
        return <Badge tone="primary">{t("role_admin")}</Badge>
      case "PlatformSubAdmin":
        return <Badge tone="warning">{t("role_subadmin")}</Badge>
      case "PlatformSupervisor":
        return <Badge tone="neutral">{t("role_supervisor")}</Badge>
      default:
        return <Badge tone="neutral">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("user_management")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("platform_users")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("platform_users_desc")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SummaryTile label={t("total_users")} value={users?.length ?? 0} />
            <SummaryTile label={t("active_users")} value={users?.filter((u) => u.isActive).length ?? 0} />
            <SummaryTile label={t("admins")} value={users?.filter((u) => u.role === "PlatformAdmin").length ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("users")}</CardTitle>
              <CardDescription>{t("users_list_desc")}</CardDescription>
            </div>
            {isPlatformAdmin && (
              <Button
                onClick={() => {
                  setSelectedUser(null)
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="size-4" />
                {t("create_user")}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">{t("loading")}</div>
            </div>
          ) : (
            <div className="hidden xl:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("full_name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("created")}</TableHead>
                    <TableHead>{t("last_login")}</TableHead>
                    {isPlatformAdmin && <TableHead className="text-right">{t("actions")}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge tone={user.isActive ? "success" : "warning"}>
                          {user.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(user.createdAt)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}
                      </TableCell>
                      {isPlatformAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDialogOpen(true)
                              }}
                            >
                              <SquarePen className="size-4" />
                              {t("edit")}
                            </Button>
                            <Button
                              type="button"
                              variant={user.isActive ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              disabled={activateMutation.isPending || deactivateMutation.isPending}
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="size-4" />
                                  {t("deactivate")}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="size-4" />
                                  {t("activate")}
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(!users || users.length === 0) && !isLoading ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-accent/60 text-muted-foreground">
                <Users className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{t("no_users_found")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("create_first_user")}</p>
            </Card>
          ) : null}
        </CardContent>
      </Card>

      <PlatformUserFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setSelectedUser(null)
        }}
        userToEdit={selectedUser}
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
