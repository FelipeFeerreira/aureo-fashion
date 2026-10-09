import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
async function main() {
  const base = process.env.E2E_BASE_URL ?? "http://localhost:3200";
  await mkdir("docs/screenshots/aureo", { recursive: true });
  const browser = await chromium.launch();
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ] as const) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.screenshot({
      path: `docs/screenshots/aureo/${name}.jpg`,
      type: "jpeg",
      quality: 85,
      fullPage: true,
    });
    await page.goto(`${base}/shop/camiseta-essencial`, {
      waitUntil: "networkidle",
    });
    await page.screenshot({
      path: `docs/screenshots/aureo/${name}-product.jpg`,
      type: "jpeg",
      quality: 85,
      fullPage: true,
    });
    await page.close();
  }
  await browser.close();
  console.log(
    "Screenshots saved in docs/screenshots/aureo. No admin sessions or credentials captured.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
