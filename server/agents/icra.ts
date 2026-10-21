// İcra Stüdyosu ajanı — kanıtlanmış mesajdan kanal varyasyonları üretir (Aşama 3).
// Girdi yalnızca kanıt dosyasındaki kazanan mesaj + onaylı bellek; çıktı şemalı JSON,
// Denetçi süzgecinden geçer. Anahtar yoksa deterministik şablonlar (simülasyon etiketli).

import { z } from "zod";
import { generateJson } from "./llm";
import { denetle } from "./denetci";

export const KANALLAR = ["eposta", "sosyal", "reklam"] as const;
export type Kanal = (typeof KANALLAR)[number];

export const VaryasyonSchema = z.object({
  kanal: z.enum(KANALLAR),
  baslik: z.string().min(3),
  govde: z.string().min(10),
});

export const IcraPaketSchema = z.object({
  varyasyonlar: z.array(VaryasyonSchema).length(3),
});
export type IcraPaket = z.infer<typeof IcraPaketSchema>;

const SYSTEM = `You are the Execution Studio agent of the "Konum" platform. You receive a PROVEN marketing message (it won a real A/B test) plus the approved strategy memory, and adapt it to three channels.
Rules:
- Return JSON with exactly: {"varyasyonlar": [{"kanal": "eposta"|"sosyal"|"reklam", "baslik": string, "govde": string}, ...]} — exactly 3 items, one per channel: eposta, sosyal, reklam.
- eposta: subject line as baslik; govde is a short email body (max 4 sentences) with one clear call to action.
- sosyal: baslik is a hook; govde is a social post (max 280 characters).
- reklam: baslik is an ad headline (max 40 characters); govde is primary ad text (max 2 sentences).
- The proven claim must survive intact in every channel — you may adapt tone and length, never the claim itself.
- NEVER invent statistics or new claims; never use the banned phrases listed in the input.
- Write in English.`;

function simulasyonPaket(kazananMesaj: string): IcraPaket {
  const mesaj = kazananMesaj.slice(0, 180);
  return {
    varyasyonlar: [
      {
        kanal: "eposta",
        baslik: "The proof, not the promise",
        govde: `${mesaj}\n\nWe'd rather show you than tell you. Reply to this email and we'll send the evidence.\n\n— sent with proof`,
      },
      {
        kanal: "sosyal",
        baslik: "Claims are cheap. Here's ours, with proof:",
        govde: mesaj.slice(0, 240),
      },
      {
        kanal: "reklam",
        baslik: "Proof before purchase",
        govde: `${mesaj.slice(0, 120)}. See the evidence yourself.`,
      },
    ],
  };
}

export interface IcraSonuc {
  paket: IcraPaket;
  mod: "llm" | "simulasyon";
  tokenSayisi: number;
  denetci: { karar: string; gerekce: string };
}

export async function kanalVaryasyonlariUret(
  kazananMesaj: string,
  bellek: { hikaye: string; konumlandirma: string; hedefKitle: string; yasakliIfadeler: string },
): Promise<IcraSonuc> {
  const yasakli = JSON.parse(bellek.yasakliIfadeler || "[]") as string[];
  const user = [
    `Proven winning message (do not alter the claim): "${kazananMesaj}"`,
    `Positioning: ${bellek.konumlandirma}`,
    `Target audience: ${bellek.hedefKitle}`,
    `Banned phrases (never use): ${yasakli.join(", ") || "none"}`,
  ].join("\n");
  const sonuc = await generateJson(SYSTEM, user, IcraPaketSchema, () => simulasyonPaket(kazananMesaj));
  const butun = sonuc.data.varyasyonlar.map((v) => `${v.baslik} ${v.govde}`).join("\n");
  const d = denetle({ metin: butun, yasakliIfadeler: yasakli });
  return { paket: sonuc.data, mod: sonuc.mod, tokenSayisi: sonuc.tokenSayisi, denetci: d };
}
