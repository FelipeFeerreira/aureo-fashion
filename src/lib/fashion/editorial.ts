import { z } from "zod";

// Shared contract: display defaults, owner form and server validation.
const image = z
  .string()
  .max(1000)
  .refine(
    (v) =>
      /^\/images\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/.test(v) ||
      /^https:\/\/res\.cloudinary\.com\//.test(v),
    "Use uma imagem da biblioteca.",
  );
const text = z.string().trim().min(1).max(600);
export const collectionSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  title: text,
  description: text,
  image,
  campaign: z.string().max(1200),
  productIds: z.array(z.string().min(1).max(100)).max(24),
});
export const editorialSchema = z.object({
  monogram: z.string().trim().min(1).max(5),
  logo: z.union([z.literal(""), image]),
  heroDescription: text,
  heroLabel: text,
  heroPosition: z.enum(["center", "left", "right"]),
  manifestoTitle: text,
  manifestoText: text,
  campaignTitle: text,
  campaignText: text,
  campaignImage: image,
  detailTitle: text,
  detailText: text,
  newsletterTitle: text,
  newsletterText: text,
  footerText: text,
  collections: z
    .array(collectionSchema)
    .max(8)
    .refine(
      (items) => new Set(items.map((x) => x.slug)).size === items.length,
      "Use slugs únicos.",
    ),
});
export type Editorial = z.infer<typeof editorialSchema>;
export const defaultEditorial: Editorial = {
  monogram: "TKM",
  logo: "",
  heroDescription: "Uma nova expressão de força, identidade e estilo.",
  heroLabel: "HERANÇA EM MOVIMENTO · CAPÍTULO I",
  heroPosition: "center",
  manifestoTitle: "O tempo passa. O legado permanece.",
  manifestoText:
    "Honrar as origens. Expressar quem você é. Encontramos na heráldica uma linguagem de pertencimento e na rua a liberdade para reinventá-la. Nossa visão: roupas com presença, para histórias que continuam.",
  campaignTitle: "Força nos detalhes.",
  campaignText:
    "Símbolos discretos. Texturas profundas. Uma linguagem que aproxima a memória medieval do vestir contemporâneo. Imagem de referência da marca; não representa o estoque demonstrativo.",
  campaignImage: "/images/tkm-campaign.webp",
  detailTitle: "Identidade, por dentro e por fora.",
  detailText:
    "O próximo capítulo começa na matéria. Explore composição, modelagem e medidas em cada peça. As especificações atuais são exemplos e serão substituídas pelas fichas técnicas da coleção real.",
  newsletterTitle: "Faça parte do próximo capítulo.",
  newsletterText:
    "Receba notícias da marca, histórias e futuras coleções. Sem excesso.",
  footerText:
    "Herança. Força. Identidade. Uma visão brasileira de streetwear com alma medieval.",
  collections: [
    {
      slug: "dragon-edition",
      title: "DRAGON EDITION",
      description: "A força de um símbolo. A liberdade de deixar sua marca.",
      image: "/images/tkm-dragon.webp",
      campaign:
        "Direção criativa: símbolos lendários e grafismos expressivos. Conceito editorial em desenvolvimento, sem lançamento ou estoque anunciado.",
      productIds: [],
    },
    {
      slug: "knights-collection",
      title: "KNIGHTS COLLECTION",
      description: "Lealdade às origens. Presença no agora.",
      image: "/images/tkm-knights.webp",
      campaign:
        "Direção criativa: escudos, insígnias e linhas de heráldica. Conceito editorial em desenvolvimento.",
      productIds: [],
    },
    {
      slug: "legacy-collection",
      title: "LEGACY COLLECTION",
      description: "O que importa resiste ao tempo.",
      image: "/images/tkm-legacy.webp",
      campaign:
        "Direção criativa: silhuetas atemporais e assinatura discreta. Conceito editorial em desenvolvimento.",
      productIds: [],
    },
    {
      slug: "dark-essentials",
      title: "DARK ESSENTIALS",
      description: "Menos ruído. Mais identidade.",
      image: "/images/tkm-campaign.webp",
      campaign:
        "Direção criativa: tons profundos e peças essenciais. Conceito editorial em desenvolvimento.",
      productIds: [],
    },
  ],
};
export function editorialContent(value: unknown): Editorial {
  const parsed = editorialSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultEditorial;
}
