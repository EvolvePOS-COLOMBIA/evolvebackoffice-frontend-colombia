import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { z } from "zod"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Register, RegisterStatus } from "@/features/business/registers/types"
import { useTranslation } from "@/i18n/use-i18n"

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
    if (registerToUpdate) {
      form.reset({ status: registerToUpdate.status })
    } else {
      form.reset({ status: "Active" })
    }
  }, [open, registerToUpdate, form])

  const toneFor = (s: RegisterStatus) =>
    s === "Active"
      ? "success"
      : s === "Locked"
        ? "danger"
        : s === "Maintenance"
          ? "warning"
          : "neutral"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>{t("set_status_title")}</DialogTitle>
          <DialogDescription>{t("set_status_desc")}</DialogDescription>
        </DialogHeader>

        {registerToUpdate ? (
          <div className="space-y-1 rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
            <p className="text-sm font-medium text-foreground">{registerToUpdate.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("code_label")}: {registerToUpdate.code} · {t("branch_label")}:{" "}
              {registerToUpdate.branchName || "—"}
            </p>
          </div>
        ) : null}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => onSubmit(v.status))}>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status_label")}</FormLabel>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("choose_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">
                        <div className="flex items-center gap-2">
                          <Badge tone={toneFor("Active")}>{t("status_active")}</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="Maintenance">
                        <div className="flex items-center gap-2">
                          <Badge tone={toneFor("Maintenance")}>{t("status_maintenance")}</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="Locked">
                        <div className="flex items-center gap-2">
                          <Badge tone={toneFor("Locked")}>{t("status_locked")}</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="Inactive">
                        <div className="flex items-center gap-2">
                          <Badge tone={toneFor("Inactive")}>{t("status_inactive")}</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
