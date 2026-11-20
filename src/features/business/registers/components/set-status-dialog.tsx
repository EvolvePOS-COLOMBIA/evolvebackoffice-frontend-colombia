import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheck, CirclePause, Lock, PowerOff, Save, Wrench, type LucideIcon } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { z } from "zod"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form"
import type { Register, RegisterStatus } from "@/features/business/registers/types"
import { registerStatusKey, registerStatusTone } from "@/features/business/registers/utils/register-status"
import { useTranslation } from "@/i18n/use-i18n"
import { cn } from "@/lib/utils"
import { DialogTitleBlock } from "./register-dialog-parts"

type SetStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  registerToUpdate: Register | null
  onSubmit: (status: RegisterStatus) => void
  isSubmitting?: boolean
}

type StatusFormValues = {
  status: RegisterStatus
}

type StatusOption = {
  value: RegisterStatus
  icon: LucideIcon
  descriptionKey: string
  /** Clases del icono y del recuadro cuando la opción está seleccionada. */
  accent: string
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "Active",
    icon: CircleCheck,
    descriptionKey: "status_active_desc",
    accent: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
  },
  {
    value: "Maintenance",
    icon: Wrench,
    descriptionKey: "status_maintenance_desc",
    accent: "border-amber-500/50 bg-amber-500/10 text-amber-500",
  },
  {
    value: "Locked",
    icon: Lock,
    descriptionKey: "status_locked_desc",
    accent: "border-rose-500/50 bg-rose-500/10 text-rose-500",
  },
  {
    value: "Inactive",
    icon: PowerOff,
    descriptionKey: "status_inactive_desc",
    accent: "border-slate-500/50 bg-slate-500/10 text-slate-400",
  },
]

export function SetStatusDialog({
  open,
  onOpenChange,
  registerToUpdate,
  onSubmit,
  isSubmitting = false,
}: SetStatusDialogProps) {
  const { t } = useTranslation("business-registers")

  const statusSchema = z.object({
    status: z.enum(["Active", "Maintenance", "Locked", "Inactive"], {
      message: t("choose_status"),
    }),
  })

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema) as Resolver<StatusFormValues>,
    defaultValues: { status: "Active" },
  })

  useEffect(() => {
    if (!open) return
    form.reset({ status: registerToUpdate?.status ?? "Active" })
  }, [open, registerToUpdate, form])

  const selected = useWatch({ control: form.control, name: "status" })
  const unchanged = registerToUpdate?.status === selected

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,480px)] gap-5">
        <DialogTitleBlock icon={CirclePause} title={t("set_status_title")} description={t("set_status_desc")} />

        {registerToUpdate ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/40 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{registerToUpdate.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {registerToUpdate.code} · {registerToUpdate.branchName || "—"}
              </p>
            </div>
            <Badge tone={registerStatusTone(registerToUpdate.status)} className="shrink-0">
              {t(registerStatusKey(registerToUpdate.status))}
            </Badge>
          </div>
        ) : null}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => onSubmit(v.status))}>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <p id="status-group-label" className="text-sm font-medium text-foreground">
                    {t("choose_status")}
                  </p>
                  <div role="radiogroup" aria-labelledby="status-group-label" className="grid gap-2">
                    {STATUS_OPTIONS.map((option) => {
                      const checked = field.value === option.value
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            checked
                              ? "border-primary/60 bg-primary/10"
                              : "border-border/70 bg-background/40 hover:border-border hover:bg-accent/40"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                              checked ? option.accent : "border-border/70 bg-muted/40 text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground">
                              {t(registerStatusKey(option.value))}
                            </span>
                            <span className="block text-xs text-muted-foreground">{t(option.descriptionKey)}</span>
                          </span>
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border",
                              checked ? "border-primary bg-primary" : "border-border"
                            )}
                          >
                            {checked ? <span className="size-2 rounded-full bg-primary-foreground" /> : null}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter className="pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || unchanged}>
                {isSubmitting && <Spinner IsButton />}
                {!isSubmitting && <Save className="size-4" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
