import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  ListUsersResultSchema,
  type ListUsersParams,
  type UsersRepository,
} from "./users-repository"

export function useUsersQuery(
  repository: UsersRepository,
  params: ListUsersParams,
) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async ({ signal }) =>
      ListUsersResultSchema.parse(
        await repository.list(params, { signal }),
      ),
    placeholderData: keepPreviousData,
  })
}
