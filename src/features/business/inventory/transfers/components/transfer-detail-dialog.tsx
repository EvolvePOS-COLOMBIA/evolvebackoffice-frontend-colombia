import { useState } from "react"
import { CheckCheck, PackageCheck, Truck } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { ShareButton } from "../../components/share-dialog"
import { useReceiveTransfer, useResolveDifference, useTransfer } from "../../hooks/use-purchasing"
import type { DifferenceReason } from "../../types/purchasing"
import { transferShareText } from "../../utils/share-text"
import { formatDateTime, TRANSFER_STATUS_TONE } from "../../utils/status"
import { formatMoney, formatQuantity, unitSymbol } from "../../utils/units"

const REASONS: DifferenceReason[] = ["NotArrived", "Damaged", "DispatchError"]

type TransferDetailDialogProps = {
  transferId: string
  branchId: string
  onOpenChange: (open: boolean) => void
}

export function TransferDetailDialog({ transferId, branchId, onOpenChange }: TransferDetailDialogProps) {
  const { t } = useTranslation("business-inventory")
  const { data: transfer, isLoading } = useTransfer(transferId)
  const [checking, setChecking] = useState(false)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [reasons, setReasons] = useState<Record<string, DifferenceReason>>({})
  const receive = useReceiveTransfer()
  const resolve = useResolveDifference()

  const fail = (error: unknown) => notify.error(getApiErrorMessage(error, t("save_error")))

  if (isLoading || !transfer) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("transfer_detail")}</DialogTitle>
          </DialogHeader>
          <Skeleton className="h-48 w-full" />
        </DialogContent>
      </Dialog>
    )
  }

  const isDestination = transfer.toBranchId === branchId
  const isOrigin = transfer.fromBranchId === branchId
  const canReceive = isDestination && transfer.status === "InTransit"

  const startChecking = () => {
    setAmounts(Object.fromEntries(transfer.lines.map((l) => [l.id, String(l.quantitySent)])))
    setReasons({})
    setChecking(true)
  }

  const receiveAll = () =>
    receive.mutate(
      { id: transfer.id, receiveAll: true, lines: null, notes: null },
      { onSuccess: () => notify.success(t("transfer_received", { number: transfer.number })), onError: fail }
    )

  const short = (lineId: string, sent: number) => Number(amounts[lineId] || 0) < sent
  const missingReason = checking && transfer.lines.some((l) => short(l.id, l.quantitySent) && !reasons[l.id])

  const confirmChecked = () =>
    receive.mutate(
      {
        id: transfer.id,
        receiveAll: false,
        notes: null,
        lines: transfer.lines.map((l) => ({
          lineId: l.id,
          quantity: Number(amounts[l.id] || 0),
          reason: short(l.id, l.quantitySent) ? reasons[l.id] : null,
        })),
      },
      {
        onSuccess: (result) => {
          notify.success(
            result.status === "ReceivedWithDifferences"
              ? t("transfer_received_differences", { number: result.number })
              : t("transfer_received", { number: result.number })
          )
          setChecking(false)
        },
        onError: fail,
      }
    )

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <Truck className="size-5" />
            </div>
            <div>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {transfer.number}
                <Badge tone={TRANSFER_STATUS_TONE[transfer.status]}>{t(`transfer_status_${transfer.status}`)}</Badge>
              </DialogTitle>
              <DialogDescription>
                {transfer.fromBranchName} → {transfer.toBranchName} · {formatDateTime(transfer.dispatchedAt)}
                {transfer.purchaseOrderNumber
                  ? ` · ${t("transfer_for_order", { number: transfer.purchaseOrderNumber })}`
                  : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {checking ? <p className="text-sm text-muted-foreground">{t("transfer_check_hint")}</p> : null}

        <div className="w-full overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead className="text-right">{t("transfer_sent_col")}</TableHead>
                {checking ? (
                  <>
                    <TableHead className="w-40">{t("transfer_arrived_col")}</TableHead>
                    <TableHead className="w-48">{t("transfer_reason")}</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">{t("transfer_received_col")}</TableHead>
                    <TableHead>{t("transfer_difference")}</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{l.itemName}</p>
                    <p className="text-xs text-muted-foreground">{l.sku ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-right">{formatQuantity(l.quantitySent, l.baseUnit)}</TableCell>
                  {checking ? (
                    <>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            aria-label={t("transfer_arrived_col")}
                            value={amounts[l.id] ?? ""}
                            onChange={(e) => setAmounts((a) => ({ ...a, [l.id]: e.target.value }))}
                          />
                          <span className="text-xs text-muted-foreground">{unitSymbol(l.baseUnit)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {short(l.id, l.quantitySent) ? (
                          <Select
                            value={reasons[l.id] ?? ""}
                            onValueChange={(value) => setReasons((r) => ({ ...r, [l.id]: value as DifferenceReason }))}
                          >
                            <SelectTrigger aria-label={t("transfer_reason")}>
                              <SelectValue placeholder={t("transfer_reason_placeholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              {REASONS.map((reason) => (
                                <SelectItem key={reason} value={reason}>
                                  {t(`reason_${reason}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right text-muted-foreground">
                        {l.quantityReceived === null ? "—" : formatQuantity(l.quantityReceived, l.baseUnit)}
                      </TableCell>
                      <TableCell>
                        {l.differenceStatus === "None" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={l.differenceStatus === "Pending" ? "warning" : "neutral"}>
                              {t("transfer_missing", { quantity: formatQuantity(l.difference, l.baseUnit) })}
                              {l.differenceReason ? ` · ${t(`reason_${l.differenceReason}`)}` : ""}
                            </Badge>
                            {l.differenceStatus === "Pending" && isOrigin ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={resolve.isPending}
                                  onClick={() =>
                                    resolve.mutate(
                                      { id: transfer.id, lineId: l.id, resolution: "returned" },
                                      { onSuccess: () => notify.success(t("difference_returned")), onError: fail }
                                    )
                                  }
                                >
                                  {t("difference_return")}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={resolve.isPending}
                                  onClick={() =>
                                    resolve.mutate(
                                      { id: transfer.id, lineId: l.id, resolution: "lost" },
                                      { onSuccess: () => notify.success(t("difference_lost")), onError: fail }
                                    )
                                  }
                                >
                                  {t("difference_mark_lost")}
                                </Button>
                              </>
                            ) : l.differenceStatus !== "Pending" ? (
                              <span className="text-xs text-muted-foreground">
                                {t(`difference_status_${l.differenceStatus}`)}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {t("transfer_total_value")}:{" "}
            <span className="font-medium text-foreground">{formatMoney(transfer.totalValue)}</span>
            {isOrigin && transfer.totalValue > transfer.totalCost ? (
              <>
                {" · "}
                {t("transfer_internal_profit")}:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(transfer.totalValue - transfer.totalCost)}
                </span>
              </>
            ) : null}
          </span>
          {transfer.notes ? <span>{transfer.notes}</span> : null}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {checking ? (
            <>
              <Button type="button" variant="outline" onClick={() => setChecking(false)}>
                {t("cancel")}
              </Button>
              <Button type="button" onClick={confirmChecked} disabled={missingReason || receive.isPending}>
                {receive.isPending ? t("saving") : t("transfer_confirm_receive")}
              </Button>
            </>
          ) : (
            <>
              <ShareButton
                title={transfer.number}
                text={transferShareText(transfer, t)}
                phone={isOrigin ? transfer.toBranchPhone : transfer.fromBranchPhone}
              />
              {canReceive ? (
                <>
                  <Button type="button" variant="outline" onClick={startChecking}>
                    <PackageCheck className="mr-2 size-4" />
                    {t("transfer_check")}
                  </Button>
                  <Button id="btn-recibi-todo" type="button" onClick={receiveAll} disabled={receive.isPending}>
                    <CheckCheck className="mr-2 size-4" />
                    {t("transfer_receive_all")}
                  </Button>
                </>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
