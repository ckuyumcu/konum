// LLM provider layer — v2 Section 4 + Cem's additional decision:
// Provider = Anthropic, model = claude-haiku-5-5, official @anthropic-ai/sdk,
// JSON output enforced with a zod schema (structured output via tool-use).
//
// LLM_PROVIDER=anthropic (default). Without a key, the deterministic "simulation"
// generator runs and the output is explicitly labeled everywhere. Key source:
// .env (ANTHROPIC_API_KEY) or the secret file outside the project (server/config.ts).

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

// Note: .env is loaded when the server starts; a function is used instead of a module constant.
export function llmSaglayici(): string {
  return process.env.LLM_PROVIDER || "anthropic";
}

export function llmAktifMi(): boolean {
  return llmSaglayici() === "anthropic" && anthropicAnahtari().kaynak !== "yok";
}

// Convert the zod schema to JSON Schema and enforce it via Anthropic tool-use
async function callAnthropic<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
): Promise<{ data: T; token: number }> {
  const { anahtar } = anthropicAnahtari();
  if (!anahtar) throw new Error("ANTHROPIC_API_KEY is not defined");
  const client = new Anthropic({ apiKey: anahtar });

  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    tools: [
      {
        name: ARAC_ADI,
        description: "Return the structured output matching this schema.",
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: ARAC_ADI },
    messages: [{ role: "user", content: user }],
  });

  const blok = res.content.find((b) => b.type === "tool_use" && b.name === ARAC_ADI);
  if (!blok || blok.type !== "tool_use") throw new Error("LLM did not return structured output");
  const parsed = schema.parse(blok.input); // zod validation — throws when invalid
  return { data: parsed, token: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0) };
}

/**
 * Verifies a pasted key with the cheapest possible call BEFORE it is trusted.
 * gecersiz: Anthropic rejected the key (401/403) — it must not be stored, otherwise
 * the system would silently stay in simulation forever. bilinmiyor: network or other
 * error — the key is kept and the first real call decides.
 */
export async function anahtariDogrula(anahtar: string): Promise<{ sonuc: "gecerli" | "gecersiz" | "bilinmiyor"; mesaj: string }> {
  const client = new Anthropic({ apiKey: anahtar, maxRetries: 0, timeout: 15000 });
  try {
    await client.messages.create({
      model: MODEL,
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
    return { sonuc: "gecerli", mesaj: "Key verified with a live test call." };
  } catch (err) {
    const status = (err as { status?: number } | null)?.status;
    if (status === 401 || status === 403) {
      return { sonuc: "gecersiz", mesaj: `Anthropic rejected this key (${status}).` };
    }
    return { sonuc: "bilinmiyor", mesaj: err instanceof Error ? err.message : "The verification call failed." };
  }
}

/**
 * Structured JSON generation. Retries on failed parsing/validation (max 2).
 * Falls back to simulation when there is no key or the call fails, and marks
 * mod as "simulasyon" — simulation is never reported as "real".
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
      "[konum] LLM call failed, falling back to the simulation generator:",
      lastError instanceof Error ? lastError.message : lastError,
    );
  }
  return { data: simulation(), mod: "simulasyon", tokenSayisi: 0 };
}
