import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles, SquarePen } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

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
import { clientSchema } from "@/features/platform/clients/schemas/client-schema"
import type { TenantClient, TenantClientFormValues } from "@/features/platform/clients/types"

type ClientFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientToEdit?: TenantClient | null
  onSubmit: (values: TenantClientFormValues) => void
  isSubmitting?: boolean
}

const defaultValues: TenantClientFormValues = {
  businessName: "",
  slug: "",
  adminEmail: "",
  phone: "",
  status: "active",
}

export function ClientFormDialog({
  open,
  onOpenChange,
  clientToEdit,
  onSubmit,
  isSubmitting = false,
}: ClientFormDialogProps) {
  const isEditMode = Boolean(clientToEdit)

  const form = useForm<TenantClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (clientToEdit) {
      form.reset({
        businessName: clientToEdit.businessName,
        slug: clientToEdit.slug,
        adminEmail: clientToEdit.adminEmail,
        phone: clientToEdit.phone,
        status: clientToEdit.status,
      })
      return
    }

    form.reset(defaultValues)
  }, [clientToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[760px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit tenant client" : "Create tenant client"}</DialogTitle>
          <DialogDescription>
            Fill in the tenant metadata used by the platform workspace and role-based routing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input placeholder="Northstar Market" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="northstar-market" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="adminEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administrator email</FormLabel>
                    <FormControl>
                      <Input placeholder="owner@northstar.co" type="email" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+57 300 111 2233" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="inactive">inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner IsButton />}
                {!isSubmitting && (isEditMode ? <SquarePen className="size-4" /> : <Sparkles className="size-4" />)}
                {isEditMode ? "Update client" : "Save client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
