import { expect, test, type Locator, type Page } from "@playwright/test"

import { appRoutes } from "../../src/app/app-routes"
import { headerContent } from "../../src/components/header/header-content"
import { clientErpFixture } from "../../src/mocks/mock-clients-fixtures"
import { clientVehicleErpFixture } from "../../src/mocks/mock-vehicles-fixtures"
import { mapErpClients } from "../../src/features/clients/mapping/clients-mapper"
import { mapErpClientVehicles } from "../../src/features/clients/vehicles/mapping/vehicles-mapper"
import { formatCityName } from "../../src/features/clients/presentation/clients-format"

import { unitErpFixture } from "../../src/mocks/mock-units-fixtures"
import { mapErpUnits } from "../../src/features/units/mapping/units-mapper"
import {
  formatUnitCity,
  formatUnitName,
} from "../../src/features/units/presentation/units-format"

const DEFAULT_PAGE_SIZE = 10
const clients = mapErpClients(clientErpFixture)
const vehicles = mapErpClientVehicles(clientVehicleErpFixture)
const units = mapErpUnits(unitErpFixture)

const firstClient = clients[0]
const firstUnit = units[0]

if (!firstClient || !firstUnit) {
  throw new Error("Fixtures E2E obrigatórias estão vazias.")
}

const firstClientCityKey = `${firstClient.stateCode}:${firstClient.city}`
const clientsInFirstCity = clients.filter(
  (client) => `${client.stateCode}:${client.city}` === firstClientCityKey,
)
const firstClientVehicles = vehicles.filter(
  (vehicle) => vehicle.clientId === firstClient.id,
)

test("distingue códigos de veículo e cliente sem tipografia mono ou tabular", async ({
  page,
}) => {
  await page.goto(appRoutes.clientDetails.path(firstClient.id))
  const { table } = await waitForDataTable(page)
  await expect(
    table.getByRole("columnheader", { name: /Código do veículo/ }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Gerenciar colunas" }).click()
  await expect(
    page.getByRole("menuitemcheckbox", {
      name: /Sincronização|Criação|Atualização|120 dias/,
    }),
  ).toHaveCount(0)
  await page
    .getByRole("menuitemcheckbox", { name: "Código do cliente", exact: true })
    .click()
  await page.keyboard.press("Escape")
  const firstVehicle = firstClientVehicles[0]
  if (!firstVehicle) throw new Error("Fixture de veículo vazia")
  const row = table.getByRole("row").nth(1)
  await expect(row.getByRole("cell").nth(0)).toHaveText(firstVehicle.id)
  await expect(row.getByRole("cell").nth(1)).toHaveText(firstVehicle.clientId)
  const typography = await row
    .getByRole("cell")
    .nth(0)
    .evaluate((cell) => {
      const style = getComputedStyle(cell.firstElementChild ?? cell)
      return { family: style.fontFamily, numeric: style.fontVariantNumeric }
    })
  expect(typography.family).not.toMatch(/mono/i)
  expect(typography.numeric).toBe("normal")
})

const unitCityCounts = units.reduce<Map<string, number>>((counts, unit) => {
  const key = `${unit.stateCode}:${unit.city}`
  counts.set(key, (counts.get(key) ?? 0) + 1)
  return counts
}, new Map())

const facetUnit = units.find((unit) => {
  const key = `${unit.stateCode}:${unit.city}`
  return (unitCityCounts.get(key) ?? 0) > 1 && unit.city !== firstUnit.city
})

if (!facetUnit) {
  throw new Error("Fixture E2E precisa conter uma cidade repetida de unidade.")
}

const facetUnitKey = `${facetUnit.stateCode}:${facetUnit.city}`
const unitsInFacetCity = units.filter(
  (unit) => `${unit.stateCode}:${unit.city}` === facetUnitKey,
)

const unitsByTradeNameDescending = [...units].sort((left, right) =>
  formatUnitName(right.tradeName).localeCompare(
    formatUnitName(left.tradeName),
    "pt-BR",
    { numeric: true, sensitivity: "base" },
  ),
)
const firstDescendingUnit = unitsByTradeNameDescending[0]

if (!firstDescendingUnit) {
  throw new Error("Ordenação E2E de unidades não produziu registros.")
}

async function waitForDataTable(page: Page) {
  const root = page.locator('[data-slot="data-table-root"]')
  const table = root.getByRole("table")

  await expect(root).toHaveAttribute("aria-busy", "false")
  await expect(table).toBeVisible()

  return { root, table }
}

function dataRow(table: Locator, id: string) {
  return table.locator(`[data-testid="data-table-row"][data-row-id="${id}"]`)
}

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

test("navega pelo menu lateral no desktop", async ({ page }) => {
  await page.goto(appRoutes.users.path)

  const navigation = page.getByRole("navigation")
  const notificationsLink = navigation.locator(
    `a[href="${appRoutes.notifications.path}"]`,
  )

  await expect(notificationsLink).toBeVisible()
  await notificationsLink.click()

  await expect(page).toHaveURL(appRoutes.notifications.path)
  await expect(notificationsLink).toHaveAttribute("aria-current", "page")
})

test("fecha o menu lateral mobile após navegar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(appRoutes.clients.path)

  await page.getByRole("button", { name: headerContent.sidebar.open }).click()

  const navigation = page.getByRole("navigation")
  const unitsLink = navigation.locator(`a[href="${appRoutes.units.path}"]`)

  await expect(unitsLink).toBeVisible()
  await unitsLink.click()

  await expect(page).toHaveURL(appRoutes.units.path)
  await expect(
    page.getByRole("button", { name: headerContent.sidebar.open }),
  ).toBeVisible()
})

test("mantém o fallback de rota fora do shell", async ({ page }) => {
  await page.goto("/nao-existe")

  await expect(page.locator("main")).toBeVisible()
  await expect(page.getByRole("navigation")).toHaveCount(0)
})

test("mantém a rolagem horizontal dentro da tabela de unidades", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/unidades")
  await waitForDataTable(page)

  const tableContainer = page.locator('[data-slot="table-container"]')
  const tableGeometry = await tableContainer.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  const viewportGeometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(viewportGeometry.scrollWidth).toBe(viewportGeometry.clientWidth)
  expect(tableGeometry.scrollWidth).toBeGreaterThan(tableGeometry.clientWidth)
})

test("filtra, pagina e abre clientes e veículos sem depender da copy", async ({
  page,
}) => {
  await page.goto("/clientes")

  const { root, table } = await waitForDataTable(page)
  const rows = table.getByTestId("data-table-row")
  const firstPageClient = clients[0]
  const secondPageClient = clients[DEFAULT_PAGE_SIZE]

  if (!firstPageClient || !secondPageClient) {
    throw new Error("Fixture de clientes insuficiente para paginação E2E.")
  }

  await expect(rows).toHaveCount(Math.min(clients.length, DEFAULT_PAGE_SIZE))
  await expect(dataRow(table, firstPageClient.id)).toBeVisible()

  await root.getByTestId("data-table-page-next").click()
  await expect(dataRow(table, secondPageClient.id)).toBeVisible()

  await root.getByTestId("data-table-page-first").click()
  await expect(dataRow(table, firstPageClient.id)).toBeVisible()

  const toolbar = root.locator('[data-slot="data-table-toolbar"]')
  const cityCombobox = toolbar.getByRole("combobox")
  const cityLabel = formatCityName(firstClient.city)

  await cityCombobox.fill(cityLabel)

  const options = page.getByRole("option")
  await expect(options).toHaveCount(1)
  await options.first().click()

  await expect(rows).toHaveCount(clientsInFirstCity.length)

  const search = toolbar.getByRole("searchbox")
  await search.fill(firstClient.id)

  const clearFilters = toolbar.getByTestId("data-table-clear-filters")
  await expect(clearFilters).toBeVisible()
  await clearFilters.click()

  await expect(rows).toHaveCount(Math.min(clients.length, DEFAULT_PAGE_SIZE))

  await cityCombobox.fill(cityLabel)
  await expect(options).toHaveCount(1)
  await options.first().click()

  const firstClientRow = dataRow(table, firstClient.id)
  await expect(firstClientRow).toBeVisible()
  await firstClientRow.getByRole("link").click()

  await expect(page).toHaveURL(appRoutes.clientDetails.path(firstClient.id))

  const { table: vehicleTable } = await waitForDataTable(page)
  const vehicleRows = vehicleTable.getByTestId("data-table-row")

  await expect(vehicleRows).toHaveCount(firstClientVehicles.length)

  for (const vehicle of firstClientVehicles) {
    await expect(dataRow(vehicleTable, vehicle.id)).toBeVisible()
  }

  await expect(
    vehicleTable.locator('th[data-column-id="driverName"]'),
  ).toHaveCount(0)
})

test("filtra, ordena e pagina unidades sem depender da copy", async ({
  page,
}) => {
  await page.goto("/unidades")

  const { root, table } = await waitForDataTable(page)
  const rows = table.getByTestId("data-table-row")
  const secondPageUnit = units[DEFAULT_PAGE_SIZE]

  if (!secondPageUnit) {
    throw new Error("Fixture de unidades insuficiente para paginação E2E.")
  }

  await expect(rows).toHaveCount(Math.min(units.length, DEFAULT_PAGE_SIZE))
  await expect(dataRow(table, firstUnit.id)).toBeVisible()

  await root.getByTestId("data-table-page-next").click()
  await expect(dataRow(table, secondPageUnit.id)).toBeVisible()

  await root.getByTestId("data-table-page-first").click()
  await expect(dataRow(table, firstUnit.id)).toBeVisible()

  const toolbar = root.locator('[data-slot="data-table-toolbar"]')
  const cityCombobox = toolbar.getByRole("combobox")
  const cityLabel = formatUnitCity(facetUnit.city)

  await cityCombobox.fill(cityLabel)

  const options = page.getByRole("option")
  await expect(options).toHaveCount(1)
  await options.first().click()

  await expect(rows).toHaveCount(unitsInFacetCity.length)

  await toolbar.locator('[data-slot="combobox-clear"]').click()
  await expect(rows).toHaveCount(Math.min(units.length, DEFAULT_PAGE_SIZE))

  const search = toolbar.getByRole("searchbox")
  await search.fill(firstUnit.cnpj)
  await search.press("Enter")

  await expect(rows).toHaveCount(1)
  await expect(dataRow(table, firstUnit.id)).toBeVisible()

  await toolbar.getByTestId("data-table-search-clear").click()
  await expect(rows).toHaveCount(Math.min(units.length, DEFAULT_PAGE_SIZE))

  const tradeNameHeader = table.locator('th[data-column-id="tradeName"]')
  const sortTrigger = tradeNameHeader.getByRole("button")

  await sortTrigger.click()
  await sortTrigger.click()

  const firstSortedRow = rows.first()
  await expect(firstSortedRow).toHaveAttribute(
    "data-row-id",
    firstDescendingUnit.id,
  )
})

test("mantém clientes responsivos e foco de teclado em 390 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/clientes")
  await waitForDataTable(page)

  const search = page.getByRole("searchbox")

  await search.focus()
  await expect(search).toBeFocused()

  await page.keyboard.press("Tab")

  await expect(search).not.toBeFocused()
  await expect(page.locator(":focus")).toBeVisible()

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(viewport.scrollWidth).toBe(viewport.clientWidth)
})

test("aplica e persiste o tema escuro", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.setItem("rmc-ui-theme", "dark"))
  await page.reload()

  await expect(page.locator("html")).toHaveClass(/dark/u)
})

for (const path of [
  "/clientes",
  "/unidades",
  appRoutes.clientDetails.path(firstClient.id),
]) {
  test(`compartilha tooltips e menu de colunas em ${path}`, async ({
    page,
  }) => {
    await page.goto(path)
    await waitForDataTable(page)
    const exportButton = page.getByRole("button", { name: "Exportar CSV" })
    await exportButton.hover()
    await expect(page.getByRole("tooltip")).toHaveText(
      "Exportar dados filtrados em CSV",
    )
    const manage = page.getByRole("button", { name: "Gerenciar colunas" })
    await manage.focus()
    await expect(
      page.getByRole("tooltip", { name: "Gerenciar colunas", exact: true }),
    ).toHaveText("Gerenciar colunas")
    await expect(manage).toHaveAccessibleDescription("Gerenciar colunas")
    await manage.press("Enter")
    await expect(page.getByRole("menu")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(manage).toBeFocused()
    await page.getByRole("searchbox").fill("sem-resultado-estrutural-999")
    await expect(exportButton).toBeDisabled()
    await exportButton.focus()
    await expect(
      page.getByRole("tooltip", {
        name: "Nenhum registro para exportar",
        exact: true,
      }),
    ).toHaveText("Nenhum registro para exportar")
  })
}

test("abre os e-mails adicionais por teclado e devolve foco ao fechar", async ({
  page,
}) => {
  await page.goto("/clientes")
  await waitForDataTable(page)
  const trigger = page
    .getByRole("button", { name: /e-mails adicionais/ })
    .first()
  await trigger.focus()
  await trigger.press("Enter")
  await expect(
    page.getByRole("dialog", { name: "Outros e-mails" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /^Copiar .*@/ }).first(),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
})
