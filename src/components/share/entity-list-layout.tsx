import { Children, isValidElement } from "react"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { Search } from "lucide-react"

import { BackLink } from "@/components/ui/back-link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { ExpandableDescription } from "./expandable-description"
import { StatTile } from "./stat-tile"
import type { EntityListLayoutProps, StatConfig, ToolbarConfig } from "./types"

export type ContainerProps = ComponentProps<"div">

export type HeroProps = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode
  /** Show the decorative circle in the top-right corner. Default: true. */
  decorative?: boolean
}

export type ToolbarProps = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode
}

export function Hero({ children, decorative = true, className, ...props }: HeroProps) {
  return (
    <CardHeader
      className={cn(
        "relative shrink-0 overflow-hidden border-b border-border/70 px-5 pt-6 pb-5 sm:px-7 sm:pt-7",
        className
      )}
      {...props}
    >
      {decorative ? (
        <div className="pointer-events-none absolute -top-16 -right-14 size-64 rounded-full border border-primary/10 bg-primary/[0.035]" />
      ) : null}
      {children}
    </CardHeader>
  )
}

export function Container({ children, className, ...props }: ContainerProps) {
  const items = Children.toArray(children)
  const headerZones: ReactNode[] = []
  const bodyZones: ReactNode[] = []
  let bodyStarted = false

  for (const item of items) {
    if (!bodyStarted && isValidElement(item) && item.type === Hero) {
      headerZones.push(item)
    } else {
      bodyStarted = true
      bodyZones.push(item)
    }
  }

  return (
    <Card
      {...props}
      className={cn(
        "flex h-[calc(100vh-5.5rem)] flex-col overflow-hidden border-border/80 bg-card/70 shadow-none md:h-[calc(100vh-6.5rem)]",
        className
      )}
    >
      {headerZones}
      {bodyZones.length > 0 ? (
        <CardContent className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4 sm:p-5">{bodyZones}</CardContent>
      ) : null}
    </Card>
  )
}

export function Toolbar({ children, className, ...props }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function isToolbarConfig(value: ToolbarConfig | ReactNode): value is ToolbarConfig {
  if (typeof value !== "object" || value === null) return false
  if (isValidElement(value)) return false
  if (Array.isArray(value)) return false
  if ("$$typeof" in value) return false
  if (Symbol.iterator in value) return false
  return true
}

function hasStatsContent(stats: EntityListLayoutProps["stats"]): boolean {
  if (stats === undefined || stats === null || stats === false) return false
  if (Array.isArray(stats)) return stats.length > 0
  return true
}

function statsGridColumns(count: number): string {
  if (count <= 1) return "grid-cols-1"
  if (count === 2) return "grid-cols-2"
  if (count === 3) return "grid-cols-3"
  return "grid-cols-2 sm:grid-cols-4"
}

function renderStatsZone(stats: EntityListLayoutProps["stats"]): ReactNode {
  if (stats === undefined || stats === null || stats === false) return null

  if (Array.isArray(stats)) {
    if (stats.length === 0) return null
    return (
      <div
        className={cn(
          // Móvil: chips en fila que fluyen (flex). sm+: grid con las columnas configuradas.
          // max-w-full: dentro de la columna derecha (limitada en xl) la grilla se
          // ajusta en vez de desbordar sobre el título.
          "z-10 flex max-w-full shrink-0 flex-wrap gap-2 sm:grid sm:gap-2.5 xl:w-fit",
          statsGridColumns(stats.length)
        )}
      >
        {stats.map((stat: StatConfig, index: number) => (
          <StatTile key={index} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>
    )
  }

  return stats
}

function renderToolbarZone(toolbar: EntityListLayoutProps["toolbar"]): ReactNode {
  if (toolbar === undefined || toolbar === null || toolbar === false) return null

  if (isToolbarConfig(toolbar)) {
    const { search, actions } = toolbar
    const hasActions = actions !== undefined && actions !== null && actions !== false
    if (!search && !hasActions) return null

    return (
      <Toolbar>
        {search ? (
          <div className={cn("relative max-w-xl flex-1", search.className)}>
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              className="h-8 pl-9 sm:h-9"
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {hasActions ? (
          // En móvil los botones de acción se compactan (h-8, texto-xs) como en
          // el catálogo de items, y w-fit evita que se estiren por el flex-col.
          <div className="flex w-fit shrink-0 items-center gap-2 max-sm:[&_button]:h-8 max-sm:[&_button]:px-2.5 max-sm:[&_button]:text-xs">
            {actions}
          </div>
        ) : null}
      </Toolbar>
    )
  }

  return <Toolbar>{toolbar}</Toolbar>
}

export function EntityListLayout(props: EntityListLayoutProps): ReactElement {
  const {
    back,
    title,
    description,
    eyebrow,
    stats,
    toolbar,
    tabs,
    heroFooter,
    hero,
    decorative = true,
    className,
    children,
  } = props

  const hasCustomHero = hero !== undefined && hero !== null && hero !== false
  const hasTabs = tabs !== undefined && tabs !== null && tabs !== false
  const hasHeroFooter = heroFooter !== undefined && heroFooter !== null && heroFooter !== false

  let heroZone: ReactNode = null
  if (hasCustomHero) {
    heroZone = <Hero decorative={decorative}>{hero}</Hero>
  } else if (eyebrow || back || title || description || hasHeroFooter || hasTabs || hasStatsContent(stats)) {
    const hasLeftContent = Boolean(eyebrow || back || title || description || hasHeroFooter)
    heroZone = (
      <Hero decorative={decorative}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          {hasLeftContent ? (
            <div className="relative min-w-0 space-y-3 xl:flex-1">
              {back ? (
                <div>
                  <BackLink to={back.to}>{back.label}</BackLink>
                </div>
              ) : null}
              {eyebrow ? <div>{eyebrow}</div> : null}
              {title || description ? (
                <div className="space-y-1">
                  {title ? (
                    <CardTitle className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
                      {title}
                    </CardTitle>
                  ) : null}
                  {description ? <ExpandableDescription text={description} /> : null}
                </div>
              ) : null}
              {hasHeroFooter ? heroFooter : null}
            </div>
          ) : null}
          {hasTabs || hasStatsContent(stats) ? (
            <div className="flex shrink-0 flex-col items-start gap-3 xl:w-1/2 xl:items-end">
              {hasTabs ? tabs : null}
              {renderStatsZone(stats)}
            </div>
          ) : null}
        </div>
      </Hero>
    )
  }

  return (
    <Container className={className}>
      {heroZone}
      {renderToolbarZone(toolbar)}
      {children}
    </Container>
  )
}
