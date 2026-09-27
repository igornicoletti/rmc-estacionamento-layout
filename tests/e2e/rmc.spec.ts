import { expect, test } from "@playwright/test"

test("exibe as prévias inline dos componentes compartilhados", async ({ page }) => {
  await page.goto("/rmc")

  for (const name of [
    "AppAlertDialog",
    "AppDialog",
    "AppSheet",
    "AppBadge",
    "AppCalendar",
    "AppCombobox",
    "AppEmpty",
  ]) {
    await expect(page.getByRole("button", { name: `Exibir ${name}` })).toBeVisible()
  }

  await page.getByRole("button", { name: "Exibir AppBadge" }).click()
  const badges = page.getByRole("region", { name: "Prévia de AppBadge" })
  await expect(badges).toBeVisible()
  await expect(badges.getByText("Sucesso")).toBeVisible()

  await page.getByRole("button", { name: "Exibir AppCalendar" }).click()
  await expect(page.getByRole("region", { name: "Prévia de AppCalendar" })).toBeVisible()
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible()

  await page.getByRole("button", { name: "Exibir AppCombobox" }).click()
  const combobox = page.getByRole("combobox", { name: "Status de exemplo" })
  await combobox.click()
  await page.getByRole("option", { name: "Ativo" }).click()
  await expect(combobox).toHaveValue("Ativo")

  await page.getByRole("button", { name: "Exibir AppEmpty" }).click()
  const emptyPreview = page.getByRole("region", { name: "Prévia de AppEmpty" })
  await expect(emptyPreview).toBeVisible()
  await expect(page.getByRole("heading", { name: "Nenhum item para exibir" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Perfil sem imagem" })).toBeVisible()
  await expect(emptyPreview.locator('[data-slot="avatar"]')).toBeVisible()
})

test("abre e fecha overlays e mantém o rodapé visível durante a rolagem", async ({ page }) => {
  await page.goto("/rmc")

  await page.getByRole("button", { name: "Exibir AppAlertDialog" }).click()
  const alert = page.getByRole("alertdialog", { name: "AppAlertDialog" })
  await expect(alert).toBeVisible()
  await alert.getByRole("button", { name: "Cancelar" }).click()
  await expect(alert).not.toBeVisible()

  for (const name of ["AppDialog", "AppSheet"]) {
    await page.getByRole("button", { name: `Exibir ${name}` }).click()
    const dialog = page.getByRole("dialog", { name })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("listitem")).toHaveCount(20)

    const scrollArea = dialog.locator("div.overflow-y-auto")
    const geometry = await scrollArea.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }))
    expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight)

    await dialog.getByRole("listitem").last().scrollIntoViewIfNeeded()
    await expect(dialog.getByRole("button", { name: "Fechar" })).toBeVisible()
    await dialog.getByRole("button", { name: "Fechar" }).click()
    await expect(dialog).not.toBeVisible()
  }
})

test("mantém a prévia utilizável em 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/rmc")

  await page.getByRole("button", { name: "Exibir AppCalendar" }).click()
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible()

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(viewport.scrollWidth).toBe(viewport.clientWidth)

  await page.getByRole("button", { name: "Exibir AppSheet" }).click()
  await expect(page.getByRole("dialog", { name: "AppSheet" })).toBeVisible()
  await expect(page.getByRole("dialog", { name: "AppSheet" }).getByRole("button", { name: "Fechar" })).toBeVisible()
})
