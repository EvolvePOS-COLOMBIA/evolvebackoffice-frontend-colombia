import { Building2, Globe } from "lucide-react"
import { useTranslation } from "@/i18n/use-i18n"

export type BranchSelectorOption = {
  id: string | null
  name: string
}

type BranchSelectorProps = {
  options: BranchSelectorOption[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function BranchSelector({ options, selectedId, onSelect }: BranchSelectorProps) {
  const { t } = useTranslation("business-items-catalog")

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
      {options.map((option) => {
        const isSelected = option.id === selectedId
        const isGlobal = option.id === null

        return (
          <button
            key={option.id ?? "global"}
            onClick={() => onSelect(option.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              isSelected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            } `}
          >
            {isGlobal ? <Globe className="size-3.5" /> : <Building2 className="size-3.5" />}
            <span className="hidden sm:inline">{option.name}</span>
            <span className="sm:hidden">{isGlobal ? t("global_catalog") : option.name.slice(0, 2).toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
