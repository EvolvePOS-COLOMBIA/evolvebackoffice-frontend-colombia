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
import type { BusinessLoginFormValues, PlatformLoginFormValues } from "@/features/auth/types"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"

export function LoginForm() {
  const navigate = useNavigate()
  const { defaultRoute, isLogging, loginBusiness, loginPlatform } = useAuth()
  const { t } = useTranslation("auth")

  const businessForm = useForm<BusinessLoginFormValues>({
    resolver: zodResolver(businessLoginSchema(t)),
    defaultValues: {
      slug: "harbor-cafe",
      email: "owner@northstar.co",
      password: "Business123",
    },
  })

  const platformForm = useForm<PlatformLoginFormValues>({
    resolver: zodResolver(platformLoginSchema(t)),
    defaultValues: {
      email: "platform@posmanager.app",
      password: "Platform123",
    },
  })

  const handleBusinessSubmit = (values: BusinessLoginFormValues) => {
    loginBusiness(values, {
      onSuccess: (session) => {
        notify.success(t("welcome_back", { name: session.user.fullName }))
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
    <div className="grid min-h-svh gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
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
                      control={businessForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("business_slug")}</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white dark:bg-secondary"
                              placeholder={t("business_slug_placeholder")}
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

                    {platformForm.formState.errors.root ? (
                      <p className="text-sm font-medium text-destructive">
                        {platformForm.formState.errors.root.message}
                      </p>
                    ) : null}

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
                {/* <p>
                  {t("demo_platform_access")}{" "}
                  <span className="font-medium text-foreground">platform@posmanager.app</span> /
                  <span className="font-medium text-foreground"> Platform123</span>
                </p>
                <p>
                  {t("demo_business_access")} <span className="font-medium text-foreground">owner@northstar.co</span> /
                  <span className="font-medium text-foreground"> Business123</span>
                </p> */}
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

      <section className="hidden items-center lg:flex">
        <div className="mx-auto grid w-full max-w-2xl gap-4">
          <InfoPanel
            eyebrow={t("platform_control")}
            title={t("platform_control_title")}
            description={t("platform_control_desc")}
          />
          <InfoPanel
            eyebrow={t("business_operations")}
            title={t("business_operations_title")}
            description={t("business_operations_desc")}
          />
        </div>
      </section>
    </div>
  )
}

function InfoPanel({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <Card className="rounded-[30px] border-border/70 bg-background/65">
      <CardContent className="space-y-3 p-6">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-primary/80 uppercase">{eyebrow}</p>
        <h2 className="text-2xl font-semibold text-balance text-foreground">{title}</h2>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
