// Konum Phase 1 automated tests — the parts of v2 Section 11 items 2, 3, 5, 6
// applicable at this phase + the anonymization test.
// Run: npm test

import { strict as assert } from "node:assert";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Test database path is set BEFORE db is imported
process.env.KONUM_DATA_DIR = mkdtempSync(path.join(tmpdir(), "konum-test-"));
process.env.KONUM_SECRET_DIR = mkdtempSync(path.join(tmpdir(), "konum-secret-"));
delete process.env.ANTHROPIC_API_KEY; // so the file path is exercised

let gecti = 0;
function test(ad: string, fn: () => void | Promise<void>): Promise<void> | void {
  const sonuc = fn();
  if (sonuc instanceof Promise) {
    return sonuc.then(() => {
      gecti++;
      console.log(`  ✓ ${ad}`);
    });
  }
  gecti++;
  console.log(`  ✓ ${ad}`);
}

async function main() {
  const { denetle } = await import("../agents/denetci");
  const { hedefGuvenliMi, scanUrl, SsrfError } = await import("../agents/scanner");
  const { anonimlestir } = await import("../agents/bellek");
  const { gecisZorla } = await import("../durum");
  const { db, newId } = await import("../db");
  const { uyeZorla, bellekOnayZorla } = await import("../trpc");
  const { workspaces, workspaceMembers, users, strategyBeliefs } = await import("../schema");

  console.log("Auditor (Section 11.3):");
  await test("output containing a banned phrase is rejected", () => {
    const r = denetle({ metin: "Bu ürün devrim niteliğinde bir çözüm.", yasakliIfadeler: ["devrim niteliğinde"] });
    assert.equal(r.karar, "reddedildi");
  });
  await test("clean output passes", () => {
    const r = denetle({ metin: "Kargo 24 saatte çıkar; iade 30 gün koşulsuzdur.", yasakliIfadeler: ["sihirli"] });
    assert.equal(r.karar, "gecti");
  });
  await test("unsourced numeric claim is rejected", () => {
    const r = denetle({ metin: "Satışlarınız %300 artar.", yasakliIfadeler: [] });
    assert.equal(r.karar, "reddedildi");
  });

  console.log("SSRF protection (Section 11.6):");
  for (const hedef of ["http://127.0.0.1", "http://169.254.169.254", "http://10.0.0.1", "http://localhost"]) {
    await test(`${hedef} is rejected`, async () => {
      const r = await hedefGuvenliMi(hedef);
      assert.equal(r.guvenli, false);
    });
  }
  await test("scanUrl rejects 127.0.0.1 without a network request", async () => {
    await assert.rejects(() => scanUrl("http://127.0.0.1:9/"), (e) => e instanceof SsrfError);
  });
  await test("ftp: scheme is rejected", async () => {
    const r = await hedefGuvenliMi("ftp://example.com/x");
    assert.equal(r.guvenli, false);
  });

  console.log("State machine (Section 3 rule 9):");
  await test("onayKuyrugu → paketlendi cannot be taken directly", () => {
    assert.throws(() => gecisZorla("icerik", "onayKuyrugu", "paketlendi"));
  });
  await test("onayli → paketlendi passes", () => {
    gecisZorla("icerik", "onayli", "paketlendi");
  });
  await test("bellek taslak → onaylandi passes, onaylandi → taslak cannot return", () => {
    gecisZorla("bellek", "taslak", "onaylandi");
    assert.throws(() => gecisZorla("bellek", "onaylandi", "taslak"));
  });

  console.log("Workspace isolation (Section 11.5):");
  await test("user A cannot read user B's workspace", () => {
    const simdi = Date.now();
    const uA = { id: newId("usr"), email: "a@test.local", name: "A", createdAt: simdi };
    const uB = { id: newId("usr"), email: "b@test.local", name: "B", createdAt: simdi };
    db.insert(users).values([uA, uB]).run();
    const wsA = { id: newId("ws"), ownerId: uA.id, musteriAdi: "Client A", sektor: "S", urunUrl: "https://a.example", beyazEtiket: "{}", createdAt: simdi };
    const wsB = { id: newId("ws"), ownerId: uB.id, musteriAdi: "Client B", sektor: "S", urunUrl: "https://b.example", beyazEtiket: "{}", createdAt: simdi };
    db.insert(workspaces).values([wsA, wsB]).run();
    db.insert(workspaceMembers)
      .values([
        { id: newId("mem"), workspaceId: wsA.id, userId: uA.id, rol: "sahip", createdAt: simdi },
        { id: newId("mem"), workspaceId: wsB.id, userId: uB.id, rol: "sahip", createdAt: simdi },
      ])
      .run();
    // A enters their own workspace
    assert.equal(uyeZorla(wsA.id, uA.id).ws.id, wsA.id);
    // A cannot enter B's workspace
    assert.throws(() => uyeZorla(wsB.id, uA.id), /do not have access/);
  });

  await test("the memory lock is enforced on the server", () => {
    const simdi = Date.now();
    const ws = { id: newId("ws"), ownerId: "usr_x", musteriAdi: "Lock", sektor: "S", urunUrl: "https://k.example", beyazEtiket: "{}", createdAt: simdi };
    db.insert(workspaces).values(ws).run();
    // Locked while there is no memory
    assert.throws(() => bellekOnayZorla(ws.id));
    db.insert(strategyBeliefs)
      .values({ id: newId("blg"), workspaceId: ws.id, onayDurumu: "taslak", hikaye: "x".repeat(30), konumlandirma: "y".repeat(30) })
      .run();
    // Locked while in draft state
    assert.throws(() => bellekOnayZorla(ws.id));
    db.update(strategyBeliefs)
      .set({ onayDurumu: "onaylandi" })
      .run();
    // Open once approved
    assert.equal(bellekOnayZorla(ws.id).onayDurumu, "onaylandi");
  });

  console.log("Privacy anonymization (Section 6.1):");
  await test("email, phone, national ID, IBAN are masked", () => {
    const m = anonimlestir(
      "Ahmet Yılmaz ahmet@ornek.com adresinden yazdı, tel: +90 532 123 45 67, TC: 12345678901, IBAN: TR33 0006 1005 1978 6457 8413 26"
    );
    assert.ok(!m.includes("ahmet@ornek.com"), "email remains");
    assert.ok(!m.includes("532 123 45 67"), "phone remains");
    assert.ok(!m.includes("12345678901"), "national ID remains");
    assert.ok(!m.includes("TR33 0006"), "IBAN remains");
    assert.ok(!m.includes("Ahmet Yılmaz"), "full name remains");
  });

  console.log("LLM key store (Cem's additional decision):");
  await test("the key is written to a secret file outside the project with 600 permissions and read back", async () => {
    const { anthropicAnahtariYaz, anthropicAnahtari, anthropicAnahtariSil } = await import("../config");
    const { statSync } = await import("node:fs");
    assert.equal(anthropicAnahtari().kaynak, "yok");
    anthropicAnahtariYaz("sk-ant-test-1234567890");
    const okunan = anthropicAnahtari();
    assert.equal(okunan.kaynak, "dosya");
    assert.equal(okunan.anahtar, "sk-ant-test-1234567890");
    const izin = statSync(path.join(process.env.KONUM_SECRET_DIR!, "secrets.json")).mode & 0o777;
    assert.equal(izin, 0o600);
    // env priority: when env exists, env is used instead of the file
    process.env.ANTHROPIC_API_KEY = "sk-ant-env-oncelikli";
    assert.equal(anthropicAnahtari().kaynak, "env");
    delete process.env.ANTHROPIC_API_KEY;
    anthropicAnahtariSil();
    assert.equal(anthropicAnahtari().kaynak, "yok");
  });
  await test("zod schema converts to JSON Schema (tool-use enforcement)", async () => {
    const { z } = await import("zod");
    const { BellekTaslagiSchema } = await import("../agents/bellek");
    const js = z.toJSONSchema(BellekTaslagiSchema) as { properties?: Record<string, unknown> };
    assert.ok(js.properties && "hikaye" in js.properties && "yasakliIfadeler" in js.properties);
  });

  console.log("Statistics engine (Phase 2 — Section 2.4):");
  await test("z-test: a clear difference is significant (20/1000 vs 40/1000)", async () => {
    const { ikiOranZTesti } = await import("../stats");
    const r = ikiOranZTesti(20, 1000, 40, 1000);
    assert.ok(r, "result must exist");
    assert.equal(r!.anlamli, true);
    assert.ok(r!.pDegeri < 0.05 && r!.pDegeri > 0.001, `p=${r!.pDegeri} out of expected range`);
    assert.ok(Math.abs(r!.z - 2.62) < 0.05, `z=${r!.z} unexpected`);
  });
  await test("z-test: close ratios are not significant (20/1000 vs 22/1000)", async () => {
    const { ikiOranZTesti } = await import("../stats");
    const r = ikiOranZTesti(20, 1000, 22, 1000);
    assert.ok(r && r.anlamli === false && r.pDegeri > 0.05);
  });
  await test("z-test: zero conversions in both arms cannot be computed", async () => {
    const { ikiOranZTesti } = await import("../stats");
    assert.equal(ikiOranZTesti(0, 1000, 0, 1000), null);
  });
  await test("power analysis: %2 baseline + 1pp MDE requires a reasonable sample (~3826 per arm)", async () => {
    const { minimumOrneklem } = await import("../stats");
    const n = minimumOrneklem(0.02, 0.01);
    assert.ok(n > 3500 && n < 4200, `n=${n} out of expected range`);
  });
  await test("winner decision: no verdict below the minimum sample", async () => {
    const { kazananKarari } = await import("../stats");
    const r = kazananKarari(
      { varyantId: "A", gosterim: 500, donusum: 10 },
      { varyantId: "B", gosterim: 500, donusum: 20 },
      2000
    );
    assert.equal(r.tur, "yetersizVeri");
    assert.ok(r.tur === "yetersizVeri" && r.gerekce.includes("Minimum sample"));
  });
  await test("winner decision: significant difference picks the higher arm", async () => {
    const { kazananKarari } = await import("../stats");
    const r = kazananKarari(
      { varyantId: "A", gosterim: 3000, donusum: 60 },
      { varyantId: "B", gosterim: 3000, donusum: 120 },
      2000
    );
    assert.equal(r.tur, "kazanan");
    assert.ok(r.tur === "kazanan" && r.kazananVaryantId === "B" && r.pDegeri < 0.05);
  });
  await test("winner decision: insignificant difference stays in yetersizVeri", async () => {
    const { kazananKarari } = await import("../stats");
    const r = kazananKarari(
      { varyantId: "A", gosterim: 3000, donusum: 60 },
      { varyantId: "B", gosterim: 3000, donusum: 66 },
      2000
    );
    assert.equal(r.tur, "yetersizVeri");
  });

  console.log("Consultation round 2 (Gate 2 fixes):");
  await test("metric pair: tiklama/gosterim valid, gosterim/tiklama invalid", async () => {
    const { payPaydaGecerliMi } = await import("../stats");
    assert.equal(payPaydaGecerliMi("tiklama", "gosterim"), true);
    assert.equal(payPaydaGecerliMi("donusum", "tiklama"), true);
    assert.equal(payPaydaGecerliMi("gosterim", "tiklama"), false);
    assert.equal(payPaydaGecerliMi("tiklama", "tiklama"), false);
  });
  await test("IP identity: IPv6 /64 prefix collapses to one identity", async () => {
    const { ipNormallestir } = await import("../guvenlik");
    assert.equal(ipNormallestir("2001:db8:aaaa:bbbb:1111:2222:3333:4444"), "2001:db8:aaaa:bbbb::/64");
    assert.equal(ipNormallestir("203.0.113.7"), "203.0.113.7");
  });
  await test("daily IP hash: stable within a day, changes the next day", async () => {
    const { gunlukIpHash } = await import("../guvenlik");
    const d1 = new Date("2026-10-22T10:00:00Z");
    const d2 = new Date("2026-10-22T23:00:00Z");
    const d3 = new Date("2026-10-23T00:30:00Z");
    assert.equal(gunlukIpHash("203.0.113.7", d1), gunlukIpHash("203.0.113.7", d2));
    assert.notEqual(gunlukIpHash("203.0.113.7", d1), gunlukIpHash("203.0.113.7", d3));
    // aynı /64 ağındaki farklı IPv6 adresleri tek kimlik
    assert.equal(
      gunlukIpHash("2001:db8:aaaa:bbbb::1", d1),
      gunlukIpHash("2001:db8:aaaa:bbbb::ffff", d1)
    );
  });
  await test("PDF: watermark appears on every page", async () => {
    const { raporPdf } = await import("../pdf");
    // 60 satırlık bölüm 2 sayfaya taşar
    const satirlar = Array.from({ length: 60 }, (_, i) => `satir ${i}`);
    const pdf = Buffer.from(raporPdf("T", "A", [{ baslik: "B", satirlar }], "SIMULATION — TEST")).toString("latin1");
    const adet = pdf.split("SIMULATION - TEST").length - 1; // latin1: — → -
    assert.ok(adet >= 2, `watermark count ${adet} < 2`);
  });

  console.log(`\n${gecti} tests passed.`);
}

main().catch((e) => {
  console.error("\nTEST FAILED:", e);
  process.exit(1);
});
