import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreatePlatformUser, useUpdatePlatformUser } from "@/features/platform/users/hooks/use-platform-users"
import { notify } from "@/hooks/use-notify"
import type { PlatformUser, AppRole } from "@/features/platform/users/types"
import { useTranslation } from "@/i18n/use-i18n"

interface PlatformUserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit: PlatformUser | null
}

export function PlatformUserFormDialog({ open, onOpenChange, userToEdit }: PlatformUserFormDialogProps) {
  const { t } = useTranslation("platform-users")
  const createMutation = useCreatePlatformUser()
  const updateMutation = useUpdatePlatformUser()

  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<AppRole>("PlatformSupervisor")

  useEffect(() => {
    if (userToEdit) {
      setEmail(userToEdit.email)
      setFullName(userToEdit.fullName)
      setPassword("")
      setRole(userToEdit.role)
    } else {
      setEmail("")
      setFullName("")
      setPassword("")
      setRole("PlatformSupervisor")
    }
  }, [userToEdit, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (userToEdit) {
      updateMutation.mutate(
        {
          id: userToEdit.id,
          data: {
            email: email || undefined,
            fullName: fullName || undefined,
            role: role || undefined,
          },
        },
        {
          onSuccess: () => {
            notify.success(t("user_updated"))
            onOpenChange(false)
          },
          onError: (error) => {
            notify.error(error instanceof Error ? error.message : t("unable_to_save"))
          },
        }
      )
    } else {
      createMutation.mutate(
        { email, fullName, password, role },
        {
          onSuccess: (result) => {
            notify.success(t("user_created"))
            if (result.temporaryPassword) {
              notify.info(`${t("temporary_password")}: ${result.temporaryPassword}`)
            }
            onOpenChange(false)
          },
          onError: (error) => {
            notify.error(error instanceof Error ? error.message : t("unable_to_save"))
          },
        }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{userToEdit ? t("edit_user") : t("create_user")}</DialogTitle>
          <DialogDescription>
            {userToEdit ? t("edit_user_desc") : t("create_user_desc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_placeholder")}
              required={!userToEdit}
              disabled={!!userToEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("full_name")}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("full_name_placeholder")}
              required
            />
          </div>
          {!userToEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password_placeholder")}
                required
                minLength={8}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role">{t("role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PlatformAdmin">{t("role_admin")}</SelectItem>
                <SelectItem value="PlatformSubAdmin">{t("role_subadmin")}</SelectItem>
                <SelectItem value="PlatformSupervisor">{t("role_supervisor")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {userToEdit ? t("save") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
