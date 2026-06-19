import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import type { z } from "zod"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { softwareSchema } from "@/features/softwares/schemas/software-schema"
import type { SoftwareFormValues } from "@/features/softwares/types/software-types"
import type { SoftwareResponse } from "@/types/domain"
import { useCreateSoftware, useUpdateSoftware } from "@/features/softwares/hooks/use-softwares"
import Spinner from "@/components/Spinner"

type SoftwareFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  softwareToEdit?: SoftwareResponse | null
}

type SoftwareFormInput = z.input<typeof softwareSchema>

export function SoftwareFormDialog(props: SoftwareFormDialogProps) {
  const { open, onOpenChange, softwareToEdit } = props

  const { mutate: createSoftware, isPending: isCreating } = useCreateSoftware()
  const { mutate: updateSoftware, isPending: isUpdating } = useUpdateSoftware()

  const isSubmitting = isCreating || isUpdating
  const isEditMode = softwareToEdit !== null

  const form = useForm<SoftwareFormInput, unknown, SoftwareFormValues>({
    resolver: zodResolver(softwareSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        description: "",
        isActive: true,
      })
      return
    }

    if (softwareToEdit) {
      form.reset({
        name: softwareToEdit.name,
        description: softwareToEdit.description ?? "",
        isActive: softwareToEdit.isActive,
      })
    }
  }, [form, open, softwareToEdit])

  const onSubmit = (values: SoftwareFormValues) => {
    const payload = {
      softwareId: softwareToEdit?.id ?? "",
      data: values,
    }

    if (softwareToEdit) {
      updateSoftware(payload, {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          form.setError("root", {
            message: error instanceof Error ? error.message : "Unable to update the software.",
          })
        },
      })
      return
    }

    createSoftware(values, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        form.setError("root", {
          message: error instanceof Error ? error.message : "Unable to create the software.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{softwareToEdit ? "Edit Software Product" : "Create Software Product"}</DialogTitle>
          <DialogDescription>
            {softwareToEdit
              ? "Update the software product details (Description, Active). name is read-only."
              : "Fill in the details of the software product to create (Name, Description, Active)."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="EvolvePOS BackOffice" {...field} readOnly={isEditMode} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional: scope, technical context, or business area."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="rounded-[26px] border border-border/70 bg-accent/35 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">Inactive software should not accept new versions.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner IsButton />}
                {isSubmitting ? "Saving..." : "Save "}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
