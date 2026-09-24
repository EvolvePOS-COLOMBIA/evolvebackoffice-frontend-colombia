import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/i18n/use-i18n"
import { useCreateTaxRate, useUpdateTaxRate } from "../hooks/use-tax-rates"
import { taxRateSchema, type TaxRateFormValues } from "../schemas/tax-rate-schema"
import {
  percentToRate,
  rateToPercent,
  taxTypeTextKey,
  type CreateTaxRateDto,
  type TaxRate,
  type UpdateTaxRateDto,
} from "../types"

type TaxRateFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxRateToEdit?: TaxRate | null
}

/** Códigos del enum TaxType soportados por el backend. */
const TAX_TYPE_OPTIONS = [0, 1, 2, 3, 4, 99]

const defaultValues: TaxRateFormValues = {
  name: "",
  countryCode: "CO",
  taxType: 0,
  ratePercent: 0,
  regionCode: "",
  description: "",
  isDefault: false,
}

export function TaxRateFormDialog({ open, onOpenChange, taxRateToEdit }: TaxRateFormDialogProps) {
  const isEditMode = Boolean(taxRateToEdit)
  const { t } = useTranslation("business-items-taxes")
  const createTaxRate = useCreateTaxRate()
  const updateTaxRate = useUpdateTaxRate()

  const form = useForm<TaxRateFormValues>({
    resolver: zodResolver(taxRateSchema(t)) as Resolver<TaxRateFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    if (taxRateToEdit) {
      form.reset({
        name: taxRateToEdit.name,
        countryCode: taxRateToEdit.countryCode,
        taxType: taxRateToEdit.taxType,
        ratePercent: rateToPercent(taxRateToEdit.rate),
        regionCode: taxRateToEdit.regionCode ?? "",
        description: taxRateToEdit.description ?? "",
        isDefault: taxRateToEdit.isDefault,
      })
      return
    }
    form.reset(defaultValues)
  }, [taxRateToEdit, form, open])

  const handleSubmit = (values: TaxRateFormValues) => {
    const rate = percentToRate(values.ratePercent)

    if (isEditMode && taxRateToEdit) {
      // El backend solo actualiza nombre/tasa/flag/región/descripción (no país ni tipo)
      const payload: UpdateTaxRateDto = {
        name: values.name,
        rate,
        isDefault: values.isDefault,
        regionCode: values.regionCode ? values.regionCode : null,
        description: values.description ? values.description : null,
      }
      updateTaxRate.mutate({ id: taxRateToEdit.id, payload }, { onSuccess: () => onOpenChange(false) })
      return
    }

    const payload: CreateTaxRateDto = {
      countryCode: values.countryCode,
      name: values.name,
      taxType: values.taxType,
      rate,
      isDefault: values.isDefault,
      regionCode: values.regionCode ? values.regionCode : null,
      description: values.description ? values.description : null,
    }
    createTaxRate.mutate(payload, { onSuccess: () => onOpenChange(false) })
  }

  const isSubmitting = createTaxRate.isPending || updateTaxRate.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-140">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_title") : t("create_title")}</DialogTitle>
          <DialogDescription>{t("create_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("country_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("country_placeholder")} disabled={isEditMode} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tax_type_label")}</FormLabel>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("tax_type_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TAX_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {t(taxTypeTextKey(option))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ratePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("rate_label")}</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type="number" min={0} max={100} step="0.01" className="pr-8" {...field} />
                      </FormControl>
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                        {t("rate")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("rate_hint")}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regionCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("region_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("region_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("description_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditMode ? <p className="text-xs text-muted-foreground">{t("edit_locked_hint")}</p> : null}

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <FormLabel>{t("is_default_label")}</FormLabel>
                    <p className="text-xs text-muted-foreground">{t("is_default_hint")}</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
                {isSubmitting ? t("saving") : isEditMode ? t("update") : t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
