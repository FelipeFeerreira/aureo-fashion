import { test, expect } from "@playwright/test";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
test.use({ trace: "off", screenshot: "off", video: "off" });
test("owner edits product and persists image ordering with keyboard controls", async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    "Owner mutation is exercised once to avoid concurrent fixture edits.",
  );
  const token = process.env.ADMIN_TOKEN;
  test.skip(!token, "Configure local owner token.");
  await page.goto("/admin");
  await page.getByLabel("Chave de acesso").fill(token!);
  await page.getByRole("button", { name: "Abrir painel" }).click();
  await page.getByRole("button", { name: /Camiseta Essencial/ }).click();
  const tagline = page.getByLabel("Frase curta", { exact: true });
  const original = await tagline.inputValue();
  try {
    await tagline.fill("Essencial, do seu jeito.");
    await page.route("**/api/admin/media", (route) =>
      route.fulfill({
        json: {
          url: "/images/campaign.jpg",
          alt: "Referência de teste",
          storageKey: null,
        },
      }),
    );
    await page
      .getByLabel("Arraste fotos ou selecione arquivos")
      .setInputFiles("public/images/campaign.jpg");
    await expect(
      page.getByText(
        "Imagens enviadas. Salve o produto para confirmar a ordem.",
      ),
    ).toBeVisible();
    await page
      .locator(".media-item")
      .last()
      .getByRole("button", { name: "Capa", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Salvar produto", exact: true })
      .click();
    await expect(
      page.getByText("Produto salvo.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: /Camiseta Essencial/ }).click();
    await expect(tagline).toHaveValue("Essencial, do seu jeito.");
    await expect(
      page.locator(".media-item").first().getByLabel("Texto alternativo"),
    ).toHaveValue("Referência de teste");
  } finally {
    await page
      .locator(".media-item")
      .first()
      .getByRole("button", { name: "Excluir", exact: true })
      .click();
    await tagline.fill(original);
    await page
      .getByRole("button", { name: "Salvar produto", exact: true })
      .click();
    await expect(
      page.getByText("Produto salvo.", { exact: true }),
    ).toBeVisible();
  }
});
