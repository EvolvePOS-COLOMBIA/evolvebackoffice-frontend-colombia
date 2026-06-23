import { zodResolver } from "@hookform/resolvers/zod"
import { BookDown, Plus, Trash2, Upload } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import type { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useSoftwares } from "@/features/softwares/hooks/use-softwares"
import { useCreateVersion, useVersions } from "@/features/versions/hooks/use-versions"
import { CHANGE_TYPES, createDefaultVersionChange, versionSchema } from "@/features/versions/schemas/version-schema"
import type { VersionFormValues } from "@/features/versions/types/version-types"
import { notify } from "@/hooks/use-notify"
import { ReleaseType } from "@/types/domain"
import { formatBytes } from "@/utils/format"
import { getNextVersionNumber } from "@/utils/version-utils"
import Spinner from "@/components/Spinner"

type VersionFormInput = z.input<typeof versionSchema>
// const NO_REQUIRED_VERSION = "__none__"

export function VersionBuilderForm() {
  const navigate = useNavigate()
  const { data: softwareProducts, isLoading, isError } = useSoftwares()
  const [zipFile, setZipFile] = useState<File | null>(null)

  const form = useForm<VersionFormInput, unknown, VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      softwareProductId: "",
      versionNumber: "1.0.0.0",
      details: "",
      releaseType: ReleaseType.Testing,
      isPublicDownload: false,
      isMandatory: false,
      isActive: true,
      requiredSoftwareVersionId: "",
      publishedAtUtc: new Date().toISOString().slice(0, 10),
      zipFileName: "",
      zipFileSize: 0,
      changes: [createDefaultVersionChange()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "changes",
    keyName: "fieldKey",
  })

  const watchValues = useWatch({
    control: form.control,
  })

  const activeSoftwareId = useMemo(() => watchValues.softwareProductId ?? "", [watchValues.softwareProductId])
  const { mutate: createVersion, isPending: isCreating } = useCreateVersion(activeSoftwareId)
  const { data: existingVersions } = useVersions(activeSoftwareId)

  const isReady =
    (watchValues.softwareProductId?.length ?? 0) > 0 &&
    (watchValues.zipFileName?.length ?? 0) > 0 &&
    (watchValues.changes?.some((change) => (change.description?.trim().length ?? 0) > 0) ?? false)

  useEffect(() => {
    if (!softwareProducts || softwareProducts.length === 0) {
      return
    }

    if (form.getValues("softwareProductId").length > 0) {
      return
    }

    form.setValue("softwareProductId", softwareProducts[0].id)
    form.setValue("softwareName", softwareProducts[0].name ?? "")
    form.setValues({
      ...form.getValues(),
    })
  }, [form, softwareProducts])

  useEffect(() => {
    if (!activeSoftwareId) {
      return
    }

    const nextVersionNumber = getNextVersionNumber((existingVersions ?? []).map((version) => version.versionNumber))

    form.setValue("versionNumber", nextVersionNumber, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    })
  }, [activeSoftwareId, existingVersions, form])

  const onSubmit = (values: VersionFormValues) => {
    if (!zipFile) {
      notify.error("You must attach a .zip file.")
      form.setError("zipFileName", {
        message: "You must attach a .zip file.",
      })
      return
    }

    const payload = {
      data: {
        softwareProductId: values.softwareProductId,
        versionNumber: values.versionNumber,
        details: values.details,
        releaseType: values.releaseType,
        isPublicDownload: values.isPublicDownload,
        isMandatory: values.isMandatory,
        changes: values.changes.map((change) => ({
          id: change.id,
          type: change.type,
          description: change.description.trim(),
        })),
        isActive: values.isActive,
        requiredSoftwareVersionId: values.requiredSoftwareVersionId,
        publishedAtUtc: new Date(values.publishedAtUtc).toISOString(),
      },
      zipFile,
    }

    createVersion(payload, {
      onSuccess: (response) => navigate(`/versions/${response.id}`),
    })
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-semibold text-foreground">Loading version builder...</h1>
        <p className="mt-3 text-sm text-muted-foreground">Fetching software products from the API.</p>
      </Card>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load version builder"
        description="The builder needs software data from the API, but the request failed before the form could be prepared."
        eyebrow="Builder error"
        icon={BookDown}
        variant="inline"
      />
    )
  }

  if (!softwareProducts || softwareProducts.length === 0) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-semibold text-foreground">Add a software product first</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          A version must belong to a software product before it can be published.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/softwares">Go to Software Catalog</Link>
        </Button>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <Card>
            <CardHeader className="space-y-3">
              <Badge tone="primary" className="w-fit">
                Metadata
              </Badge>
              <CardTitle className="text-2xl">Version details and package metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="softwareProductId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Software Product</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue("softwareName", softwareProducts.find((software) => software.id === value)?.name ?? "")
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {softwareProducts.map((software) => (
                            <SelectItem key={software.id} value={software.id}>
                              {software.name}
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
                  name="releaseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Type</FormLabel>
                      <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={String(ReleaseType.Development)}>Development</SelectItem>
                          <SelectItem value={String(ReleaseType.Testing)}>Testing</SelectItem>
                          <SelectItem value={String(ReleaseType.Staging)}>Staging</SelectItem>
                          <SelectItem value={String(ReleaseType.Production)}>Production</SelectItem>
                          <SelectItem value={String(ReleaseType.Preview)}>Preview</SelectItem>
                          <SelectItem value={String(ReleaseType.Beta)}>Beta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="versionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publishedAtUtc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Date</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} placeholder="Select a date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isMandatory"
                  render={({ field }) => (
                    <FormItem className="rounded-[26px] border border-border/70 bg-accent/35 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FormLabel>Mandatory update</FormLabel>
                          <p className="text-sm text-muted-foreground">Mark this version as required for clients.</p>
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
                  name="isPublicDownload"
                  render={({ field }) => (
                    <FormItem className="rounded-[26px] border border-border/70 bg-accent/35 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FormLabel>Public download</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Allow this package to be downloaded externally.
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

              {/* <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="rounded-[26px] border border-border/70 bg-accent/35 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <FormLabel>Active version</FormLabel>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Inactive versions remain registered but should not be used.
                          </p>
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
                          {(existingVersions ?? []).map((version) => (
                            <SelectItem key={version.id} value={version.id}>
                              {version.versionNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a summary summary of this release."
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
                name="zipFileName"
                render={() => (
                  <FormItem>
                    <FormLabel>ZIP Package</FormLabel>
                    <FormControl>
                      <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-primary/25 bg-primary/6 px-6 py-8 text-center transition hover:bg-primary/10">
                        <Upload className="size-8 text-primary" />
                        <span className="mt-4 text-base font-medium text-foreground">
                          Drop a .zip file here or click to browse
                        </span>
                        <span className="mt-2 text-sm text-muted-foreground">
                          The file will be uploaded as a package.
                        </span>
                        {watchValues.zipFileName ? (
                          <div className="mt-5 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-foreground">
                            {watchValues.zipFileName} · {formatBytes(watchValues.zipFileSize ?? 0)}
                          </div>
                        ) : null}
                        <input
                          type="file"
                          accept=".zip"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0]

                            form.setValue("zipFileName", file?.name ?? "", {
                              shouldValidate: true,
                            })
                            form.setValue("zipFileSize", Number(file?.size ?? 0), {
                              shouldValidate: true,
                            })
                            setZipFile(file ?? null)
                          }}
                        />
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge tone="warning" className="w-fit">
                  Change Log
                </Badge>
                <CardTitle className="text-2xl">Dynamic technical change entries</CardTitle>
              </div>
              <Button type="button" variant="outline" onClick={() => append(createDefaultVersionChange())}>
                <Plus className="size-4" />
                Add Change
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.fieldKey} className="rounded-[26px] border-border/70 bg-accent/35 shadow-none">
                  <CardContent className="space-y-4 px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
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

                      <div className="flex items-end">
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
                  </CardContent>
                </Card>
              ))}

              {form.formState.errors.root ? (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/versions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!isReady || isCreating}>
            {isCreating && <Spinner IsButton />}
            {isCreating ? "Creating..." : "Publish Version"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
