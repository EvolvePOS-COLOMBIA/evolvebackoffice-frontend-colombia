import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/i18n/use-i18n"
import { PAYMENT_METHOD_CATEGORIES, type PaymentMethodResponseDto } from "../types"

const schema = (t: (key: string) => string) =>
  z.object({
    code: z
      .string()
      .min(1, t("code_required"))
      .regex(/^[A-Za-z0-9_]+$/, t("code_invalid")),
    name: z.string().min(1, t("name_required")),
    category: z.enum(PAYMENT_METHOD_CATEGORIES),
    requiresReference: z.boolean(),
    requiresAuthCode: z.boolean(),
    isCash: z.boolean(),
    allowsOffline: z.boolean(),
    allowsInTerminal: z.boolean(),
    dianCode: z.string().nullable(),
    iconKey: z.string().nullable(),
    sortOrder: z.coerce.number().min(0),
  })

type FormValues = z.infer<ReturnType<typeof schema>>

type PaymentMethodFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  methodToEdit?: PaymentMethodResponseDto | null
  onSubmit: (values: FormValues) => void
  isSubmitting?: boolean
}

const defaultValues: FormValues = {
  code: "",
  name: "",
  category: "Cash",
  requiresReference: false,
  requiresAuthCode: false,
  isCash: false,
  allowsOffline: true,
  allowsInTerminal: true,
  dianCode: null,
  iconKey: null,
  sortOrder: 0,
}

export function PaymentMethodFormDialog({
  open,
  onOpenChange,
  methodToEdit,
  onSubmit,
  isSubmitting = false,
}: PaymentMethodFormDialogProps) {
  const isEditMode = Boolean(methodToEdit)
  const { t } = useTranslation("business-payment-methods")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema(t)) as never,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return

    if (methodToEdit) {
      form.reset({
        code: methodToEdit.code,
        name: methodToEdit.name,
        category: methodToEdit.category,
        requiresReference: methodToEdit.requiresReference,
        requiresAuthCode: methodToEdit.requiresAuthCode,
        isCash: methodToEdit.isCash,
        allowsOffline: methodToEdit.allowsOffline,
        allowsInTerminal: methodToEdit.allowsInTerminal,
        dianCode: methodToEdit.dianCode,
        iconKey: methodToEdit.iconKey,
        sortOrder: methodToEdit.sortOrder,
      })
      return
    }

    form.reset(defaultValues)
  }, [methodToEdit, form, open])

  const categoryLabel = (code: string) => {
    const map: Record<string, string> = {
      Cash: t("cat_cash"),
      Transfer: t("cat_transfer"),
      CardDebit: t("cat_card_debit"),
      CardCredit: t("cat_card_credit"),
      Wallet: t("cat_wallet"),
      Voucher: t("cat_voucher"),
      Online: t("cat_online"),
      Credit: t("cat_credit"),
    }
    return map[code] ?? code
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("edit_method") : t("create_method")}</DialogTitle>
          <DialogDescription>{t("form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("code")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("code_placeholder")}
                        {...field}
                        value={field.value ?? ""}
                        disabled={isEditMode}
                      />
                    </FormControl>
                    <FormDescription>{t("code_hint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("name_placeholder")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHOD_CATEGORIES.map((code) => (
                          <SelectItem key={code} value={code}>
                            {categoryLabel(code)}
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
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sort_order")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 p-3 sm:p-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("rules")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FlagField name="isCash" label={t("is_cash")} hint={t("is_cash_hint")} control={form.control} />
                <FlagField
                  name="requiresReference"
                  label={t("requires_reference")}
                  hint={t("requires_reference_hint")}
                  control={form.control}
                />
                <FlagField
                  name="requiresAuthCode"
                  label={t("requires_auth")}
                  hint={t("requires_auth_hint")}
                  control={form.control}
                />
                <FlagField
                  name="allowsOffline"
                  label={t("allows_offline")}
                  hint={t("allows_offline_hint")}
                  control={form.control}
                />
                <FlagField
                  name="allowsInTerminal"
                  label={t("allows_terminal")}
                  hint={t("allows_terminal_hint")}
                  control={form.control}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="iconKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("icon_key")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("icon_key_placeholder")}
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
                name="dianCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dian_code")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("dian_code_placeholder")}
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
                {isSubmitting ? t("saving") : isEditMode ? t("update_method") : t("create_method")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function FlagField({
  name,
  label,
  hint,
  control,
}: {
  name: "isCash" | "requiresReference" | "requiresAuthCode" | "allowsOffline" | "allowsInTerminal"
  label: string
  hint: string
  control: ReturnType<typeof useForm<FormValues>>["control"]
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border border-border/50 p-3">
          <FormControl>
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          </FormControl>
          <div className="space-y-0.5">
            <FormLabel className="text-sm leading-none font-medium">{label}</FormLabel>
            <FormDescription className="text-xs leading-4">{hint}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  )
}
