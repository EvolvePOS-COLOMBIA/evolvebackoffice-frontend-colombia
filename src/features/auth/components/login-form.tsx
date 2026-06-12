import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { loginSchema } from "@/features/auth/schemas/login-schema"
import type { LoginFormValues } from "@/features/auth/types/auth-types"

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@evolve.local",
      password: "evolve123",
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    try {
      login(values.email, values.password)
      navigate("/versions")
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to sign in right now.",
      })
    }
  }

  return (
    <div className="grid min-h-svh gap-8 px-4 py-8 lg:px-8">
      <section className="flex items-center">
        <Card className="mx-auto w-full max-w-xl bg-card/88">
          <CardHeader className="space-y-2">
            <Badge tone="neutral" className="w-fit">
              Secure access
            </Badge>
            <CardTitle className="text-2xl">Sign in to Version Manager</CardTitle>
            <CardDescription>
              Use any valid email and a password with at least 6 characters in demo mode.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@evolve.local" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimum 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Card className="rounded-3xl border-primary/20 bg-primary/8 shadow-none">
                  <CardContent className="px-4 py-4 text-sm leading-6 text-muted-foreground">
                    Press <kbd className="rounded-md border px-1.5 py-0.5 text-xs">d</kbd> to toggle theme quickly while
                    you test the application.
                  </CardContent>
                </Card>

                {form.formState.errors.root ? (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                ) : null}

                <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  Sign In
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
