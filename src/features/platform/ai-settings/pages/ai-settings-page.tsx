import { useEffect } from "react"
import { Bot, Save, Sparkles } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type Resolver } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  useAiSetting,
  useTestAiSetting,
  useUpdateAiSetting,
} from "@/features/platform/ai-settings/hooks/use-ai-settings"
import { aiSettingsSchema } from "@/features/platform/ai-settings/schemas/ai-schema"
import type { AiSettingsFormValues } from "@/features/platform/ai-settings/schemas/ai-schema"
import { getApiErrorMessage } from "@/utils/api-error"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

export function AiSettingsPage() {
  const { t } = useTranslation("platform-ai-settings")
  const { data: setting, isLoading } = useAiSetting()
  const updateMutation = useUpdateAiSetting()
  const testMutation = useTestAiSetting()

  const form = useForm<AiSettingsFormValues>({
    resolver: zodResolver(aiSettingsSchema(t)) as unknown as Resolver<AiSettingsFormValues>,
    defaultValues: {
      baseUrl: "",
      model: "",
      apiKey: "",
    },
  })

  useEffect(() => {
    if (setting) {
      form.reset({
        baseUrl: setting.baseUrl,
        model: setting.model,
        apiKey: "",
      })
    }
  }, [setting, form])

  const handleSave = (values: AiSettingsFormValues) => {
    updateMutation.mutate(
      {
        baseUrl: values.baseUrl,
        model: values.model,
        apiKey: values.apiKey || undefined,
      },
      {
        onSuccess: () => notify.success(t("settings_saved")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("unable_to_save"))),
      }
    )
  }

  const handleTest = () => {
    testMutation.mutate(undefined, {
      onSuccess: (result) => notify.success(result.message || t("test_success")),
      onError: (error) => notify.error(getApiErrorMessage(error, t("test_failed"))),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("ai_settings")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("ai_configuration")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("ai_desc")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Card className="max-h-min rounded-3xl">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  {t("status")}
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {setting ? (
                    <span className="text-green-600">{t("configured")}</span>
                  ) : (
                    <span className="text-yellow-600">{t("not_configured")}</span>
                  )}
                </p>
                {setting ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("api_key_status")}: {setting.hasApiKey ? t("api_key_saved") : t("api_key_missing")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5" />
              {t("provider_settings")}
            </CardTitle>
            <CardDescription>{t("provider_settings_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("base_url")}</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.openai.com/v1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("model")}</FormLabel>
                      <FormControl>
                        <Input placeholder="gpt-4o-mini" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("api_key")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={setting?.hasApiKey ? t("api_key_placeholder_exists") : t("api_key_placeholder")}
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="size-4" />
                  {updateMutation.isPending ? t("saving") : t("save")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              {t("test_connection")}
            </CardTitle>
            <CardDescription>{t("test_connection_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("test_connection_hint")}</p>
            <Button type="button" onClick={handleTest} disabled={testMutation.isPending || !setting}>
              <Sparkles className="size-4" />
              {testMutation.isPending ? t("testing") : t("test_button")}
            </Button>
            {!setting && <p className="text-sm text-muted-foreground">{t("configure_provider_first")}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
