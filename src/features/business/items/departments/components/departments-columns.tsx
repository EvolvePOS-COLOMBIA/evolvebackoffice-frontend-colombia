import { ChevronDown, CornerDownRight, Folder, Pencil, Power } from "lucide-react"

import type { ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ItemThumbnail } from "../../catalog/components/item-thumbnail"
import type { Department } from "../types"

export type DepartmentRow =
  | { kind: "parent"; department: Department; hasChildren: boolean; isOpen: boolean }
  | { kind: "child"; department: Department }

type DepartmentColumnActions = {
  isMutating: boolean
  onToggleExpand: (id: string) => void
  onEdit: (dept: Department) => void
  onToggle: (dept: Department) => void
}

export function buildDepartmentColumns(
  t: (key: string) => string,
  { isMutating, onToggleExpand, onEdit, onToggle }: DepartmentColumnActions
): ColumnDef<DepartmentRow>[] {
  return [
    {
      key: "code",
      header: t("code_label"),
      minWidth: "min-w-[120px]",
      responsive: "sm",
      render: (row) => <span className="font-mono text-muted-foreground">{row.department.code}</span>,
    },
    {
      key: "name",
      header: t("name_label"),
      minWidth: "min-w-[220px]",
      render: (row) =>
        row.kind === "parent" ? (
          <div className="flex items-center gap-1.5">
            {row.hasChildren ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-6 shrink-0 sm:size-7"
                onClick={() => onToggleExpand(row.department.id)}
                aria-label={row.isOpen ? t("hide_details") : t("details")}
                title={row.isOpen ? t("hide_details") : t("details")}
              >
                <ChevronDown className={`size-3.5 transition-transform sm:size-4 ${row.isOpen ? "rotate-180" : ""}`} />
              </Button>
            ) : (
              <span className="w-6 shrink-0 sm:w-7" aria-hidden="true" />
            )}
            <ItemThumbnail
              url={row.department.images?.[0]?.url}
              alt={row.department.name}
              icon={Folder}
              className="ml-1 size-9"
            />
            <span className="ml-1.5 font-medium">{row.department.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 pl-7 sm:pl-9">
            <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
            <ItemThumbnail
              url={row.department.images?.[0]?.url}
              alt={row.department.name}
              icon={Folder}
              className="ml-1 size-8"
            />
            <span className="ml-1.5 text-muted-foreground">{row.department.name}</span>
          </div>
        ),
    },
    {
      key: "status",
      header: t("status_label"),
      minWidth: "min-w-[90px]",
      responsive: "md",
      render: (row) => (
        <Badge tone={row.department.isActive ? "success" : "neutral"}>
          {row.department.isActive ? t("active") : t("inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      minWidth: "min-w-[90px]",
      align: "right",
      stickyRight: true,
      render: (row) => (
        <div className="flex justify-end gap-1 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => onEdit(row.department)}
            disabled={isMutating}
            aria-label={t("edit")}
            title={t("edit")}
          >
            <Pencil className="size-3.5 sm:size-4" />
          </Button>
          <Button
            type="button"
            variant={row.department.isActive ? "destructive" : "secondary"}
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => onToggle(row.department)}
            disabled={isMutating}
            aria-label={row.department.isActive ? t("deactivate") : t("activate")}
            title={row.department.isActive ? t("deactivate") : t("activate")}
          >
            <Power className="size-3.5 sm:size-4" />
          </Button>
        </div>
      ),
    },
  ]
}
