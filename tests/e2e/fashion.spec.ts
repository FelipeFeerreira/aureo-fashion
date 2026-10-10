import { test, expect } from "@playwright/test";
test("editorial navigation, URL filters, variant inventory, persistent bag and wishlist", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "CARREGUE SEU LEGADO." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explorar coleção" }).click();
  await expect(page).toHaveURL(/\/shop/);
  await page.getByLabel("Tamanho", { exact: true }).selectOption("M");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page).toHaveURL(/size=M/);
  await page
    .getByRole("heading", { name: "Camiseta Essencial", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "XGG", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Adicionar à sacola" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Preto", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "PP", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Off-white", exact: true }).click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar à sacola" }).click();
  await expect(
    page.getByRole("button", { name: "Adicionado à sacola" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir sacola" }).click();
  await expect(page.getByRole("dialog")).toContainText("Off-white / M");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Salvar nos favoritos" })
    .first()
    .click();
  await page.goto("/wishlist");
  await expect(
    page.getByRole("heading", { name: "Camiseta Essencial" }),
  ).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText("Off-white / M")).toBeVisible();
  await expect(page.getByText("R$ 159,00").first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("Off-white / M")).toBeVisible();
  await page
    .getByRole("button", { name: "Aumentar Camiseta Essencial" })
    .click();
  await expect(page.getByText("R$ 318,00").first()).toBeVisible();
  await page.getByLabel("Cupom", { exact: true }).fill("DEMO10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByText("R$ 286,20")).toBeVisible();
});
test("mobile layout, accessible menu and unavailable size empty state", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (isMobile) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Camisetas", exact: true })
      .click();
    await expect(page).toHaveURL(/category=camisetas/);
  }
  await page.goto("/shop?size=XGG&available=1");
  await expect(
    page.getByRole("heading", { name: "Nenhuma peça por aqui." }),
  ).toBeVisible();
});
test("rejects missing checkout configuration without claiming payment", async ({
  page,
}) => {
  await page.goto("/shop/camiseta-essencial");
  await page.getByRole("button", { name: "P", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar à sacola" }).click();
  await page.goto("/cart");
  for (const [label, value] of [
    ["Nome completo", "Pessoa Teste"],
    ["E-mail", "teste@example.com"],
    ["CEP", "01310-100"],
    ["Rua", "Paulista"],
    ["Número", "100"],
    ["Cidade", "São Paulo"],
    ["UF", "SP"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Ir ao pagamento de teste" }).click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "Checkout de teste indisponível",
  );
  await expect(page).toHaveURL(/\/cart/);
});

test("collection concepts never invent inventory and dark pages stay within the viewport", async ({
  page,
}) => {
  await page.goto("/collections/dragon-edition");
  await expect(
    page.getByRole("heading", { name: "DRAGON EDITION", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Este conceito ainda não tem peças vinculadas.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Adicionar à sacola" }),
  ).toHaveCount(0);
  for (const url of [
    "/",
    "/shop",
    "/shop/camiseta-essencial",
    "/cart",
    "/about",
  ]) {
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
