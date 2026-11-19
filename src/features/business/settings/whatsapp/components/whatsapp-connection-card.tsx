import { useEffect, useRef, useState } from "react"
import { KeyRound, Link2, LogOut, MessageCircle, QrCode, RefreshCw, Smartphone } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocaleFormat } from "@/hooks/use-locale-format"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"
import { useConnectWhatsApp, useDisconnectWhatsApp, useWhatsAppQr } from "../hooks/use-whatsapp"
import type { WhatsAppStatus } from "../types"
import { formatWhatsAppNumber, isValidWhatsAppNumber, phoneDigits } from "../utils/phone"

type WhatsAppConnectionCardProps = {
  status: WhatsAppStatus
}

/** Conectar el número (QR o código), ver la conexión, cambiar de número y desconectar. */
export function WhatsAppConnectionCard({ status }: WhatsAppConnectionCardProps) {
  const { t } = useTranslation("business-whatsapp")
  const { formatDateTime } = useLocaleFormat()
  const connect = useConnectWhatsApp()
  const disconnect = useDisconnectWhatsApp()

  const [changingNumber, setChangingNumber] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [showPairingCode, setShowPairingCode] = useState(false)
  const [phone, setPhone] = useState(formatWhatsAppNumber(status.phoneNumber))
  const [touched, setTouched] = useState(false)

  const isConnecting = status.status === "Connecting"
  const isConnected = status.status === "Connected"
  const showForm = !isConnecting && (!isConnected || changingNumber)
  const qr = useWhatsAppQr(isConnecting && status.configured)

  // Avisar cuando el escaneo termina (Conectando → Conectado).
  const previousStatus = useRef(status.status)
  useEffect(() => {
    if (previousStatus.current === "Connecting" && status.status === "Connected") {
      notify.success(t("connected_success"))
      setChangingNumber(false)
    }
    previousStatus.current = status.status
  }, [status.status, t])

  const phoneValid = isValidWhatsAppNumber(phone)

  const submit = () => {
    setTouched(true)
    if (!phoneValid || connect.isPending) return
    connect.mutate(phoneDigits(phone), {
      onSuccess: (result) => {
        setShowPairingCode(false)
        if (result.status === "Connected") {
          notify.success(t("connected_success"))
          setChangingNumber(false)
        }
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("connect_error"))),
    })
  }

  const doDisconnect = () => {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setConfirmDisconnect(false)
        setChangingNumber(false)
        notify.success(t("disconnected"))
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("disconnect_error"))),
    })
  }

  const numberMismatch =
    isConnected && status.connectedNumber && status.phoneNumber && status.connectedNumber !== status.phoneNumber

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-5" />
          {t("connection_title")}
        </CardTitle>
        <CardDescription>{t("connection_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="whatsapp-numero">{t("phone_label")}</Label>
              <Input
                id="whatsapp-numero"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={25}
                placeholder="+57 300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && !phoneValid}
              />
              {touched && !phoneValid ? (
                <p className="text-xs text-destructive">{t("phone_invalid")}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("phone_hint")}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={connect.isPending || !status.configured}>
                <Link2 className="size-4" />
                {connect.isPending ? t("connecting") : t("connect")}
              </Button>
              {changingNumber ? (
                <Button type="button" variant="outline" onClick={() => setChangingNumber(false)}>
                  {t("cancel")}
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}

        {isConnecting ? (
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
              {showPairingCode && qr.data?.pairingCode ? (
                <div className="flex size-64 shrink-0 items-center justify-center self-center rounded-2xl border border-border/70 bg-card/60 p-3">
                  <p className="font-mono text-3xl font-semibold tracking-[0.3em] text-foreground">
                    {qr.data.pairingCode}
                  </p>
                </div>
              ) : qr.data?.qrCode ? (
                // Fondo blanco también en modo oscuro: el QR necesita contraste para escanearse.
                <div className="flex size-64 shrink-0 items-center justify-center self-center rounded-2xl border border-border/70 bg-white p-3">
                  <img src={qr.data.qrCode} alt={t("qr_alt")} className="size-full object-contain" />
                </div>
              ) : (
                <div className="flex size-64 shrink-0 items-center justify-center self-center rounded-2xl border border-border/70 bg-card/60 p-3">
                  <p className="text-center text-sm text-muted-foreground">
                    {qr.isError ? t("qr_error") : t("qr_loading")}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {t("scan_for", { phone: formatWhatsAppNumber(status.phoneNumber) })}
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>{t("step_open")}</li>
                  <li>{t("step_devices")}</li>
                  <li>{showPairingCode ? t("step_code") : t("step_scan")}</li>
                </ol>
                <p className="text-xs text-muted-foreground">{t("qr_auto_refresh")}</p>
                <div className="flex flex-wrap gap-2">
                  {qr.data?.pairingCode ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowPairingCode((v) => !v)}>
                      {showPairingCode ? <QrCode className="size-4" /> : <KeyRound className="size-4" />}
                      {showPairingCode ? t("use_qr") : t("use_code")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => qr.refetch()}
                    disabled={qr.isFetching}
                  >
                    <RefreshCw className="size-4" />
                    {t("new_qr")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={doDisconnect}
                    disabled={disconnect.isPending}
                  >
                    {t("cancel_connection")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isConnected && !changingNumber ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                <Smartphone className="size-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium text-foreground">
                  {formatWhatsAppNumber(status.connectedNumber) || t("unknown_number")}
                </p>
                {status.profileName ? <p className="text-sm text-muted-foreground">{status.profileName}</p> : null}
                {status.connectedAt ? (
                  <p className="text-xs text-muted-foreground">
                    {t("connected_since", { date: formatDateTime(status.connectedAt) })}
                  </p>
                ) : null}
              </div>
            </div>
            {numberMismatch ? (
              <Alert variant="warning">
                <AlertDescription>
                  {t("number_mismatch", {
                    connected: formatWhatsAppNumber(status.connectedNumber),
                    expected: formatWhatsAppNumber(status.phoneNumber),
                  })}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setChangingNumber(true)}>
                <Smartphone className="size-4" />
                {t("change_number")}
              </Button>
              <Button type="button" variant="destructive" onClick={() => setConfirmDisconnect(true)}>
                <LogOut className="size-4" />
                {t("disconnect")}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      <AlertDialog open={confirmDisconnect} onOpenChange={(open) => !open && setConfirmDisconnect(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disconnect_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("disconnect_confirm_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnect.isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={disconnect.isPending} onClick={doDisconnect}>
              {disconnect.isPending ? t("disconnecting") : t("disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
