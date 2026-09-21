import { expect, test } from "@playwright/test"

test("exibe a base sem conteúdo demonstrativo", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: /rmc estacionamento/i }),
  ).toBeVisible()
  await expect(
    page.getByText("Base de interface pronta para integração com dados reais."),
  ).toBeVisible()
  await expect(page.getByRole("table")).toHaveCount(0)
})
