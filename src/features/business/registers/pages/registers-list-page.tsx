import { useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, KeyRound, MonitorCog, Plus, RefreshCw, SearchX, Settings2 } from "lucide-react"

import { DataTable } from "@/components/data-table"
import { EntityListLayout } from "@/components/share"
import { EmptyState } from "@/components/share/empty-state"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBranchTerminalSettings } from "@/features/business/branches/hooks/use-branch-terminals"
import { buildRegisterColumns, buildSerialColumns } from "@/features/business/registers/components/register-columns"
import { CreateRegisterDialog } from "@/features/business/registers/components/create-register-dialog"
import { EditRegisterDialog } from "@/features/business/registers/components/edit-register-dialog"
import { SetStatusDialog } from "@/features/business/registers/components/set-status-dialog"
import {
  useCreateRegister,
  useRegisters,
  useSetRegisterStatus,
  useTenantSerialCodes,
  useUpdateRegister,
} from "@/features/business/registers/hooks/use-registers"
import type { Register, RegisterFormValues, RegisterStatus } from "@/features/business/registers/types"
import type { CreateRegisterDto, UpdateRegisterDto } from "@/features/business/registers/types/api"
import { filterSerials, summarizeSerials } from "@/features/business/registers/utils/register-status"
import { notify } from "@/hooks/use-notify"
import { useTranslation } from "@/i18n/use-i18n"
import { getApiErrorMessage } from "@/utils/api-error"

const PAGE_SIZE = 10

type RegistersTab = "registers" | "serials"

function BranchDisabledWarning({ branchId, onNavigate }: { branchId: string; onNavigate: (id: string) => void }) {
  const { t } = useTranslation("business-registers")
  const { data: settings } = useBranchTerminalSettings(branchId, true)
  if (!settings || settings.areTerminalsEnabled) return null
  return (
    <Alert variant="default" className="shrink-0 border-amber-400/30 bg-amber-500/5">
      <AlertTriangle className="size-4 text-amber-500" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AlertTitle className="text-amber-600">{t("warning_branch_disabled")}</AlertTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => onNavigate(branchId)} className="shrink-0">
          <Settings2 className="size-4" />
          {t("go_to_branch_settings")}
        </Button>
      </div>
    </Alert>
  )
}

/** Cajas / terminales POS y pool de seriales del tenant, en dos pestañas sobre EntityListLayout. */
export function RegistersListPage() {
  const { t } = useTranslation("business-registers")
  const navigate = useNavigate()

  const [tab, setTab] = useState<RegistersTab>("registers")
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [serialQuery, setSerialQuery] = useState("")
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [selected, setSelected] = useState<Register | null>(null)

  const registersQuery = useRegisters(page, PAGE_SIZE, debouncedQuery)
  // El stat de total no debe cambiar con la búsqueda: se pide el conteo sin filtro (1 fila).
  const overallQuery = useRegisters(1, 1, "")
  const overallCount = overallQuery.data?.totalCount ?? 0
  const serialsQuery = useTenantSerialCodes()
  const createMutation = useCreateRegister()
  const updateMutation = useUpdateRegister()
  const statusMutation = useSetRegisterStatus()

  const registers = useMemo(() => registersQuery.data?.data ?? [], [registersQuery.data?.data])
  const totalCount = registersQuery.data?.totalCount ?? 0
  const totalPages = registersQuery.data?.totalPages ?? 0
  const serials = useMemo(() => serialsQuery.data ?? [], [serialsQuery.data])
  const visibleSerials = useMemo(() => filterSerials(serials, serialQuery), [serials, serialQuery])

  const serialStats = useMemo(() => summarizeSerials(serials), [serials])

  const branchIds = useMemo(
    () => Array.from(new Set(registers.map((r) => r.branchPublicId).filter(Boolean))),
    [registers]
  )

  const isMutating = createMutation.isPending || updateMutation.isPending || statusMutation.isPending

  // Búsqueda server-side con debounce, igual que el catálogo.
  const handleSearch = (value: string) => {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(value.trim())
      setPage(1)
    }, 350)
  }

  const goToBranchSettings = (branchId: string) => navigate(`/business/branches/${branchId}/config?tab=terminals`)

  const handleCreate = (values: RegisterFormValues) => {
    const payload: CreateRegisterDto = {
      name: values.name,
      code: values.code,
      branchPublicId: values.branchPublicId,
      deviceIdentifier: values.deviceIdentifier || null,
      serialCode: values.serialCode || null,
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        notify.success(t("success_created"))
        setCreateOpen(false)
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("error_save"))),
    })
  }

  const handleEdit = (values: RegisterFormValues) => {
    if (!selected) return
    const payload: UpdateRegisterDto = {
      name: values.name,
      branchPublicId: values.branchPublicId,
      deviceIdentifier: values.deviceIdentifier || null,
      serialCode: values.serialCode || null,
    }
    updateMutation.mutate(
      { id: selected.id, payload },
      {
        onSuccess: () => {
          notify.success(t("success_updated"))
          setEditOpen(false)
          setSelected(null)
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("error_save"))),
      }
    )
  }

  const handleSetStatus = (status: RegisterStatus) => {
    if (!selected) return
    statusMutation.mutate(
      { id: selected.id, status },
      {
        onSuccess: () => {
          notify.success(t("success_status_changed"))
          setStatusOpen(false)
          setSelected(null)
        },
        onError: (error) => notify.error(getApiErrorMessage(error, t("error_save"))),
      }
    )
  }

  const registerColumns = buildRegisterColumns(t, {
    onEdit: (r) => {
      setSelected(r)
      setEditOpen(true)
    },
    onSetStatus: (r) => {
      setSelected(r)
      setStatusOpen(true)
    },
    onBranchSettings: goToBranchSettings,
    disabled: isMutating,
  })
  const serialColumns = buildSerialColumns(t)

  const retry = (refetch: () => unknown) => (
    <Button variant="outline" onClick={() => refetch()}>
      <RefreshCw className="size-4" />
      {t("retry")}
    </Button>
  )

  const renderBody = () => {
    if (tab === "registers") {
      if (registersQuery.isError) {
        return (
          <EmptyState
            icon={MonitorCog}
            title={t("error_load_title")}
            description={t("error_load_desc")}
            action={retry(registersQuery.refetch)}
          />
        )
      }
      return (
        <>
          {branchIds.map((id) => (
            <BranchDisabledWarning key={id} branchId={id} onNavigate={goToBranchSettings} />
          ))}
          <DataTable
            columns={registerColumns}
            data={registers}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            isLoading={registersQuery.isLoading}
            skeletonRows={5}
            emptyState={
              debouncedQuery
                ? {
                    icon: SearchX,
                    title: t("no_results"),
                    description: t("search_desc"),
                    action: (
                      <Button variant="outline" onClick={() => handleSearch("")}>
                        {t("clear_search")}
                      </Button>
                    ),
                  }
                : {
                    icon: MonitorCog,
                    title: t("empty_title"),
                    description: t("empty_desc"),
                    action: (
                      <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        {t("create")}
                      </Button>
                    ),
                  }
            }
            labels={{
              previous: t("previous"),
              next: t("next"),
              paginationTotal: (count) => t("registers_count", { count }),
              paginationProgress: (count, total) => t("registers_progress", { count, total }),
            }}
          />
        </>
      )
    }

    if (serialsQuery.isError) {
      return (
        <EmptyState
          icon={KeyRound}
          title={t("error_load_title")}
          description={t("error_load_desc")}
          action={retry(serialsQuery.refetch)}
        />
      )
    }
    return (
      <DataTable
        columns={serialColumns}
        data={visibleSerials}
        page={1}
        totalPages={1}
        totalCount={visibleSerials.length}
        onPageChange={() => undefined}
        isLoading={serialsQuery.isLoading}
        skeletonRows={5}
        emptyState={{
          icon: serialQuery ? SearchX : KeyRound,
          title: serialQuery ? t("serials_no_results") : t("serials_pool_empty"),
          description: serialQuery ? t("serials_no_results_desc") : undefined,
        }}
        labels={{
          paginationTotal: (count) => t("serials_count", { count }),
        }}
      />
    )
  }

  return (
    <>
      <EntityListLayout
        back={{ to: "/business/settings?tab=global", label: t("back_to_settings") }}
        title={t("page_title")}
        description={t("page_desc")}
        stats={[
          { icon: MonitorCog, tone: "primary", label: t("total_registers"), value: overallCount },
          { icon: KeyRound, tone: "success", label: t("stat_serials_available"), value: serialStats.available },
          { icon: KeyRound, tone: "info", label: t("stat_serials_in_use"), value: serialStats.inUse },
        ]}
        heroFooter={
          <Tabs value={tab} onValueChange={(value) => setTab(value as RegistersTab)}>
            <TabsList>
              <TabsTrigger value="registers">{t("tab_registers")}</TabsTrigger>
              <TabsTrigger value="serials">{t("tab_serials")}</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        toolbar={
          tab === "registers"
            ? {
                search: { value: query, onChange: handleSearch, placeholder: t("search_placeholder") },
                actions: (
                  <Button onClick={() => setCreateOpen(true)} disabled={isMutating}>
                    <Plus className="size-4" />
                    {t("create")}
                  </Button>
                ),
              }
            : {
                search: { value: serialQuery, onChange: setSerialQuery, placeholder: t("search_serials_placeholder") },
                actions: (
                  <Button onClick={() => serialsQuery.refetch()} disabled={serialsQuery.isFetching}>
                    <RefreshCw className="size-4" />
                    {t("refresh")}
                  </Button>
                ),
              }
        }
      >
        {renderBody()}
      </EntityListLayout>

      <CreateRegisterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
      <EditRegisterDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setSelected(null)
        }}
        registerToEdit={selected}
        onSubmit={handleEdit}
        isSubmitting={updateMutation.isPending}
      />
      <SetStatusDialog
        open={statusOpen}
        onOpenChange={(open) => {
          setStatusOpen(open)
          if (!open) setSelected(null)
        }}
        registerToUpdate={selected}
        onSubmit={handleSetStatus}
        isSubmitting={statusMutation.isPending}
      />
    </>
  )
}
