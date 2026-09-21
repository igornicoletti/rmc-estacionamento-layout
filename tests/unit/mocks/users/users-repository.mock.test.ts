import { describe, expect, it } from "vitest"

import type { ListUsersParams } from "@/features/users/api/users-repository"

import { MOCK_USERS } from "@/mocks/users/users.data"
import { createMockUsersRepository } from "@/mocks/users/users-repository.mock"

const baseParams: ListUsersParams = {
  search: "",
  sorting: [],
  pageIndex: 0,
  pageSize: 5,
}

describe("mockUsersRepository", () => {
  it("mantém 12 usuários determinísticos e pagina sem mutar a origem", async () => {
    const before = [...MOCK_USERS]
    const repository = createMockUsersRepository()

    const firstPage = await repository.list(baseParams)
    const lastPage = await repository.list({ ...baseParams, pageIndex: 2 })

    expect(MOCK_USERS).toHaveLength(12)
    expect(firstPage.rows).toHaveLength(5)
    expect(firstPage.rowCount).toBe(12)
    expect(lastPage.rows).toHaveLength(2)
    expect(firstPage.facets).toEqual({
      status: {
        counts: { active: 7, invited: 3, suspended: 2 },
      },
      role: {
        counts: { administrator: 3, manager: 4, operator: 5 },
      },
    })
    expect(MOCK_USERS).toEqual(before)
  })

  it("normaliza acentos, combina filtros e calcula facetas cruzadas", async () => {
    const repository = createMockUsersRepository()

    const search = await repository.list({ ...baseParams, search: "  JOAO " })
    const filtered = await repository.list({
      ...baseParams,
      status: "suspended",
      role: "manager",
    })

    expect(search.rows.map(({ name }) => name)).toEqual(["João Ribeiro"])
    expect(filtered.rows.map(({ name }) => name)).toEqual(["Lucas Ferreira"])
    expect(filtered.facets.status).toEqual({
      counts: { active: 2, invited: 1, suspended: 1 },
    })
    expect(filtered.facets.role).toEqual({
      counts: { administrator: 0, manager: 1, operator: 1 },
    })
  })

  it("ordena por múltiplos critérios de forma determinística", async () => {
    const repository = createMockUsersRepository()
    const result = await repository.list({
      ...baseParams,
      pageSize: 20,
      sorting: [
        { field: "status", desc: false },
        { field: "name", desc: true },
      ],
    })

    expect(result.rows.filter(({ status }) => status === "active").map(({ name }) => name)).toEqual([
      "Karen Dias",
      "Isabela Costa",
      "Hugo Alves",
      "Fábio Souza",
      "Elisa Prado",
      "Bruno Lima",
      "Ana Martins",
    ])
  })

  it("cancela a consulta com AbortSignal", async () => {
    const repository = createMockUsersRepository()
    const controller = new AbortController()
    const request = repository.list(baseParams, { signal: controller.signal })

    controller.abort()

    await expect(request).rejects.toMatchObject({ name: "AbortError" })
  })
})
