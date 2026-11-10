import { useState } from "react"
import { KeyRound, Loader2, RefreshCw } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { useTranslation } from "@/i18n/use-i18n"
import { useActivateCredit, useCreditHistory, usePersonCredit, useResendCreditPin } from "../hooks/use-person-credit"

type CreditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** PublicId de la persona dueña del cupo (CustomerResponseDto.personPublicId). */
  personId: string | null
  personName: string
}

export function CreditDialog({ open, onOpenChange, personId, personName }: CreditDialogProps) {
  const { t } = useTranslation("business-credit")
  const { formatCurrency, formatDate } = useLocaleFormat()

  const { data: credit, isLoading, isError, refetch } = usePersonCredit(open ? personId : null)
  const { data: history } = useCreditHistory(open ? personId : null)
  const activateMutation = useActivateCredit(personId)
  const resendMutation = useResendCreditPin(personId)

  const [limitInput, setLimitInput] = useState("")
  const [deliveryError, setDeliveryError] = useState<string | null>(null)

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevCredit, setPrevCredit] = useState(credit)
  if (open !== prevOpen || credit !== prevCredit) {
    setPrevOpen(open)
    setPrevCredit(credit)
    if (!open) {
      setLimitInput("")
      setDeliveryError(null)
    } else if (credit) {
      setLimitInput(String(credit.creditLimit > 0 ? credit.creditLimit : ""))
    }
  }

  const isActive = credit?.isActive ?? false

  const handleActivate = () => {
    const limit = Number(limitInput)
    if (!Number.isFinite(limit) || limit <= 0) {
      notify.error(t("limit_placeholder"))
      return
    }
    activateMutation.mutate(limit, {
      onSuccess: (result) => {
        setDeliveryError(result.pinDeliveryError)
        if (result.pinDeliveryError) notify.error(t("pin_send_failed", { error: result.pinDeliveryError }))
        else notify.success(t("activated"))
        void refetch()
      },
      onError: (error) => notify.error(getErrorMessage(error)),
    })
  }

  const handleResendPin = () => {
    resendMutation.mutate(undefined, {
      onSuccess: (result) => {
        setDeliveryError(result.pinDeliveryError)
        if (result.pinDeliveryError) notify.error(t("pin_send_failed", { error: result.pinDeliveryError }))
        else notify.success(t("pin_sent"))
        void refetch()
      },
      onError: (error) => notify.error(getErrorMessage(error)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto lg:w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("credit_title")}
            {credit && <Badge tone={isActive ? "success" : "neutral"}>{isActive ? t("active") : t("inactive")}</Badge>}
          </DialogTitle>
          <DialogDescription>{personName ? `${personName} — ${t("credit_desc")}` : t("credit_desc")}</DialogDescription>
        </DialogHeader>

        {!personId ? (
          <p className="text-sm text-muted-foreground">{t("no_person")}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">{t("loading")}</span>
          </div>
        ) : isError || !credit ? (
          <p className="text-sm text-destructive">{getErrorMessage(isError)}</p>
        ) : (
          <div className="space-y-4">
            {deliveryError && (
              <Alert variant="warning">
                <AlertTitle>{t("pin")}</AlertTitle>
                <AlertDescription>{t("pin_send_failed", { error: deliveryError })}</AlertDescription>
              </Alert>
            )}

            {!credit.email && (
              <Alert variant="warning">
                <AlertDescription>{t("email_missing")}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Figure label={t("credit_limit")} value={formatCurrency(credit.creditLimit)} />
              <Figure label={t("balance")} value={formatCurrency(credit.balance)} />
              <Figure label={t("available")} value={formatCurrency(credit.available)} accent />
            </div>

            <div className="space-y-1 rounded-xl border border-border/60 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t("email")}</span>
                <span className="font-medium">{credit.email ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t("pin")}</span>
                <span className="font-medium">
                  {credit.pinConfigured ? t("pin_configured") : t("pin_not_configured")}
                </span>
              </div>
              {credit.pinAttempts > 0 && !credit.isLocked && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("pin_attempts", { count: credit.pinAttempts })}</span>
                </div>
              )}
              {credit.isLocked && <p className="text-xs font-medium text-destructive">{t("pin_locked")}</p>}
              {credit.activatedAt && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("activated_at")}</span>
                  <span className="font-medium">{formatDate(new Date(credit.activatedAt))}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="credit-limit-input">{t("limit_input")}</Label>
                <Input
                  id="credit-limit-input"
                  type="number"
                  min={0}
                  placeholder={t("limit_placeholder")}
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleActivate}
                  disabled={activateMutation.isPending || !credit.email}
                  className="flex-1 sm:flex-none"
                >
                  <KeyRound className="mr-2 size-4" />
                  {isActive ? t("save_limit") : t("activate")}
                </Button>
                {isActive && credit.email && (
                  <Button variant="outline" onClick={handleResendPin} disabled={resendMutation.isPending}>
                    <RefreshCw className="mr-2 size-4" />
                    {t("resend_pin")}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("history")}</p>
              {!history || history.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("history_empty")}</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[520px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("type")}</TableHead>
                        <TableHead className="text-right">{t("amount")}</TableHead>
                        <TableHead className="text-right">{t("movement_balance")}</TableHead>
                        <TableHead>{t("code")}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t("movement_date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.items.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <Badge tone={m.type === "Authorization" ? "warning" : "success"}>
                              {m.type === "Authorization" ? t("type_auth") : t("type_payment")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(m.amount)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(m.balanceAfter)}</TableCell>
                          <TableCell className="max-w-[140px] truncate font-mono text-xs">
                            {m.cancelledAt
                              ? t("cancelled")
                              : m.settledTransactionId
                                ? t("settled")
                                : m.type === "Authorization"
                                  ? t("pending")
                                  : (m.reference ?? "—")}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {formatDate(new Date(m.createdAt))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{t("pos_only")}</p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Figure({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 p-3 text-center">
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className={`text-base font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response
    return response?.data?.message ?? response?.data?.error ?? "Error"
  }
  return "Error"
}
