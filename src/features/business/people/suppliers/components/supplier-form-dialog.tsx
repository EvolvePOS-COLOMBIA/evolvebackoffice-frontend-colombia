import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Search } from "lucide-react"

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
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { PersonLookupBanner } from "../../../people/persons/person-lookup-banner"
import { usePersonLookup } from "../../../people/persons/use-person-lookup"
import type { PersonResponseDto } from "../../../people/persons/types"
import { createSupplierSchema, type CreateSupplierFormValues } from "../schemas/supplier-schema"
import type { SupplierResponseDto } from "../types"

type SupplierFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierToEdit?: SupplierResponseDto | null
  onSubmit: (values: CreateSupplierFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: CreateSupplierFormValues = {
  company: "",
  firstName: "",
  lastName: null,
  identificationTypeId: 1,
  identificationNumber: "",
  address: null,
  address2: null,
  phoneNumber: null,
  emailAddress: null,
  url: null,
  accountNumber: null,
  code: null,
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplierToEdit,
  onSubmit,
  isSubmitting = false,
}: SupplierFormDialogProps) {
  const isEditMode = Boolean(supplierToEdit)
  const { t } = useTranslation("business-suppliers")
  const { t: tCommon } = useTranslation("common")
  const { lookup, isLooking } = usePersonLookup()
  const [foundPerson, setFoundPerson] = useState<PersonResponseDto | null>(null)

  const form = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema(t)) as never,
    defaultValues,
  })

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevSupplierToEdit, setPrevSupplierToEdit] = useState(supplierToEdit)
  if (open !== prevOpen || supplierToEdit !== prevSupplierToEdit) {
    setPrevOpen(open)
    setPrevSupplierToEdit(supplierToEdit)
    if (open) setFoundPerson(null)
  }

  useEffect(() => {
    if (!open) return

    if (supplierToEdit) {
      form.reset({
        company: supplierToEdit.company ?? "",
        firstName: supplierToEdit.firstName ?? "",
        lastName: supplierToEdit.lastName,
        identificationTypeId: supplierToEdit.identificationTypeId || 1,
        identificationNumber: supplierToEdit.identificationNumber ?? "",
        address: supplierToEdit.address,
        address2: supplierToEdit.address2,
        phoneNumber: supplierToEdit.phoneNumber,
        emailAddress: supplierToEdit.emailAddress,
        url: supplierToEdit.url,
        accountNumber: supplierToEdit.accountNumber,
        code: supplierToEdit.code,
      })
      return
    }

    form.reset(defaultValues)
  }, [supplierToEdit, form, open])

  /**
   * Consulta la tabla Persons compartida por tipo + número de identificación.
   * Si existe, precarga los datos de la persona (incluida la empresa).
   */
  const runLookup = async (explicit: boolean) => {
    const typeId = Number(form.getValues("identificationTypeId")) || 1
    const number = form.getValues("identificationNumber") ?? ""

    if (!number.trim()) {
      if (explicit) notify.info(tCommon("person_not_found"))
      return
    }

    const person = await lookup(typeId, number)
    if (!person) {
      setFoundPerson(null)
      if (explicit) notify.info(tCommon("person_not_found"))
      return
    }

    setFoundPerson(person)
    form.reset({
      ...form.getValues(),
      firstName: person.firstName ?? "",
      lastName: person.lastName ?? "",
      address: person.address ?? "",
      phoneNumber: person.phoneNumber ?? "",
      emailAddress: person.emailAddress ?? "",
      // Si la persona ya tiene empresa registrada, se precarga también.
      company: form.getValues("company") || person.company || "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-[640px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_supplier") : t("create_supplier")}</DialogTitle>
          <DialogDescription>{t("supplier_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            {!isEditMode && (
              <div className="space-y-3 rounded-xl border border-border/60 p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t("identification_section")}
                  </p>
                  <p className="hidden text-xs text-muted-foreground sm:block">{t("identification_hint")}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <FormField
                    control={form.control}
                    name="identificationTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("document_type")}</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(Number(val))
                            setFoundPerson(null)
                          }}
                          value={String(field.value)}
                        >
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
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder={t("document_number_placeholder")}
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                field.onChange(e.target.value)
                                setFoundPerson(null)
                              }}
                              onBlur={() => void runLookup(false)}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            disabled={isLooking}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => void runLookup(true)}
                          >
                            <Search className="mr-1 size-4" />
                            {isLooking ? tCommon("person_looking") : tCommon("person_lookup")}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {foundPerson && <PersonLookupBanner person={foundPerson} onDismiss={() => setFoundPerson(null)} />}
              </div>
            )}

            <div className="space-y-4 rounded-xl border border-border/60 p-3 sm:p-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("company_section")}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("company")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("company_placeholder")} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("code")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("code_placeholder")}
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
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("url")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("url_placeholder")}
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
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("account_number")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("account_number_placeholder")}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 p-3 sm:p-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("contact_section")}
              </p>

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
                        <Input
                          placeholder={t("last_name_placeholder")}
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

              <FormField
                control={form.control}
                name="address2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address2")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("address2_placeholder")}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : isEditMode ? t("update_supplier") : t("create_supplier")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
