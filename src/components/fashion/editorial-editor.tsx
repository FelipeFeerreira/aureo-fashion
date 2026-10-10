"use client";
import { EditorialUpload } from "./editorial-upload";
import Image from "next/image";
import type { Editorial } from "@/lib/fashion/editorial";
import { defaultEditorial } from "@/lib/fashion/editorial";
const labels: Record<string, string> = {
  monogram: "Monograma",
  logo: "Logo — URL da biblioteca (opcional)",
  heroDescription: "Descrição principal",
  heroLabel: "Identificador da campanha",
  manifestoTitle: "Título do manifesto",
  manifestoText: "Texto do manifesto",
  campaignTitle: "Título da campanha",
  campaignText: "Texto da campanha",
  campaignImage: "Imagem da campanha — URL da biblioteca",
  detailTitle: "Título sobre os detalhes",
  detailText: "Texto sobre os detalhes",
  newsletterTitle: "Título da newsletter",
  newsletterText: "Descrição da newsletter",
  footerText: "Texto do rodapé",
};
export function EditorialEditor({
  value,
  onChange,
  products,
}: {
  value: Editorial;
  onChange: (value: Editorial) => void;
  products: { id?: string; name: string; archived: boolean }[];
}) {
  return (
    <fieldset className="wide editorial-editor">
      <legend>Conteúdo editorial e coleções</legend>
      <p className="muted">
        Imagens são referências até a validação da campanha. Vincule apenas
        produtos existentes; o estoque continua sendo controlado por variante.
      </p>
      <div className="admin-form">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
          <label key={key}>
            {labels[key]}
            <textarea
              rows={key.endsWith("Text") ? 3 : 2}
              value={String(value[key as keyof Editorial])}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          </label>
        ))}
        <label>
          Enquadramento da imagem principal
          <select
            value={value.heroPosition}
            onChange={(e) =>
              onChange({
                ...value,
                heroPosition: e.target.value as Editorial["heroPosition"],
              })
            }
          >
            <option value="center">Centro</option>
            <option value="left">Esquerda</option>
            <option value="right">Direita</option>
          </select>
        </label>
      </div>
      <EditorialUpload
        onUpload={(campaignImage) => onChange({ ...value, campaignImage })}
      />
      <div className="editorial-preview">
        {(value.campaignImage.startsWith("/images/") ||
          value.campaignImage.startsWith("https://res.cloudinary.com/")) && (
          <Image
            unoptimized
            src={value.campaignImage}
            alt="Prévia da campanha"
            width={640}
            height={360}
          />
        )}
        <p>Prévia editorial · substitua pela campanha aprovada</p>
      </div>
      {value.collections.map((c, i) => (
        <fieldset key={i} className="collection-editor">
          <legend>Coleção {i + 1}</legend>
          <div className="admin-form">
            {(
              ["title", "slug", "description", "image", "campaign"] as const
            ).map((k) => (
              <label key={k}>
                {
                  {
                    title: "Nome da coleção",
                    slug: "Slug da coleção",
                    description: "Descrição da coleção",
                    image: "Capa da coleção — URL da biblioteca",
                    campaign: "Conteúdo da campanha",
                  }[k]
                }
                <input
                  value={c[k]}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      collections: value.collections.map((x, n) =>
                        n === i ? { ...x, [k]: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <label>
              Peças da coleção
              <select
                multiple
                value={c.productIds}
                onChange={(e) =>
                  onChange({
                    ...value,
                    collections: value.collections.map((x, n) =>
                      n === i
                        ? {
                            ...x,
                            productIds: Array.from(
                              e.target.selectedOptions,
                              (o) => o.value,
                            ),
                          }
                        : x,
                    ),
                  })
                }
              >
                {products
                  .filter((p) => p.id && !p.archived)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <small>
                Seleção múltipla: Ctrl/Cmd + clique. Sem seleção, a página
                apresenta somente o conceito.
              </small>
            </label>
          </div>
          <EditorialUpload
            onUpload={(image) =>
              onChange({
                ...value,
                collections: value.collections.map((x, n) =>
                  n === i ? { ...x, image } : x,
                ),
              })
            }
          />
          <button
            type="button"
            className="text-link"
            onClick={() =>
              onChange({
                ...value,
                collections: value.collections.filter((_, n) => i !== n),
              })
            }
          >
            Remover conceito
          </button>
        </fieldset>
      ))}
      <button
        className="button"
        type="button"
        disabled={value.collections.length >= 8}
        onClick={() =>
          onChange({
            ...value,
            collections: [
              ...value.collections,
              {
                ...defaultEditorial.collections[0],
                slug: `colecao-${Date.now()}`,
                title: "NOVA COLEÇÃO",
                productIds: [],
              },
            ],
          })
        }
      >
        Adicionar conceito
      </button>
    </fieldset>
  );
}
