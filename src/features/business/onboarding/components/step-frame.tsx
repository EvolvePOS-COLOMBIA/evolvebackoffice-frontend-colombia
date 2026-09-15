import type { ReactNode } from "react"
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react"

import Spinner from "@/components/Spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type StepCardProps = {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}

export function StepCard({ icon: Icon, title, description, children }: StepCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col -space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

type StepFooterProps = {
  onBack: () => void
  backLabel: string
  submitLabel: string
  isSubmitting?: boolean
}

export function StepFooter({ onBack, backLabel, submitLabel, isSubmitting = false }: StepFooterProps) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
        <ArrowLeft className="size-4" />
        {backLabel}
      </Button>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner IsButton /> : null}
        {submitLabel}
        {!isSubmitting && <ArrowRight className="size-4" />}
      </Button>
    </div>
  )
}
