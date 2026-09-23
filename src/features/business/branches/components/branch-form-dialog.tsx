import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { Building2 } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { branchFormSchema, type BranchFormSchemaValues } from "@/features/business/branches/schemas/branch-schema"
import type { Branch, BranchFormValues } from "@/features/business/branches/types"
import { getUserDisplayName, type UserResponseDto } from "@/features/business/people/users/types"
import { useTranslation } from "@/i18n/use-i18n"

const AUTOMATIC_ADMIN = "automatic-admin"

const defaultValues: BranchFormValues = {
  name: "",
  identification: "",
  address: "",
  phone: "",
  email: "",
  adminUserId: "",
}

type BranchFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchToEdit?: Branch | null
  users?: UserResponseDto[]
  isUsersLoading?: boolean
  isSubmitting?: boolean
  onSubmit: (values: BranchFormValues) => void
}

export function BranchFormDialog({
  open,
  onOpenChange,
  branchToEdit,
  users = [],
  isUsersLoading = false,
  isSubmitting = false,
  onSubmit,
}: BranchFormDialogProps) {
  const { t } = useTranslation("business-branches")
  const isEditMode = Boolean(branchToEdit)
  const schema = useMemo(() => branchFormSchema(t), [t])
  const form = useForm<BranchFormSchemaValues>({
    resolver: zodResolver(schema) as Resolver<BranchFormSchemaValues>,
    defaultValues,
  })

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.isActive && ["Admin", "Manager"].includes(user.role ?? "")),
    [users]
  )

  useEffect(() => {
    if (!open) return

    form.reset(
      branchToEdit
        ? {
            name: branchToEdit.name,
            identification: branchToEdit.identification,
            address: branchToEdit.address,
            phone: branchToEdit.phone,
            email: branchToEdit.email,
            adminUserId: branchToEdit.adminUserId,
          }
        : defaultValues
    )
  }, [branchToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto border-border/80 bg-card p-0 sm:max-w-5xl">
        <DialogHeader className="relative overflow-hidden border-b border-border/70 px-5 pt-6 pb-5 sm:px-6">
          <div className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full border border-primary/10 bg-primary/[0.035]" />
          <div className="relative flex items-center gap-2">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <DialogTitle className="-mb-1 text-lg">{isEditMode ? t("edit_title") : t("create_title")}</DialogTitle>
              <DialogDescription className="leading-6">
                {isEditMode ? t("edit_desc") : t("create_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <section className="flex flex-col justify-between gap-4 p-4 lg:flex-row">
              <div className="w-full space-y-5 rounded-2xl border border-border/70 bg-background/35 p-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name_label")}</FormLabel>
                      <FormControl>
                        <Input autoFocus placeholder={t("name_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="identification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("identification_label")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("identification_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("phone_label")}</FormLabel>
                        <FormControl>
                          <Input inputMode="tel" placeholder={t("phone_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("address_label")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("address_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email_label")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t("email_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="adminUserId"
                render={({ field }) => (
                  <FormItem className="h-max rounded-2xl border border-border/70 bg-background/35 p-4 sm:p-5">
                    <FormLabel>{t("admin_label")}</FormLabel>
                    <Select
                      value={field.value || AUTOMATIC_ADMIN}
                      onValueChange={(value) => field.onChange(value === AUTOMATIC_ADMIN ? "" : value)}
                      disabled={isUsersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("admin_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AUTOMATIC_ADMIN}>{t("admin_automatic")}</SelectItem>
                        {branchToEdit?.adminUserId &&
                        !eligibleUsers.some((user) => user.id === branchToEdit.adminUserId) ? (
                          <SelectItem value={branchToEdit.adminUserId}>
                            {branchToEdit.adminUserName || branchToEdit.adminUserId}
                          </SelectItem>
                        ) : null}
                        {eligibleUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {getUserDisplayName(user)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-5 text-muted-foreground">{t("admin_hint")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
            <DialogFooter className="border-t border-border/70 p-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : isEditMode ? t("save_changes") : t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
