import ButterflyLoading from "@/components/layout/ButterflyLoading"

/**
 * Componente de loading que se muestra mientras i18n se inicializa.
 * Reemplaza el loading por defecto con el ButterflyLoading del layout.
 */
export function I18nLoading() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background/80">
      <ButterflyLoading />
    </div>
  )
}
