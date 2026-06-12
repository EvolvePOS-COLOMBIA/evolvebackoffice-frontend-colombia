import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Upload } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  defaultVersionChange,
  versionSchema,
} from "@/features/versions/schemas/version-schema"
import type { VersionFormValues } from "@/features/versions/types/version-types"
import { useAppStore } from "@/store/app-store"
import {
  CHANGE_CATEGORIES,
  RELEASE_CHANNEL_LABELS,
  RELEASE_CHANNELS,
} from "@/types/domain"
import { formatBytes } from "@/utils/format"

export function VersionBuilderForm() {
  const navigate = useNavigate()
  const softwareProducts = useAppStore((state) => state.softwareProducts)
  const createVersion = useAppStore((state) => state.createVersion)

  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      softwareId: softwareProducts[0]?.id ?? "",
      versionNumber: "1.0.0.0",
      summary: "",
      releaseChannel: "Testing",
      isCritical: false,
      releaseDate: new Date().toISOString().slice(0, 10),
      zipFileName: "",
      zipFileSize: 0,
      changes: [{ ...defaultVersionChange }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "changes",
  })

  const watchValues = useWatch({
    control: form.control,
  })
  const isReady =
    (watchValues.softwareId?.length ?? 0) > 0 &&
    (watchValues.summary?.trim().length ?? 0) > 0 &&
    (watchValues.zipFileName?.length ?? 0) > 0 &&
    (watchValues.changes?.some(
      (change) => (change.description?.trim().length ?? 0) > 0
    ) ??
      false)

  const onSubmit = (values: VersionFormValues) => {
    try {
      const versionId = createVersion(values)
      navigate(`/versions/${versionId}`)
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create the release version.",
      })
    }
  }

  if (softwareProducts.length === 0) {
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Add a software product first
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          A version must belong to a software product before it can be
          published.
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
              <CardTitle className="text-2xl">
                Version details and package metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="softwareId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Software Product</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                  name="releaseChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Channel</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RELEASE_CHANNELS.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              {RELEASE_CHANNEL_LABELS[channel]}
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
                  name="releaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isCritical"
                render={({ field }) => (
                  <FormItem className="rounded-[26px] border border-border/70 bg-accent/35 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <FormLabel>Critical Release</FormLabel>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Highlight this release across lists and details.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Summarize the scope, expected impact, rollout notes, or release intent."
                        {...field}
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
                          Demo mode stores the file name and size so the UI
                          stays backend-ready without real uploads.
                        </span>
                        {watchValues.zipFileName ? (
                          <div className="mt-5 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-foreground">
                            {watchValues.zipFileName} ·{" "}
                            {formatBytes(watchValues.zipFileSize ?? 0)}
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
                            form.setValue(
                              "zipFileSize",
                              Number(file?.size ?? 0),
                              {
                                shouldValidate: true,
                              }
                            )
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
                <CardTitle className="text-2xl">
                  Dynamic technical change entries
                </CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ ...defaultVersionChange })}
              >
                <Plus className="size-4" />
                Add Change
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className="rounded-[26px] border-border/70 bg-accent/35 shadow-none"
                >
                  <CardContent className="space-y-4 px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
                      <FormField
                        control={form.control}
                        name={`changes.${index}.category`}
                        render={({ field: nestedField }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              value={nestedField.value}
                              onValueChange={nestedField.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CHANGE_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
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
                              <Input
                                placeholder="Describe the technical change precisely."
                                {...nestedField}
                              />
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
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/versions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!isReady}>
            Publish Version
          </Button>
        </div>
      </form>
    </Form>
  )
}
