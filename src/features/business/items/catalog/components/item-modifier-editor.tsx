import { useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/i18n/use-i18n"
import { ItemModifierFormDialog } from "../../modifiers/components/item-modifier-form-dialog"
import { useDeleteItemModifier, useItemModifiers, useItemsForPicker } from "../../modifiers/hooks/use-modifiers"
import { normalizeModifierTypeCode, type ItemModifier } from "../../modifiers/types"
import type { ItemResponseDto } from "../types"

type ItemModifierEditorProps = {
  item: ItemResponseDto
}

/**
 * Editor de modificadores GLOBALES de un producto (pestaña "Modificadores"
 * del diálogo de editar). Reutiliza los diálogos del módulo Modificadores.
 */
export function ItemModifierEditor({ item }: ItemModifierEditorProps) {
  const { t } = useTranslation("business-items-catalog")
  const { t: tMod } = useTranslation("business-items-modifiers")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ItemModifier | null>(null)

  const modifiersQuery = useItemModifiers(item.id)
  const pickerQuery = useItemsForPicker()
  const deleteMutation = useDeleteItemModifier()

  const modifiers = useMemo(() => modifiersQuery.data ?? [], [modifiersQuery.data])
  const items = useMemo(() => pickerQuery.data ?? [], [pickerQuery.data])

  const typeLabel = (code: string | number) => {
    const normalized = normalizeModifierTypeCode(typeof code === "number" ? String(code) : code)
    return tMod(`modifier_${normalized.toLowerCase()}`)
  }

  const handleDelete = (m: ItemModifier) => {
    if (!confirm(t("confirm_delete_modifier", { name: m.childItemName ?? m.childItemId }))) return
    deleteMutation.mutate({ id: m.id, parentItemId: item.id })
  }

  if (modifiersQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{t("modifiers_assign_hint")}</p>
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
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modifiers.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.childItemName ?? "—"}
                  {m.childItemSku ? <span className="ml-2 text-xs text-muted-foreground">{m.childItemSku}</span> : null}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ItemModifierFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        parentItemId={item.id}
        modifierToEdit={editing}
        items={items}
      />
    </div>
  )
}
