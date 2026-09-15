import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plug, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import {
  useCreateBranchIntegration,
  useDeleteBranchIntegration,
  useTestBranchIntegrationConnection,
  useUpdateBranchIntegration,
} from "@/features/business/branches/hooks/use-branch-integrations"
import type {
  BranchIntegrationResponseDto,
  CreateBranchIntegrationDto,
  PlatformCode,
  UpdateBranchIntegrationDto,
} from "@/features/business/branches/types/integrations-api"

import { notify } from "@/hooks/use-notify"
import { formatDateTime } from "@/utils/format"
import { useTranslation } from "@/i18n/use-i18n"

type Props = {
  branchId: string
  platformCode: PlatformCode
  integration: BranchIntegrationResponseDto | null
}

export function IntegrationForm({ branchId, platformCode, integration }: Props) {
  const { t } = useTranslation("business-branches-config")
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isWoo = platformCode === "WOOCOMMERCE"
  const isNew = !integration

  const formSchema = z.object({
    baseUrl: z.string().min(1, "URL is required"),
    isActive: z.boolean(),
    ...(isWoo
      ? {
          consumerKey: z.string().min(1, "Consumer Key is required"),
          consumerSecret: z.string().min(1, "Consumer Secret is required"),
        }
      : {
          apiKey: z.string().min(1, "API Key is required"),
          apiSecret: z.string().optional(),
        }),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseUrl: integration?.baseUrl ?? "",
      isActive: integration?.isActive ?? true,
      ...(isWoo
        ? { consumerKey: "", consumerSecret: "" }
        : { apiKey: "", apiSecret: "" }),
    },
  })

  const createMutation = useCreateBranchIntegration()
  const updateMutation = useUpdateBranchIntegration()
  const deleteMutation = useDeleteBranchIntegration()
  const testMutation = useTestBranchIntegrationConnection()

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    testMutation.isPending

  const onSubmit = (values: FormValues) => {
    if (isNew) {
      const dto: CreateBranchIntegrationDto = {
        platformCode,
        isActive: values.isActive,
        baseUrl: values.baseUrl,
        ...(isWoo
          ? { consumerKey: values.consumerKey, consumerSecret: values.consumerSecret }
          : { apiKey: values.apiKey }),
      }
      createMutation.mutate(
        { branchId, dto },
        {
          onSuccess: () => {
            notify.success(t("integration_create_success"))
            form.reset({
              baseUrl: values.baseUrl,
              isActive: values.isActive,
              ...(isWoo
                ? { consumerKey: "", consumerSecret: "" }
                : { apiKey: "", apiSecret: "" }),
            })
          },
          onError: (err) => notify.error(err instanceof Error ? err.message : t("integration_save_error")),
        }
      )
    } else {
      const dto: UpdateBranchIntegrationDto = {
        isActive: values.isActive,
        baseUrl: values.baseUrl,
        setNewApiKey: !isWoo && values.apiKey.length > 0,
        apiKey: !isWoo ? values.apiKey : undefined,
        setNewApiSecret: false,
        apiSecret: undefined,
        setNewConsumerKey: isWoo && values.consumerKey.length > 0,
        consumerKey: isWoo ? values.consumerKey : undefined,
        setNewConsumerSecret: isWoo && values.consumerSecret.length > 0,
        consumerSecret: isWoo ? values.consumerSecret : undefined,
      }
      updateMutation.mutate(
        { branchId, id: integration.id, dto },
        {
          onSuccess: () => notify.success(t("integration_save_success")),
          onError: (err) => notify.error(err instanceof Error ? err.message : t("integration_save_error")),
        }
      )
    }
  }

  const handleTest = () => {
    if (!integration) return
    testMutation.mutate(
      { branchId, id: integration.id },
      {
        onSuccess: (result) => {
          if (result.success) {
            notify.success(t("integration_test_success"))
          } else {
            notify.error(result.message || t("integration_test_error"))
          }
        },
        onError: (err) => notify.error(err instanceof Error ? err.message : t("integration_test_error")),
      }
    )
  }

  const handleDelete = () => {
    if (!integration) return
    deleteMutation.mutate(
      { branchId, id: integration.id },
      {
        onSuccess: () => {
          notify.success(t("integration_delete_success"))
          setDeleteOpen(false)
          form.reset({
            baseUrl: "",
            isActive: true,
            ...(isWoo
              ? { consumerKey: "", consumerSecret: "" }
              : { apiKey: "", apiSecret: "" }),
          })
        },
        onError: (err) => notify.error(err instanceof Error ? err.message : t("integration_save_error")),
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Status card */}
      {integration && (
        <Card className="rounded-2xl border-border/70 bg-card/60">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge tone={integration.isActive ? "success" : "warning"}>
                    {integration.isActive ? t("integration_active") : t("integration_inactive")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("integration_last_sync")}:
                    {integration.lastSyncedAtUtc
                      ? formatDateTime(integration.lastSyncedAtUtc)
                      : ` ${t("integration_never_synced")}`}
                  </span>
                </div>
                {integration.lastError && (
                  <p className="text-xs text-destructive">{integration.lastError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={isMutating}
                >
                  {testMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plug className="size-4" />
                  )}
                  {t("integration_test")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isMutating}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isNew ? t("integration_create") : t("integration_save")}
          </CardTitle>
          <CardDescription>
            {isWoo ? t("woocommerce_help_keys") : t("cluvi_help_keys")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("integration_form_url")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("integration_form_url_placeholder")}
                        {...field}
                        disabled={isMutating}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {isWoo ? t("woocommerce_help_url") : t("cluvi_help_url")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isWoo ? (
                <>
                  <FormField
                    control={form.control}
                    name="consumerKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("integration_form_consumer_key")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("integration_form_consumer_key_placeholder")}
                            {...field}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consumerSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("integration_form_consumer_secret")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("integration_form_consumer_secret_placeholder")}
                            type="password"
                            {...field}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("integration_form_api_key")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("integration_form_api_key_placeholder")}
                            {...field}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("integration_form_api_secret")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("integration_form_api_secret_placeholder")}
                            type="password"
                            {...field}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/70 bg-card/60 p-4">
                    <div className="space-y-0.5">
                      <FormLabel>{t("integration_form_is_active")}</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {t("integration_form_is_active_hint")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isMutating}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isMutating}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {isNew ? t("integration_create") : t("integration_save")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("integration_delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("integration_delete_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
