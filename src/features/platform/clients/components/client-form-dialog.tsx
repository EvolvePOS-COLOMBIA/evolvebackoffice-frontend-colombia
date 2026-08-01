import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles, SquarePen } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { clientSchema } from "@/features/platform/clients/schemas/client-schema"
import type { TenantClient, TenantClientFormValues } from "@/features/platform/clients/types"
import { useTranslation } from "@/i18n/use-i18n"

type ClientFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientToEdit?: TenantClient | null
  onSubmit: (values: TenantClientFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: TenantClientFormValues = {
  businessName: "",
  slug: "",
  adminEmail: "",
  phone: "",
  status: "active",
}

export function ClientFormDialog({
  open,
  onOpenChange,
  clientToEdit,
  onSubmit,
  isSubmitting = false,
}: ClientFormDialogProps) {
  const isEditMode = Boolean(clientToEdit)
  const { t } = useTranslation("platform-clients")

  const form = useForm<TenantClientFormValues>({
    resolver: zodResolver(clientSchema(t)),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (clientToEdit) {
      form.reset({
        businessName: clientToEdit.businessName,
        slug: clientToEdit.slug,
        adminEmail: clientToEdit.adminEmail,
        phone: clientToEdit.phone,
        status: clientToEdit.status,
      })
      return
    }

    form.reset(defaultValues)
  }, [clientToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[760px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_tenant_client") : t("create_tenant_client")}</DialogTitle>
          <DialogDescription>{t("fill_metadata")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("business_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("business_name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("slug")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("slug_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="adminEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("administrator_email")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("email_placeholder")} type="email" {...field} />
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
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("phone_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="inactive">{t("inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
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
                {isEditMode ? t("update_client") : t("save_client")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
