import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import { useNotify } from "@/hooks/use-notify"
import Spinner from "@/components/Spinner"
import { ShoppingCart } from "lucide-react"

interface CreateLocalOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLocalOrderDialog({ open, onOpenChange }: CreateLocalOrderDialogProps) {
  const { t } = useTranslation("business-orders")
  const notify = useNotify()
  const [loading, setLoading] = useState(false)

  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // TODO: POST /api/orders with manual order data
      // For now just close and notify
      notify.success("Orden creada exitosamente")
      onOpenChange(false)
      setCustomerName("")
      setPhone("")
      setAddress("")
      setNotes("")
    } catch {
      notify.error("Error al crear orden")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nueva Orden Local
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del cliente</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Juan Pérez" />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="300 123 4567" />
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 123 #45-67" />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones especiales..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("close")}
            </Button>
            <Button onClick={handleSubmit} disabled={!customerName || loading}>
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              Crear Orden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
