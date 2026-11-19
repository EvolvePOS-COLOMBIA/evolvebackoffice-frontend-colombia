import { useEffect, useMemo, useState, type ComponentProps } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFormState, type Control, type Resolver } from "react-hook-form"
import { Building2, ListChecks, MapPin, Power, ShieldAlert } from "lucide-react"

import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  useActivateBranch,
  useDeactivateBranch,
  useUpdateBranch,
} from "@/features/business/branches/hooks/use-branches"
import { branchFormSchema, type BranchFormSchemaValues } from "@/features/business/branches/schemas/branch-schema"
import type { Branch } from "@/features/business/branches/types"
import { branchValuesToPayload } from "@/features/business/branches/utils/branch-payload"
import { timeZoneOptions } from "@/features/business/branches/utils/time-zones"
import { useUsers } from "@/features/business/people/users/hooks/use-users"
import { getUserDisplayName } from "@/features/business/people/users/types"
import { useGeolocation, type GeolocationErrorCode } from "@/hooks/use-geolocation"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import type { ConfigSectionId } from "./config-sections"
import { SaveBar, SectionShell, SettingRow, SettingsGroup } from "./settings-primitives"

const AUTOMATIC_ADMIN = "automatic-admin"

const GEOLOCATION_ERROR_KEYS: Record<GeolocationErrorCode, string> = {
  unsupported: "geolocation_unsupported",
  permission_denied: "geolocation_denied",
  unavailable: "geolocation_unavailable",
  timeout: "geolocation_timeout",
}

type TextFieldName = Exclude<keyof BranchFormSchemaValues, "isSupplier" | "adminUserId" | "timeZoneId">

/** Text input of the form. A dot next to the label marks a value that was edited and not saved yet. */
function TextField({
  control,
  name,
  label,
  className,
  ...inputProps
}: { control: Control<BranchFormSchemaValues>; name: TextFieldName; label: string } & ComponentProps<typeof Input>) {
  const { dirtyFields } = useFormState({ control, name })
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {dirtyFields[name] ? (
              <span aria-hidden className="ml-1 text-[9px] text-amber-400">
                ●
              </span>
            ) : null}
          </FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface InfoSectionProps {
  branch: Branch
  onDirtyChange?: (id: ConfigSectionId, dirty: boolean) => void
}

/** Branch data, admin, location and supplier flag: one form saved from the bar at the bottom. */
export function InfoSection({ branch, onDirtyChange }: InfoSectionProps) {
  const { t } = useTranslation("business-branches")
  const { data: users = [], isLoading: usersLoading } = useUsers()
  const { isLocating, requestLocation } = useGeolocation()
  const updateBranch = useUpdateBranch()
  const activateBranch = useActivateBranch()
  const deactivateBranch = useDeactivateBranch()
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)

  const schema = useMemo(() => branchFormSchema(t), [t])
  const values = useMemo<BranchFormSchemaValues>(
    () => ({
      name: branch.name,
      identification: branch.identification,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      latitude: branch.latitude,
      longitude: branch.longitude,
      adminUserId: branch.adminUserId,
      isSupplier: branch.isSupplier,
      timeZoneId: branch.timeZoneId ?? "",
    }),
    [branch]
  )
  const form = useForm<BranchFormSchemaValues>({
    resolver: zodResolver(schema) as Resolver<BranchFormSchemaValues>,
    values,
  })

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.isActive && ["Admin", "Manager"].includes(user.role ?? "")),
    [users]
  )

  const handleSave = form.handleSubmit((formValues) => {
    updateBranch.mutate(
      { id: branch.id, payload: branchValuesToPayload(formValues) },
      {
        onSuccess: () => notify.success(t("updated_success")),
        onError: (error) => notify.error(getApiErrorMessage(error, t("save_error"))),
      }
    )
  })

  const handleUseLocation = async () => {
    const outcome = await requestLocation()
    if (!outcome.ok) {
      notify.error(t(GEOLOCATION_ERROR_KEYS[outcome.code]))
      return
    }
    const options = { shouldValidate: true, shouldDirty: true }
    form.setValue("latitude", String(Number(outcome.latitude.toFixed(7))), options)
    form.setValue("longitude", String(Number(outcome.longitude.toFixed(7))), options)
  }

  const handleStatusChange = () => {
    const mutation = branch.isActive ? deactivateBranch : activateBranch
    mutation.mutate(branch.id, {
      onSuccess: () => {
        notify.success(branch.isActive ? t("deactivated_success") : t("activated_success"))
        setConfirmStatusOpen(false)
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("action_error"))),
    })
  }

  const isDirty = form.formState.isDirty
  const statusPending = activateBranch.isPending || deactivateBranch.isPending

  useEffect(() => {
    onDirtyChange?.("info", isDirty)
  }, [isDirty, onDirtyChange])

  return (
    <>
      <SectionShell
        icon={Building2}
        title={t("section_info")}
        description={t("section_info_desc")}
        footer={
          <SaveBar
            visible={isDirty}
            isPending={updateBranch.isPending}
            onSave={handleSave}
            onDiscard={() => form.reset(values)}
          />
        }
      >
        <Form {...form}>
          <form onSubmit={handleSave} className="space-y-4">
            <SettingsGroup icon={ListChecks} title={t("cfg_group_general")}>
              <div className="grid gap-4 p-4 @xl:grid-cols-2">
                <TextField
                  control={form.control}
                  name="name"
                  label={t("name_label")}
                  placeholder={t("name_placeholder")}
                />
                <TextField
                  control={form.control}
                  name="identification"
                  label={t("identification_label")}
                  placeholder={t("identification_placeholder")}
                />
                <TextField
                  control={form.control}
                  name="phone"
                  label={t("phone_label")}
                  placeholder={t("phone_placeholder")}
                  inputMode="tel"
                />
                <TextField
                  control={form.control}
                  name="email"
                  label={t("email_label")}
                  placeholder={t("email_placeholder")}
                  type="email"
                />
                <TextField
                  control={form.control}
                  name="address"
                  label={t("address_label")}
                  placeholder={t("address_placeholder")}
                  className="@xl:col-span-2"
                />
                <FormField
                  control={form.control}
                  name="adminUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin_label")}</FormLabel>
                      <Select
                        value={field.value || AUTOMATIC_ADMIN}
                        onValueChange={(value) => field.onChange(value === AUTOMATIC_ADMIN ? "" : value)}
                        disabled={usersLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("admin_placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AUTOMATIC_ADMIN}>{t("admin_automatic")}</SelectItem>
                          {branch.adminUserId && !eligibleUsers.some((user) => user.id === branch.adminUserId) ? (
                            <SelectItem value={branch.adminUserId}>
                              {branch.adminUserName || branch.adminUserId}
                            </SelectItem>
                          ) : null}
                          {eligibleUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {getUserDisplayName(user)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeZoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cfg_timezone")}</FormLabel>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("cfg_timezone_placeholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeZoneOptions(branch.timeZoneId).map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SettingsGroup>

            <div className="grid items-start gap-4 @xl:grid-cols-2">
              <SettingsGroup
                icon={MapPin}
                title={t("cfg_group_location")}
                aside={
                  <Button type="button" variant="outline" size="sm" disabled={isLocating} onClick={handleUseLocation}>
                    <MapPin className="size-4" />
                    {isLocating ? t("geolocation_locating") : t("cfg_use_location")}
                  </Button>
                }
              >
                <div className="space-y-4 p-4">
                  <div
                    aria-hidden
                    className="relative grid h-24 place-items-center overflow-hidden rounded-xl border border-border/70 bg-[radial-gradient(circle_at_50%_60%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_55%)] text-primary"
                  >
                    <MapPin className="size-8 drop-shadow-[0_6px_10px_color-mix(in_oklab,var(--primary)_50%,transparent)] motion-safe:animate-bounce motion-safe:[animation-duration:3s]" />
                  </div>
                  <div className="grid gap-4 @md:grid-cols-2">
                    <TextField
                      control={form.control}
                      name="latitude"
                      label={t("latitude_label")}
                      placeholder={t("latitude_placeholder")}
                      inputMode="decimal"
                    />
                    <TextField
                      control={form.control}
                      name="longitude"
                      label={t("longitude_label")}
                      placeholder={t("longitude_placeholder")}
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </SettingsGroup>

              <div className="space-y-4">
                <SettingsGroup icon={Building2} title={t("cfg_group_type")}>
                  <FormField
                    control={form.control}
                    name="isSupplier"
                    render={({ field }) => (
                      <SettingRow title={t("supplier_label")} description={t("supplier_hint")}>
                        <Switch
                          glow
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t("supplier_label")}
                        />
                      </SettingRow>
                    )}
                  />
                </SettingsGroup>

                <SettingsGroup icon={ShieldAlert} title={t("cfg_group_danger")}>
                  <SettingRow
                    title={branch.isActive ? t("cfg_deactivate_title") : t("cfg_activate_title")}
                    description={branch.isActive ? t("cfg_deactivate_desc") : t("cfg_activate_desc")}
                  >
                    <Button
                      type="button"
                      variant={branch.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => setConfirmStatusOpen(true)}
                    >
                      <Power className="size-4" />
                      {branch.isActive ? t("deactivate") : t("activate")}
                    </Button>
                  </SettingRow>
                </SettingsGroup>
              </div>
            </div>
          </form>
        </Form>
      </SectionShell>

      <ConfirmActionDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        title={branch.isActive ? t("deactivate_confirm_title") : t("activate_confirm_title")}
        description={
          branch.isActive
            ? t("deactivate_confirm_desc", { name: branch.name })
            : t("activate_confirm_desc", { name: branch.name })
        }
        confirmLabel={branch.isActive ? t("deactivate") : t("activate")}
        tone={branch.isActive ? "destructive" : "default"}
        isPending={statusPending}
        onConfirm={handleStatusChange}
      />
    </>
  )
}
