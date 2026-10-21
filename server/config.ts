// Ortam yapılandırması + gizli anahtar deposu.
//
// Anahtar iki yoldan gelir (öncelik sırasıyla):
//  1) Proje kökündeki .env içinde ANTHROPIC_API_KEY (git'e girmez — .gitignore'da)
//  2) Ayarlar ekranından girilen anahtar → proje DIŞI yerel gizli dosya
//     (~/.konum/secrets.json, izinler 700/600). Anahtar bir daha gösterilmez,
//     istemciye asla dönmez, git'e asla yazılmaz.

import { existsSync, readFileSync, mkdirSync, writeFileSync, unlinkSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJE_KOKU = path.resolve(__dirname, "..");

// Basit .env okuyucu (process.env'e yalnızca eksik anahtarları ekler)
export function envYukle(): void {
  const p = path.join(PROJE_KOKU, ".env");
  if (!existsSync(p)) return;
  for (const satir of readFileSync(p, "utf8").split("\n")) {
    const s = satir.trim();
    if (!s || s.startsWith("#")) continue;
    const esit = s.indexOf("=");
    if (esit < 1) continue;
    const ad = s.slice(0, esit).trim();
    let deger = s.slice(esit + 1).trim();
    if ((deger.startsWith('"') && deger.endsWith('"')) || (deger.startsWith("'") && deger.endsWith("'"))) {
      deger = deger.slice(1, -1);
    }
    if (!(ad in process.env)) process.env[ad] = deger;
  }
}

const GIZLI_DIZIN = process.env.KONUM_SECRET_DIR || path.join(homedir(), ".konum");
const GIZLI_DOSYA = path.join(GIZLI_DIZIN, "secrets.json");

interface Secrets {
  anthropicApiKey?: string;
}

function dosyadanOku(): Secrets {
  try {
    return JSON.parse(readFileSync(GIZLI_DOSYA, "utf8")) as Secrets;
  } catch {
    return {};
  }
}

export function anthropicAnahtari(): { anahtar?: string; kaynak: "env" | "dosya" | "yok" } {
  if (process.env.ANTHROPIC_API_KEY) return { anahtar: process.env.ANTHROPIC_API_KEY, kaynak: "env" };
  const d = dosyadanOku();
  if (d.anthropicApiKey) return { anahtar: d.anthropicApiKey, kaynak: "dosya" };
  return { kaynak: "yok" };
}

export function anthropicAnahtariYaz(anahtar: string): void {
  mkdirSync(GIZLI_DIZIN, { recursive: true, mode: 0o700 });
  chmodSync(GIZLI_DIZIN, 0o700);
  writeFileSync(GIZLI_DOSYA, JSON.stringify({ ...dosyadanOku(), anthropicApiKey: anahtar }), { mode: 0o600 });
  chmodSync(GIZLI_DOSYA, 0o600);
}

export function anthropicAnahtariSil(): void {
  try {
    unlinkSync(GIZLI_DOSYA);
  } catch {
    /* dosya yok */
  }
}

// Platform sahibi: yerel geliştirmede tohum davetin e-postası; üretimde Kimi
// OAuth kimliğine bağlanacak. KONUM_PLATFORM_SAHIBI ile ezilebilir.
export function platformSahibiMi(email: string): boolean {
  const sahip = (process.env.KONUM_PLATFORM_SAHIBI || "cem@konum.local").toLocaleLowerCase("tr");
  return email.toLocaleLowerCase("tr") === sahip;
}
