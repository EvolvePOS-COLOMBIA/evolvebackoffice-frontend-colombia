import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { badgeTones, type BadgeTone } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type BackLinkProps = {
  /** Link text, e.g. "Volver a configuraciones" */
  children: ReactNode
  /**
   * Target path (e.g. "/business/settings").
   * When omitted, goes back in history (navigate(-1)).
   */
  to?: string
  tone?: BadgeTone
  className?: string
}

/**
 * Badge-styled link for returning to a previous page.
 *
 * @example
 * <BackLink to="/business/settings">Volver a configuraciones</BackLink>
 * <BackLink to="/products">Volver a productos</BackLink>
 * <BackLink>Volver (historial)</BackLink>
 */
export function BackLink({ children, to, tone = "primary", className }: BackLinkProps) {
  const navigate = useNavigate()

  const classes = cn(
    "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
    badgeTones[tone],
    className
  )

  const content = (
    <>
      <ArrowLeft className="size-3.5 shrink-0" />
      <span>{children}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={classes}>
      {content}
    </button>
  )
}
