import { useCallback, useMemo, useState } from "react"

import {
  useDataTablePageBounds,
  useDataTableState,
} from "@/components/data-table/use-data-table-state"
import { toast } from "@/components/ui/toast"

import type {
  ListUsersParams,
  UsersRepository,
  UserSortField,
} from "./api/users-repository"
import { useUsersQuery } from "./api/use-users-query"
import { usersTableColumns } from "./users-table.columns"
import { useUsersTableInstance } from "./users-table.features"
import {
  DemoUserRoleSchema,
  DemoUserStatusSchema,
  type DemoUser,
} from "./users.schema"

const EMPTY_USERS: DemoUser[] = []
const SORTABLE_FIELDS: ReadonlySet<string> = new Set([
  "name",
  "email",
  "role",
  "status",
  "lastAccessAt",
])

function isUserSortField(value: string): value is UserSortField {
  return SORTABLE_FIELDS.has(value)
}

export function useUsersTableController(repository: UsersRepository) {
  const state = useDataTableState()
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null)

  const parsedRole = DemoUserRoleSchema.safeParse(
    state.columnFilters.find((filter) => filter.id === "role")?.value,
  )
  const parsedStatus = DemoUserStatusSchema.safeParse(
    state.columnFilters.find((filter) => filter.id === "status")?.value,
  )
  const role = parsedRole.success ? parsedRole.data : undefined
  const status = parsedStatus.success ? parsedStatus.data : undefined

  const params = useMemo<ListUsersParams>(() => ({
    search: state.globalFilter,
    role,
    status,
    sorting: state.sorting.flatMap(({ id, desc }) =>
      isUserSortField(id)
        ? [{ field: id, desc }]
        : [],
    ),
    pageIndex: state.pagination.pageIndex,
    pageSize: state.pagination.pageSize,
  }), [
    role,
    state.globalFilter,
    state.pagination.pageIndex,
    state.pagination.pageSize,
    state.sorting,
    status,
  ])

  const query = useUsersQuery(repository, params)

  useDataTablePageBounds({
    isPlaceholderData: query.isPlaceholderData,
    onPaginationChange: state.onPaginationChange,
    pagination: state.pagination,
    rowCount: query.data?.rowCount,
  })

  const handleCopyEmail = useCallback(async (user: DemoUser) => {
    try {
      await navigator.clipboard.writeText(user.email)
      toast.add({
        title: "E-mail copiado",
        type: "success",
      })
    } catch {
      toast.add({
        title: "Não foi possível copiar",
        description: "Copie o e-mail manualmente.",
        priority: "high",
        type: "error",
      })
    }
  }, [])

  const table = useUsersTableInstance({
    columns: usersTableColumns,
    data: query.data?.rows ?? EMPTY_USERS,
    state: {
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      columnVisibility: state.columnVisibility,
      globalFilter: state.globalFilter,
      pagination: state.pagination,
    },
    onSortingChange: state.onSortingChange,
    onColumnFiltersChange: state.onColumnFiltersChange,
    onColumnVisibilityChange: state.setColumnVisibility,
    onPaginationChange: state.onPaginationChange,
    rowCount: query.data?.rowCount ?? 0,
    getRowId: (user) => user.id,
    meta: {
      onView: setSelectedUser,
      onCopyEmail: (user) => void handleCopyEmail(user),
    },
  })

  return {
    table,
    query,
    role,
    status,
    selectedUser,
    hasFilters: state.hasFilters,
    searchDraft: state.searchDraft,
    setSelectedUser,
    handleSearchChange: state.handleSearchChange,
    submitSearch: state.submitSearch,
    clearSearch: state.clearSearch,
    clearFilters: state.clearFilters,
  }
}
