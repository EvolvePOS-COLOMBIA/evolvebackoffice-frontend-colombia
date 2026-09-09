import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2 } from "lucide-react"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/use-i18n"

import { businessSchema, type BusinessFormValues } from "../schemas/onboarding-schemas"
import type { BusinessStepValues, TenantSettings } from "../types"
import { StepCard, StepFooter } from "./step-frame"

type StepBusinessProps = {
  initialValues: BusinessStepValues | null
  tenantSettings: TenantSettings | undefined
  isSubmitting: boolean
  onBack: () => void
  onSubmit: (values: BusinessFormValues) => void
}

export function StepBusiness(props: StepBusinessProps) {
  const { initialValues, tenantSettings, isSubmitting, onBack, onSubmit } = props
  const { t } = useTranslation("business-onboarding")

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema(t)) as never,
    defaultValues: {
      name: "",
      nit: "",
      contactEmail: "",
      phone: "",
      address: "",
    },
  })

  // Reset form when tenant settings arrive (after F5 or initial load)
  useEffect(() => {
    if (!tenantSettings) return

    // Only reset if the form is still empty (initial load)
    const currentValues = form.getValues()
    if (currentValues.name || currentValues.nit) return

    form.reset({
      name: initialValues?.name ?? tenantSettings.name ?? "",
      nit: initialValues?.nit ?? tenantSettings.identificationNumber ?? "",
      contactEmail: initialValues?.contactEmail ?? tenantSettings.contactEmail ?? "",
      phone: initialValues?.phone ?? tenantSettings.phone ?? "",
      address: initialValues?.address ?? tenantSettings.address ?? "",
    })
  }, [tenantSettings, initialValues, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <StepCard icon={Building2} title={t("business_title")} description={t("business_description")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("legal_name")}</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white dark:bg-secondary"
                      placeholder={t("legal_name_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nit")}</FormLabel>
                  <FormControl>
                    <Input className="bg-white dark:bg-secondary" placeholder="900000000-1" {...field} />
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
                    <Input
                      className="bg-white dark:bg-secondary"
                      placeholder={t("business_email_placeholder")}
                      {...field}
                    />
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
                    <Input className="bg-white dark:bg-secondary" placeholder={t("landline_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Input className="bg-white dark:bg-secondary" placeholder={t("address_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </StepCard>

        <StepFooter
          onBack={onBack}
          backLabel={t("back")}
          submitLabel={t("save_and_continue")}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  )
}
