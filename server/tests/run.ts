// Konum Aşama 1 otomatik testleri — v2 Bölüm 11 maddeleri 2, 3, 5, 6'nın
// bu aşamada uygulanabilen kısımları + anonimleştirme testi.
// Çalıştır: npm test

import { strict as assert } from "node:assert";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// db import edilmeden ÖNCE test veritabanı yolu ayarlanır
process.env.KONUM_DATA_DIR = mkdtempSync(path.join(tmpdir(), "konum-test-"));

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

  console.log("Denetçi (Bölüm 11.3):");
  await test("yasaklı ifade içeren çıktı reddedilir", () => {
    const r = denetle({ metin: "Bu ürün devrim niteliğinde bir çözüm.", yasakliIfadeler: ["devrim niteliğinde"] });
    assert.equal(r.karar, "reddedildi");
  });
  await test("temiz çıktı geçer", () => {
    const r = denetle({ metin: "Kargo 24 saatte çıkar; iade 30 gün koşulsuzdur.", yasakliIfadeler: ["sihirli"] });
    assert.equal(r.karar, "gecti");
  });
  await test("kaynaksız sayısal iddia reddedilir", () => {
    const r = denetle({ metin: "Satışlarınız %300 artar.", yasakliIfadeler: [] });
    assert.equal(r.karar, "reddedildi");
  });

  console.log("SSRF koruması (Bölüm 11.6):");
  for (const hedef of ["http://127.0.0.1", "http://169.254.169.254", "http://10.0.0.1", "http://localhost"]) {
    await test(`${hedef} reddedilir`, async () => {
      const r = await hedefGuvenliMi(hedef);
      assert.equal(r.guvenli, false);
    });
  }
  await test("scanUrl 127.0.0.1'i ağ isteği yapmadan reddeder", async () => {
    await assert.rejects(() => scanUrl("http://127.0.0.1:9/"), (e) => e instanceof SsrfError);
  });
  await test("ftp: şeması reddedilir", async () => {
    const r = await hedefGuvenliMi("ftp://example.com/x");
    assert.equal(r.guvenli, false);
  });

  console.log("Durum makinesi (Bölüm 3 kural 9):");
  await test("onayKuyrugu → paketlendi doğrudan geçemez", () => {
    assert.throws(() => gecisZorla("icerik", "onayKuyrugu", "paketlendi"));
  });
  await test("onayli → paketlendi geçer", () => {
    gecisZorla("icerik", "onayli", "paketlendi");
  });
  await test("bellek taslak → onaylandi geçer, onaylandi → taslak dönemez", () => {
    gecisZorla("bellek", "taslak", "onaylandi");
    assert.throws(() => gecisZorla("bellek", "onaylandi", "taslak"));
  });

  console.log("Workspace izolasyonu (Bölüm 11.5):");
  await test("A kullanıcısı B'nin çalışma alanını okuyamaz", () => {
    const simdi = Date.now();
    const uA = { id: newId("usr"), email: "a@test.local", name: "A", createdAt: simdi };
    const uB = { id: newId("usr"), email: "b@test.local", name: "B", createdAt: simdi };
    db.insert(users).values([uA, uB]).run();
    const wsA = { id: newId("ws"), ownerId: uA.id, musteriAdi: "A Müşteri", sektor: "S", urunUrl: "https://a.example", beyazEtiket: "{}", createdAt: simdi };
    const wsB = { id: newId("ws"), ownerId: uB.id, musteriAdi: "B Müşteri", sektor: "S", urunUrl: "https://b.example", beyazEtiket: "{}", createdAt: simdi };
    db.insert(workspaces).values([wsA, wsB]).run();
    db.insert(workspaceMembers)
      .values([
        { id: newId("mem"), workspaceId: wsA.id, userId: uA.id, rol: "sahip", createdAt: simdi },
        { id: newId("mem"), workspaceId: wsB.id, userId: uB.id, rol: "sahip", createdAt: simdi },
      ])
      .run();
    // A kendi alanına girer
    assert.equal(uyeZorla(wsA.id, uA.id).ws.id, wsA.id);
    // A, B'nin alanına giremez
    assert.throws(() => uyeZorla(wsB.id, uA.id), /erişim yetkiniz yok/);
  });

  await test("bellek kilidi sunucuda zorlanır", () => {
    const simdi = Date.now();
    const ws = { id: newId("ws"), ownerId: "usr_x", musteriAdi: "Kilit", sektor: "S", urunUrl: "https://k.example", beyazEtiket: "{}", createdAt: simdi };
    db.insert(workspaces).values(ws).run();
    // Bellek yokken kilitli
    assert.throws(() => bellekOnayZorla(ws.id));
    db.insert(strategyBeliefs)
      .values({ id: newId("blg"), workspaceId: ws.id, onayDurumu: "taslak", hikaye: "x".repeat(30), konumlandirma: "y".repeat(30) })
      .run();
    // Taslak hâlinde kilitli
    assert.throws(() => bellekOnayZorla(ws.id));
    db.update(strategyBeliefs)
      .set({ onayDurumu: "onaylandi" })
      .run();
    // Onaylıyken açık
    assert.equal(bellekOnayZorla(ws.id).onayDurumu, "onaylandi");
  });

  console.log("KVKK anonimleştirme (Bölüm 6.1):");
  await test("e-posta, telefon, TC, IBAN maskelenir", () => {
    const m = anonimlestir(
      "Ahmet Yılmaz ahmet@ornek.com adresinden yazdı, tel: +90 532 123 45 67, TC: 12345678901, IBAN: TR33 0006 1005 1978 6457 8413 26"
    );
    assert.ok(!m.includes("ahmet@ornek.com"), "e-posta kaldı");
    assert.ok(!m.includes("532 123 45 67"), "telefon kaldı");
    assert.ok(!m.includes("12345678901"), "TC kaldı");
    assert.ok(!m.includes("TR33 0006"), "IBAN kaldı");
    assert.ok(!m.includes("Ahmet Yılmaz"), "ad-soyad kaldı");
  });

  console.log(`\n${gecti} test geçti.`);
}

main().catch((e) => {
  console.error("\nTEST BAŞARISIZ:", e);
  process.exit(1);
});
