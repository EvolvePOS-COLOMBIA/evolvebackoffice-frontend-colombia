import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkles } from "lucide-react"
import { useForm } from "react-hook-form"

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
import { Textarea } from "@/components/ui/textarea"
import { softwareSchema } from "@/features/softwares/schemas/software-schema"
import type { SoftwareFormValues } from "@/features/softwares/types/software-types"
import { useAppStore } from "@/store/app-store"

type SoftwareFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SoftwareFormDialog({ open, onOpenChange }: SoftwareFormDialogProps) {
  const addSoftware = useAppStore((state) => state.addSoftware)

  const form = useForm<SoftwareFormValues>({
    resolver: zodResolver(softwareSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onSubmit = (values: SoftwareFormValues) => {
    try {
      addSoftware(values)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to create the software record.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Software Product</DialogTitle>
          <DialogDescription>
            In production this form will call `POST /api/softwares` and receive the final backend-generated software
            code.
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
                    <Input placeholder="EvolvePOS BackOffice" {...field} />
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
                      placeholder="Describe the product scope, technical context, or business area."
                      {...field}
                    />
                  </FormControl>
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
              <Button type="submit">
                <Sparkles className="size-4" />
                Save Software
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
