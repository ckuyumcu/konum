// LLM sağlayıcı katmanı — v2 Bölüm 4: "LLM çağrıları sunucu tarafında yapılır;
// API anahtarı istemciye asla gelmez."
//
// Sağlayıcı, LLM_PROVIDER ortam değişkeniyle seçilir (varsayılan: "moonshot").
// MOONSHOT_API_KEY tanımlıysa gerçek çağrı yapılır; yanıt JSON'a zorlanır
// (maks. 2 deneme). Anahtar yoksa deterministik "simülasyon" üretici çalışır ve
// çıktı her yerde açıkça etiketlenir (agent_logs.mod = "simulasyon", UI rozeti).
//
// NOT: Bu makinedeki KIMI_API_KEY, Kimi Work çalışma zamanının kendi anahtarıdır;
// Moonshot platform API'sinde geçersizdir (401). Ürün çağrıları için Cem'in
// ayrı bir MOONSHOT_API_KEY vermesi gerekir → EXTERNAL_GATE (README + KAPI-1).

export interface LlmResult<T> {
  data: T;
  mod: "llm" | "simulasyon";
  tokenSayisi: number;
}

const API_URL = "https://api.moonshot.cn/v1/chat/completions";
const MODEL = "kimi-k2-0905-preview";

export function llmAktifMi(): boolean {
  return process.env.LLM_PROVIDER !== "simulasyon" && Boolean(process.env.MOONSHOT_API_KEY);
}

async function callMoonshot(system: string, user: string): Promise<{ icerik: string; token: number }> {
  const key = process.env.MOONSHOT_API_KEY;
  if (!key) throw new Error("MOONSHOT_API_KEY tanımlı değil");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM boş yanıt döndü");
    return { icerik: content, token: json.usage?.total_tokens ?? 0 };
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson<T>(raw: string): T {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Yanıtta JSON bulunamadı");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

/**
 * Yapılandırılmış JSON üretimi. Başarısız ayrıştırmada yeniden deneme (maks. 2).
 * LLM erişilemezse simülasyon üreticiye düşer ve mod "simulasyon" işaretlenir.
 */
export async function generateJson<T>(
  system: string,
  user: string,
  simulation: () => T,
  validate?: (v: unknown) => T,
): Promise<LlmResult<T>> {
  if (llmAktifMi()) {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { icerik, token } = await callMoonshot(system, user);
        const parsed = extractJson<unknown>(icerik);
        const data = validate ? validate(parsed) : (parsed as T);
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
