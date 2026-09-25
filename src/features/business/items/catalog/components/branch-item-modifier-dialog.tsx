import { useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { ItemModifierFormDialog } from "../../modifiers/components/item-modifier-form-dialog"
import { useDeleteItemModifier, useItemModifiers, useItemsForPicker } from "../../modifiers/hooks/use-modifiers"
import { normalizeModifierTypeCode, type ItemModifier } from "../../modifiers/types"
import { useUpdateBranchItemConfig } from "../hooks/use-branch-items"
import type { BranchItemResponseDto } from "../types"

type BranchItemModifierDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  item: BranchItemResponseDto | null
}

/**
 * Modificadores de un ítem EN UNA SUCURSAL.
 * Interruptor "Usar configuración global" vs configuración propia de la sucursal
 * (PUT .../config; al personalizar el backend copia la configuración global).
 * En modo global la lista es de solo lectura; en modo propio se puede editar.
 */
export function BranchItemModifierDialog({ open, onOpenChange, branchId, item }: BranchItemModifierDialogProps) {
  const { t } = useTranslation("business-items-catalog")
  const { t: tMod } = useTranslation("business-items-modifiers")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ItemModifier | null>(null)

  const configMutation = useUpdateBranchItemConfig(branchId)
  const modifiersQuery = useItemModifiers(item?.itemPublicId, open ? branchId : undefined)
  const pickerQuery = useItemsForPicker()
  const deleteMutation = useDeleteItemModifier()

  const useGlobal = item?.useGlobalModifiers ?? true
  const modifiers = useMemo(() => modifiersQuery.data ?? [], [modifiersQuery.data])
  const items = useMemo(() => pickerQuery.data ?? [], [pickerQuery.data])

  const typeLabel = (code: string | number) => {
    const normalized = normalizeModifierTypeCode(typeof code === "number" ? String(code) : code)
    return tMod(`modifier_${normalized.toLowerCase()}`)
  }

  const handleToggleConfig = (useGlobalValue: boolean) => {
    if (!item) return
    configMutation.mutate({ id: item.id, payload: { useGlobalModifiers: useGlobalValue } })
  }

  const handleDelete = (m: ItemModifier) => {
    if (!confirm(t("confirm_delete_modifier", { name: m.childItemName ?? m.childItemId }))) return
    deleteMutation.mutate({ id: m.id, parentItemId: item?.itemPublicId })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-160">
        <DialogHeader>
          <DialogTitle>{t("modifier_dialog_title")}</DialogTitle>
          <DialogDescription>{item?.itemName ?? ""}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="modifier-config-switch">{t("config_global")}</Label>
            <p className="text-xs text-muted-foreground">
              {useGlobal ? t("config_global_hint_modifiers") : t("config_custom_hint_modifiers")}
            </p>
          </div>
          <Switch
            id="modifier-config-switch"
            checked={useGlobal}
            disabled={configMutation.isPending}
            onCheckedChange={handleToggleConfig}
          />
        </div>

        {modifiersQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Badge tone={useGlobal ? "neutral" : "primary"} className="w-fit">
                {t("assigned_modifiers")}
              </Badge>
              {!useGlobal && (
                <Button
                  size="sm"
                  className="h-8 w-fit px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                  onClick={() => {
                    setEditing(null)
                    setDialogOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  {t("add_modifier")}
                </Button>
              )}
            </div>

            {modifiers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-muted-foreground">
                <p className="text-sm">{t("no_modifiers")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("modifier_child")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("modifier_group")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("modifier_type")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("modifier_qty")}</TableHead>
                    <TableHead className="text-right">{t("modifier_extra")}</TableHead>
                    {!useGlobal && <TableHead className="text-right">{t("actions")}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modifiers.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.childItemName ?? "—"}
                        {m.childItemSku ? (
                          <span className="ml-2 text-xs text-muted-foreground">{m.childItemSku}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {m.modifierGroupName ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge tone="neutral">{typeLabel(m.modifierTypeCode)}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {m.minQuantity}–{m.maxQuantity}
                      </TableCell>
                      <TableCell className="text-right font-mono">${m.extraPrice.toLocaleString("es-CO")}</TableCell>
                      {!useGlobal && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => {
                                setEditing(m)
                                setDialogOpen(true)
                              }}
                              aria-label={t("edit_mod")}
                            >
                              <Pencil className="size-3.5 sm:size-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="size-7 text-destructive sm:size-8"
                              onClick={() => handleDelete(m)}
                              aria-label={t("delete_mod")}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="size-3.5 sm:size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {useGlobal && (
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                {t("readonly_global")}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
        </DialogFooter>

        <ItemModifierFormDialog
          open={dialogOpen}
          onOpenChange={(openValue) => {
            setDialogOpen(openValue)
            if (!openValue) setEditing(null)
          }}
          parentItemId={item?.itemPublicId ?? ""}
          modifierToEdit={editing}
          items={items}
          branchId={branchId}
        />
      </DialogContent>
    </Dialog>
  )
}
