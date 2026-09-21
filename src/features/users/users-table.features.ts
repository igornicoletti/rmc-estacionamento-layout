import { createServerTableHook } from "@/components/data-table/create-server-table-hook"

import type { DemoUser } from "./users.schema"

export interface UsersTableMeta {
  onCopyEmail: (user: DemoUser) => void
  onView: (user: DemoUser) => void
}

const usersTable = createServerTableHook<UsersTableMeta>()

export const usersTableFeatures = usersTable.features

export const {
  createAppColumnHelper: createUsersColumnHelper,
  useAppTable: useUsersTableInstance,
} = usersTable
