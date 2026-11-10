import { useMemo, useState } from "react"
import { FolderCheck, FolderTree, FolderX, Plus, RefreshCw } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { DepartmentFormDialog } from "../components/department-form-dialog"
import { buildDepartmentColumns, type DepartmentRow } from "../components/departments-columns"
import { useDepartments, useSetDepartmentActive } from "../hooks/use-departments"
import type { Department } from "../types"

const PAGE_SIZE = 20

export function DepartmentsPage() {
  const { t } = useTranslation("business-items-departments")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
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
  const inactiveCount = departments.length - activeCount

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

  // Grupos (padre + hijos visibles) para paginar sin cortar familias.
  const groups = useMemo(
    () =>
      visibleParents.map((parent) => {
        const children = childrenByParent.get(parent.id) ?? []
        const matchingChildren = children.filter(matches)
        const isOpen = expandedIds.has(parent.id) || (q.length > 0 && matchingChildren.length > 0)
        return { parent, children: isOpen ? matchingChildren : [] }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleParents, childrenByParent, expandedIds, q]
  )

  const totalGroupPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE))
  const safePage = Math.min(page, totalGroupPages)
  const visibleRows: DepartmentRow[] = useMemo(() => {
    const pageGroups = groups.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    return pageGroups.flatMap(({ parent, children }) => [
      {
        kind: "parent",
        department: parent,
        hasChildren: (childrenByParent.get(parent.id) ?? []).length > 0,
        isOpen: expandedIds.has(parent.id) || (q.length > 0 && children.length > 0),
      },
      ...children.map((child) => ({ kind: "child", department: child }) as DepartmentRow),
    ])
  }, [groups, safePage, childrenByParent, expandedIds, q])

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

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  const columns = buildDepartmentColumns(t, {
    isMutating,
    onToggleExpand: toggleDetails,
    onEdit: handleEdit,
    onToggle: handleToggleStatus,
  })

  if (isError && !isLoading) {
    return (
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
    )
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/items", label: t("back_to_items") }}
        title={t("page_title")}
        description={t("page_desc")}
        stats={[
          { icon: FolderTree, tone: "info", label: t("total_departments"), value: totalCount },
          { icon: FolderCheck, tone: "success", label: t("active_departments"), value: activeCount },
          { icon: FolderX, tone: "warning", label: t("inactive_departments"), value: inactiveCount },
        ]}
        toolbar={{
          search: { value: query, onChange: handleSearchChange, placeholder: t("search_placeholder") },
          actions: (
            <Button onClick={handleCreate} disabled={isMutating} className="relative shadow-sm shadow-primary/20">
              <Plus className="size-4" />
              {t("create")}
            </Button>
          ),
        }}
      >
        <DataTable
          columns={columns}
          data={visibleRows}
          isLoading={isLoading}
          page={safePage}
          totalPages={totalGroupPages}
          totalCount={groups.length}
          onPageChange={setPage}
          skeletonRows={5}
          rowClassName={(row) => (row.kind === "child" ? "bg-muted/30 hover:bg-muted/45" : undefined)}
          emptyState={{
            icon: FolderTree,
            title: q ? t("search_title") : t("empty_title"),
            description: q ? t("search_desc") : t("empty_desc"),
            action: q ? null : (
              <Button onClick={handleCreate}>
                <Plus className="size-4" />
                {t("create")}
              </Button>
            ),
          }}
          labels={{
            previous: t("previous"),
            next: t("next"),
            paginationTotal: (count) => t("list_total", { total: count }),
            paginationProgress: (count, total) => t("list_progress", { count, total }),
          }}
        />
      </EntityListLayout>

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
    </>
  )
}
