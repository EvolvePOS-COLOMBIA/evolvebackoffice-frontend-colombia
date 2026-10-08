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
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import type { Courier, CourierPayload } from "../types/delivery"

const ALL_BRANCHES = "__ALL__"

const schema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("courier_name_required")).max(150),
    phone: z.string().max(50),
    documentNumber: z.string().max(50),
    vehiclePlate: z.string().max(20),
    notes: z.string().max(500),
    branchId: z.string(),
  })

type FormValues = z.infer<ReturnType<typeof schema>>

const defaultValues: FormValues = {
  name: "",
  phone: "",
  documentNumber: "",
  vehiclePlate: "",
  notes: "",
  branchId: ALL_BRANCHES,
}

type CourierFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courierToEdit?: Courier | null
  branches: { id: string; name: string }[]
  onSubmit: (payload: CourierPayload) => void
  isSubmitting?: boolean
}

export function CourierFormDialog({
  open,
  onOpenChange,
  courierToEdit,
  branches,
  onSubmit,
  isSubmitting = false,
}: CourierFormDialogProps) {
  const { t } = useTranslation("business-orders")
  const isEditMode = Boolean(courierToEdit)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema(t)) as never,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      courierToEdit
        ? {
            name: courierToEdit.name,
            phone: courierToEdit.phone ?? "",
            documentNumber: courierToEdit.documentNumber ?? "",
            vehiclePlate: courierToEdit.vehiclePlate ?? "",
            notes: courierToEdit.notes ?? "",
            branchId: courierToEdit.branchId ?? ALL_BRANCHES,
          }
        : defaultValues
    )
  }, [courierToEdit, form, open])

  const handleSubmit = (values: FormValues) => {
    const clean = (v: string) => (v.trim() ? v.trim() : null)
    onSubmit({
      name: values.name.trim(),
      phone: clean(values.phone),
      documentNumber: clean(values.documentNumber),
      vehiclePlate: clean(values.vehiclePlate),
      notes: clean(values.notes),
      branchId: values.branchId === ALL_BRANCHES ? null : values.branchId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t("courier_edit") : t("courier_create")}</DialogTitle>
          <DialogDescription>{t("courier_form_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("courier_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("courier_name_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input inputMode="tel" placeholder="300 000 0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courier_document")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="vehiclePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courier_plate")}</FormLabel>
                    <FormControl>
                      <Input className="uppercase" placeholder="ABC12D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("branch")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ALL_BRANCHES}>{t("all_branches")}</SelectItem>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("courier_branch_hint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("courier_notes")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
