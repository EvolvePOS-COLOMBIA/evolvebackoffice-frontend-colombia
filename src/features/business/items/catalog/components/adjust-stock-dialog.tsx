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
import { useTranslation } from "@/i18n/use-i18n"
import { adjustStockSchema, type AdjustStockFormValues } from "../schemas/item-schema"
import type { BranchItemResponseDto } from "../types"

type AdjustStockDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: BranchItemResponseDto | null
  onSubmit?: (quantity: number) => void
  isSubmitting?: boolean
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isSubmitting = false,
}: AdjustStockDialogProps) {
  const { t } = useTranslation("business-items-catalog")

  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema(t)) as never,
    defaultValues: { quantity: 0 },
  })

  useEffect(() => {
    if (open) {
      form.reset({ quantity: 0 })
    }
  }, [open, form])

  const handleSubmit = (values: AdjustStockFormValues) => {
    onSubmit?.(values.quantity)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("adjust_stock")}</DialogTitle>
          <DialogDescription>
            {t("adjust_stock_desc")} <strong>{item?.itemName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="rounded-lg border border-border/70 bg-accent/35 p-4">
              <p className="text-xs text-muted-foreground">{t("current_stock")}</p>
              <p className="text-2xl font-semibold text-foreground">{item?.quantity ?? 0}</p>
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("new_quantity")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("quantity_hint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : t("apply")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
