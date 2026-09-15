import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { useTranslation } from "@/i18n/use-i18n"
import { createCustomerSchema, type CreateCustomerFormValues } from "../schemas/customer-schema"
import { IdentificationType, type CustomerResponseDto } from "../types"

type CustomerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerToEdit?: CustomerResponseDto | null
  onSubmit: (values: CreateCustomerFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: CreateCustomerFormValues = {
  firstName: "",
  lastName: "",
  identificationTypeId: IdentificationType.CedulaCiudadania,
  identificationNumber: "",
  phoneNumber: null,
  emailAddress: null,
  address: null,
  city: null,
  department: null,
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customerToEdit,
  onSubmit,
  isSubmitting = false,
}: CustomerFormDialogProps) {
  const isEditMode = Boolean(customerToEdit)
  const { t } = useTranslation("business-customers-catalog")

  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema(t)) as never,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return

    if (customerToEdit) {
      form.reset({
        firstName: customerToEdit.firstName ?? "",
        lastName: customerToEdit.lastName ?? "",
        identificationTypeId: customerToEdit.identificationTypeId || IdentificationType.CedulaCiudadania,
        identificationNumber: customerToEdit.identificationNumber ?? "",
        phoneNumber: customerToEdit.phoneNumber,
        emailAddress: customerToEdit.emailAddress,
        address: customerToEdit.address,
        city: customerToEdit.city,
        department: customerToEdit.department,
      })
      return
    }

    form.reset(defaultValues)
  }, [customerToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_customer") : t("create_customer")}</DialogTitle>
          <DialogDescription>{t("customer_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("first_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("first_name_placeholder")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("last_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("last_name_placeholder")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="identificationTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("document_type")}</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">CC</SelectItem>
                        <SelectItem value="2">CE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="identificationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("document_number")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("document_number_placeholder")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("phone_placeholder")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("email_placeholder")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("city_placeholder")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("department")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("department_placeholder")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
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
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("address_placeholder")}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
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
                {isSubmitting ? t("saving") : isEditMode ? t("update_customer") : t("create_customer")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
