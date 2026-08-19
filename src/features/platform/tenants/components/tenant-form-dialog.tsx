import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles, SquarePen } from "lucide-react"
import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"

import Spinner from "@/components/Spinner"
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
import { tenantSchema } from "@/features/platform/tenants/schemas/tenant-schema"
import type { Tenant, TenantFormValues } from "@/features/platform/tenants/types"
import { useTranslation } from "@/i18n/use-i18n"

type TenantFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantToEdit?: Tenant | null
  onSubmit: (values: TenantFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: TenantFormValues = {
  name: "",
  contactEmail: "",
  phone: "",
  address: "",
  maxRegisters: 1,
}

export function TenantFormDialog({
  open,
  onOpenChange,
  tenantToEdit,
  onSubmit,
  isSubmitting = false,
}: TenantFormDialogProps) {
  const isEditMode = Boolean(tenantToEdit)
  const { t } = useTranslation("platform-tenants")

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema(t)) as Resolver<TenantFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (tenantToEdit) {
      form.reset({
        name: tenantToEdit.name,
        contactEmail: tenantToEdit.contactEmail,
        phone: tenantToEdit.phone,
        address: tenantToEdit.address,
        maxRegisters: tenantToEdit.maxRegisters,
      })
      return
    }

    form.reset(defaultValues)
  }, [tenantToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[760px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_tenant") : t("create_tenant")}</DialogTitle>
          <DialogDescription>{t("fill_metadata")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contact_email")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("email_placeholder")} type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("phone_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("address_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxRegisters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("max_registers")}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder={t("max_registers_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner IsButton />}
                {!isSubmitting && (isEditMode ? <SquarePen className="size-4" /> : <Sparkles className="size-4" />)}
                {isEditMode ? t("update_tenant") : t("save_tenant")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
