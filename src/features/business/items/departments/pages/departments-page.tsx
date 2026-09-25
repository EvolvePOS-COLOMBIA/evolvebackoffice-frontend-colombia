import { Fragment, useMemo, useState } from "react"
import { ChevronDown, CornerDownRight, Pencil, Power, Plus, RefreshCw, SearchX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { DepartmentFormDialog } from "../components/department-form-dialog"
import { useDepartments, useSetDepartmentActive } from "../hooks/use-departments"
import type { Department } from "../types"

export function DepartmentsPage() {
  const { t } = useTranslation("business-items-departments")
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  // Departamentos padre con el detalle (subdepartamentos) expandido
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [deactivateTarget, setDeactivateTarget] = useState<Department | null>(null)

  const { data, isLoading, isError, refetch } = useDepartments(1, 500)
  const setStatusMutation = useSetDepartmentActive()

  const departments = useMemo(() => data?.data ?? [], [data?.data])
  const totalCount = data?.totalCount ?? 0
  const activeCount = useMemo(() => departments.filter((d) => d.isActive).length, [departments])

  const q = query.trim().toLowerCase()
  const matches = (d: Department) => !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)

  const deptIds = useMemo(() => new Set(departments.map((d) => d.id)), [departments])

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Department[]>()
    for (const d of departments) {
      if (d.parentPublicId) {
        const arr = map.get(d.parentPublicId) ?? []
        arr.push(d)
        map.set(d.parentPublicId, arr)
      }
    }
    return map
  }, [departments])

  // Nivel superior: departamentos sin padre (los huérfanos también se listan arriba).
  const topLevels = useMemo(
    () => departments.filter((d) => !d.parentPublicId || !deptIds.has(d.parentPublicId)),
    [departments, deptIds]
  )

  // Con búsqueda: un padre es visible si él o alguno de sus hijos coincide.
  const visibleParents = useMemo(() => {
    if (!q) return topLevels
    return topLevels.filter((p) => matches(p) || (childrenByParent.get(p.id) ?? []).some(matches))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topLevels, q, childrenByParent])

  const shownChildrenCount = useMemo(
    () => visibleParents.reduce((acc, p) => acc + (childrenByParent.get(p.id) ?? []).filter(matches).length, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleParents, childrenByParent, q]
  )

  const handleCreate = () => {
    setSelectedDepartment(null)
    setFormOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept)
    setFormOpen(true)
  }

  const toggleDetails = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Activar es directo; desactivar pide confirmación visual.
  const handleToggleStatus = (dept: Department) => {
    if (dept.isActive) {
      setDeactivateTarget(dept)
    } else {
      setStatusMutation.mutate(
        { id: dept.id, active: true },
        {
          onSuccess: () => notify.success(t("success_status")),
          onError: () => notify.error(t("error_status")),
        }
      )
    }
  }

  const isMutating = setStatusMutation.isPending

  if (isError && !isLoading) {
    return (
      <div className="space-y-6">
        <ErrorState
          eyebrow={t("page_title")}
          title={t("error_load_title")}
          description={t("error_load_desc")}
          action={
            <Button onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              {t("retry")}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <Badge tone="primary">{t("summary")}</Badge>
            <div>
              <h1 className="text-3xl font-semibold text-balance text-foreground">{t("page_title")}</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("page_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label={t("total_departments")} value={totalCount} loading={isLoading} />
            <SummaryTile label={t("active_departments")} value={activeCount} loading={isLoading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("page_title")}</CardTitle>
              <CardDescription>{t("search_placeholder")}</CardDescription>
            </div>
            <Button
              onClick={handleCreate}
              disabled={isMutating}
              size="sm"
              className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
            >
              <Plus className="size-4" />
              {t("create")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="h-8 w-full max-w-sm px-3 text-sm sm:h-9"
              />
            </div>
            <Badge tone="neutral" className="w-fit">
              {visibleParents.length + shownChildrenCount} {t("results")}
            </Badge>
          </div>

          {isLoading ? (
            <DepartmentsSkeleton />
          ) : visibleParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <SearchX className="mb-3 size-10 opacity-40" />
              <p className="text-sm">{query ? t("no_results") : t("empty_desc")}</p>
              {!query && (
                <Button variant="outline" size="sm" className="mt-4" onClick={handleCreate}>
                  {t("create")}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code_label")}</TableHead>
                  <TableHead>{t("name_label")}</TableHead>
                  <TableHead>{t("status_label")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleParents.map((parent) => {
                  const children = childrenByParent.get(parent.id) ?? []
                  const matchingChildren = children.filter(matches)
                  const isOpen = expandedIds.has(parent.id) || (q.length > 0 && matchingChildren.length > 0)

                  return (
                    <Fragment key={parent.id}>
                      <TableRow>
                        <TableCell className="font-mono text-muted-foreground">{parent.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {children.length > 0 ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="size-6 shrink-0 sm:size-7"
                                onClick={() => toggleDetails(parent.id)}
                                aria-label={isOpen ? t("hide_details") : t("details")}
                                title={isOpen ? t("hide_details") : t("details")}
                              >
                                <ChevronDown
                                  className={`size-3.5 transition-transform sm:size-4 ${isOpen ? "rotate-180" : ""}`}
                                />
                              </Button>
                            ) : (
                              <span className="w-6 shrink-0 sm:w-7" aria-hidden="true" />
                            )}
                            <span className="font-medium">{parent.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge tone={parent.isActive ? "success" : "neutral"}>
                            {parent.isActive ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 text-right sm:px-4">
                          <ActionsCell
                            dept={parent}
                            isMutating={isMutating}
                            onEdit={handleEdit}
                            onToggle={handleToggleStatus}
                          />
                        </TableCell>
                      </TableRow>

                      {isOpen &&
                        matchingChildren.map((child) => (
                          <TableRow key={child.id} className="bg-muted/30 hover:bg-muted/45">
                            <TableCell className="font-mono text-muted-foreground">{child.code}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 pl-7 sm:pl-9">
                                <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="text-muted-foreground">{child.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge tone={child.isActive ? "success" : "neutral"}>
                                {child.isActive ? t("active") : t("inactive")}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-1 text-right sm:px-4">
                              <ActionsCell
                                dept={child}
                                isMutating={isMutating}
                                onEdit={handleEdit}
                                onToggle={handleToggleStatus}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedDepartment(null)
        }}
        departmentToEdit={selectedDepartment}
      />

      {/* Confirmación visual: desactivar departamento */}
      <ConfirmActionDialog
        open={deactivateTarget !== null}
        onOpenChange={(openValue) => {
          if (!openValue) setDeactivateTarget(null)
        }}
        title={t("deactivate_title")}
        description={t("confirm_deactivate", { name: deactivateTarget?.name ?? "" })}
        confirmLabel={t("deactivate")}
        tone="destructive"
        isPending={isMutating}
        onConfirm={() => {
          if (!deactivateTarget) return
          setStatusMutation.mutate(
            { id: deactivateTarget.id, active: false },
            {
              onSuccess: () => {
                notify.success(t("success_status"))
                setDeactivateTarget(null)
              },
              onError: () => notify.error(t("error_status")),
            }
          )
        }}
      />
    </div>
  )
}

/** Acciones de fila solo con íconos (misma presentación que el catálogo de productos). */
function ActionsCell({
  dept,
  isMutating,
  onEdit,
  onToggle,
}: {
  dept: Department
  isMutating: boolean
  onEdit: (dept: Department) => void
  onToggle: (dept: Department) => void
}) {
  const { t } = useTranslation("business-items-departments")
  return (
    <div className="flex justify-end gap-1 sm:gap-2">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="size-7 sm:size-8"
        onClick={() => onEdit(dept)}
        disabled={isMutating}
        aria-label={t("edit")}
        title={t("edit")}
      >
        <Pencil className="size-3.5 sm:size-4" />
      </Button>
      <Button
        type="button"
        variant={dept.isActive ? "destructive" : "secondary"}
        size="icon"
        className="size-7 sm:size-8"
        onClick={() => onToggle(dept)}
        disabled={isMutating}
        aria-label={dept.isActive ? t("deactivate") : t("activate")}
        title={dept.isActive ? t("deactivate") : t("activate")}
      >
        <Power className="size-3.5 sm:size-4" />
      </Button>
    </div>
  )
}

function SummaryTile({ label, value, loading = false }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <Card className="max-h-min rounded-3xl">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-16" />
        ) : (
          <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

function DepartmentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}
