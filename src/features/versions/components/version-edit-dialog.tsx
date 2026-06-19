import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, SquarePen, Trash2 } from "lucide-react"
import { useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import type { z } from "zod"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { useUpdateVersion } from "@/features/versions/hooks/use-versions"
import {
  CHANGE_TYPES,
  createDefaultVersionChange,
  updateVersionSchema,
} from "@/features/versions/schemas/version-schema"
import type { UpdateVersionFormValues } from "@/features/versions/types/version-types"
import type { SoftwareVersionResponse } from "@/types/domain"
import { serializeVersionChanges } from "@/utils/version-utils"

const NO_REQUIRED_VERSION = "__none__"

type VersionEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: SoftwareVersionResponse
  availableVersions: SoftwareVersionResponse[]
}

type UpdateVersionFormInput = z.input<typeof updateVersionSchema>

function getDefaultValues(version: SoftwareVersionResponse): UpdateVersionFormInput {
  return {
    details: version.details ?? "",
    isMandatory: version.isMandatory,
    isActive: version.isActive,
    requiredSoftwareVersionId: version.requiredSoftwareVersionId ?? "",
    changes:
      version.changes.length > 0
        ? version.changes.map((change) => ({
            id: change.id,
            type: change.type,
            description: change.description,
          }))
        : [createDefaultVersionChange()],
  }
}

export function VersionEditDialog({ open, onOpenChange, version, availableVersions }: VersionEditDialogProps) {
  const { mutate: updateVersion, isPending: isUpdating } = useUpdateVersion()

  const form = useForm<UpdateVersionFormInput, unknown, UpdateVersionFormValues>({
    resolver: zodResolver(updateVersionSchema),
    defaultValues: getDefaultValues(version),
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "changes",
    keyName: "fieldKey",
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(getDefaultValues(version))
  }, [form, open, version])

  const onSubmit = (values: UpdateVersionFormValues) => {
    const changes = values.changes.map((change) => ({
      id: change.id.trim() || crypto.randomUUID(),
      type: change.type,
      description: change.description.trim(),
    }))

    updateVersion(
      {
        versionId: version.id,
        data: {
          details: values.details,
          isActive: values.isActive,
          isMandatory: values.isMandatory,
          requiredSoftwareVersionId: values.requiredSoftwareVersionId,
          changes,
          changesJson: serializeVersionChanges(changes),
        },
      },
      {
        onSuccess: () => {
          form.reset(getDefaultValues(version))
          onOpenChange(false)
        },
        onError: (error) => {
          form.setError("root", {
            message: error instanceof Error ? error.message : "Unable to update the release version.",
          })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-7xl max-w-[calc(100%-5rem)] flex-col overflow-hidden">
        <DialogHeader>
          <Badge className="max-w-max" tone="primary">
            {version.softwareName ?? "Unknown software"}
          </Badge>
          <DialogTitle className="text-3xl font-bold">
            {version?.softwareName ?? "Unknown software"} - {version.versionNumber}
          </DialogTitle>
          <DialogDescription className="-mt-1 text-muted-foreground">
            Update only the fields currently supported by the API: summary, activation flags, dependency and changelog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="mt-2 flex min-h-0 flex-1 flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex min-h-0 w-full flex-col gap-8 xl:flex-row">
              <div className="w-full space-y-6 xl:max-w-[48%]">
                <FormField
                  control={form.control}
                  name="requiredSoftwareVersionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required version</FormLabel>
                      <Select
                        value={field.value ?? NO_REQUIRED_VERSION}
                        onValueChange={(value) => field.onChange(value === NO_REQUIRED_VERSION ? "" : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No dependency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_REQUIRED_VERSION}>No dependency</SelectItem>
                          {availableVersions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.versionNumber}
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
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain the release context, rollout notes or technical summary."
                          rows={7}
                          style={{ resize: "none" }}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="isMandatory"
                    render={({ field }) => (
                      <FormItem className="rounded-[26px] border border-border/70 bg-accent/35 px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <FormLabel>Mandatory update</FormLabel>
                            <p className="text-sm text-muted-foreground">Force clients to move to this release.</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </div>
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
                            <FormLabel>Active version</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Keep the release available for the application.
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex min-h-0 w-full flex-col space-y-4 xl:max-w-[52%]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">Changelog</h3>
                      <Badge tone="neutral">{fields.length + " changes"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Keep at least one technical change entry.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => append(createDefaultVersionChange())}>
                    <Plus className="size-4" />
                    Add Change
                  </Button>
                </div>

                <div className="custom-scrollbar h-[340px] max-h-[340px] space-y-4 overflow-y-auto pr-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.fieldKey}
                      className="grid items-center justify-between gap-4 rounded-[26px] border border-border/70 bg-accent/35 p-4 md:grid-cols-[180px_1fr_auto]"
                    >
                      <FormField
                        control={form.control}
                        name={`changes.${index}.type`}
                        render={({ field: nestedField }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select value={nestedField.value} onValueChange={nestedField.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CHANGE_TYPES.map((changeType) => (
                                  <SelectItem key={changeType} value={changeType}>
                                    {changeType}
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
                        name={`changes.${index}.description`}
                        render={({ field: nestedField }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Describe the technical change precisely." {...nestedField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="mt-6 flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? <Spinner IsButton /> : <SquarePen className="size-4" />}
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
