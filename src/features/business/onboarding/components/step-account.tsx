import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserRound } from "lucide-react"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserResponseDto } from "@/features/business/people/users/types"
import { IdentificationType } from "@/features/business/people/users/types"
import { useTranslation } from "@/i18n/use-i18n"

import { accountSchema, type AccountFormValues } from "../schemas/onboarding-schemas"
import type { AccountStepValues } from "../types"
import { StepCard, StepFooter } from "./step-frame"

type StepAccountProps = {
  initialValues: AccountStepValues | null
  backendUser: UserResponseDto | undefined
  isSubmitting: boolean
  onBack: () => void
  onSubmit: (values: AccountFormValues) => void
}

export function StepAccount({ initialValues, backendUser, isSubmitting, onBack, onSubmit }: StepAccountProps) {
  const { t } = useTranslation("business-onboarding")

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema(t)) as never,
    defaultValues: {
      firstName: "",
      lastName: "",
      identificationTypeId: IdentificationType.CedulaCiudadania,
      identificationNumber: "",
      phoneNumber: "",
      emailAddress: "",
    },
  })

  // Reset form when backend user data arrives (after F5 or initial load)
  useEffect(() => {
    if (!backendUser) return

    // Only reset if the form is still empty (initial load)
    const currentValues = form.getValues()
    if (currentValues.firstName || currentValues.lastName) return

    form.reset({
      firstName: initialValues?.firstName ?? backendUser.firstName ?? "",
      lastName: initialValues?.lastName ?? backendUser.lastName ?? "",
      identificationTypeId:
        initialValues?.identificationTypeId ?? backendUser.identificationTypeId ?? IdentificationType.CedulaCiudadania,
      identificationNumber: initialValues?.identificationNumber ?? backendUser.identificationNumber ?? "",
      phoneNumber: initialValues?.phoneNumber ?? backendUser.phoneNumber ?? "",
      emailAddress: initialValues?.emailAddress ?? backendUser.emailAddress ?? backendUser.email ?? "",
    })
  }, [backendUser, initialValues, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <StepCard icon={UserRound} title={t("account_title")} description={t("account_description")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("first_name")}</FormLabel>
                  <FormControl>
                    <Input className="bg-white dark:bg-secondary" {...field} />
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
                    <Input className="bg-white dark:bg-secondary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identificationTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("document_type")}</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{t("document_type_cc")}</SelectItem>
                      <SelectItem value="2">{t("document_type_ce")}</SelectItem>
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
                    <Input
                      className="bg-white dark:bg-secondary"
                      placeholder={t("document_number_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input className="bg-white dark:bg-secondary" placeholder={t("phone_placeholder")} {...field} />
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
                  <FormLabel>{t("contact_email")}</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white dark:bg-secondary"
                      placeholder={t("contact_email_placeholder")}
                      {...field}
                    />
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
