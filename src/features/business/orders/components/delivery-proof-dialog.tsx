import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useTranslation } from "@/i18n/use-i18n"
import { getDeliveryProof } from "../services/delivery-enhancements.service"
import { getApiErrorMessage } from "../utils/order-helpers"

export function DeliveryProofDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation("business-orders")
  const { data, error, isLoading } = useQuery({
    queryKey: ["delivery-proof", id],
    queryFn: () => getDeliveryProof(id),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("e_view_proof")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("e_view_proof")}</DialogTitle>
            <DialogDescription>{t("e_proof_private")}</DialogDescription>
          </DialogHeader>
          {isLoading && <p>{t("loading")}</p>}
          {error && <p role="alert">{getApiErrorMessage(error, t("status_update_failed"))}</p>}
          {data && (
            <>
              <p>
                {data.receiverName} · {new Date(data.createdAt).toLocaleString()}
              </p>
              <img
                alt={t(data.kind === "Signature" ? "e_signature" : "e_photo")}
                className="max-h-96 rounded bg-white object-contain"
                src={`data:${data.contentType};base64,${data.data}`}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
