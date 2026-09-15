import { useEffect, useState } from "react"
import { Mail, Send, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  useEmailSetting,
  useUpdateEmailSetting,
  useSendTestEmail,
} from "@/features/platform/email/hooks/use-email-settings"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

export function EmailSettingsPage() {
  const { t } = useTranslation("platform-email")
  const { data: setting, isLoading } = useEmailSetting()
  const updateMutation = useUpdateEmailSetting()
  const testMutation = useSendTestEmail()

  const [smtpServer, setSmtpServer] = useState("")
  const [smtpPort, setSmtpPort] = useState(587)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [senderEmail, setSenderEmail] = useState("")
  const [senderName, setSenderName] = useState("")
  const [encryptionType, setEncryptionType] = useState("TLS")
  const [testEmail, setTestEmail] = useState("")

  useEffect(() => {
    if (setting) {
      setSmtpServer(setting.smtpServer)
      setSmtpPort(setting.smtpPort)
      setUsername(setting.username ?? "")
      setPassword("")
      setSenderEmail(setting.senderEmail)
      setSenderName(setting.senderName)
      setEncryptionType(setting.encryptionType)
    }
  }, [setting])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(
      {
        smtpServer,
        smtpPort,
        username: username || undefined,
        password: password || undefined,
        senderEmail,
        senderName,
        encryptionType,
      },
      {
        onSuccess: () => notify.success(t("settings_saved")),
        onError: (error) => notify.error(error instanceof Error ? error.message : t("unable_to_save")),
      }
    )
  }

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail) return
    testMutation.mutate(
      { recipientEmail: testEmail },
      {
        onSuccess: () => {
          notify.success(t("test_email_sent"))
          setTestEmail("")
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
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">{t("smtp_server")}</Label>
                  <Input
                    id="smtpServer"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">{t("smtp_port")}</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">{t("smtp_username")}</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("smtp_username_placeholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("smtp_password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={setting ? t("smtp_password_placeholder_exists") : t("smtp_password_placeholder")}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">{t("sender_email")}</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="noreply@posco.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderName">{t("sender_name")}</Label>
                  <Input
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="PosCo Platform"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="encryption">{t("encryption")}</Label>
                <Select value={encryptionType} onValueChange={setEncryptionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{t("encryption_none")}</SelectItem>
                    <SelectItem value="SSL">{t("encryption_ssl")}</SelectItem>
                    <SelectItem value="TLS">{t("encryption_tls")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="size-4" />
                {updateMutation.isPending ? t("saving") : t("save")}
              </Button>
            </form>
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
            <form onSubmit={handleSendTest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">{t("recipient_email")}</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
              </div>
              <Button type="submit" disabled={testMutation.isPending || !setting}>
                <Send className="size-4" />
                {testMutation.isPending ? t("sending") : t("send_test")}
              </Button>
              {!setting && <p className="text-sm text-muted-foreground">{t("configure_smtp_first")}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
