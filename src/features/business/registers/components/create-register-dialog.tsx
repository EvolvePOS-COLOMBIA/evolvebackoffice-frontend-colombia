import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"

import Spinner from "@/components/Spinner"
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
import { registerCreateSchema } from "@/features/business/registers/schemas/register-schema"
import type { RegisterFormValues } from "@/features/business/registers/types"
import { useBranches } from "@/features/business/branches/hooks/use-branches"
import { useTranslation } from "@/i18n/use-i18n"

type CreateRegisterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RegisterFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: RegisterFormValues = {
  name: "",
  code: "",
  branchPublicId: "",
  deviceIdentifier: "",
  serialCode: "",
}

export function CreateRegisterDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateRegisterDialogProps) {
  const { t } = useTranslation("business-registers")
  const { data: branchesPage, isLoading: branchesLoading } = useBranches(1, 1000)
  const branches = branchesPage?.data ?? []

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerCreateSchema(t)) as Resolver<RegisterFormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(defaultValues)
  }, [open, form])

  const handleSubmit = (values: RegisterFormValues) => {
    const payload: RegisterFormValues = {
      ...values,
      deviceIdentifier: values.deviceIdentifier || undefined as unknown as string,
      serialCode: values.serialCode || undefined as unknown as string,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("create_title")}</DialogTitle>
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("code_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("code_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="branchPublicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branch_label")}</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={branchesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("branch_placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="deviceIdentifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("device_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("device_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("serial_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("serial_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || branchesLoading}>
                {isSubmitting && <Spinner IsButton />}
                {!isSubmitting && <Plus className="size-4" />}
                {t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
