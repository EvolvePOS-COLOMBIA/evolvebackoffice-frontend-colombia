import { useEffect } from "react"
import { Mail, Send, Save } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type Resolver } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useEmailSetting,
  useUpdateEmailSetting,
  useSendTestEmail,
} from "@/features/platform/email/hooks/use-email-settings"
import { emailSettingsSchema, sendTestEmailSchema } from "@/features/platform/email/schemas/email-schema"
import type { EmailSettingsFormValues, SendTestEmailFormValues } from "@/features/platform/email/schemas/email-schema"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

export function EmailSettingsPage() {
  const { t } = useTranslation("platform-email")
  const { data: setting, isLoading } = useEmailSetting()
  const updateMutation = useUpdateEmailSetting()
  const testMutation = useSendTestEmail()

  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema(t)) as unknown as Resolver<EmailSettingsFormValues>,
    defaultValues: {
      smtpServer: "",
      smtpPort: 587,
      username: "",
      password: "",
      senderEmail: "",
      senderName: "",
      encryptionType: "TLS",
    },
  })

  const testForm = useForm<SendTestEmailFormValues>({
    resolver: zodResolver(sendTestEmailSchema(t)) as unknown as Resolver<SendTestEmailFormValues>,
    defaultValues: {
      recipientEmail: "",
    },
  })

  useEffect(() => {
    if (setting) {
      form.reset({
        smtpServer: setting.smtpServer,
        smtpPort: setting.smtpPort,
        username: setting.username ?? "",
        password: "",
        senderEmail: setting.senderEmail,
        senderName: setting.senderName,
        encryptionType: setting.encryptionType,
      })
    }
  }, [setting, form])

  const handleSave = (values: EmailSettingsFormValues) => {
    updateMutation.mutate(
      {
        smtpServer: values.smtpServer,
        smtpPort: values.smtpPort,
        username: values.username || undefined,
        password: values.password || undefined,
        senderEmail: values.senderEmail,
        senderName: values.senderName,
        encryptionType: values.encryptionType,
      },
      {
        onSuccess: () => notify.success(t("settings_saved")),
        onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      }
    )
  }

  const handleSendTest = (values: SendTestEmailFormValues) => {
    testMutation.mutate(
      { recipientEmail: values.recipientEmail },
      {
        onSuccess: () => {
          notify.success(t("test_email_sent"))
          testForm.reset()
        },
        onError: (error) => notify.error(error instanceof Error ? error.message : t("test_email_failed")),
      }
    )
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
            <Badge tone="primary">{t("email_settings")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("smtp_configuration")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("smtp_desc")}</p>
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
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              {t("smtp_settings")}
            </CardTitle>
            <CardDescription>{t("smtp_settings_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="smtpServer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("smtp_server")}</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("smtp_port")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("smtp_username")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("smtp_username_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("smtp_password")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={
                              setting ? t("smtp_password_placeholder_exists") : t("smtp_password_placeholder")
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sender_email")}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="noreply@posco.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sender_name")}</FormLabel>
                        <FormControl>
                          <Input placeholder="PosCo Platform" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="encryptionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("encryption")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NONE">{t("encryption_none")}</SelectItem>
                          <SelectItem value="SSL">{t("encryption_ssl")}</SelectItem>
                          <SelectItem value="TLS">{t("encryption_tls")}</SelectItem>
                        </SelectContent>
                      </Select>
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
              <Send className="size-5" />
              {t("send_test")}
            </CardTitle>
            <CardDescription>{t("send_test_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...testForm}>
              <form onSubmit={testForm.handleSubmit(handleSendTest)} className="space-y-4">
                <FormField
                  control={testForm.control}
                  name="recipientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("recipient_email")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="test@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={testMutation.isPending || !setting}>
                  <Send className="size-4" />
                  {testMutation.isPending ? t("sending") : t("send_test")}
                </Button>
                {!setting && <p className="text-sm text-muted-foreground">{t("configure_smtp_first")}</p>}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
