import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Store } from "lucide-react"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/use-i18n"

import { branchSchema, type BranchFormValues } from "../schemas/onboarding-schemas"
import type { BranchStepValues, TenantSettings } from "../types"
import { StepCard, StepFooter } from "./step-frame"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type StepBranchProps = {
  initialValues: BranchStepValues | null
  tenantSettings: TenantSettings | undefined
  adminUserId: string
  adminUserName: string
  isSubmitting: boolean
  sameAsBusiness: boolean
  onToggleSameAsBusiness: (next: boolean) => void
  onBack: () => void
  onSubmit: (values: BranchFormValues) => void
}

export function StepBranch({
  initialValues,
  tenantSettings,
  adminUserId,
  adminUserName,
  isSubmitting,
  sameAsBusiness,
  onToggleSameAsBusiness,
  onBack,
  onSubmit,
}: StepBranchProps) {
  const { t } = useTranslation("business-onboarding")

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema(t)) as never,
    defaultValues: {
      name: initialValues?.name ?? "",
      identification: initialValues?.identification ?? "",
      address: initialValues?.address ?? "",
      phone: initialValues?.phone ?? "",
      email: initialValues?.email ?? "",
      adminUserId: initialValues?.adminUserId ?? adminUserId,
    },
  })

  /** Copia dirección, teléfono y correo del negocio a la sede, o los limpia. */
  const handleToggleSame = (checked: boolean) => {
    onToggleSameAsBusiness(checked)

    if (checked) {
      form.setValue("address", tenantSettings?.address ?? "", { shouldValidate: true })
      form.setValue("phone", tenantSettings?.phone ?? "")
      form.setValue("email", tenantSettings?.contactEmail ?? "")
      return
    }

    form.setValue("address", "")
    form.setValue("phone", "")
    form.setValue("email", "")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <StepCard icon={Store} title={t("branch_title")} description={t("branch_description")}>
          <div
            className={cn(
              "flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors",
              sameAsBusiness ? "border-primary/30 bg-primary/6" : "border-border/70 bg-card/55"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("same_as_business")}</p>
              <p className="text-[13px] leading-4.5 text-muted-foreground">
                {t("same_as_business_desc", { business: tenantSettings?.name || t("the_business") })}
              </p>
            </div>
            <Switch checked={sameAsBusiness} onCheckedChange={handleToggleSame} />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branch_name")}</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white dark:bg-secondary"
                      placeholder={t("branch_name_placeholder")}
                      {...field}
                    />
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
                    <Input className="bg-white dark:bg-secondary" placeholder={t("address_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branch_identification")}</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white dark:bg-secondary"
                      placeholder={t("branch_identification_placeholder")}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white dark:bg-secondary"
                      placeholder={t("branch_email_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branch_admin")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={adminUserId}>{t("branch_admin_you", { name: adminUserName })}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </StepCard>

        <StepFooter
          onBack={onBack}
          backLabel={t("back")}
          submitLabel={t("create_branch_and_continue")}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  )
}
