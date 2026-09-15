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

type DeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName: string
  onConfirm: () => void
  isPending?: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  customerName,
  onConfirm,
  isPending = false,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation("business-customers-catalog")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>{t("confirm_delete_title")}</DialogTitle>
          <DialogDescription>
            {t("confirm_delete_desc")} <span className="font-medium text-foreground">{customerName}</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? t("saving") : t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
