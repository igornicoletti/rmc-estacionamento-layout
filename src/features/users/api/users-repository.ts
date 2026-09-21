import type {
  PaginatedResult,
  RepositoryRequestOptions,
} from "@/components/data-table/data-table.types"
import * as z from "zod"

import type { DemoUser, DemoUserRole, DemoUserStatus } from "../users.schema"
import {
  DemoUserRoleSchema,
  DemoUserSchema,
  DemoUserStatusSchema,
} from "../users.schema"

export type UserSortField = "name" | "email" | "role" | "status" | "lastAccessAt"

export interface UserSort {
  field: UserSortField
  desc: boolean
}

export interface ListUsersParams {
  search: string
  role?: DemoUserRole
  status?: DemoUserStatus
  sorting: UserSort[]
  pageIndex: number
  pageSize: number
}

interface FacetCounts<TValue extends string> {
  counts: Record<TValue, number>
}

export interface UserFacets {
  role: FacetCounts<DemoUserRole>
  status: FacetCounts<DemoUserStatus>
}

export interface ListUsersResult extends PaginatedResult<DemoUser> {
  facets: UserFacets
}

export interface UsersRepository {
  list(
    params: ListUsersParams,
    options?: RepositoryRequestOptions,
  ): Promise<ListUsersResult>
}

const UserStatusCountsSchema = z.record(
  DemoUserStatusSchema,
  z.number().int().nonnegative(),
)
const UserRoleCountsSchema = z.record(
  DemoUserRoleSchema,
  z.number().int().nonnegative(),
)

export const ListUsersResultSchema = z.object({
  rows: z.array(DemoUserSchema),
  rowCount: z.number().int().nonnegative(),
  facets: z.object({
    status: z.object({ counts: UserStatusCountsSchema }),
    role: z.object({ counts: UserRoleCountsSchema }),
  }),
})
