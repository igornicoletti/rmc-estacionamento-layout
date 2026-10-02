import { expect, test, type Locator } from "@playwright/test"

async function textContrast(locator: Locator) {
  return locator.evaluate((element) => {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) throw new Error("Canvas 2D indisponível")

    // Browser-resolved colors, composited on the actual solid ancestor surfaces.
    const paint = (color: string) => {
      context.fillStyle = "#010203"
      context.fillStyle = color
      const parsed = context.fillStyle
      context.fillStyle = "#030201"
      context.fillStyle = color
      if (context.fillStyle !== parsed) throw new Error(`Cor não suportada: ${color}`)
      context.fillRect(0, 0, 1, 1)
    }
    const luminance = (pixels: Uint8ClampedArray) =>
      [0.2126, 0.7152, 0.0722].reduce((total, weight, index) => {
        const pixel = pixels[index]
        if (pixel === undefined) throw new Error("Pixel incompleto")
        const channel = pixel / 255
        return total + weight * (channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4)
      }, 0)

    const ancestors: Element[] = []
    let current: Element | null = element
    while (current) {
      ancestors.unshift(current)
      current = current.parentElement
    }
    paint("white")
    for (const ancestor of ancestors) {
      const style = getComputedStyle(ancestor)
      if (style.backgroundImage !== "none" || style.opacity !== "1") {
        throw new Error("O cálculo exige superfícies sólidas sem opacidade de grupo")
      }
      paint(style.backgroundColor)
    }
    const background = luminance(context.getImageData(0, 0, 1, 1).data)
    paint(getComputedStyle(element).color)
    const foreground = luminance(context.getImageData(0, 0, 1, 1).data)
    return (Math.max(background, foreground) + 0.05) /
      (Math.min(background, foreground) + 0.05)
  })
}

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
    const close = dialog.locator('[data-slot$="-footer"]').getByRole("button", { name: "Fechar" })
    await expect(close).toBeVisible()
    await close.click()
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
  const sheet = page.getByRole("dialog", { name: "AppSheet" })
  await expect(sheet).toBeVisible()
  await expect(sheet.locator('[data-slot="sheet-footer"]').getByRole("button", { name: "Fechar" })).toBeVisible()
})

test("mantém conteúdo e ações alcançáveis em baixa altura e restaura o foco", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 360 })
  await page.goto("/rmc")
  for (const name of ["AppDialog", "AppSheet"]) {
    const opener = page.getByRole("button", { name: `Exibir ${name}` })
    await opener.click()
    const dialog = page.getByRole("dialog", { name })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("listitem").last().scrollIntoViewIfNeeded()
    const footer = dialog.locator('[data-slot$="-footer"]')
    const close = footer.getByRole("button", { name: "Fechar" })
    const box = await close.boundingBox()
    expect(box).not.toBeNull()
    if (!box) throw new Error("Ação de fechamento sem geometria")
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(360)
    await close.click()
    await expect(dialog).not.toBeVisible()
    await expect(opener).toBeFocused()
  }
})

for (const theme of ["light", "dark"] as const) {
  test(`contraste mínimo dos badges e calendário selecionado em ${theme}`, async ({ page }, testInfo) => {
    await page.goto("/rmc")
    await page.evaluate((mode) => {
      document.documentElement.classList.toggle("dark", mode === "dark")
    }, theme)
    const results: Array<{ subject: string; ratio: number }> = []
    await page.getByRole("button", { name: "Exibir AppBadge" }).click()
    const badges = page.getByRole("region", { name: "Prévia de AppBadge" }).locator('[data-slot="badge"]')
    await expect(badges).toHaveCount(5)
    for (const badge of await badges.all()) {
      await expect.poll(() => textContrast(badge)).toBeGreaterThanOrEqual(4.5)
      results.push({ subject: await badge.innerText(), ratio: await textContrast(badge) })
    }

    await page.getByRole("button", { name: "Exibir AppCalendar" }).click()
    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toHaveAttribute("lang", "pt-BR")
    await calendar.getByRole("button", { name: /\b15\b/ }).click()
    const selected = calendar.locator('button[data-selected-single="true"]')
    await expect(selected).toHaveCount(1)
    await page.mouse.move(0, 0)
    await expect.poll(() => textContrast(selected)).toBeGreaterThanOrEqual(4.5)
    results.push({ subject: "calendar-selected", ratio: await textContrast(selected) })
    await selected.hover()
    await expect.poll(() => textContrast(selected)).toBeGreaterThanOrEqual(4.5)
    results.push({ subject: "calendar-selected-hover", ratio: await textContrast(selected) })
    await testInfo.attach(`contrast-${theme}`, {
      body: JSON.stringify({ theme, method: "browser-computed-solid-colors-canvas-srgb", results }, null, 2),
      contentType: "application/json",
    })
  })
}
