import { Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/i18n/use-i18n"

type UserDeleteDialogProps = {
  title: string
  description?: string
  selectedLabel: string
  onDelete: () => void
}

export function AlertDeleteDialog({ title, description, selectedLabel, onDelete }: UserDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const handleDelete = () => {
    onDelete()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
        {t("delete")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex gap-2">
            {description ? description : t("delete_confirmation")}
            <span className="font-semibold text-foreground">{selectedLabel}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
