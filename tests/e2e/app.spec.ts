import { expect, test } from "@playwright/test"

test("consulta, filtra, limpa e inspeciona usuários", async ({ page }) => {
  await page.goto("/")

  const usersCard = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Usuários", exact: true }),
  })

  await expect(
    page.getByRole("heading", { name: /rmc estacionamento/i }),
  ).toBeVisible()
  await expect(usersCard.getByText("Ana Martins")).toBeVisible()
  await expect(usersCard.getByText("12 usuários")).toBeVisible()
  await expect(usersCard.getByText("Página 1 de 3")).toBeVisible()

  const search = usersCard.getByRole("searchbox", { name: "Buscar usuários" })
  await search.fill("joao")
  await search.press("Enter")
  await expect(usersCard.getByText("João Ribeiro")).toBeVisible()
  await usersCard.getByRole("button", { name: "Limpar busca" }).click()

  const status = usersCard.getByRole("combobox", {
    name: "Filtrar usuários por status",
  })
  await status.click()
  const suspended = page.getByRole("option", { name: /Suspenso/ })
  await expect(suspended.getByText("2")).toBeVisible()
  await suspended.click()
  await expect(usersCard.getByText("2 usuários")).toBeVisible()
  await expect(usersCard.getByText("Lucas Ferreira")).toBeVisible()

  await usersCard.locator('[data-slot="combobox-clear"]').click()
  await expect(usersCard.getByText("12 usuários")).toBeVisible()

  await usersCard.getByRole("button", { name: "Ações de Ana Martins" }).click()
  await page.getByRole("menuitem", { name: "Ver detalhes" }).click()
  await expect(page.getByRole("heading", { name: "Ana Martins" })).toBeVisible()
  await expect(page.getByText("USR-001")).toBeVisible()
})

test("preserva uma coluna de dados", async ({ page }) => {
  await page.goto("/")
  const usersCard = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Usuários", exact: true }),
  })
  await expect(usersCard.getByText("Ana Martins")).toBeVisible()

  const columnsButton = usersCard.getByRole("button", { name: "Colunas" })
  for (const name of ["E-mail", "Perfil", "Status", "Último acesso"]) {
    const item = page.getByRole("menuitemcheckbox", { name })
    if (!(await item.isVisible())) await columnsButton.click()
    await item.click()
  }

  const nameColumn = page.getByRole("menuitemcheckbox", {
    name: "Nome, última coluna visível",
  })
  if (!(await nameColumn.isVisible())) await columnsButton.click()
  await expect(nameColumn).toBeDisabled()
  await expect(usersCard.getByRole("columnheader", { name: "Nome" })).toBeVisible()
})

test("centraliza o estado vazio e a paginação em viewport estreita", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto("/")

  const usersCard = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Usuários", exact: true }),
  })
  await expect(usersCard.getByText("Ana Martins")).toBeVisible()
  const search = usersCard.getByRole("searchbox", { name: "Buscar usuários" })
  await search.fill("usuário inexistente")
  await search.press("Enter")

  const table = usersCard.locator('[data-slot="data-table"]')
  const empty = table.locator('[data-slot="empty"]')
  const pagination = usersCard.locator('[data-slot="data-table-pagination"]')
  const pageSize = pagination.locator('[data-slot="data-table-page-size"]')
  const navigation = pagination.locator('[data-slot="data-table-page-navigation"]')

  await expect(empty).toBeVisible()
  await expect(pageSize).toBeVisible()
  await expect(navigation).toBeVisible()

  const [tableBox, emptyBox, paginationBox, pageSizeBox, navigationBox] =
    await Promise.all([
      table.boundingBox(),
      empty.boundingBox(),
      pagination.boundingBox(),
      pageSize.boundingBox(),
      navigation.boundingBox(),
    ])

  expect(tableBox).not.toBeNull()
  expect(emptyBox).not.toBeNull()
  expect(paginationBox).not.toBeNull()
  expect(pageSizeBox).not.toBeNull()
  expect(navigationBox).not.toBeNull()

  if (!tableBox || !emptyBox || !paginationBox || !pageSizeBox || !navigationBox) {
    throw new Error("Não foi possível medir o layout responsivo")
  }

  const center = (box: { x: number; width: number }) => box.x + box.width / 2

  expect(Math.abs(center(emptyBox) - center(tableBox))).toBeLessThanOrEqual(1)
  expect(Math.abs(center(pageSizeBox) - center(paginationBox))).toBeLessThanOrEqual(1)
  expect(Math.abs(center(navigationBox) - center(paginationBox))).toBeLessThanOrEqual(1)
  expect(pageSizeBox.y + pageSizeBox.height).toBeLessThanOrEqual(navigationBox.y)
})
