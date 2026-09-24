import { useMemo, useState } from "react"
import { Pencil, Power, Plus, RefreshCw, SearchX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

  const { data, isLoading, isError, refetch } = useDepartments(1, 500)
  const setStatusMutation = useSetDepartmentActive()

  const departments = useMemo(() => data?.data ?? [], [data?.data])
  const totalCount = data?.totalCount ?? 0
  const activeCount = useMemo(() => departments.filter((d) => d.isActive).length, [departments])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return departments
    return departments.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
  }, [departments, query])

  const handleCreate = () => {
    setSelectedDepartment(null)
    setFormOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept)
    setFormOpen(true)
  }

  const handleToggleStatus = (dept: Department) => {
    const confirmMsg = dept.isActive
      ? t("confirm_deactivate", { name: dept.name })
      : t("confirm_activate", { name: dept.name })
    if (!confirm(confirmMsg)) return
    setStatusMutation.mutate(
      { id: dept.id, active: !dept.isActive },
      {
        onSuccess: () => notify.success(t("success_status")),
        onError: () => notify.error(t("error_load_title")),
      }
    )
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
            <Button onClick={handleCreate} disabled={isMutating}>
              <Plus className="size-4" />
              {t("create")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search_placeholder")} />
            </div>
            <Badge tone="neutral" className="w-fit">
              {filtered.length} {t("results")}
            </Badge>
          </div>

          {isLoading ? (
            <DepartmentsSkeleton />
          ) : filtered.length === 0 ? (
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
                  <TableHead className="hidden sm:table-cell">{t("parent_label")}</TableHead>
                  <TableHead>{t("status_label")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-muted-foreground">{d.code}</TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {d.parentName ?? t("no_parent")}
                    </TableCell>
                    <TableCell>
                      <Badge tone={d.isActive ? "success" : "neutral"}>
                        {d.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(d)}
                          disabled={isMutating}
                        >
                          <Pencil className="size-4" />
                          {t("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(d)}
                          disabled={isMutating}
                        >
                          <Power className="size-4" />
                          {d.isActive ? t("deactivate") : t("activate")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
