"use client";
import { useState } from "react";
export function EditorialUpload({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <div className="editorial-upload">
      <label>
        Enviar imagem editorial
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              setMessage("A imagem deve ter até 5 MB.");
              return;
            }
            setBusy(true);
            setMessage("");
            try {
              const body = new FormData();
              body.set("file", file);
              const response = await fetch("/api/admin/media", {
                method: "POST",
                body,
              });
              const data = await response.json();
              if (!response.ok) throw Error(data.error);
              onUpload(data.url);
              setMessage(
                "Imagem enviada. Salve as configurações para publicar.",
              );
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Falha no envio.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <small>JPEG, PNG ou WebP · até 5 MB · armazenamento Cloudinary</small>
      <p role="status">{busy ? "Enviando…" : message}</p>
    </div>
  );
}
