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

export function LoginForm() {
  const navigate = useNavigate()
  const { defaultRoute, isLogging, loginBusiness, loginPlatform } = useAuth()

  const businessForm = useForm<BusinessLoginFormValues>({
    resolver: zodResolver(businessLoginSchema),
    defaultValues: {
      slug: "harbor-cafe",
      email: "owner@northstar.co",
      password: "Business123",
    },
  })

  const platformForm = useForm<PlatformLoginFormValues>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: {
      email: "platform@posmanager.app",
      password: "Platform123",
    },
  })

  const handleBusinessSubmit = (values: BusinessLoginFormValues) => {
    loginBusiness(values, {
      onSuccess: (session) => {
        notify.success(`Welcome back, ${session.user.fullName}.`)
        navigate("/business/dashboard")
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Unable to sign in right now."
        notify.error(message)
        businessForm.setError("root", { message })
      },
    })
  }

  const handlePlatformSubmit = (values: PlatformLoginFormValues) => {
    loginPlatform(values, {
      onSuccess: (session) => {
        notify.success(`Welcome back, ${session.user.fullName}.`)
        navigate("/platform/dashboard")
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Unable to sign in right now."
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
              Multitenant access
            </Badge>
            <CardTitle className="text-2xl">Sign in to POS Manager</CardTitle>
            <CardDescription>
              Use the tab that matches your role. Sessions, active business selection, and theme are persisted.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Tabs defaultValue="business" className="space-y-5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="business">
                  <Building2 className="mr-2 size-4" />
                  Business Admin
                </TabsTrigger>
                <TabsTrigger value="platform">
                  <ShieldCheck className="mr-2 size-4" />
                  Platform Admin
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
                          <FormLabel>Business slug</FormLabel>
                          <FormControl>
                            <Input className="bg-white dark:bg-secondary" placeholder="northstar-market" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white dark:bg-secondary"
                              placeholder="owner@northstar.co"
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white dark:bg-secondary"
                              type="password"
                              placeholder="Minimum 6 characters"
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
                      {isLogging ? "Signing in" : "Continue as Business Admin"}
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white dark:bg-secondary"
                              placeholder="platform@posmanager.app"
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white dark:bg-secondary"
                              type="password"
                              placeholder="Minimum 6 characters"
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
                      {isLogging ? "Signing in" : "Continue as Platform Admin"}
                      {!isLogging && <ArrowRight className="size-4" />}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <Card className="rounded-3xl border-primary/20 bg-primary/8 shadow-none">
              <CardContent className="space-y-3 px-4 py-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Demo platform access: <span className="font-medium text-foreground">platform@posmanager.app</span> /
                  <span className="font-medium text-foreground"> Platform123</span>
                </p>
                <p>
                  Demo business access: <span className="font-medium text-foreground">owner@northstar.co</span> /
                  <span className="font-medium text-foreground"> Business123</span>
                </p>
                <p>
                  Press <kbd className="rounded-md border px-1.5 py-0.5 text-xs">d</kbd> to toggle theme while you test
                  the application.
                </p>
              </CardContent>
            </Card>

            {defaultRoute !== "/login" ? (
              <p className="text-center text-sm text-muted-foreground">
                Authenticated users are redirected automatically.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="hidden items-center lg:flex">
        <div className="mx-auto grid w-full max-w-2xl gap-4">
          <InfoPanel
            eyebrow="Platform control"
            title="Manage every tenant from a single administrative shell."
            description="Review client status, create new businesses, and keep the platform portfolio organized."
          />
          <InfoPanel
            eyebrow="Business operations"
            title="Jump between businesses without signing out."
            description="Business administrators can switch the active tenant from the shell and keep working instantly."
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
