import {
  AlertCircle,
  Clock,
  Fingerprint,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/i18n/use-i18n"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { getRoleLabelKey } from "@/features/auth/utils/role-labels"
import { getUserById } from "@/features/business/people/users/services/users.service"
import { getUserDisplayName } from "@/features/business/people/users/types"

type ProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChangePassword?: () => void
}

export function ProfileDialog({ open, onOpenChange, onChangePassword }: ProfileDialogProps) {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation()
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", "profile", userId],
    queryFn: () => getUserById(userId!),
    enabled: open && Boolean(userId),
  })

  const fullName = data ? getUserDisplayName(data) : (session?.user.fullName ?? "—")
  const roleLabelKey = getRoleLabelKey(data?.role ?? session?.user.role)
  const roleLabel = roleLabelKey ? tCommon(roleLabelKey) : (data?.role ?? "—")
  const email = data?.email ?? session?.user.email ?? "—"
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join("") || "PM"

  const detailRows = [
    { icon: User, label: tCommon("name"), value: fullName },
    { icon: Mail, label: tCommon("email"), value: email },
    { icon: ShieldCheck, label: t("profile_role"), value: roleLabel },
    { icon: Phone, label: t("profile_phone"), value: data?.phoneNumber },
    { icon: Fingerprint, label: t("profile_identification"), value: data?.identificationNumber },
    { icon: MapPin, label: t("profile_address"), value: data?.address },
    {
      icon: Clock,
      label: t("profile_last_login"),
      value: data?.lastLoginAt ? new Date(data.lastLoginAt).toLocaleString() : null,
    },
  ].filter((row) => Boolean(row.value))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center text-xl">{t("profile_title")}</DialogTitle>
          <DialogDescription className="text-center">{t("profile_description")}</DialogDescription>
          <div className="mx-auto flex w-fit items-center justify-center gap-3 rounded-full bg-accent p-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary shadow-sm shadow-primary/10">
              {initials}
            </div>
            <div className="flex w-fit flex-col items-start gap-0.5 leading-tight">
              <div className="flex items-start gap-1 leading-tight">
                <span className="text-sm font-semibold text-foreground">{fullName}</span>
                <span className="mt-0.5 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {roleLabel}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{email}</span>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="mx-auto h-5 w-40" />
            <Skeleton className="mx-auto h-4 w-52" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-4" role="alert">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{t("profile_load_error")}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 size-4" />
              {t("profile_retry")}
            </Button>
          </div>
        ) : (
          data && (
            <div className="space-y-4">
              <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40 px-4">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                      <row.icon className="size-4" />
                      {row.label}
                    </span>
                    <span className="text-right font-medium break-words text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>

              {onChangePassword ? (
                <Button
                  type="button"
                  className="w-full bg-sky-500 text-white shadow-sm shadow-sky-500/25 hover:bg-sky-600"
                  onClick={onChangePassword}
                >
                  <KeyRound className="mr-2 size-4" />
                  {tCommon("change_password")}
                </Button>
              ) : null}
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
