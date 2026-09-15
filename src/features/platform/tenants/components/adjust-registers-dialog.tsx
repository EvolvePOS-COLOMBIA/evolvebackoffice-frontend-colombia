import { useState } from "react"
import { useTranslation } from "@/i18n/use-i18n"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Plus, Minus, Key, Check } from "lucide-react"
import Spinner from "@/components/Spinner"
import type { PosSerialCodeResponseDto } from "@/features/platform/tenants/types/api"

type AdjustRegistersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  previousMax: number
  newMax: number
  serialCodes: PosSerialCodeResponseDto[]
  onConfirm: (serialsToDecommission: string[]) => void
  isPending?: boolean
}

export function AdjustRegistersDialog({
  open,
  onOpenChange,
  previousMax,
  newMax,
  serialCodes,
  onConfirm,
  isPending = false,
}: AdjustRegistersDialogProps) {
  const { t } = useTranslation("platform-tenants")
  const [selectedSerials, setSelectedSerials] = useState<string[]>([])

  const isIncreasing = newMax > previousMax
  const isDecreasing = newMax < previousMax
  const difference = Math.abs(newMax - previousMax)

  const availableForDecommission = serialCodes.filter(
    (s) => s.status === "Unassigned" || s.status === "Activated"
  )

  const handleToggleSerial = (serialId: string) => {
    setSelectedSerials((prev) =>
      prev.includes(serialId) ? prev.filter((id) => id !== serialId) : [...prev, serialId]
    )
  }

  const handleConfirm = () => {
    if (isDecreasing) {
      onConfirm(selectedSerials)
    } else {
      onConfirm([])
    }
    setSelectedSerials([])
  }

  const handleCancel = () => {
    setSelectedSerials([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] lg:w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIncreasing ? (
              <Plus className="size-5 text-green-500" />
            ) : (
              <Minus className="size-5 text-orange-500" />
            )}
            {t("adjust_registers_title")}
          </DialogTitle>
          <DialogDescription>{t("adjust_registers_description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant={isIncreasing ? "default" : "destructive"}>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              {isIncreasing ? (
                <span>
                  {t("adjust_registers_increase", {
                    count: difference,
                    newMax: newMax,
                  })}
                </span>
              ) : (
                <span>
                  {t("adjust_registers_decrease", {
                    count: difference,
                    newMax: newMax,
                  })}
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("current_max")}</span>
              <Badge variant="outline">{previousMax}</Badge>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("new_max")}</span>
              <Badge variant={isIncreasing ? "success" : "warning"}>{newMax}</Badge>
            </div>
          </div>

          {isDecreasing && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("select_serials_to_decommission")}</p>
              {availableForDecommission.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_serials_available")}</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableForDecommission.map((serial) => (
                    <div
                      key={serial.id}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedSerials.includes(serial.id)
                          ? "border-orange-500 bg-orange-50"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleToggleSerial(serial.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-5 items-center justify-center rounded border ${
                            selectedSerials.includes(serial.id)
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedSerials.includes(serial.id) && (
                            <Check className="size-3" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-sm">{serial.serialCode}</p>
                          <p className="text-xs text-muted-foreground">
                            {serial.deviceName || serial.machineIdentifier || "—"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={serial.status === "Activated" ? "default" : "secondary"}
                      >
                        {serial.status === "Activated" ? t("serial_activated") : t("serial_unassigned")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {selectedSerials.length > 0 && (
                <p className="text-sm text-orange-600">
                  {t("serials_selected_to_delete", { count: selectedSerials.length })}
                </p>
              )}
            </div>
          )}

          {isIncreasing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Key className="size-4" />
              <span>{t("new_serials_will_be_generated", { count: difference })}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={isDecreasing ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending || (isDecreasing && selectedSerials.length === 0)}
          >
            {isPending && <Spinner IsButton />}
            {isIncreasing ? t("confirm_increase") : t("confirm_decrease")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
