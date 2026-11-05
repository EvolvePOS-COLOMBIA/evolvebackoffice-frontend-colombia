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
import { PersonLookupBanner } from "../../persons/person-lookup-banner"
import { usePersonLookup } from "../../persons/use-person-lookup"
import type { PersonResponseDto } from "../../persons/types"
import { createCustomerSchema, type CreateCustomerFormValues } from "../schemas/customer-schema"
import type { CustomerResponseDto } from "../types"

type CustomerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerToEdit?: CustomerResponseDto | null
  onSubmit: (values: CreateCustomerFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: CreateCustomerFormValues = {
  firstName: "",
  lastName: null,
  identificationTypeId: 1,
  identificationNumber: "",
  address: null,
  phoneNumber: null,
  emailAddress: null,
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
  const { t } = useTranslation("business-customers")
  const { t: tCommon } = useTranslation("common")
  const { lookup, isLooking } = usePersonLookup()
  const [foundPerson, setFoundPerson] = useState<PersonResponseDto | null>(null)

  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema(t)) as never,
    defaultValues,
  })

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevCustomerToEdit, setPrevCustomerToEdit] = useState(customerToEdit)
  if (open !== prevOpen || customerToEdit !== prevCustomerToEdit) {
    setPrevOpen(open)
    setPrevCustomerToEdit(customerToEdit)
    if (open) setFoundPerson(null)
  }

  useEffect(() => {
    if (!open) return

    if (customerToEdit) {
      form.reset({
        firstName: customerToEdit.firstName ?? "",
        lastName: customerToEdit.lastName,
        identificationTypeId: customerToEdit.identificationTypeId || 1,
        identificationNumber: customerToEdit.identificationNumber ?? "",
        address: customerToEdit.address,
        phoneNumber: customerToEdit.phoneNumber,
        emailAddress: customerToEdit.emailAddress,
        city: customerToEdit.city,
        department: customerToEdit.department,
      })
      return
    }

    form.reset(defaultValues)
  }, [customerToEdit, form, open])

  /**
   * Consulta la tabla Persons compartida por tipo + número de identificación.
   * Si existe, precarga todos los datos de la persona en el formulario.
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
      city: person.city ?? "",
      // Person.State guarda el departamento cuando viene de la ficha de persona.
      department: person.state ?? "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-[640px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_customer") : t("create_customer")}</DialogTitle>
          <DialogDescription>{t("customer_form_desc")}</DialogDescription>
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
