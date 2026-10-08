import { useEffect, useRef, useState, type PointerEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/use-i18n"
import type { DeliveryProofInput } from "../types/enhancements"

export function DeliveryProofCapture({
  onChange,
}: {
  onChange: (value: DeliveryProofInput | null, valid: boolean) => void
}) {
  const { t } = useTranslation("business-orders")
  const [kind, setKind] = useState<"None" | "Photo" | "Signature">("None")
  const [name, setName] = useState("")
  const [consent, setConsent] = useState(false)
  const [picture, setPicture] = useState<{ data: string; contentType: string } | null>(null)
  const [error, setError] = useState("")
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const changed = useRef(false)
  const readVersion = useRef(0)
  useEffect(
    () => () => {
      readVersion.current++
    },
    []
  )
  useEffect(() => {
    const proof = kind !== "None" && picture ? { kind, ...picture, receiverName: name.trim() || undefined } : null
    onChange(proof, kind === "None" || (!!proof && consent))
  }, [kind, picture, name, consent, onChange])
  function point(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return [((e.clientX - rect.left) * 600) / rect.width, ((e.clientY - rect.top) * 200) / rect.height]
  }
  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend>{t("e_proof_optional")}</legend>
      <select
        aria-label={t("e_proof_kind")}
        value={kind}
        className="w-full rounded border bg-background p-2"
        onChange={(e) => {
          const value = e.target.value as typeof kind
          setKind(value)
          readVersion.current++
          setPicture(null)
          changed.current = false
          setError("")
        }}
      >
        <option value="None">{t("e_proof_none")}</option>
        <option value="Photo">{t("e_photo")}</option>
        <option value="Signature">{t("e_signature")}</option>
      </select>
      {kind !== "None" && (
        <>
          <Input
            aria-label={t("e_receiver_name")}
            placeholder={t("e_receiver_name")}
            value={name}
            maxLength={200}
            onChange={(e) => {
              setName(e.target.value)
            }}
          />
          {kind === "Photo" && (
            <Input
              aria-label={t("e_photo")}
              type="file"
              capture="environment"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const version = ++readVersion.current
                const file = e.target.files?.[0]
                setPicture(null)
                if (!file) return
                if (file.size > 2097152 || !["image/png", "image/jpeg"].includes(file.type)) {
                  setError(t("e_photo_invalid"))
                  return
                }
                const reader = new FileReader()
                reader.onload = () => {
                  if (version !== readVersion.current) return
                  const photo = { data: String(reader.result).split(",")[1], contentType: file.type }
                  setPicture(photo)
                  setError("")
                }
                reader.onerror = () => {
                  if (version === readVersion.current) setError(t("e_photo_invalid"))
                }
                reader.readAsDataURL(file)
              }}
            />
          )}
          {kind === "Signature" && (
            <>
              <canvas
                ref={canvas}
                width={600}
                height={200}
                aria-label={t("e_signature")}
                className="h-36 w-full touch-none rounded border bg-white"
                onPointerDown={(e) => {
                  drawing.current = true
                  changed.current = false
                  e.currentTarget.setPointerCapture(e.pointerId)
                  const ctx = canvas.current!.getContext("2d")!
                  const [x, y] = point(e)
                  ctx.beginPath()
                  ctx.moveTo(x, y)
                  ctx.strokeStyle = "#111827"
                  ctx.lineWidth = 3
                }}
                onPointerMove={(e) => {
                  if (!drawing.current) return
                  const ctx = canvas.current!.getContext("2d")!
                  const [x, y] = point(e)
                  ctx.lineTo(x, y)
                  ctx.stroke()
                  changed.current = true
                }}
                onPointerUp={() => {
                  drawing.current = false
                  if (!changed.current) return
                  const signature = {
                    data: canvas.current!.toDataURL("image/png").split(",")[1],
                    contentType: "image/png",
                  }
                  setPicture(signature)
                }}
                onPointerCancel={() => {
                  drawing.current = false
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  canvas.current?.getContext("2d")?.clearRect(0, 0, 600, 200)
                  setPicture(null)
                }}
              >
                {t("e_clear_signature")}
              </Button>
            </>
          )}
          {picture && kind === "Photo" && (
            <img
              src={`data:${picture.contentType};base64,${picture.data}`}
              alt={t("e_photo")}
              className="max-h-48 rounded"
            />
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
              }}
            />
            {t("e_proof_consent")}
          </label>
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
        </>
      )}
    </fieldset>
  )
}
