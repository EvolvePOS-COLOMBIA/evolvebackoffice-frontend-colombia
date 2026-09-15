import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { resetPassword } from "@/features/auth/services/auth.service"
import type { PasswordResetScope } from "@/features/auth/types"
import { PASSWORD_POLICY } from "@/features/business/onboarding/schemas/onboarding-schemas"

type ResetPasswordFormValues = {
  password: string
  confirmPassword: string
}

export function ResetPasswordPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get("token") ?? ""
  const scope: PasswordResetScope = searchParams.get("scope") === "platform" ? "platform" : "tenant"
  const tenantId = searchParams.get("tenantId") ?? ""

  const [submitting, setSubmitting] = useState(false)

  const invalidLink = token.length !== 64 || (scope === "tenant" && !tenantId)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(
      z
        .object({
          password: z.string().min(8, t("password_min_length")).regex(PASSWORD_POLICY, t("password_policy")),
          confirmPassword: z.string().min(1, t("confirm_password_required")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("password_mismatch"),
          path: ["confirmPassword"],
        })
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitting(true)
    try {
      await resetPassword(token, values.password, scope, scope === "tenant" ? tenantId : undefined)
      notify.success(t("password_reset_success"))
      navigate("/login")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message
        notify.error(message ?? t("password_reset_error"))
      } else {
        notify.error(t("password_reset_error"))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (invalidLink) {
    return (
      <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_26%)]">
        <div className="grid min-h-svh place-items-center gap-8 px-4 py-8">
          <Card className="w-full max-w-xl bg-card/88">
            <CardHeader className="space-y-3 text-center">
              <Badge tone="warning" className="mx-auto w-fit">
                {t("forgot_password")}
              </Badge>
              <CardTitle className="text-2xl">{t("invalid_reset_link")}</CardTitle>
              <CardDescription>{t("invalid_reset_link_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-5">
              <ShieldCheck className="size-12 text-muted-foreground" />
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
              {t("forgot_password")}
            </Badge>
            <CardTitle className="text-2xl">{t("reset_password_title")}</CardTitle>
            <CardDescription>{t("reset_password_desc")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("new_password")}</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-white dark:bg-secondary"
                          type="password"
                          placeholder={t("password_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("confirm_password")}</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-white dark:bg-secondary"
                          type="password"
                          placeholder={t("confirm_password_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting && <Spinner IsButton />}
                  {submitting ? t("saving") : t("save_password")}
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
