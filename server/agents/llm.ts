// LLM sağlayıcı katmanı — v2 Bölüm 4 + Cem'in ek kararı:
// Sağlayıcı = Anthropic, model = claude-haiku-5-5, resmî @anthropic-ai/sdk,
// JSON çıktı zod şemasıyla zorlanır (tool-use üzerinden yapılandırılmış çıktı).
//
// LLM_PROVIDER=anthropic (varsayılan). Anahtar yoksa deterministik "simülasyon"
// üretici çalışır ve çıktı her yerde açıkça etiketlenir. Anahtar kaynağı:
// .env (ANTHROPIC_API_KEY) veya proje dışı gizli dosya (server/config.ts).

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { anthropicAnahtari } from "../config";

export interface LlmResult<T> {
  data: T;
  mod: "llm" | "simulasyon";
  tokenSayisi: number;
}

const MODEL = "claude-haiku-5-5";
const ARAC_ADI = "json_cikti";

// Not: .env server başlarken yüklenir; modül sabiti yerine fonksiyon kullanılır.
export function llmSaglayici(): string {
  return process.env.LLM_PROVIDER || "anthropic";
}

export function llmAktifMi(): boolean {
  return llmSaglayici() === "anthropic" && anthropicAnahtari().kaynak !== "yok";
}

// zod şemasını JSON Schema'ya çevirip Anthropic tool-use ile zorla
async function callAnthropic<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
): Promise<{ data: T; token: number }> {
  const { anahtar } = anthropicAnahtari();
  if (!anahtar) throw new Error("ANTHROPIC_API_KEY tanımlı değil");
  const client = new Anthropic({ apiKey: anahtar });

  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    tools: [
      {
        name: ARAC_ADI,
        description: "Yapılandırılmış çıktıyı bu şemaya uygun döndür.",
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: ARAC_ADI },
    messages: [{ role: "user", content: user }],
  });

  const blok = res.content.find((b) => b.type === "tool_use" && b.name === ARAC_ADI);
  if (!blok || blok.type !== "tool_use") throw new Error("LLM yapılandırılmış çıktı döndürmedi");
  const parsed = schema.parse(blok.input); // zod doğrulaması — geçersizse hata fırlatır
  return { data: parsed, token: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0) };
}

/**
 * Yapılandırılmış JSON üretimi. Başarısız ayrıştırma/doğrulamada yeniden deneme
 * (maks. 2). Anahtar yoksa veya çağrı başarısızsa simülasyona düşer ve
 * mod "simulasyon" işaretlenir — simülasyon asla "gerçek" diye raporlanmaz.
 */
export async function generateJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  simulation: () => T,
): Promise<LlmResult<T>> {
  if (llmAktifMi()) {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data, token } = await callAnthropic(system, user, schema);
        return { data, mod: "llm", tokenSayisi: token };
      } catch (err) {
        lastError = err;
      }
    }
    console.warn(
      "[konum] LLM çağrısı başarısız, simülasyon üreticiye düşüldü:",
      lastError instanceof Error ? lastError.message : lastError,
    );
  }
  return { data: simulation(), mod: "simulasyon", tokenSayisi: 0 };
}
