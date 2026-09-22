import { expect, test } from "@playwright/test"

test("abre o dashboard e publica a identidade do portal na aba", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Dashboard" }),
  ).toBeVisible()
  await expect(page).toHaveTitle(
    "Dashboard | Portal Estacionamento — Rede Monte Carlo",
  )
})

test("resolve uma rota reservada por deep link", async ({ page }) => {
  await page.goto("/patio-virtual")

  await expect(
    page.getByRole("heading", { name: "Pátio virtual" }),
  ).toBeVisible()
})

test("apresenta página não encontrada para deep link desconhecido", async ({
  page,
}) => {
  await page.goto("/nao-existe")

  await expect(
    page.getByRole("heading", { name: "Conteúdo não encontrado" }),
  ).toBeVisible()
})
