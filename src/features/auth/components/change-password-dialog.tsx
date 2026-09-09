import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, ShieldCheck, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/use-i18n"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { notify } from "@/hooks/use-notify"
import { useChangePassword } from "../hooks/use-change-password"
import { PASSWORD_POLICY } from "@/features/business/onboarding/schemas/onboarding-schemas"

/**
 * Políticas del backend:
 * - 8+ caracteres
 * - Una mayúscula
 * - Una minúscula
 * - Un número
 * - Un símbolo
 */

type ChangePasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type ChangePasswordDialogProps = {
  open: boolean
  onPasswordChanged: () => void
}

export function ChangePasswordDialog({ open, onPasswordChanged }: ChangePasswordDialogProps) {
  const { t } = useTranslation("auth")
  const { logout } = useAuth()
  const changePasswordMutation = useChangePassword()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(
      z
        .object({
          currentPassword: z.string().min(1, t("current_password_required")),
          newPassword: z.string().min(8, t("password_min_length")).regex(PASSWORD_POLICY, t("password_policy")),
          confirmPassword: z.string().min(1, t("confirm_password_required")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("password_mismatch"),
          path: ["confirmPassword"],
        })
    ),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const handleSubmit = (values: ChangePasswordFormValues) => {
    changePasswordMutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          notify.success(t("password_changed_success"))
          onPasswordChanged()
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : t("password_change_error")
          notify.error(message)
          form.setError("root", { message })
        },
      }
    )
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{t("change_password_title")}</DialogTitle>
          <DialogDescription className="text-center">{t("change_password_description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("current_password")}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder={t("current_password_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("new_password")}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder={t("new_password_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
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
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("confirm_password_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root ? (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <p className="text-[13px] leading-[18px] text-muted-foreground">{t("password_policy_hint")}</p>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full sm:w-auto">
                {changePasswordMutation.isPending ? t("saving") : t("save_password")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
