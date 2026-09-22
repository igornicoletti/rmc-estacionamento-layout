import { expect, test } from "@playwright/test"

test("monta o shell da aplicação", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("main")).toBeVisible()
  await expect(page.getByRole("navigation")).toBeVisible()
  await expect(page).toHaveURL("/")
})

test("resolve uma rota por deep link", async ({ page }) => {
  await page.goto("/patio-virtual")

  await expect(page).toHaveURL("/patio-virtual")
  await expect(page.locator("main")).toBeVisible()
  await expect(page.getByRole("navigation")).toBeVisible()
})

test("mantém o fallback de rota fora do shell", async ({ page }) => {
  await page.goto("/nao-existe")

  await expect(page.locator("main")).toBeVisible()
  await expect(page.getByRole("navigation")).toHaveCount(0)
})

test("mantém a rolagem horizontal dentro da tabela de unidades", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/unidades")

  await expect(page.getByRole("heading", { name: "Unidades" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Bandeira" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Hash da origem" })).toHaveCount(0)

  const geometry = await page.evaluate<{
    bodyClientWidth: number
    bodyScrollWidth: number
    tableClientWidth: number
    tableScrollWidth: number
  }>(`(() => {
    const tableContainer = document.querySelector('[data-slot="table-container"]')
    if (!tableContainer) throw new Error("Contêiner da tabela não encontrado.")
    return {
      bodyClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.documentElement.scrollWidth,
      tableClientWidth: tableContainer.clientWidth,
      tableScrollWidth: tableContainer.scrollWidth,
    }
  })()`)

  expect(geometry.bodyScrollWidth).toBe(geometry.bodyClientWidth)
  expect(geometry.tableScrollWidth).toBeGreaterThan(geometry.tableClientWidth)
})
