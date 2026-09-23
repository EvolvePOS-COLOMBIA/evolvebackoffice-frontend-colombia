import { Children, isValidElement } from "react"
import type { ComponentProps, ReactElement, ReactNode } from "react"
import { Search } from "lucide-react"

import { BackLink } from "@/components/ui/back-link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { StatTile } from "./stat-tile"
import type { EntityListLayoutBaseProps, EntityListLayoutProps, StatConfig, ToolbarConfig } from "./types"

export type ContainerProps = ComponentProps<"div">

export type HeroProps = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode
  /** Show the decorative circle in the top-right corner. Default: true. */
  decorative?: boolean
}

export type ToolbarProps = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode
}

function Hero({ children, decorative = true, className, ...props }: HeroProps) {
  return (
    <CardHeader
      className={cn("relative overflow-hidden border-b border-border/70 px-5 pt-6 pb-5 sm:px-7 sm:pt-7", className)}
      {...props}
    >
      {decorative ? (
        <div className="pointer-events-none absolute -top-16 -right-14 size-64 rounded-full border border-primary/10 bg-primary/[0.035]" />
      ) : null}
      {children}
    </CardHeader>
  )
}

function Container({ children, className, ...props }: ContainerProps) {
  const items = Children.toArray(children)
  const headerZones: ReactNode[] = []
  const bodyZones: ReactNode[] = []
  let bodyStarted = false

  for (const item of items) {
    const isLeadingHero = !bodyStarted && isValidElement(item) && item.type === Hero
    if (isLeadingHero) {
      headerZones.push(item)
    } else {
      bodyStarted = true
      bodyZones.push(item)
    }
  }

  return (
    <Card {...props} className={cn("overflow-hidden border-border/80 bg-card/70 shadow-none", className)}>
      {headerZones}
      {bodyZones.length > 0 ? <CardContent className="space-y-5 p-4 sm:p-5">{bodyZones}</CardContent> : null}
    </Card>
  )
}

function Toolbar({ children, className, ...props }: ToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)} {...props}>
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
      <div className={cn("z-10 grid shrink-0 gap-2.5 sm:gap-3 xl:w-fit", statsGridColumns(stats.length))}>
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
              className="pl-9"
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {hasActions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </Toolbar>
    )
  }

  return <Toolbar>{toolbar}</Toolbar>
}

function EntityListLayoutImpl(
  props: EntityListLayoutBaseProps & { stats?: StatConfig[]; toolbar?: ToolbarConfig }
): ReactElement
function EntityListLayoutImpl(
  props: EntityListLayoutBaseProps & { stats?: StatConfig[]; toolbar?: ReactNode }
): ReactElement
function EntityListLayoutImpl(
  props: EntityListLayoutBaseProps & { stats?: ReactNode; toolbar?: ToolbarConfig }
): ReactElement
function EntityListLayoutImpl(props: EntityListLayoutProps): ReactElement
function EntityListLayoutImpl(props: EntityListLayoutProps): ReactElement {
  const { back, title, description, stats, toolbar, hero, decorative = true, className, children } = props

  const hasCustomHero = hero !== undefined && hero !== null && hero !== false

  let heroZone: ReactNode = null
  if (hasCustomHero) {
    heroZone = <Hero decorative={decorative}>{hero}</Hero>
  } else if (back || title || description || hasStatsContent(stats)) {
    const hasLeftContent = Boolean(back || title || description)
    heroZone = (
      <Hero decorative={decorative}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          {hasLeftContent ? (
            <div className="relative min-w-0 space-y-3 xl:flex-1">
              {back ? <BackLink to={back.to}>{back.label}</BackLink> : null}
              {title || description ? (
                <div className="space-y-1">
                  {title ? (
                    <CardTitle className="text-3xl font-semibold tracking-tight text-balance text-foreground">
                      {title}
                    </CardTitle>
                  ) : null}
                  {description ? (
                    <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      {description}
                    </CardDescription>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {renderStatsZone(stats)}
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

export const EntityListLayout = Object.assign(EntityListLayoutImpl, {
  Container,
  Hero,
  Toolbar,
})
