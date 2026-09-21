import type {
  ListUsersParams,
  UsersRepository,
  UserSortField,
} from "@/features/users/api/users-repository"
import { USER_ROLE_LABELS } from "@/features/users/users.constants"
import type { DemoUser } from "@/features/users/users.schema"
import {
  compareText,
  normalizeSearch,
  waitForMockLatency,
} from "@/mocks/shared/mock-repository.utils"

import { MOCK_USERS } from "./users.data"

function comparableValue(user: DemoUser, field: UserSortField) {
  if (field === "lastAccessAt") {
    return user.lastAccessAt ? Date.parse(user.lastAccessAt) : 0
  }
  return user[field]
}

function compareUsers(a: DemoUser, b: DemoUser, params: ListUsersParams) {
  for (const sort of params.sorting) {
    const left = comparableValue(a, sort.field)
    const right = comparableValue(b, sort.field)
    const comparison = typeof left === "number"
      ? left - (right as number)
      : compareText(left, right as string)

    if (comparison !== 0) return sort.desc ? -comparison : comparison
  }

  return compareText(a.id, b.id)
}

function countBy<TValue extends string>(
  users: readonly DemoUser[],
  values: readonly TValue[],
  select: (user: DemoUser) => TValue,
) {
  const counts = Object.fromEntries(values.map((value) => [value, 0])) as Record<TValue, number>
  for (const user of users) counts[select(user)] += 1
  return counts
}

const USER_STATUSES = ["active", "invited", "suspended"] as const
const USER_ROLES = ["administrator", "manager", "operator"] as const

export function createMockUsersRepository(
  users: readonly DemoUser[] = MOCK_USERS,
): UsersRepository {
  return {
    async list(params, options) {
      await waitForMockLatency(options?.signal)

      const search = normalizeSearch(params.search)
      let searched = [...users]

      if (search) {
        searched = searched.filter((user) => [
          user.id,
          user.name,
          user.email,
          user.role,
          USER_ROLE_LABELS[user.role],
        ].some((value) => normalizeSearch(value).includes(search)))
      }

      const statusBase = params.role
        ? searched.filter((user) => user.role === params.role)
        : searched
      const roleBase = params.status
        ? searched.filter((user) => user.status === params.status)
        : searched
      const facets = {
        status: {
          counts: countBy(statusBase, USER_STATUSES, (user) => user.status),
        },
        role: {
          counts: countBy(roleBase, USER_ROLES, (user) => user.role),
        },
      }

      let result = searched
      if (params.status) {
        result = result.filter((user) => user.status === params.status)
      }
      if (params.role) {
        result = result.filter((user) => user.role === params.role)
      }
      if (params.sorting.length > 0) {
        result.sort((a, b) => compareUsers(a, b, params))
      }

      const rowCount = result.length
      const start = params.pageIndex * params.pageSize

      return {
        rows: result.slice(start, start + params.pageSize),
        rowCount,
        facets,
      }
    },
  }
}

export const mockUsersRepository = createMockUsersRepository()
