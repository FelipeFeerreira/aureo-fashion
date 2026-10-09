import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
async function main() {
  if (process.env.NODE_ENV === "production")
    throw Error("Sample seed is disabled in production");
  const cats = [
    ["camisetas", "Camisetas", "tee"],
    ["moletons", "Blusas e moletons", "hoodie"],
    ["calcas", "Calças", "pants"],
    ["jaquetas", "Jaquetas", "jacket"],
  ];
  for (const [i, [slug, name, img]] of cats.entries())
    await db.category.upsert({
      where: { slug },
      create: { slug, name, imageUrl: `/images/${img}.jpg`, sortOrder: i },
      update: {},
    });
  await db.storeSettings.upsert({
    where: { id: "store" },
    create: { id: "store" },
    update: {},
  });
  const products = [
    [
      "camiseta-essencial",
      "Camiseta Essencial",
      "camisetas",
      "tee",
      15900,
      "Off-white",
    ],
    [
      "camiseta-presenca",
      "Camiseta Presença",
      "camisetas",
      "black",
      17900,
      "Preto",
    ],
    ["moletom-volume", "Moletom Volume", "moletons", "hoodie", 32900, "Areia"],
    ["calca-reta", "Calça Reta 01", "calcas", "pants", 28900, "Índigo"],
    [
      "jaqueta-atelier",
      "Jaqueta Atelier",
      "jaquetas",
      "jacket",
      45900,
      "Caramelo",
    ],
    [
      "camiseta-ampla",
      "Camiseta Ampla",
      "camisetas",
      "tee",
      18900,
      "Off-white",
    ],
    ["moletom-origem", "Moletom Origem", "moletons", "hoodie", 35900, "Areia"],
    ["denim-cotidiano", "Denim Cotidiano", "calcas", "pants", 31900, "Índigo"],
  ] as const;
  for (const [i, [slug, name, cat, img, price, color]] of products.entries()) {
    const category = await db.category.findUniqueOrThrow({
      where: { slug: cat },
    });
    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) continue;
    await db.product.create({
      data: {
        slug,
        name,
        type: "ACCESSORY",
        tagline: "Linhas limpas. Presença natural.",
        description:
          "Uma proposta de essencial para acompanhar diferentes momentos do dia. Produto de demonstração: fotografia ilustrativa, medidas e composição de exemplo. Substitua pelos dados da peça real antes de vender.",
        priceCents: price,
        stock: 0,
        tastingNotes: [],
        brewMethods: [],
        imageUrl: `/images/${img}.jpg`,
        imageAlt: `Referência ilustrativa de ${name}`,
        categoryId: category.id,
        composition: "Exemplo: 100% algodão. Validar com o fabricante.",
        fit: "Modelagem descontraída. Medidas ilustrativas em centímetros.",
        care: "Exemplo: lavar do avesso em água fria. Validar a etiqueta real.",
        collection: "Essentials",
        tags: ["essencial", "casual"],
        sample: true,
        featured: i < 4,
        sortOrder: i,
        popularity: 8 - i,
        sizeChart: [
          { size: "PP", chest: 48, length: 66 },
          { size: "P", chest: 51, length: 69 },
          { size: "M", chest: 54, length: 72 },
          { size: "G", chest: 57, length: 75 },
          { size: "GG", chest: 60, length: 78 },
          { size: "XGG", chest: 63, length: 81 },
        ],
        variants: {
          create: ["PP", "P", "M", "G", "GG", "XGG"].map((size, j) => ({
            sku: `AU-${i + 1}-${size}`,
            size,
            color,
            colorHex:
              color === "Preto"
                ? "#202020"
                : color === "Índigo"
                  ? "#3b5064"
                  : color === "Caramelo"
                    ? "#966c49"
                    : "#ded8c9",
            stock: j === 5 ? 0 : 5,
          })),
        },
        images: {
          create: [
            {
              url: `/images/${img}.jpg`,
              alt: `${name} — imagem ilustrativa`,
              color,
              position: 0,
            },
          ],
        },
      },
    });
  }
  await db.coupon.upsert({
    where: { code: "DEMO10" },
    create: {
      code: "DEMO10",
      percent: 10,
      expiresAt: new Date("2028-01-01"),
      minimumCents: 10000,
    },
    update: {},
  });
  const essential = await db.product.findUniqueOrThrow({
    where: { slug: "camiseta-essencial" },
  });
  if (
    !(await db.productVariant.findUnique({ where: { sku: "AU-1-PRETO-M" } }))
  ) {
    await db.productVariant.createMany({
      data: ["P", "M", "G"].map((size) => ({
        productId: essential.id,
        sku: `AU-1-PRETO-${size}`,
        size,
        color: "Preto",
        colorHex: "#202020",
        stock: 3,
      })),
    });
    await db.productImage.create({
      data: {
        productId: essential.id,
        url: "/images/black.jpg",
        alt: "Referência ilustrativa em preto — não representa mercadoria real",
        color: "Preto",
        position: 1,
      },
    });
  }
  console.log(
    "AUREO: 8 produtos ilustrativos. Nenhum estoque ou pedido real. Dados existentes preservados.",
  );
}
main().finally(() => db.$disconnect());
