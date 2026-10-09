import { readFile } from "node:fs/promises";
import { beforeEach, afterEach, afterAll, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import { createAdminSession, sessionCookie } from "@/lib/admin/auth";
import { POST } from "@/app/api/admin/media/route";
let cookie = "";
beforeEach(async () => {
  process.env.ADMIN_TOKEN = "media-test-".repeat(8);
  process.env.CLOUDINARY_CLOUD_NAME = "aureo-test";
  process.env.CLOUDINARY_API_KEY = "test";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
  await db.rateLimit.deleteMany();
  cookie = sessionCookie(await createAdminSession());
});
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
});
afterAll(async () => {
  await db.$disconnect();
});
function request(file: File) {
  const body = new FormData();
  body.set("file", file);
  return new Request("http://localhost:3200/api/admin/media", {
    method: "POST",
    headers: { origin: "http://localhost:3200", cookie },
    body,
  });
}
it("rejects SVG and invalid image bytes without reaching persistent storage", async () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  expect(
    (
      await POST(
        request(new File(["<svg/>"], "test.svg", { type: "image/svg+xml" })),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await POST(
        request(new File(["invalid"], "test.jpg", { type: "image/jpeg" })),
      )
    ).status,
  ).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it("decodes a real image and uploads optimized WebP with server-side signature", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      Response.json({
        secure_url:
          "https://res.cloudinary.com/aureo-test/image/upload/aureo/test.webp",
        public_id: "aureo/test",
      }),
    );
  const bytes = await readFile("public/images/tee.jpg");
  const response = await POST(
    request(new File([bytes], "tee.jpg", { type: "image/jpeg" })),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).url).toContain(
    "https://res.cloudinary.com/aureo-test/",
  );
  const body = fetch.mock.calls[0][1]?.body as FormData;
  expect((body.get("file") as File).type).toBe("image/webp");
  expect(body.get("signature")).toMatch(/^[a-f0-9]{40}$/);
  expect(body.has("api_secret")).toBe(false);
});
