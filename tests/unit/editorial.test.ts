import { describe, expect, it } from "vitest";
import {
  defaultEditorial,
  editorialContent,
  editorialSchema,
} from "@/lib/fashion/editorial";
describe("editorial settings contract", () => {
  it("provides non-purchasable concepts for existing rows without editorial data", () => {
    expect(editorialContent({})).toEqual(defaultEditorial);
    expect(
      defaultEditorial.collections.every((c) => c.productIds.length === 0),
    ).toBe(true);
  });
  it("rejects duplicate collection URLs and unsafe media", () => {
    expect(
      editorialSchema.safeParse({
        ...defaultEditorial,
        collections: [
          defaultEditorial.collections[0],
          defaultEditorial.collections[0],
        ],
      }).success,
    ).toBe(false);
    expect(
      editorialSchema.safeParse({
        ...defaultEditorial,
        logo: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("preserves valid owner content and limits monogram width", () => {
    const data = {
      ...defaultEditorial,
      monogram: "ABC",
      heroDescription: "Uma nova campanha.",
    };
    expect(editorialContent(data)).toEqual(data);
    expect(
      editorialSchema.safeParse({ ...data, monogram: "TOOLONG" }).success,
    ).toBe(false);
  });
});
