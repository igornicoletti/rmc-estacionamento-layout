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

test("filtra, pagina e abre detalhes de clientes e veículos", async ({ page }) => {
  await page.goto("/clientes")

  await expect(page.getByText("24 clientes")).toBeVisible()
  await expect(page.getByRole("link", { name: /Cliente Demonstracao 01/u })).toBeVisible()

  await page.getByRole("button", { name: "Próxima página" }).click()
  await expect(page.getByRole("link", { name: /Cliente Demonstracao 11/u })).toBeVisible()

  await page.getByRole("button", { name: "Primeira página" }).click()
  await page.getByRole("combobox", { name: "Filtrar clientes por cidade" }).click()
  await page.getByRole("option", { name: /São José do Rio Preto/u }).click()
  await expect(page.getByText("6 clientes")).toBeVisible()

  await page.getByRole("link", { name: /Cliente Demonstracao 01/u }).click()
  await expect(page).toHaveURL("/clientes/1001")
  await expect(page.getByText("2 veículos")).toBeVisible()
  await expect(page.getByText("DEM-0001")).toBeVisible()
  await expect(page.getByRole("columnheader", { name: /Motorista/u })).toHaveCount(0)
})

test("mantém clientes responsivos e foco de teclado em 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/clientes")

  const search = page.getByRole("searchbox", { name: "Buscar clientes" })
  await search.focus()
  await expect(search).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(search).not.toBeFocused()
  await expect(page.locator(":focus")).toBeVisible()

  const viewport = await page.evaluate<{
    clientWidth: number
    scrollWidth: number
  }>(`(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))()`)
  expect(viewport.scrollWidth).toBe(viewport.clientWidth)
})

test("aplica e persiste o tema escuro", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.setItem("rmc-ui-theme", "dark"))
  await page.reload()

  await expect(page.locator("html")).toHaveClass(/dark/u)
})
