import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Building2, ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import Spinner from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { businessLoginSchema, platformLoginSchema } from "@/features/auth/schemas/login-schema"
import type { PlatformLoginFormValues, TenantLoginFormValues } from "@/features/auth/types"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

export function LoginForm() {
  const navigate = useNavigate()
  const { defaultRoute, isLogging, loginBusiness, loginPlatform } = useAuth()
  const { t } = useTranslation("auth")

  const businessForm = useForm<TenantLoginFormValues>({
    resolver: zodResolver(businessLoginSchema(t)),
    defaultValues: {
      tenantPublicId: "",
      email: "joaquin@urspos.com",
      password: "Guar123!",
    },
  })

  const platformForm = useForm<PlatformLoginFormValues>({
    resolver: zodResolver(platformLoginSchema(t)),
    defaultValues: {
      email: "giovany@urspos.com",
      password: "Guar123!",
    },
  })

  const handleBusinessSubmit = (values: TenantLoginFormValues) => {
    loginBusiness(values, {
      onSuccess: (session) => {
        notify.success(t("welcome_back", { name: session.user.fullName }))
        // Siempre ir al dashboard. El OnboardingGate se encargará de redirigir
        // al onboarding si es necesario, y el modal de cambio de contraseña
        // aparecerá si forcePasswordChange es true.
        navigate("/business/dashboard")
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : t("sign_in_error")
        notify.error(message)
        businessForm.setError("root", { message })
      },
    })
  }

  const handlePlatformSubmit = (values: PlatformLoginFormValues) => {
    loginPlatform(values, {
      onSuccess: (session) => {
        notify.success(t("welcome_back", { name: session.user.fullName }))
        navigate("/platform/dashboard")
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : t("sign_in_error")
        notify.error(message)
        platformForm.setError("root", { message })
      },
    })
  }

  return (
    <div className="grid min-h-svh gap-8 px-4 py-8 lg:px-8">
      <section className="flex items-center">
        <Card className="mx-auto w-full max-w-xl bg-card/88">
          <CardHeader className="space-y-3">
            <Badge tone="primary" className="w-fit">
              {t("multitenant_access")}
            </Badge>
            <CardTitle className="text-2xl">{t("sign_in_to_pos_manager")}</CardTitle>
            <CardDescription>{t("use_tab_description")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Tabs defaultValue="business" className="space-y-5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="business">
                  <Building2 className="mr-2 size-4" />
                  {t("business_admin")}
                </TabsTrigger>
                <TabsTrigger value="platform">
                  <ShieldCheck className="mr-2 size-4" />
                  {t("platform_admin")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="business">
                <Form {...businessForm}>
                  <form className="space-y-5" onSubmit={businessForm.handleSubmit(handleBusinessSubmit)}>
                    <FormField
                      // control={businessForm.control}
                      name="tenantPublicId"
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

                    <FormField
                      control={businessForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("email")}</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white dark:bg-secondary"
                              placeholder={t("email_placeholder")}
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("password")}</FormLabel>
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

                    {businessForm.formState.errors.root ? (
                      <p className="text-sm font-medium text-destructive">
                        {businessForm.formState.errors.root.message}
                      </p>
                    ) : null}

                    <Button type="submit" size="lg" className="w-full" disabled={isLogging}>
                      {isLogging && <Spinner IsButton />}
                      {isLogging ? t("signing_in") : t("continue_as_business_admin")}
                      {!isLogging && <ArrowRight className="size-4" />}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="platform">
                <Form {...platformForm}>
                  <form className="space-y-5" onSubmit={platformForm.handleSubmit(handlePlatformSubmit)}>
                    <FormField
                      control={platformForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("email")}</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white dark:bg-secondary"
                              placeholder={t("email_placeholder")}
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={platformForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("password")}</FormLabel>
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

                    <Button type="submit" size="lg" className="w-full" disabled={isLogging}>
                      {isLogging && <Spinner IsButton />}
                      {isLogging ? t("signing_in") : t("continue_as_platform_admin")}
                      {!isLogging && <ArrowRight className="size-4" />}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <Card className="rounded-3xl border-primary/20 bg-primary/8 shadow-none">
              <CardContent className="space-y-3 px-4 py-4 text-sm leading-6 text-muted-foreground">
                <p>
                  {t("press")} <kbd className="rounded-md border px-1.5 py-0.5 text-xs">d</kbd> {t("toggle_theme_hint")}
                </p>
              </CardContent>
            </Card>

            {defaultRoute !== "/login" ? (
              <p className="text-center text-sm text-muted-foreground">{t("authenticated_redirect")}</p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
