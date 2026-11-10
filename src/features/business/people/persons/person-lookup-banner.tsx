import { CheckCircle2, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/use-i18n"
import { personDisplayName, type PersonResponseDto } from "./types"

type PersonLookupBannerProps = {
  person: PersonResponseDto
  onDismiss?: () => void
}

/**
 * Aviso compartido por los tres CRUD (Clientes, Proveedores y Usuarios):
 * indica que el formulario precargó los datos de una persona existente en la
 * tabla Persons. Usa el namespace común porque vive fuera de cada feature.
 */
export function PersonLookupBanner({ person, onDismiss }: PersonLookupBannerProps) {
  const { t } = useTranslation("common")

  return (
    <Alert variant="success" data-testid="person-lookup-banner">
      <CheckCircle2 />
      <AlertTitle className="flex items-start justify-between gap-2">
        <span>{t("person_found_title")}</span>
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-my-1 size-6 shrink-0"
            onClick={onDismiss}
            aria-label={t("close")}
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </AlertTitle>
      <AlertDescription>{t("person_found_desc", { name: personDisplayName(person) })}</AlertDescription>
    </Alert>
  )
}
