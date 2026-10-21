import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Konum data model — v2 Brief Section 4 (minimum tables + audit additions)
// Note: the brief assumes MySQL; since MySQL is unavailable in this environment,
// SQLite is used as the safe default (documented in README). The Drizzle schema
// is kept portable; moving to MySQL only changes the driver and dialect.

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

// Users without an invite cannot enter the app (v2 Section 4)
export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(),
  eposta: text("eposta").notNull(),
  rol: text("rol").notNull().default("sahip"), // sahip | editor | onaylayici | izleyici
  workspaceId: text("workspace_id"), // null → can open a new workspace
  token: text("token").notNull().unique(),
  sonKullanma: integer("son_kullanma", { mode: "number" }).notNull(),
  kullanildi: integer("kullanildi").notNull().default(0),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

// Yerel oturum (Kimi OAuth yerine — README'de belgelendi)
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  expiresAt: integer("expires_at", { mode: "number" }).notNull(),
});

// Organization (tenant) layer — consultant finding (Kapı 1, P0): the agency is the
// tenant; a workspace is one of its clients. Kept minimal for the pilot: one org per
// owner for now, but the column exists on every workspace so tenant isolation can
// tighten without a data migration later.
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  ad: text("ad").notNull(),
  sahipId: text("sahip_id").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().default(""),
  ownerId: text("owner_id").notNull(),
  musteriAdi: text("musteri_adi").notNull(),
  sektor: text("sektor").notNull().default(""),
  urunUrl: text("urun_url").notNull().default(""),
  beyazEtiket: text("beyaz_etiket").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

// Workspace membership — membership + role verified in every procedure (v2 Section 6.2)
export const workspaceMembers = sqliteTable("workspace_members", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  rol: text("rol").notNull().default("editor"), // sahip | editor | onaylayici | izleyici
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const strategyBeliefs = sqliteTable("strategy_beliefs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().unique(),
  hikaye: text("hikaye").notNull().default(""),
  konumlandirma: text("konumlandirma").notNull().default(""),
  hedefKitle: text("hedef_kitle").notNull().default(""),
  yasakliIfadeler: text("yasakli_ifadeler").notNull().default("[]"),
  kanitlanmisMesajlar: text("kanitlanmis_mesajlar").notNull().default("[]"),
  onayDurumu: text("onay_durumu").notNull().default("taslak"), // taslak | onaylandi
  guncelleyen: text("guncelleyen").notNull().default(""),
  guncellemeZamani: integer("guncelleme_zamani", { mode: "number" }).notNull().default(0),
  taramaOzeti: text("tarama_ozeti").notNull().default(""),
  surum: integer("surum").notNull().default(1),
});

// Baseline for the staleness alarm (v2 Section 4)
export const crawlSnapshots = sqliteTable("crawl_snapshots", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  url: text("url").notNull(),
  tip: text("tip").notNull().default("urun"), // urun | rakip
  metin: text("metin").notNull().default(""),
  hash: text("hash").notNull().default(""),
  zaman: integer("zaman", { mode: "number" }).notNull(),
});

export const hypotheses = sqliteTable("hypotheses", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  iddia: text("iddia").notNull(),
  kitle: text("kitle").notNull().default(""),
  kanitOnerisi: text("kanit_onerisi").notNull().default(""),
  durum: text("durum").notNull().default("oneri"), // oneri | secildi | reddedildi
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const tests = sqliteTable("tests", {
  id: text("id").primaryKey(),
  hypothesisId: text("hypothesis_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  varyantlar: text("varyantlar").notNull().default("[]"),
  olcut: text("olcut").notNull().default(""),
  olcutTipi: text("olcut_tipi").notNull().default(""), // "ctr" | "donusum" — eski kayıtlar için yedek
  // Danışma turu 2: kontrollü pay/payda çifti (stats.ts payPaydaGecerliMi)
  olcutPayi: text("olcut_payi").notNull().default(""), // tiklama | donusum
  olcutPaydasi: text("olcut_paydasi").notNull().default(""), // gosterim | tiklama
  deneme: integer("deneme").notNull().default(1), // aynı hipotezin kaçıncı testi (arka-kapı peeking ölçümü)
  temelOran: integer("temel_oran").notNull().default(0), // baz puan (2.0% → 200)
  mde: integer("mde").notNull().default(0),
  minimumOrneklem: integer("minimum_orneklem").notNull().default(0),
  baslangic: integer("baslangic", { mode: "number" }),
  durum: text("durum").notNull().default("taslak"), // taslak | onayBekliyor | calisiyor | tamamlandi | yetersizVeri
  sonuc: text("sonuc").notNull().default(""),
  kazananVaryantId: text("kazanan_varyant_id"),
  pDegeri: integer("p_degeri"), // oran*1e6 ham
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

// Test result entry: manual form or CSV (v2 Section 2.4)
// tarih: YYYY-MM-DD — danışma turu 2: (test, varyant, tarih) tekil; aynı günün
// ikinci yüklemesi reddedilir (CSV tekrarıyla örneklem şişmesi kapatıldı).
export const testResults = sqliteTable("test_results", {
  id: text("id").primaryKey(),
  testId: text("test_id").notNull(),
  varyantId: text("varyant_id").notNull(),
  tarih: text("tarih").notNull().default(""), // boş = tarihsiz manuel giriş
  gosterim: integer("gosterim").notNull().default(0),
  tiklama: integer("tiklama").notNull().default(0),
  donusum: integer("donusum").notNull().default(0),
  kaynak: text("kaynak").notNull().default("manuel"), // manuel | csv
  girenKullanici: text("giren_kullanici").notNull().default(""),
  zaman: integer("zaman", { mode: "number" }).notNull(),
});

export const evidenceFiles = sqliteTable("evidence_files", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  testId: text("test_id").notNull(),
  kazananMesaj: text("kazanan_mesaj").notNull().default(""),
  ogrenim: text("ogrenim").notNull().default(""),
  disaAktarimFormati: text("disa_aktarim_formati").notNull().default("markdown"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  evidenceId: text("evidence_id"),
  kanal: text("kanal").notNull(),
  baslik: text("baslik").notNull().default(""),
  govde: text("govde").notNull(),
  // denetimde | onayKuyrugu | revize | onayli | reddedildi | paketlendi
  durum: text("durum").notNull().default("denetimde"),
  denetciNotu: text("denetci_notu").notNull().default(""),
  surum: integer("surum").notNull().default(1),
  oncekiSurumId: text("onceki_surum_id"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

// Approval Center evidence record — cannot be deleted or updated (v2 Section 6.3)
export const approvalEvents = sqliteTable("approval_events", {
  id: text("id").primaryKey(),
  contentItemId: text("content_item_id").notNull(),
  userId: text("user_id").notNull(),
  eylem: text("eylem").notNull(), // onay | revize | red
  not: text("not").notNull().default(""),
  zaman: integer("zaman", { mode: "number" }).notNull(),
});

export const publishPackages = sqliteTable("publish_packages", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  ogeler: text("ogeler").notNull().default("[]"),
  olusturan: text("olusturan").notNull().default(""),
  olusturmaZamani: integer("olusturma_zamani", { mode: "number" }).notNull(),
  disaAktarimAnahtari: text("disa_aktarim_anahtari").notNull().default(""),
});

// Product-internal agents only; external advisor records are NEVER written here (v2 Section 12)
export const agentLogs = sqliteTable("agent_logs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  ajan: text("ajan").notNull(),
  girdiOzeti: text("girdi_ozeti").notNull().default(""),
  ciktiOzeti: text("cikti_ozeti").notNull().default(""),
  denetciKarari: text("denetci_karari").notNull().default(""),
  tokenSayisi: integer("token_sayisi").notNull().default(0),
  mod: text("mod").notNull().default(""),
  zaman: integer("zaman", { mode: "number" }).notNull(),
});

export const signals = sqliteTable("signals", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  tip: text("tip").notNull(), // haftalikOzet | eskimeAlarmi
  icerik: text("icerik").notNull().default(""),
  okundu: integer("okundu").notNull().default(0),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

// Landing pilot form — real record (v2 Section 8, Phase 1)
export const pilotApplications = sqliteTable("pilot_applications", {
  id: text("id").primaryKey(),
  eposta: text("eposta").notNull(),
  ajansAdi: text("ajans_adi").notNull().default(""),
  musteriSayisi: text("musteri_sayisi").notNull().default(""),
  kaynak: text("kaynak").notNull().default("landing"),
  rizaMetniSurumu: text("riza_metni_surumu").notNull().default(""),
  zaman: integer("zaman", { mode: "number" }).notNull(),
});

// Section 15 free diagnosis tool (used in Phase 2)
export const diagnosisRequests = sqliteTable("diagnosis_requests", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  eposta: text("eposta"),
  rapor: text("rapor").notNull().default(""),
  ipHash: text("ip_hash").notNull().default(""),
  zaman: integer("zaman", { mode: "number" }).notNull(),
});
