import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
async function main() {
  const base = process.env.E2E_BASE_URL ?? "http://localhost:3200";
  await mkdir("docs/screenshots/tkm", { recursive: true });
  const browser = await chromium.launch();
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ] as const) {
    const page = await browser.newPage({ viewport: { width, height } });
    const response = await page.goto(base, { waitUntil: "networkidle" });
    if (!response?.ok())
      throw new Error(`Homepage failed: ${response?.status()}`);
    await page.getByRole("heading", { name: "CARREGUE SEU LEGADO." }).waitFor();
    await page.evaluate(async () => {
      for (const image of Array.from(document.images)) {
        image.loading = "eager";
      }
      await Promise.all(
        Array.from(document.images).map((image) =>
          image.decode().catch(() => undefined),
        ),
      );
      await document.fonts.ready;
    });
    await page.screenshot({
      path: `docs/screenshots/tkm/${name}.jpg`,
      type: "jpeg",
      quality: 85,
      fullPage: true,
    });
    await page.goto(`${base}/shop/camiseta-essencial`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(async () => {
      for (const image of Array.from(document.images)) {
        image.loading = "eager";
      }
      await Promise.all(
        Array.from(document.images).map((image) =>
          image.decode().catch(() => undefined),
        ),
      );
      await document.fonts.ready;
    });
    await page.screenshot({
      path: `docs/screenshots/tkm/${name}-product.jpg`,
      type: "jpeg",
      quality: 85,
      fullPage: true,
    });
    await page.close();
  }
  await browser.close();
  console.log(
    "Screenshots saved in docs/screenshots/tkm. No admin sessions or credentials captured.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
