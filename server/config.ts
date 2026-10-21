// Environment configuration + secret key store.
//
// The key arrives one of two ways (in priority order):
//  1) ANTHROPIC_API_KEY in the .env at the project root (never enters git — in .gitignore)
//  2) A key entered on the Settings screen → a local secret file OUTSIDE the project
//     (~/.konum/secrets.json, permissions 700/600). The key is never shown again,
//     never returned to the client, never written to git.

import { existsSync, readFileSync, mkdirSync, writeFileSync, unlinkSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJE_KOKU = path.resolve(__dirname, "..");

// Simple .env reader (adds only missing keys to process.env)
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

// Platform owner: the seed invite's email in local development; will be tied to the Kimi
// OAuth identity in production. Can be overridden with KONUM_PLATFORM_SAHIBI.
export function platformSahibiMi(email: string): boolean {
  const sahip = (process.env.KONUM_PLATFORM_SAHIBI || "cem@konum.local").toLocaleLowerCase("tr");
  return email.toLocaleLowerCase("tr") === sahip;
}
