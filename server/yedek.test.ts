import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Yalıtılmış veritabanı + sabit anahtar; modüller içe aktarılmadan ÖNCE tanımlanmalı.
// Dış ağ, DNS, canlı veritabanı veya model çağrısı yok.
const gecici = mkdtempSync(path.join(tmpdir(), "konum-yedek-test-"));
process.env.KONUM_DB_PATH = path.join(gecici, "test.db");
process.env.KONUM_YEDEK_ANAHTARI = "test-anahtar";

const { createServerApp } = await import("./app");

test("yanlış anahtar 401; doğru anahtar SQLite dosyası indirir", async () => {
  const app = createServerApp();
  const yanlis = await app.request("/admin/yedek", { headers: { authorization: "Bearer yanlis" } });
  assert.equal(yanlis.status, 401);

  const dogru = await app.request("/admin/yedek", { headers: { authorization: "Bearer test-anahtar" } });
  assert.equal(dogru.status, 200);
  const buf = Buffer.from(await dogru.arrayBuffer());
  assert.ok(buf.subarray(0, 15).toString("latin1").startsWith("SQLite format 3"), "SQLite başlığı beklenir");
  assert.match(dogru.headers.get("content-disposition") || "", /konum-yedek-/);
});

test("özet ucu tablo sayımlarını döner", async () => {
  const app = createServerApp();
  const r = await app.request("/admin/yedek/ozet", { headers: { authorization: "Bearer test-anahtar" } });
  assert.equal(r.status, 200);
  const json = (await r.json()) as { tablolar: { tablo: string; kayit: number }[]; toplam: number };
  assert.ok(Array.isArray(json.tablolar));
  assert.ok(json.tablolar.length > 10, "göç şemasındaki tablolar sayılmalı");
  assert.equal(typeof json.toplam, "number");
});

test("anahtar tanımsızken uç gizli kalır (404)", async () => {
  delete process.env.KONUM_YEDEK_ANAHTARI;
  const app = createServerApp();
  const r = await app.request("/admin/yedek", { headers: { authorization: "Bearer test-anahtar" } });
  assert.equal(r.status, 404);
});
