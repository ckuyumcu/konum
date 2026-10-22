// Analist ajanı — Aşama 4 (v2 Bölüm 4): salt-okur. Test sonuçları, kanıt
// dosyaları ve içerik durumlarını okuyup haftalık "ne öğrendik" özeti üretir.
// Eskime alarmı LLM'e bırakılmaz: kural kodda (radar.ts). Anahtar yoksa
// deterministik özet (simülasyon etiketli).

import { z } from "zod";
import { generateJson } from "./llm";

export const HaftalikOzetSchema = z.object({
  ozet: z.string().min(10),
  ogrenimler: z.array(z.string().min(5)).min(1).max(5),
  sonrakiOneri: z.string().min(5),
});
export type HaftalikOzet = z.infer<typeof HaftalikOzetSchema>;

export interface OzetGirdisi {
  musteriAdi: string;
  kanitlar: { kazananMesaj: string; ogrenim: string; createdAt: number }[];
  testler: { olcut: string; durum: string; sonuc: string; pDegeri: number | null; deneme: number }[];
  icerikSayilari: Record<string, number>; // durum -> adet
}

const SYSTEM = `You are the Analyst agent of the "Konum" platform — read-only. You receive one week of evidence data from a marketing workspace and produce the weekly "what did we learn" brief.
Rules:
- Return JSON with exactly: {"ozet": string, "ogrenimler": string[1-5], "sonrakiOneri": string}.
- ozet: 2-3 sentences, plain and honest. If data is thin, say so — never inflate.
- ogrenimler: concrete learnings tied to the numbers given (rates, p-values, attempt counts). No generic advice.
- sonrakiOneri: the single most valuable next test or action, tied to the data.
- Never invent numbers that are not in the input. Write in English.`;

function simulasyonOzet(g: OzetGirdisi): HaftalikOzet {
  const tamamlanan = g.testler.filter((t) => t.durum === "tamamlandi");
  const ogrenimler: string[] = [];
  for (const k of g.kanitlar.slice(0, 3)) {
    ogrenimler.push(`Proven: "${k.kazananMesaj.slice(0, 120)}" — ${k.ogrenim.slice(0, 120)}`);
  }
  const yetersiz = g.testler.filter((t) => t.durum === "yetersizVeri").length;
  if (yetersiz > 0) ogrenimler.push(`${yetersiz} test(s) ended without a significant winner — the sample or the difference was too small.`);
  const kuyruk = g.icerikSayilari["onayKuyrugu"] ?? 0;
  if (kuyruk > 0) ogrenimler.push(`${kuyruk} content item(s) are waiting in the approval queue.`);
  if (ogrenimler.length === 0) ogrenimler.push("No completed test or proven message this period — the evidence base is still empty.");
  const ozet =
    tamamlanan.length > 0 || g.kanitlar.length > 0
      ? `${g.musteriAdi}: ${tamamlanan.length} completed test(s), ${g.kanitlar.length} proven message(s) on record. The evidence base is growing; every claim below traces back to a recorded test.`
      : `${g.musteriAdi}: no completed tests yet this period. The first evidence file arrives when a running test reaches its minimum sample.`;
  const sonrakiOneri =
    g.kanitlar.length > 0
      ? "Adapt the newest proven message to all three channels in the Execution Studio and run the next test against the current winner."
      : "Pick a hypothesis in the Evidence Engine and start the first A/B test.";
  return { ozet, ogrenimler: ogrenimler.slice(0, 5), sonrakiOneri };
}

export async function haftalikOzetUret(
  g: OzetGirdisi,
): Promise<{ ozet: HaftalikOzet; mod: "llm" | "simulasyon"; tokenSayisi: number }> {
  const user = [
    `Client: ${g.musteriAdi}`,
    `Evidence files (${g.kanitlar.length}):`,
    ...g.kanitlar.map((k) => `- "${k.kazananMesaj}" — ${k.ogrenim}`),
    `Tests (${g.testler.length}):`,
    ...g.testler.map(
      (t) => `- metric "${t.olcut}", status ${t.durum}, p=${t.pDegeri ?? "n/a"}, attempt #${t.deneme}${t.sonuc ? ` — ${t.sonuc}` : ""}`,
    ),
    `Content items by state: ${JSON.stringify(g.icerikSayilari)}`,
  ].join("\n");
  const sonuc = await generateJson(SYSTEM, user, HaftalikOzetSchema, () => simulasyonOzet(g));
  return { ozet: sonuc.data, mod: sonuc.mod, tokenSayisi: sonuc.tokenSayisi };
}

// Eskime alarmı için metin farkı ölçüsü (v2 Bölüm 8, Aşama 4 kuralı):
// normalize edilmiş kelime kümeleri arasında simetrik fark / birleşim oranı.
// 0 = aynı metin, 1 = tamamen farklı. Eşik: 0.20 üzeri "anlamlı değişim".
export function metinFarkiYuzde(eski: string, yeni: string): number {
  const kelimeler = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9ğüşöçıi\s]/gi, " ")
        .split(/\s+/)
        .filter((k) => k.length > 1),
    );
  const a = kelimeler(eski);
  const b = kelimeler(yeni);
  if (a.size === 0 && b.size === 0) return 0;
  const birlesim = new Set([...a, ...b]).size;
  let ortak = 0;
  for (const k of a) if (b.has(k)) ortak++;
  return (birlesim - ortak) / birlesim;
}
