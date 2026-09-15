import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, MailCheck } from "lucide-react"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { requestPasswordReset } from "@/features/auth/services/auth.service"
import type { PasswordResetScope } from "@/features/auth/types"

type ForgotPasswordFormValues = {
  email: string
  tenantId: string
}

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth")
  const [searchParams] = useSearchParams()
  const scope: PasswordResetScope = searchParams.get("scope") === "platform" ? "platform" : "tenant"
  const requiresTenant = scope === "tenant"

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(
      z.object({
        email: z.string().email(t("email_validation")),
        tenantId: requiresTenant ? z.string().min(1, t("tenant_public_id_validation")) : z.string(),
      })
    ),
    defaultValues: {
      email: "",
      tenantId: searchParams.get("tenantId") ?? "",
    },
  })

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setSubmitting(true)
    try {
      await requestPasswordReset(values.email, scope, requiresTenant ? values.tenantId : undefined)
      setSubmitted(true)
    } catch {
      notify.error(t("password_reset_error"))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_26%)]">
        <div className="grid min-h-svh place-items-center gap-8 px-4 py-8">
          <Card className="w-full max-w-xl bg-card/88">
            <CardHeader className="space-y-3 text-center">
              <Badge tone="primary" className="mx-auto w-fit">
                {t("forgot_password")}
              </Badge>
              <CardTitle className="text-2xl">{t("reset_link_sent")}</CardTitle>
              <CardDescription>{t("reset_link_sent_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-5">
              <MailCheck className="size-12 text-primary" />
              <Button asChild variant="outline">
                <Link to="/login">
                  <ArrowLeft className="size-4" />
                  {t("back_to_login")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_26%)]">
      <div className="grid min-h-svh place-items-center gap-8 px-4 py-8">
        <Card className="w-full max-w-xl bg-card/88">
          <CardHeader className="space-y-3">
            <Badge tone="primary" className="w-fit">
              {requiresTenant ? t("business_admin") : t("platform_admin")}
            </Badge>
            <CardTitle className="text-2xl">{t("forgot_password_title")}</CardTitle>
            <CardDescription>{t("forgot_password_desc")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
                {requiresTenant && (
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("tenant_public_id")}</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white dark:bg-secondary"
                            placeholder={t("tenant_public_id_placeholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-white dark:bg-secondary"
                          type="email"
                          placeholder={t("email_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting && <Spinner IsButton />}
                  {submitting ? t("sending") : t("send_reset_link")}
                </Button>

                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to="/login">
                    <ArrowLeft className="size-4" />
                    {t("back_to_login")}
                  </Link>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
