import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.KONUM_DATA_DIR || path.resolve(__dirname, "data");
mkdirSync(dataDir, { recursive: true });

const dbYolu = process.env.KONUM_DB_PATH || path.join(dataDir, "konum.db");
const sqlite = new Database(dbYolu);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Simple startup migration (Phase 1 scope; can move to drizzle-kit migrate later)
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY, eposta TEXT NOT NULL, rol TEXT NOT NULL DEFAULT 'sahip',
  workspace_id TEXT, token TEXT NOT NULL UNIQUE,
  son_kullanma INTEGER NOT NULL, kullanildi INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, ad TEXT NOT NULL, sahip_id TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL DEFAULT '', owner_id TEXT NOT NULL, musteri_adi TEXT NOT NULL,
  sektor TEXT NOT NULL DEFAULT '', urun_url TEXT NOT NULL DEFAULT '',
  beyaz_etiket TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, user_id TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'editor', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS strategy_beliefs (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL UNIQUE,
  hikaye TEXT NOT NULL DEFAULT '', konumlandirma TEXT NOT NULL DEFAULT '',
  hedef_kitle TEXT NOT NULL DEFAULT '', yasakli_ifadeler TEXT NOT NULL DEFAULT '[]',
  kanitlanmis_mesajlar TEXT NOT NULL DEFAULT '[]', onay_durumu TEXT NOT NULL DEFAULT 'taslak',
  guncelleyen TEXT NOT NULL DEFAULT '', guncelleme_zamani INTEGER NOT NULL DEFAULT 0,
  tarama_ozeti TEXT NOT NULL DEFAULT '', surum INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS crawl_snapshots (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, url TEXT NOT NULL,
  tip TEXT NOT NULL DEFAULT 'urun', metin TEXT NOT NULL DEFAULT '',
  hash TEXT NOT NULL DEFAULT '', esas INTEGER NOT NULL DEFAULT 0, zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS hypotheses (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, iddia TEXT NOT NULL,
  kitle TEXT NOT NULL DEFAULT '', kanit_onerisi TEXT NOT NULL DEFAULT '',
  durum TEXT NOT NULL DEFAULT 'oneri', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY, hypothesis_id TEXT NOT NULL, workspace_id TEXT NOT NULL,
  varyantlar TEXT NOT NULL DEFAULT '[]', olcut TEXT NOT NULL DEFAULT '',
  olcut_tipi TEXT NOT NULL DEFAULT '', olcut_payi TEXT NOT NULL DEFAULT '',
  olcut_paydasi TEXT NOT NULL DEFAULT '', deneme INTEGER NOT NULL DEFAULT 1,
  temel_oran INTEGER NOT NULL DEFAULT 0, mde INTEGER NOT NULL DEFAULT 0,
  minimum_orneklem INTEGER NOT NULL DEFAULT 0, baslangic INTEGER,
  durum TEXT NOT NULL DEFAULT 'taslak', sonuc TEXT NOT NULL DEFAULT '',
  kazanan_varyant_id TEXT, p_degeri INTEGER, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS test_results (
  id TEXT PRIMARY KEY, test_id TEXT NOT NULL, varyant_id TEXT NOT NULL, tarih TEXT NOT NULL DEFAULT '',
  gosterim INTEGER NOT NULL DEFAULT 0, tiklama INTEGER NOT NULL DEFAULT 0,
  donusum INTEGER NOT NULL DEFAULT 0, kaynak TEXT NOT NULL DEFAULT 'manuel',
  giren_kullanici TEXT NOT NULL DEFAULT '', zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, test_id TEXT NOT NULL,
  kazanan_mesaj TEXT NOT NULL DEFAULT '', ogrenim TEXT NOT NULL DEFAULT '',
  disa_aktarim_formati TEXT NOT NULL DEFAULT 'markdown', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, evidence_id TEXT,
  kanal TEXT NOT NULL, baslik TEXT NOT NULL DEFAULT '', govde TEXT NOT NULL,
  durum TEXT NOT NULL DEFAULT 'denetimde', denetci_notu TEXT NOT NULL DEFAULT '',
  govde_hash TEXT NOT NULL DEFAULT '', kuyruga_giris INTEGER,
  surum INTEGER NOT NULL DEFAULT 1, onceki_surum_id TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS approval_events (
  id TEXT PRIMARY KEY, content_item_id TEXT NOT NULL, user_id TEXT NOT NULL,
  eylem TEXT NOT NULL, "not" TEXT NOT NULL DEFAULT '', govde_hash TEXT NOT NULL DEFAULT '',
  rol TEXT NOT NULL DEFAULT '', red_nedeni TEXT NOT NULL DEFAULT '', zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS publish_packages (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, ogeler TEXT NOT NULL DEFAULT '[]',
  olusturan TEXT NOT NULL DEFAULT '', olusturma_zamani INTEGER NOT NULL,
  disa_aktarim_anahtari TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, ajan TEXT NOT NULL,
  girdi_ozeti TEXT NOT NULL DEFAULT '', cikti_ozeti TEXT NOT NULL DEFAULT '',
  denetci_karari TEXT NOT NULL DEFAULT '', token_sayisi INTEGER NOT NULL DEFAULT 0,
  mod TEXT NOT NULL DEFAULT '', zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, tip TEXT NOT NULL,
  icerik TEXT NOT NULL DEFAULT '', okundu INTEGER NOT NULL DEFAULT 0,
  durum TEXT NOT NULL DEFAULT 'acik', erteleme_bitis INTEGER, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS pilot_applications (
  id TEXT PRIMARY KEY, eposta TEXT NOT NULL, ajans_adi TEXT NOT NULL DEFAULT '',
  musteri_sayisi TEXT NOT NULL DEFAULT '', kaynak TEXT NOT NULL DEFAULT 'landing',
  riza_metni_surumu TEXT NOT NULL DEFAULT '', zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS diagnosis_requests (
  id TEXT PRIMARY KEY, url TEXT NOT NULL, eposta TEXT, rapor TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '', zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id TEXT PRIMARY KEY, url TEXT NOT NULL, ajans_adi TEXT NOT NULL DEFAULT '',
  eposta TEXT NOT NULL DEFAULT '', konu TEXT NOT NULL DEFAULT '', taslak TEXT NOT NULL DEFAULT '',
  rapor_ozeti TEXT NOT NULL DEFAULT '', durum TEXT NOT NULL DEFAULT 'taslak', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS publish_plan_items (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, content_item_id TEXT NOT NULL,
  kanal TEXT NOT NULL, planlanan_tarih TEXT NOT NULL, durum TEXT NOT NULL DEFAULT 'planlandi',
  "not" TEXT NOT NULL DEFAULT '', olusturan TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_logs_ws ON agent_logs(workspace_id, zaman DESC);
CREATE INDEX IF NOT EXISTS idx_content_ws ON content_items(workspace_id, durum);
CREATE INDEX IF NOT EXISTS idx_members ON workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_ws ON crawl_snapshots(workspace_id, zaman DESC);
CREATE INDEX IF NOT EXISTS idx_plan_ws ON publish_plan_items(workspace_id, planlanan_tarih);
`);

// Column additions for databases left over from v1.0 (ignorable errors are tolerated)
for (const stmt of [
  "ALTER TABLE strategy_beliefs ADD COLUMN surum INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE agent_logs ADD COLUMN token_sayisi INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE tests ADD COLUMN olcut_tipi TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE workspaces ADD COLUMN org_id TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE tests ADD COLUMN olcut_payi TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE tests ADD COLUMN olcut_paydasi TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE tests ADD COLUMN deneme INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE test_results ADD COLUMN tarih TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE content_items ADD COLUMN govde_hash TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE content_items ADD COLUMN kuyruga_giris INTEGER",
  // Onay kuyruğu etiketi: öğe LLM'den mi simülasyondan mı — boş = eski kayıt, bilinmiyor
  "ALTER TABLE content_items ADD COLUMN mod TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE approval_events ADD COLUMN govde_hash TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE approval_events ADD COLUMN rol TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE approval_events ADD COLUMN red_nedeni TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE crawl_snapshots ADD COLUMN esas INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE signals ADD COLUMN durum TEXT NOT NULL DEFAULT 'acik'",
  "ALTER TABLE signals ADD COLUMN erteleme_bitis INTEGER",
]) {
  try {
    sqlite.exec(stmt);
  } catch {
    /* column already exists */
  }
}

// Backfill: one organization per existing workspace owner (one-time, idempotent)
try {
  sqlite.exec(`
    INSERT INTO organizations (id, ad, sahip_id, created_at)
    SELECT 'org_' || lower(hex(randomblob(8))), 'Org ' || substr(w.owner_id, 1, 12), w.owner_id, w.created_at
    FROM workspaces w
    WHERE w.org_id = ''
    GROUP BY w.owner_id;
    UPDATE workspaces
    SET org_id = (SELECT o.id FROM organizations o WHERE o.sahip_id = workspaces.owner_id LIMIT 1)
    WHERE org_id = '' AND EXISTS (SELECT 1 FROM organizations o WHERE o.sahip_id = workspaces.owner_id);
  `);
} catch {
  /* not needed on a fresh database */
}
// Move existing workspace owners into the membership table (one-time migration)
try {
  sqlite.exec(`
    INSERT INTO workspace_members (id, workspace_id, user_id, rol, created_at)
    SELECT 'mem_' || lower(hex(randomblob(8))), w.id, w.owner_id, 'sahip', w.created_at
    FROM workspaces w
    WHERE NOT EXISTS (
      SELECT 1 FROM workspace_members m WHERE m.workspace_id = w.id AND m.user_id = w.owner_id
    );
  `);
} catch {
  /* not needed if the tables were just created */
}

// Backfill: mevcut veritabanlarında her (workspace, url) için EN ESKİ anlık kayıt
// esas=1 yapılır — kademeli drift düzeltmesinin başlangıç tabanı (bir kerelik)
try {
  sqlite.exec(`
    UPDATE crawl_snapshots SET esas = 1
    WHERE esas = 0 AND id IN (
      SELECT id FROM crawl_snapshots c2
      WHERE c2.esas = 0
      GROUP BY c2.workspace_id, c2.url
      HAVING c2.zaman = MIN(c2.zaman)
    );
  `);
} catch {
  /* not needed on a fresh database */
}

export const db = drizzle(sqlite, { schema });

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
