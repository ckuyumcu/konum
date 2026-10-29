// Tam SQLite yedeği — kalıcı disksiz ortamlarda (Render Free) veri kurtarmanın tek yolu.
// Uçlar yalnızca KONUM_YEDEK_ANAHTARI tanımlıysa açılır; tanımsızsa 404 (uç gizli kalır).
import { mkdtempSync } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Context } from "hono";
import { sqlite } from "./db";

export function yedekAcikMi(): boolean {
  return Boolean(process.env.KONUM_YEDEK_ANAHTARI);
}

export function anahtarDogruMu(c: Context): boolean {
  const anahtar = process.env.KONUM_YEDEK_ANAHTARI;
  if (!anahtar) return false;
  return (c.req.header("authorization") || "") === `Bearer ${anahtar}`;
}

// better-sqlite3 .backup() WAL dahil tutarlı kopya üretir; belleğe okuyup geçici dosyayı sileriz.
export async function yedekIndir(): Promise<Buffer> {
  const gecici = path.join(mkdtempSync(path.join(tmpdir(), "konum-yedek-")), "konum.db");
  try {
    await sqlite.backup(gecici);
    return await readFile(gecici);
  } finally {
    await unlink(gecici).catch(() => {});
  }
}

export function yedekOzet(): { tablolar: { tablo: string; kayit: number }[]; toplam: number } {
  const tablolar = (
    sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[]
  ).map((t) => ({
    tablo: t.name,
    kayit: (sqlite.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get() as { n: number }).n,
  }));
  return { tablolar, toplam: tablolar.reduce((a, b) => a + b.kayit, 0) };
}
