import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "node:crypto";
import { desc, asc, eq, and, gte } from "drizzle-orm";
import {
  router,
  publicProcedure,
  protectedProcedure,
  uyeZorla,
  onayYetkisiZorla,
  bellekOnayZorla,
} from "./trpc";
import { db, newId } from "./db";
import {
  agentLogs,
  approvalEvents,
  contentItems,
  crawlSnapshots,
  diagnosisRequests,
  evidenceFiles,
  hypotheses,
  organizations,
  outreachDrafts,
  pilotApplications,
  publishPackages,
  publishPlanItems,
  signals,
  strategyBeliefs,
  testResults,
  tests,
  workspaces,
  workspaceMembers,
} from "./schema";
import { scanUrl, SsrfError } from "./agents/scanner";
import { bellekTaslagiUret } from "./agents/bellek";
import { hipotezUret, testPlaniUret } from "./agents/kanit";
import { mesajHaritasiUret } from "./agents/teshis";
import { kanalVaryasyonlariUret } from "./agents/icra";
import { denetle } from "./agents/denetci";
import { haftalikOzetUret, metinFarkiYuzde } from "./agents/analist";
import {
  alarmAcilabilirMi,
  kanitAlarmiGerekirMi,
  kisiselEpostaMi,
  taramaAlarmiGerekirMi,
  ERTELEME_GUN,
  type AlarmKaydi,
} from "./radar";
import { gecisZorla } from "./durum";
import { kazananKarari, payPaydaGecerliMi } from "./stats";
import { gunlukIpHash } from "./guvenlik";
import {
  anthropicAnahtari,
  anthropicAnahtariSil,
  anthropicAnahtariYaz,
  platformSahibiMi,
} from "./config";
import { llmAktifMi, llmSaglayici, anahtariDogrula } from "./agents/llm";

function logAjan(
  workspaceId: string,
  ajan: string,
  girdiOzeti: string,
  ciktiOzeti: string,
  denetciKarari: string,
  mod: string,
  tokenSayisi = 0,
) {
  db.insert(agentLogs)
    .values({
      id: newId("log"),
      workspaceId,
      ajan,
      girdiOzeti: girdiOzeti.slice(0, 2000),
      ciktiOzeti: ciktiOzeti.slice(0, 2000),
      denetciKarari,
      mod,
      tokenSayisi,
      zaman: Date.now(),
    })
    .run();
}

// Cost protection — v2 Section 4: daily LLM call limit per workspace.
// Threshold [DV — default]: 50/day; will be made adjustable in Settings (Phase 4).
// Danışma turu 2 (P0): workspace sınırına ek olarak KÜRESEL günlük tavan — botnet
// ya da çok-workspace'li suistimalde toplam fatura burada kesilir.
const GUNLUK_LLM_SINIRI = 50;
const GUNLUK_LLM_KURESEL_TAVAN = 300;

function gunlukLlmSiniriZorla(workspaceId: string) {
  const gunBaslangic = new Date();
  gunBaslangic.setHours(0, 0, 0, 0);
  const bugun = db.select().from(agentLogs).where(gte(agentLogs.zaman, gunBaslangic.getTime())).all();
  const kuresel = bugun.filter((l) => l.mod === "llm").length;
  if (kuresel >= GUNLUK_LLM_KURESEL_TAVAN) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "The platform-wide daily AI capacity has been reached. This circuit breaker protects against runaway costs; service resumes tomorrow.",
    });
  }
  const kayitlar = bugun.filter((l) => l.workspaceId === workspaceId && l.mod === "llm");
  if (kayitlar.length >= GUNLUK_LLM_SINIRI) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `The daily LLM call limit for this workspace has been reached (${GUNLUK_LLM_SINIRI}). Please try again tomorrow.`,
    });
  }
}

const entegrasyonlar = [
  { ad: "Website scanning", durum: "aktif", aciklama: "Text extraction from the product URL; robots.txt-aware, SSRF-protected." },
  { ad: "File upload (.txt/.csv, up to 5 MB)", durum: "planlandi", aciklama: "Customer reviews / FAQs / support texts — in scope for Phase 2." },
  { ad: "Meta Ads / Instagram", durum: "planlandi", aciklama: "Planned — during the pilot phase (v1.1 target)." },
  { ad: "Google Ads", durum: "planlandi", aciklama: "Planned — during the pilot phase (v1.1 target)." },
  { ad: "Email (Mailchimp / Klaviyo)", durum: "planlandi", aciklama: "Planned — during the pilot phase (v1.1 target)." },
  { ad: "Analytics connection", durum: "planlandi", aciklama: "Planned — during the pilot phase (v1.1 target)." },
];

const EPOSTA_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const RIZA_METNI_SURUMU = "v0.1-taslak";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) =>
      ctx.user
        ? { ...ctx.user, mod: "yerel" as const, platformSahibi: platformSahibiMi(ctx.user.email) }
        : null,
    ),
  }),

  // Landing pilot form — the only public procedure (v2 Section 8, Phase 1)
  pilot: router({
    basvur: publicProcedure
      .input(
        z.object({
          eposta: z.string().trim().regex(EPOSTA_RE, "Enter a valid email address."),
          ajansAdi: z.string().trim().max(200).optional().default(""),
          musteriSayisi: z.string().trim().max(50).optional().default(""),
          riza: z.literal(true, { error: "Applications cannot be accepted without consent to the privacy notice." }),
        }),
      )
      .mutation(({ input }) => {
        db.insert(pilotApplications)
          .values({
            id: newId("plt"),
            eposta: input.eposta.toLocaleLowerCase("en"),
            ajansAdi: input.ajansAdi,
            musteriSayisi: input.musteriSayisi,
            kaynak: "landing",
            rizaMetniSurumu: RIZA_METNI_SURUMU,
            zaman: Date.now(),
          })
          .run();
        return { ok: true };
      }),
  }),

  workspaces: router({
    list: protectedProcedure.query(({ ctx }) => {
      const uyelikler = db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, ctx.user.id))
        .all();
      return uyelikler.map((u) => {
        const ws = db.select().from(workspaces).where(eq(workspaces.id, u.workspaceId)).get();
        const bellek = db
          .select()
          .from(strategyBeliefs)
          .where(eq(strategyBeliefs.workspaceId, u.workspaceId))
          .get();
        const bekleyenOnay = db
          .select()
          .from(contentItems)
          .where(and(eq(contentItems.workspaceId, u.workspaceId), eq(contentItems.durum, "onayKuyrugu")))
          .all().length;
        return { ...ws!, rol: u.rol, bellekDurumu: bellek?.onayDurumu ?? "yok", bekleyenOnay };
      });
    }),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(({ ctx, input }) => {
        const { ws, rol } = uyeZorla(input.id, ctx.user.id);
        return { ...ws, rol };
      }),
    create: protectedProcedure
      .input(
        z.object({
          musteriAdi: z.string().trim().min(2, "Client name must be at least 2 characters."),
          sektor: z.string().trim().min(2, "Sector is required."),
          urunUrl: z.string().trim().min(4, "Product URL is required."),
        }),
      )
      .mutation(({ ctx, input }) => {
        // Kiracı katmanı (danışman P0): kullanıcının kuruluşu yoksa oluştur; workspace ona bağlanır
        let org = db.select().from(organizations).where(eq(organizations.sahipId, ctx.user.id)).get();
        if (!org) {
          org = { id: newId("org"), ad: `${ctx.user.name || "Agency"} — Organization`, sahipId: ctx.user.id, createdAt: Date.now() };
          db.insert(organizations).values(org).run();
        }
        const ws = {
          id: newId("ws"),
          orgId: org.id,
          ownerId: ctx.user.id,
          musteriAdi: input.musteriAdi,
          sektor: input.sektor,
          urunUrl: input.urunUrl,
          beyazEtiket: "{}",
          createdAt: Date.now(),
        };
        db.insert(workspaces).values(ws).run();
        db.insert(workspaceMembers)
          .values({ id: newId("mem"), workspaceId: ws.id, userId: ctx.user.id, rol: "sahip", createdAt: Date.now() })
          .run();
        return ws;
      }),

    // Beyaz etiket ayarları (Aşama 4, Ajans Konsolu) — yalnız sahip rolü
    beyazEtiketGuncelle: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          markaAdi: z.string().trim().max(100).default(""),
          vurguRenk: z
            .string()
            .trim()
            .regex(/^#[0-9a-fA-F]{6}$/, "Enter a hex color like #ff3500.")
            .or(z.literal(""))
            .default(""),
          alanAdi: z.string().trim().max(200).default(""),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { rol } = uyeZorla(input.workspaceId, ctx.user.id);
        if (rol !== "sahip") {
          throw new TRPCError({ code: "FORBIDDEN", message: "White-label settings can only be changed by the owner role." });
        }
        const beyazEtiket = JSON.stringify({ markaAdi: input.markaAdi, vurguRenk: input.vurguRenk, alanAdi: input.alanAdi });
        db.update(workspaces).set({ beyazEtiket }).where(eq(workspaces.id, input.workspaceId)).run();
        return { ok: true };
      }),
  }),

  bellek: router({
    get: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return (
          db.select().from(strategyBeliefs).where(eq(strategyBeliefs.workspaceId, input.workspaceId)).get() ?? null
        );
      }),

    // Setup wizard step 1: scan the URL (Researcher) — SSRF-protected
    tara: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { ws } = uyeZorla(input.workspaceId, ctx.user.id);
        if (!ws.urunUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Product URL is not defined." });
        const scan = await scanUrl(ws.urunUrl);
        if (scan.metin) {
          db.insert(crawlSnapshots)
            .values({
              id: newId("crw"),
              workspaceId: ws.id,
              url: scan.finalUrl,
              tip: "urun",
              metin: scan.metin,
              hash: createHash("sha256").update(scan.metin).digest("hex"),
              zaman: Date.now(),
            })
            .run();
        }
        logAjan(
          ws.id,
          "arastirmaci",
          `URL scan: ${ws.urunUrl}`,
          scan.metin
            ? `${scan.metin.length} characters of text extracted. Title: ${scan.title}`
            : scan.not || "No text could be extracted.",
          "uygulanamaz",
          "tarama",
        );
        return scan;
      }),

    // Setup wizard step 2: generate a memory draft from the scan (Strategist Asst. → Auditor)
    taslakUret: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          // Boş/kısa metin reddedilir: taramasız taslak, LLM'in site hakkında uydurması demektir
          taramaMetni: z.string().min(200, "Scan text is too short — run the site scan first; a draft without real scan text is not allowed.").max(12000),
          taramaBaslik: z.string().max(500),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { ws } = uyeZorla(input.workspaceId, ctx.user.id);
        gunlukLlmSiniriZorla(ws.id);
        const sonuc = await bellekTaslagiUret(
          {
            url: ws.urunUrl,
            finalUrl: ws.urunUrl,
            title: input.taramaBaslik,
            metin: input.taramaMetni,
            robotsIzni: true,
          },
          ws.musteriAdi,
          ws.sektor,
        );

        const simdi = Date.now();
        const mevcut = db.select().from(strategyBeliefs).where(eq(strategyBeliefs.workspaceId, ws.id)).get();

        const kayit = {
          hikaye: sonuc.taslak.hikaye,
          konumlandirma: sonuc.taslak.konumlandirma,
          hedefKitle: sonuc.taslak.hedefKitle,
          yasakliIfadeler: JSON.stringify(sonuc.taslak.yasakliIfadeler),
          taramaOzeti: `Source: ${input.taramaBaslik || ws.urunUrl} — ${input.taramaMetni.length} characters`,
          onayDurumu: "taslak",
          guncelleyen: `Strategist Assistant (${sonuc.mod})`,
          guncellemeZamani: simdi,
          surum: (mevcut?.surum ?? 0) + 1,
        };
        if (mevcut) {
          db.update(strategyBeliefs).set(kayit).where(eq(strategyBeliefs.id, mevcut.id)).run();
        } else {
          db.insert(strategyBeliefs).values({ id: newId("blg"), workspaceId: ws.id, ...kayit }).run();
        }

        logAjan(
          ws.id,
          "stratejist",
          `Memory draft — source: ${input.taramaBaslik || ws.urunUrl}`,
          `hikaye=${sonuc.taslak.hikaye.length}c, konumlandirma=${sonuc.taslak.konumlandirma.length}c, yasakli=${sonuc.taslak.yasakliIfadeler.length} adet`,
          sonuc.denetci.karar === "gecti" ? "gecti" : `reddedildi: ${sonuc.denetci.gerekce}`,
          sonuc.mod,
          sonuc.tokenSayisi,
        );
        return { taslak: sonuc.taslak, mod: sonuc.mod, denetci: sonuc.denetci };
      }),

    guncelle: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          hikaye: z.string().max(5000),
          konumlandirma: z.string().max(2000),
          hedefKitle: z.string().max(2000),
          yasakliIfadeler: z.array(z.string().max(200)).max(50),
        }),
      )
      .mutation(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const bellek = db
          .select()
          .from(strategyBeliefs)
          .where(eq(strategyBeliefs.workspaceId, input.workspaceId))
          .get();
        if (!bellek) throw new TRPCError({ code: "NOT_FOUND", message: "Generate a draft with the setup wizard first." });
        db.update(strategyBeliefs)
          .set({
            hikaye: input.hikaye,
            konumlandirma: input.konumlandirma,
            hedefKitle: input.hedefKitle,
            yasakliIfadeler: JSON.stringify(input.yasakliIfadeler),
            guncelleyen: ctx.user.name,
            guncellemeZamani: Date.now(),
            surum: bellek.surum + 1,
          })
          .where(eq(strategyBeliefs.id, bellek.id))
          .run();
        return { ok: true };
      }),

    // Human approval — the state transition goes through the single state machine on the server (v2 B3 r9)
    onayla: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(({ ctx, input }) => {
        onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const bellek = db
          .select()
          .from(strategyBeliefs)
          .where(eq(strategyBeliefs.workspaceId, input.workspaceId))
          .get();
        if (!bellek) throw new TRPCError({ code: "NOT_FOUND", message: "There is no memory draft to approve." });
        gecisZorla("bellek", bellek.onayDurumu, "onaylandi");
        if (bellek.hikaye.trim().length < 20 || bellek.konumlandirma.trim().length < 20) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The memory cannot be approved before the story and positioning fields have meaningful length.",
          });
        }
        db.update(strategyBeliefs)
          .set({ onayDurumu: "onaylandi", guncelleyen: ctx.user.name, guncellemeZamani: Date.now() })
          .where(eq(strategyBeliefs.id, bellek.id))
          .run();
        logAjan(
          input.workspaceId,
          "denetci",
          "Memory human approval",
          `${ctx.user.name} approved the Strategy Memory; module locks are open.`,
          "gecti",
          "insan",
        );
        return { ok: true };
      }),
  }),

  ajanlar: router({
    // The agent log is only visible to workspace members (v2 Section 6.4)
    logs: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return db
          .select()
          .from(agentLogs)
          .where(eq(agentLogs.workspaceId, input.workspaceId))
          .orderBy(desc(agentLogs.zaman))
          .limit(100)
          .all();
      }),
  }),


  // ===== Kanıt Motoru (Aşama 2) — bellek onayı sunucuda zorlanır =====
  kanit: router({
    // Stratejist Yardımcısı 2-3 hipotez kartı üretir (LLM veya simülasyon)
    hipotezUret: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const bellek = bellekOnayZorla(input.workspaceId);
        gunlukLlmSiniriZorla(input.workspaceId);
        const { ws } = uyeZorla(input.workspaceId, ctx.user.id);
        const sonuc = await hipotezUret({
          hikaye: bellek.hikaye,
          konumlandirma: bellek.konumlandirma,
          hedefKitle: bellek.hedefKitle,
          yasakliIfadeler: JSON.parse(bellek.yasakliIfadeler || "[]") as string[],
          musteriAdi: ws.musteriAdi,
          sektor: ws.sektor,
        });
        const simdi = Date.now();
        const kayitlar = sonuc.hipotezler.map((h) => ({
          id: newId("hip"),
          workspaceId: input.workspaceId,
          iddia: h.iddia,
          kitle: h.kitle,
          kanitOnerisi: h.kanitOnerisi,
          durum: "oneri",
          createdAt: simdi,
        }));
        db.insert(hypotheses).values(kayitlar).run();
        logAjan(
          input.workspaceId,
          "stratejist",
          `Hypothesis generation — memory v${bellek.surum}`,
          `${kayitlar.length} hypothesis cards produced`,
          sonuc.denetci.karar === "gecti" ? "gecti" : `reddedildi: ${sonuc.denetci.gerekce}`,
          sonuc.mod,
          sonuc.tokenSayisi,
        );
        return { hipotezler: kayitlar, mod: sonuc.mod, denetci: sonuc.denetci };
      }),

    hipotezler: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return db
          .select()
          .from(hypotheses)
          .where(eq(hypotheses.workspaceId, input.workspaceId))
          .orderBy(desc(hypotheses.createdAt))
          .all();
      }),

    // İnsan hipotezi seçer → Test Tasarımcısı planı kurar (taslak)
    hipotezSec: protectedProcedure
      .input(z.object({ workspaceId: z.string(), hypothesisId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const bellek = bellekOnayZorla(input.workspaceId);
        gunlukLlmSiniriZorla(input.workspaceId);
        const hip = db.select().from(hypotheses).where(eq(hypotheses.id, input.hypothesisId)).get();
        if (!hip || hip.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hypothesis not found." });
        }
        const yasakli = JSON.parse(bellek.yasakliIfadeler || "[]") as string[];
        const sonuc = await testPlaniUret(hip.iddia, yasakli);
        db.update(hypotheses).set({ durum: "secildi" }).where(eq(hypotheses.id, hip.id)).run();
        const varyantlar = [
          { id: "A", rol: "kontrol", metin: sonuc.plan.varyantA },
          { id: "B", rol: "varyant", metin: sonuc.plan.varyantB },
        ];
        // Arka-kapı peeking ölçümü (danışma turu 2): aynı hipotezin kaçıncı testi olduğu kaydedilir
        const oncekiler = db.select().from(tests).where(eq(tests.hypothesisId, hip.id)).all().length;
        const test = {
          id: newId("tst"),
          hypothesisId: hip.id,
          workspaceId: input.workspaceId,
          varyantlar: JSON.stringify(varyantlar),
          olcut: sonuc.plan.olcut,
          olcutTipi: sonuc.plan.olcutPayi === "tiklama" ? "ctr" : "donusum", // eski okuyucular için yedek
          olcutPayi: sonuc.plan.olcutPayi,
          olcutPaydasi: sonuc.plan.olcutPaydasi,
          deneme: oncekiler + 1,
          temelOran: Math.round(sonuc.plan.temelOranYuzde * 100), // % → baz puan (2.0% → 200)
          mde: Math.round(sonuc.plan.mdeYuzdePuan * 100),
          minimumOrneklem: sonuc.minimumOrneklem,
          durum: "taslak",
          sonuc: sonuc.plan.butceNotu,
          createdAt: Date.now(),
        };
        db.insert(tests).values(test).run();
        logAjan(
          input.workspaceId,
          "testTasarimcisi",
          `Test plan — hypothesis: ${hip.iddia.slice(0, 120)}`,
          `A/B plan; min sample ${sonuc.minimumOrneklem} per arm; metric: ${sonuc.plan.olcut}`,
          sonuc.denetci.karar === "gecti" ? "gecti" : `reddedildi: ${sonuc.denetci.gerekce}`,
          sonuc.mod,
          sonuc.tokenSayisi,
        );
        return { test, varyantlar, mod: sonuc.mod, denetci: sonuc.denetci };
      }),

    testler: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const satirlar = db
          .select()
          .from(tests)
          .where(eq(tests.workspaceId, input.workspaceId))
          .orderBy(desc(tests.createdAt))
          .all();
        return satirlar.map((t) => ({
          ...t,
          varyantlar: JSON.parse(t.varyantlar || "[]"),
          sonuclar: db.select().from(testResults).where(eq(testResults.testId, t.id)).all(),
        }));
      }),

    // Test onaya gönderilir — durum makinesi zorlar
    testOnayaGonder: protectedProcedure
      .input(z.object({ workspaceId: z.string(), testId: z.string() }))
      .mutation(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        bellekOnayZorla(input.workspaceId);
        const t = db.select().from(tests).where(eq(tests.id, input.testId)).get();
        if (!t || t.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
        }
        gecisZorla("test", t.durum, "onayBekliyor");
        db.update(tests).set({ durum: "onayBekliyor" }).where(eq(tests.id, t.id)).run();
        return { ok: true };
      }),

    // İnsan onayı: test çalışmaya başlar (yalnız sahip/onaylayıcı)
    testOnayla: protectedProcedure
      .input(z.object({ workspaceId: z.string(), testId: z.string() }))
      .mutation(({ ctx, input }) => {
        onayYetkisiZorla(input.workspaceId, ctx.user.id);
        bellekOnayZorla(input.workspaceId);
        const t = db.select().from(tests).where(eq(tests.id, input.testId)).get();
        if (!t || t.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
        }
        gecisZorla("test", t.durum, "calisiyor");
        db.update(tests).set({ durum: "calisiyor", baslangic: Date.now() }).where(eq(tests.id, t.id)).run();
        logAjan(input.workspaceId, "denetci", "Test human approval", `${ctx.user.name} started test ${t.id}.`, "gecti", "insan");
        return { ok: true };
      }),

    // Sonuç girişi — manuel form (v2 Bölüm 2.4)
    // tarih verilirse (YYYY-MM-DD) aynı gün ikinci kez girilemez — CSV tekrarıyla
    // örneklem şişmesi kapatıldı (danışma turu 2, P0)
    sonucGir: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          testId: z.string(),
          varyantId: z.string().min(1),
          tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.").optional(),
          gosterim: z.number().int().min(0).max(100_000_000),
          tiklama: z.number().int().min(0).max(100_000_000),
          donusum: z.number().int().min(0).max(100_000_000),
        }),
      )
      .mutation(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const t = db.select().from(tests).where(eq(tests.id, input.testId)).get();
        if (!t || t.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
        }
        if (t.durum !== "calisiyor") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Results can only be entered while the test is running." });
        }
        if (input.tiklama > input.gosterim || input.donusum > input.gosterim) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Clicks/conversions cannot exceed impressions." });
        }
        const tarih = input.tarih ?? "";
        if (tarih) {
          const mevcut = db.select().from(testResults).where(eq(testResults.testId, t.id)).all();
          if (mevcut.some((r) => r.varyantId === input.varyantId && r.tarih === tarih)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Results for variant ${input.varyantId} on ${tarih} were already entered. A day cannot be entered twice — to correct it, contact support (reversal, not deletion, is the policy).`,
            });
          }
        }
        db.insert(testResults)
          .values({
            id: newId("res"),
            testId: t.id,
            varyantId: input.varyantId,
            tarih,
            gosterim: input.gosterim,
            tiklama: input.tiklama,
            donusum: input.donusum,
            kaynak: "manuel",
            girenKullanici: ctx.user.email,
            zaman: Date.now(),
          })
          .run();
        return { ok: true };
      }),

    // CSV şablonu — danışma turu 2: tarih kolonu zorunlu (günlük artış bildirimi)
    csvSablonu: protectedProcedure
      .input(z.object({ workspaceId: z.string(), testId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const t = db.select().from(tests).where(eq(tests.id, input.testId)).get();
        if (!t || t.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
        }
        const varyantlar = JSON.parse(t.varyantlar || "[]") as { id: string }[];
        const bugun = new Date().toISOString().slice(0, 10);
        const satirlar = varyantlar.map((v) => `${v.id},${bugun},0,0,0`);
        return { csv: `varyant_id,tarih,gosterim,tiklama,donusum\n${satirlar.join("\n")}\n` };
      }),

    // CSV toplu sonuç girişi — her satır bir günün ARTIŞIDIR (kümülatif anlık görüntü değil).
    // (test, varyant, tarih) tekil: aynı dosyayı iki kez yüklemek veriyi ikiye katlayamaz.
    csvSonucGir: protectedProcedure
      .input(z.object({ workspaceId: z.string(), testId: z.string(), csv: z.string().max(100_000) }))
      .mutation(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const t = db.select().from(tests).where(eq(tests.id, input.testId)).get();
        if (!t || t.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
        }
        if (t.durum !== "calisiyor") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Results can only be entered while the test is running." });
        }
        const mevcut = db.select().from(testResults).where(eq(testResults.testId, t.id)).all();
        const dosyaIcinde = new Set<string>();
        const TARIH_RE = /^\d{4}-\d{2}-\d{2}$/;
        const satirlar = input.csv.trim().split(/\r?\n/).slice(1); // başlık atlanır
        let eklenen = 0;
        for (const [i, satir] of satirlar.entries()) {
          if (!satir.trim()) continue;
          const [varyantId, tarih, gosterim, tiklama, donusum] = satir.split(",").map((p) => p.trim());
          const g = Number(gosterim), tk = Number(tiklama), d = Number(donusum);
          if (!varyantId || !TARIH_RE.test(tarih || "") || !Number.isInteger(g) || !Number.isInteger(tk) || !Number.isInteger(d) || g < 0 || tk < 0 || d < 0 || tk > g || d > g) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid CSV row ${i + 2}: "${satir}" (format: varyant_id,YYYY-MM-DD,gosterim,tiklama,donusum — daily increments)` });
          }
          const anahtar = `${varyantId}|${tarih}`;
          if (dosyaIcinde.has(anahtar) || mevcut.some((r) => r.varyantId === varyantId && r.tarih === tarih)) {
            throw new TRPCError({ code: "CONFLICT", message: `Row ${i + 2}: variant ${varyantId} for ${tarih} already exists. Re-uploading the same day is not allowed.` });
          }
          dosyaIcinde.add(anahtar);
          db.insert(testResults)
            .values({ id: newId("res"), testId: t.id, varyantId, tarih, gosterim: g, tiklama: tk, donusum: d, kaynak: "csv", girenKullanici: ctx.user.email, zaman: Date.now() })
            .run();
          eklenen++;
        }
        if (eklenen === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No valid data rows found in the CSV." });
        return { ok: true, eklenen };
      }),

    // Kazanan kararı — kod verir, LLM değil (v2 Bölüm 2.4)
    degerlendir: protectedProcedure
      .input(z.object({ workspaceId: z.string(), testId: z.string() }))
      .mutation(({ ctx, input }) => {
        onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const t = db.select().from(tests).where(eq(tests.id, input.testId)).get();
        if (!t || t.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
        }
        gecisZorla("test", t.durum, "tamamlandi"); // yalnız calisiyor → tamamlandi izinli; yetersizVeri aşağıda
        const varyantlar = JSON.parse(t.varyantlar || "[]") as { id: string; metin: string }[];
        const sonuclar = db.select().from(testResults).where(eq(testResults.testId, t.id)).all();
        // Pay/payda planlayıcıdan yapısal gelir (danışma turu 2); eski kayıtlar için olcutTipi/metin yedeği
        const pay = t.olcutPayi || (t.olcutTipi === "donusum" ? "donusum" : /click|ctr|tıklama/i.test(t.olcut || "") || t.olcutTipi === "ctr" ? "tiklama" : "donusum");
        const payda = t.olcutPaydasi || "gosterim";
        if (!payPaydaGecerliMi(pay, payda)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Invalid metric pair on the test plan: ${pay}/${payda}.` });
        }
        const sayac = (r: (typeof sonuclar)[number], alan: string) =>
          alan === "tiklama" ? r.tiklama : alan === "donusum" ? r.donusum : r.gosterim;
        const topla = (vid: string) => {
          const rows = sonuclar.filter((r) => r.varyantId === vid);
          return {
            varyantId: vid,
            gosterim: rows.reduce((a, r) => a + sayac(r, payda), 0), // z-testi paydası
            donusum: rows.reduce((a, r) => a + sayac(r, pay), 0), // z-testi payı
          };
        };
        const kontrol = topla("A");
        const varyant = topla("B");

        // Günlük yön tutarlılığı (danışma turu 2): tarihli satırlarda günlük kazanan yönü
        // karışıksa sonuç "zayıf" etiketi alır — hesap değişmez, dürüstlük katmanıdır.
        let zayifNotu = "";
        const tarihler = [...new Set(sonuclar.map((r) => r.tarih).filter(Boolean))].sort();
        if (tarihler.length >= 3) {
          const yonler = tarihler
            .map((gun) => {
              const gunSatir = sonuclar.filter((r) => r.tarih === gun);
              const aS = gunSatir.filter((r) => r.varyantId === "A");
              const bS = gunSatir.filter((r) => r.varyantId === "B");
              const aP = aS.reduce((x, r) => x + sayac(r, payda), 0);
              const bP = bS.reduce((x, r) => x + sayac(r, payda), 0);
              if (aP === 0 || bP === 0) return null;
              const aOran = aS.reduce((x, r) => x + sayac(r, pay), 0) / aP;
              const bOran = bS.reduce((x, r) => x + sayac(r, pay), 0) / bP;
              return aOran === bOran ? null : bOran > aOran ? "B" : "A";
            })
            .filter(Boolean);
          if (yonler.length >= 3 && new Set(yonler).size > 1) {
            zayifNotu = " WEAK: the daily winner direction flipped across days — treat this result with caution.";
          }
        }

        // Min örneklem dolmadan değerlendirme testi ÖLDÜRMEZ: durum calisiyor kalır,
        // veri girişi devam eder. (İç red-team bulgusu — Kapı 2 soru 1)
        if (kontrol.gosterim < t.minimumOrneklem || varyant.gosterim < t.minimumOrneklem) {
          const gerekce = `Minimum sample not reached (${t.minimumOrneklem} per arm). Current: ${kontrol.gosterim} vs ${varyant.gosterim}. Keep collecting data — the test stays running.`;
          return {
            durum: "calisiyor" as const,
            gerekce,
            oranlar: {
              A: kontrol.gosterim > 0 ? kontrol.donusum / kontrol.gosterim : 0,
              B: varyant.gosterim > 0 ? varyant.donusum / varyant.gosterim : 0,
            },
          };
        }

        const karar = kazananKarari(kontrol, varyant, t.minimumOrneklem);

        if (karar.tur === "yetersizVeri") {
          // calisiyor → yetersizVeri geçişi durum makinesinde izinli
          db.update(tests).set({ durum: "yetersizVeri", sonuc: karar.gerekce }).where(eq(tests.id, t.id)).run();
          logAjan(input.workspaceId, "denetci", `Test evaluation ${t.id}`, karar.gerekce, "uygulanamaz", "kod");
          return { durum: "yetersizVeri", gerekce: karar.gerekce, oranlar: karar.oranlar };
        }

        const kazananMetin = varyantlar.find((v) => v.id === karar.kazananVaryantId)?.metin ?? "";
        // Tekrarlanabilirlik (danışma turu 2, P1): kod sürümü + girdi hash'i + hesap anı kaydedilir
        const girdiHash = createHash("sha256")
          .update(JSON.stringify({ kontrol, varyant, min: t.minimumOrneklem, pay, payda }))
          .digest("hex")
          .slice(0, 16);
        const tekrar = ` [reproduce: stats v1.2 · α=0.05 two-sided · pair ${pay}/${payda} · input ${girdiHash} · ${new Date().toISOString()}]`;
        db.update(tests)
          .set({ durum: "tamamlandi", kazananVaryantId: karar.kazananVaryantId, pDegeri: Math.round(karar.pDegeri * 1e6), sonuc: `Winner: variant ${karar.kazananVaryantId} (p = ${karar.pDegeri.toFixed(4)})${zayifNotu}` })
          .where(eq(tests.id, t.id))
          .run();
        const kanit = {
          id: newId("evd"),
          workspaceId: input.workspaceId,
          testId: t.id,
          kazananMesaj: kazananMetin,
          ogrenim: `A/B test winner: variant ${karar.kazananVaryantId} — p = ${karar.pDegeri.toFixed(4)}, rates A=${(karar.oranlar.A * 100).toFixed(2)}%, B=${(karar.oranlar.B * 100).toFixed(2)}%. Metric: ${t.olcut} (${pay}/${payda}). Attempt #${t.deneme} for this hypothesis.${zayifNotu}${tekrar}`,
          disaAktarimFormati: "markdown",
          createdAt: Date.now(),
        };
        db.insert(evidenceFiles).values(kanit).run();
        // Kanıtlanmış mesaj Strateji Belleği'ne işlenir — danışman kararı (Kapı 1 soru 2):
        // metin KOPYALANMAZ; bellek kanıta referans taşır. Tek doğruluk kaynağı evidence_files'tır;
        // kanıt ileride geçersizleşirse bu bağlantı üzerinden bellek kaydı "itirazlı"ya düşürülebilir.
        const bellek = db.select().from(strategyBeliefs).where(eq(strategyBeliefs.workspaceId, input.workspaceId)).get();
        if (bellek) {
          const liste = JSON.parse(bellek.kanitlanmisMesajlar || "[]") as (string | { metin: string; kanitId: string; zaman: number })[];
          liste.push({ metin: kazananMetin, kanitId: kanit.id, zaman: Date.now() });
          db.update(strategyBeliefs)
            .set({ kanitlanmisMesajlar: JSON.stringify(liste), guncelleyen: "Evidence Engine (kod)", guncellemeZamani: Date.now(), surum: bellek.surum + 1 })
            .where(eq(strategyBeliefs.id, bellek.id))
            .run();
        }
        logAjan(input.workspaceId, "denetci", `Test evaluation ${t.id}`, kanit.ogrenim, "gecti", "kod");
        return { durum: "kazanan", kazananVaryantId: karar.kazananVaryantId, pDegeri: karar.pDegeri, oranlar: karar.oranlar, kanit };
      }),

    kanitlar: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return db.select().from(evidenceFiles).where(eq(evidenceFiles.workspaceId, input.workspaceId)).orderBy(desc(evidenceFiles.createdAt)).all();
      }),

    // Kanıt dosyası dışa aktarımı — markdown (kilitlenme karşıtı, v2 SSS)
    kanitDisaAktar: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        const { ws } = uyeZorla(input.workspaceId, ctx.user.id);
        const liste = db.select().from(evidenceFiles).where(eq(evidenceFiles.workspaceId, input.workspaceId)).orderBy(desc(evidenceFiles.createdAt)).all();
        const md = [
          `# Evidence file — ${ws.musteriAdi}`,
          `Exported: ${new Date().toISOString()}`,
          "",
          ...liste.flatMap((k) => [`## ${new Date(k.createdAt).toISOString().slice(0, 10)}`, "", `**Winning message:** ${k.kazananMesaj}`, "", k.ogrenim, ""]),
        ].join("\n");
        return { markdown: md };
      }),
  }),


  // ===== İcra Stüdyosu + Onay Merkezi (Aşama 3) ===========================
  // Danışma şartları: onay içerik hash'ine bağlı; düzenleme onayı bozar; ret nedeni
  // sabit listeden; her olay approval_events'e (rol + hash kopyasıyla) yazılır.
  icra: router({
    // Kanıtlanmış mesajdan 3 kanal varyasyonu üret (eposta/sosyal/reklam)
    varyasyonUret: protectedProcedure
      .input(z.object({ workspaceId: z.string(), evidenceId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const bellek = bellekOnayZorla(input.workspaceId);
        gunlukLlmSiniriZorla(input.workspaceId);
        const kanit = db.select().from(evidenceFiles).where(eq(evidenceFiles.id, input.evidenceId)).get();
        if (!kanit || kanit.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evidence file not found." });
        }
        const sonuc = await kanalVaryasyonlariUret(kanit.kazananMesaj, bellek);
        const simdi = Date.now();
        const gecti = sonuc.denetci.karar === "gecti";
        const ogeler = sonuc.paket.varyasyonlar.map((v) => {
          const govdeHash = createHash("sha256").update(`${v.kanal}|${v.baslik}|${v.govde}`).digest("hex");
          const item = {
            id: newId("cnt"),
            workspaceId: input.workspaceId,
            evidenceId: kanit.id,
            kanal: v.kanal,
            baslik: v.baslik,
            govde: v.govde,
            // Denetçi geçirdiyse doğrudan onay kuyruğunda; reddettiyse denetimde kalır
            durum: gecti ? "onayKuyrugu" : "denetimde",
            denetciNotu: gecti ? "" : sonuc.denetci.gerekce,
            govdeHash,
            kuyrugaGiris: gecti ? simdi : null,
            surum: 1,
            oncekiSurumId: null,
            createdAt: simdi,
          };
          db.insert(contentItems).values(item).run();
          return item;
        });
        logAjan(
          input.workspaceId,
          "icra",
          `Channel variations from evidence ${kanit.id}`,
          `${ogeler.length} items (${ogeler.map((o) => o.kanal).join(", ")})`,
          sonuc.denetci.karar === "gecti" ? "gecti" : `reddedildi: ${sonuc.denetci.gerekce}`,
          sonuc.mod,
          sonuc.tokenSayisi,
        );
        return { ogeler, mod: sonuc.mod, denetci: sonuc.denetci };
      }),

    icerikler: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return db
          .select()
          .from(contentItems)
          .where(eq(contentItems.workspaceId, input.workspaceId))
          .orderBy(desc(contentItems.createdAt))
          .all();
      }),

    // Düzenleme — danışma turu 1: onaylı içerik düzenlenirse onay geçersizleşir,
    // öğe onay kuyruğuna döner; olay kaydı "duzenleme-onayi-bozdu" ile yazılır.
    duzenle: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          icerikId: z.string(),
          baslik: z.string().trim().min(3),
          govde: z.string().trim().min(10),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { rol } = uyeZorla(input.workspaceId, ctx.user.id);
        const bellek = bellekOnayZorla(input.workspaceId);
        const item = db.select().from(contentItems).where(eq(contentItems.id, input.icerikId)).get();
        if (!item || item.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found." });
        }
        if (!["denetimde", "onayKuyrugu", "revize", "onayli"].includes(item.durum)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Content in "${item.durum}" state cannot be edited.` });
        }
        const yasakli = JSON.parse(bellek.yasakliIfadeler || "[]") as string[];
        const d = denetle({ metin: `${input.baslik} ${input.govde}`, yasakliIfadeler: yasakli });
        const hashTam = createHash("sha256").update(`${item.kanal}|${input.baslik}|${input.govde}`).digest("hex");
        const degisti = hashTam !== item.govdeHash;
        const simdi = Date.now();
        let yeniDurum = item.durum;
        if (item.durum === "onayli" && degisti) {
          gecisZorla("icerik", "onayli", "onayKuyrugu");
          yeniDurum = "onayKuyrugu";
          db.insert(approvalEvents)
            .values({
              id: newId("apr"),
              contentItemId: item.id,
              userId: ctx.user.id,
              eylem: "duzenleme-onayi-bozdu",
              not: "Approved content was edited; the previous approval is invalid for the new version.",
              govdeHash: item.govdeHash,
              rol,
              redNedeni: "",
              zaman: simdi,
            })
            .run();
        }
        if (item.durum === "denetimde" && d.karar === "gecti") {
          gecisZorla("icerik", "denetimde", "onayKuyrugu");
          yeniDurum = "onayKuyrugu";
        }
        if (item.durum === "revize" && d.karar === "gecti") {
          gecisZorla("icerik", "revize", "onayKuyrugu");
          yeniDurum = "onayKuyrugu";
        }
        db.update(contentItems)
          .set({
            baslik: input.baslik,
            govde: input.govde,
            govdeHash: hashTam,
            surum: item.surum + 1,
            durum: yeniDurum,
            denetciNotu: d.karar === "gecti" ? "" : d.gerekce,
            kuyrugaGiris: yeniDurum === "onayKuyrugu" && item.durum !== "onayKuyrugu" ? simdi : item.kuyrugaGiris,
          })
          .where(eq(contentItems.id, item.id))
          .run();
        return { ok: true, durum: yeniDurum, surum: item.surum + 1, denetci: d };
      }),
  }),

  onay: router({
    // Tekil onay kuyruğu — toplu/kör onay yok (v2 vaadi)
    kuyruk: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return db
          .select()
          .from(contentItems)
          .where(and(eq(contentItems.workspaceId, input.workspaceId), eq(contentItems.durum, "onayKuyrugu")))
          .orderBy(contentItems.kuyrugaGiris)
          .all();
      }),

    onayla: protectedProcedure
      .input(z.object({ workspaceId: z.string(), icerikId: z.string() }))
      .mutation(({ ctx, input }) => {
        const { rol } = onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const item = db.select().from(contentItems).where(eq(contentItems.id, input.icerikId)).get();
        if (!item || item.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found." });
        }
        gecisZorla("icerik", item.durum, "onayli");
        db.update(contentItems).set({ durum: "onayli" }).where(eq(contentItems.id, item.id)).run();
        db.insert(approvalEvents)
          .values({
            id: newId("apr"),
            contentItemId: item.id,
            userId: ctx.user.id,
            eylem: "onay",
            not: "",
            govdeHash: item.govdeHash, // onay bu sürüme bağlı — sonraki düzenleme onayı bozar
            rol,
            redNedeni: "",
            zaman: Date.now(),
          })
          .run();
        return { ok: true };
      }),

    reddet: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          icerikId: z.string(),
          redNedeni: z.enum(["ton", "yanlis-bilgi", "marka-disi", "hukuki-risk", "diger"]),
          not: z.string().max(500).optional(),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { rol } = onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const item = db.select().from(contentItems).where(eq(contentItems.id, input.icerikId)).get();
        if (!item || item.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found." });
        }
        gecisZorla("icerik", item.durum, "reddedildi");
        db.update(contentItems).set({ durum: "reddedildi" }).where(eq(contentItems.id, item.id)).run();
        db.insert(approvalEvents)
          .values({ id: newId("apr"), contentItemId: item.id, userId: ctx.user.id, eylem: "red", not: input.not ?? "", govdeHash: item.govdeHash, rol, redNedeni: input.redNedeni, zaman: Date.now() })
          .run();
        return { ok: true };
      }),

    revizeIste: protectedProcedure
      .input(z.object({ workspaceId: z.string(), icerikId: z.string(), not: z.string().trim().min(3, "A revision note is required.").max(500) }))
      .mutation(({ ctx, input }) => {
        const { rol } = onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const item = db.select().from(contentItems).where(eq(contentItems.id, input.icerikId)).get();
        if (!item || item.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found." });
        }
        gecisZorla("icerik", item.durum, "revize");
        db.update(contentItems).set({ durum: "revize" }).where(eq(contentItems.id, item.id)).run();
        db.insert(approvalEvents)
          .values({ id: newId("apr"), contentItemId: item.id, userId: ctx.user.id, eylem: "revize", not: input.not, govdeHash: item.govdeHash, rol, redNedeni: "", zaman: Date.now() })
          .run();
        return { ok: true };
      }),

    // Yayın paketi — yalnızca onay hash'i GÜNCEL içerikle birebir eşleşen öğeler girer
    paketOlustur: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(({ ctx, input }) => {
        onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const onaylilar = db
          .select()
          .from(contentItems)
          .where(and(eq(contentItems.workspaceId, input.workspaceId), eq(contentItems.durum, "onayli")))
          .all();
        if (onaylilar.length === 0) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "There are no approved items to package." });
        }
        const uyumsuz: string[] = [];
        for (const item of onaylilar) {
          const sonOnay = db
            .select()
            .from(approvalEvents)
            .where(eq(approvalEvents.contentItemId, item.id))
            .orderBy(desc(approvalEvents.zaman))
            .all()
            .find((e) => e.eylem === "onay");
          if (!sonOnay || sonOnay.govdeHash !== item.govdeHash) uyumsuz.push(item.id);
        }
        if (uyumsuz.length > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `${uyumsuz.length} item(s) were edited after approval — they need re-approval before packaging.`,
          });
        }
        const simdi = Date.now();
        const paket = {
          id: newId("pkg"),
          workspaceId: input.workspaceId,
          ogeler: JSON.stringify(onaylilar.map((o) => ({ id: o.id, kanal: o.kanal, baslik: o.baslik, govde: o.govde, govdeHash: o.govdeHash }))),
          olusturan: ctx.user.email,
          olusturmaZamani: simdi,
          disaAktarimAnahtari: randomBytes(8).toString("hex"),
        };
        db.insert(publishPackages).values(paket).run();
        for (const item of onaylilar) {
          gecisZorla("icerik", "onayli", "paketlendi");
          db.update(contentItems).set({ durum: "paketlendi" }).where(eq(contentItems.id, item.id)).run();
          db.insert(approvalEvents)
            .values({ id: newId("apr"), contentItemId: item.id, userId: ctx.user.id, eylem: "paketlendi", not: `Package ${paket.id}`, govdeHash: item.govdeHash, rol: "", redNedeni: "", zaman: simdi })
            .run();
        }
        return { paket, adet: onaylilar.length };
      }),

    paketler: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return db
          .select()
          .from(publishPackages)
          .where(eq(publishPackages.workspaceId, input.workspaceId))
          .orderBy(desc(publishPackages.olusturmaZamani))
          .all();
      }),

    gecmis: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const olaylar = db.select().from(approvalEvents).orderBy(desc(approvalEvents.zaman)).all();
        const icerikler = db.select().from(contentItems).where(eq(contentItems.workspaceId, input.workspaceId)).all();
        const wsIds = new Set(icerikler.map((i) => i.id));
        return olaylar.filter((o) => wsIds.has(o.contentItemId)).slice(0, 100);
      }),
  }),

  // ===== Aşama 5 — Yayın Planı =====
  // v1: platform HİÇBİR hesapta işlem yapmaz. Plan + dışa aktarım + "yayınlandı
  // (manuel)" işareti tutulur; otomatik yayın v1.1 hedefidir (v2 Bölüm 3, kural 274).
  yayinPlani: router({
    // Onaylı/paketlenmiş içerikler — plana eklenmeye aday liste
    planlanabilir: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const icerikler = db
          .select()
          .from(contentItems)
          .where(eq(contentItems.workspaceId, input.workspaceId))
          .all()
          .filter((i) => i.durum === "onayli" || i.durum === "paketlendi");
        const aktifPlanlar = db
          .select()
          .from(publishPlanItems)
          .where(eq(publishPlanItems.workspaceId, input.workspaceId))
          .all()
          .filter((p) => p.durum !== "iptal");
        const planHarita = new Map(aktifPlanlar.map((p) => [p.contentItemId, p.id]));
        return icerikler.map((i) => ({
          id: i.id,
          kanal: i.kanal,
          baslik: i.baslik,
          durum: i.durum,
          aktifPlanId: planHarita.get(i.id) ?? null,
        }));
      }),

    planla: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          contentItemId: z.string(),
          planlananTarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-mm-dd."),
          not: z.string().trim().max(500).optional().default(""),
        }),
      )
      .mutation(({ ctx, input }) => {
        onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const bugun = new Date();
        const bugunStr = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, "0")}-${String(bugun.getDate()).padStart(2, "0")}`;
        if (input.planlananTarih < bugunStr) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "The planned date cannot be in the past." });
        }
        const item = db.select().from(contentItems).where(eq(contentItems.id, input.contentItemId)).get();
        if (!item || item.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found." });
        }
        if (item.durum !== "onayli" && item.durum !== "paketlendi") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Only approved or packaged content can be added to the publish plan.",
          });
        }
        const aktifPlan = db
          .select()
          .from(publishPlanItems)
          .where(eq(publishPlanItems.contentItemId, input.contentItemId))
          .all()
          .find((p) => p.durum !== "iptal");
        if (aktifPlan) {
          throw new TRPCError({ code: "CONFLICT", message: "This item already has an active publish plan." });
        }
        const simdi = Date.now();
        const satir = {
          id: newId("plan"),
          workspaceId: input.workspaceId,
          contentItemId: item.id,
          kanal: item.kanal, // kanal her zaman içerikten alınır, istemci girişinden asla
          planlananTarih: input.planlananTarih,
          durum: "planlandi",
          not: input.not,
          olusturan: ctx.user.email,
          createdAt: simdi,
          updatedAt: simdi,
        };
        db.insert(publishPlanItems).values(satir).run();
        db.insert(approvalEvents)
          .values({ id: newId("apr"), contentItemId: item.id, userId: ctx.user.id, eylem: "yayin-planlandi", not: `Plan ${satir.id} → ${input.planlananTarih}`, govdeHash: item.govdeHash, rol: "", redNedeni: "", zaman: simdi })
          .run();
        return satir;
      }),

    liste: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const planlar = db
          .select()
          .from(publishPlanItems)
          .where(eq(publishPlanItems.workspaceId, input.workspaceId))
          .orderBy(asc(publishPlanItems.planlananTarih), desc(publishPlanItems.createdAt))
          .all();
        const icerikHarita = new Map(
          db.select().from(contentItems).where(eq(contentItems.workspaceId, input.workspaceId)).all().map((i) => [i.id, i]),
        );
        return planlar.map((p) => {
          const item = icerikHarita.get(p.contentItemId);
          return { ...p, baslik: item?.baslik ?? "", govdeHash: item?.govdeHash ?? "", icerikDurum: item?.durum ?? "" };
        });
      }),

    // Dışa aktarım gerçekten sunucuda üretilir — bu yüzden "disaAktarildi" geçişi
    // burada, kullanıcı beyanına değil fiili olaya bağlıdır.
    disariAktar: protectedProcedure
      .input(z.object({ workspaceId: z.string(), planId: z.string() }))
      .mutation(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const plan = db.select().from(publishPlanItems).where(eq(publishPlanItems.id, input.planId)).get();
        if (!plan || plan.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Plan item not found." });
        }
        if (plan.durum === "iptal") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A cancelled plan cannot be exported." });
        }
        const item = db.select().from(contentItems).where(eq(contentItems.id, plan.contentItemId)).get();
        if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Content item not found." });
        const kanalAd = { eposta: "Email", sosyal: "Social", reklam: "Ad" }[plan.kanal] ?? plan.kanal;
        const metin = [
          `Channel: ${kanalAd}`,
          item.baslik ? `Title: ${item.baslik}` : "",
          `Planned date: ${plan.planlananTarih}`,
          "---",
          item.govde,
          "---",
          "You publish this in your own account. The platform never posts on your behalf.",
        ]
          .filter(Boolean)
          .join("\n");
        const simdi = Date.now();
        if (plan.durum === "planlandi") {
          gecisZorla("yayinPlani", "planlandi", "disaAktarildi");
          db.update(publishPlanItems).set({ durum: "disaAktarildi", updatedAt: simdi }).where(eq(publishPlanItems.id, plan.id)).run();
          db.insert(approvalEvents)
            .values({ id: newId("apr"), contentItemId: item.id, userId: ctx.user.id, eylem: "yayin-disaAktarildi", not: `Plan ${plan.id}`, govdeHash: item.govdeHash, rol: "", redNedeni: "", zaman: simdi })
            .run();
        }
        return { metin, durum: plan.durum === "planlandi" ? "disaAktarildi" : plan.durum };
      }),

    durumGuncelle: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          planId: z.string(),
          hedef: z.enum(["planlandi", "disaAktarildi", "yayinlandiManuel", "iptal"]),
          not: z.string().trim().max(500).optional().default(""),
        }),
      )
      .mutation(({ ctx, input }) => {
        onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const plan = db.select().from(publishPlanItems).where(eq(publishPlanItems.id, input.planId)).get();
        if (!plan || plan.workspaceId !== input.workspaceId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Plan item not found." });
        }
        gecisZorla("yayinPlani", plan.durum, input.hedef);
        const item = db.select().from(contentItems).where(eq(contentItems.id, plan.contentItemId)).get();
        const simdi = Date.now();
        db.update(publishPlanItems)
          .set({ durum: input.hedef, not: input.not || plan.not, updatedAt: simdi })
          .where(eq(publishPlanItems.id, plan.id))
          .run();
        db.insert(approvalEvents)
          .values({ id: newId("apr"), contentItemId: plan.contentItemId, userId: ctx.user.id, eylem: `yayin-${input.hedef}`, not: input.not || `Plan ${plan.id}`, govdeHash: item?.govdeHash ?? "", rol: "", redNedeni: "", zaman: simdi })
          .run();
        return { id: plan.id, durum: input.hedef };
      }),
  }),

  // ===== Aşama 4 — Sinyal Radarı =====
  // Analist salt-okur; eskime alarmı kuralı kodda (kanıt 30+ gün VEYA rakip
  // taramasında hash değişimi + %20'yi aşan metin farkı). Otomatik zamanlama
  // YOK — README'de açık; yenileme kullanıcı düğmesiyle tetiklenir.
  radar: router({
    sinyaller: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        return db
          .select()
          .from(signals)
          .where(eq(signals.workspaceId, input.workspaceId))
          .orderBy(desc(signals.createdAt))
          .all()
          .slice(0, 100);
      }),

    // Haftalık "ne öğrendik" özeti — Analist (LLM veya simülasyon)
    // Dönem filtresi gerçek: yalnız son 7 günün kanıt ve testleri okunur;
    // dönem sınırları sinyal içeriğine yazılır.
    ozetUret: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { ws } = uyeZorla(input.workspaceId, ctx.user.id);
        bellekOnayZorla(input.workspaceId);
        gunlukLlmSiniriZorla(input.workspaceId);
        const simdi = Date.now();
        const donemBaslangic = simdi - 7 * 24 * 60 * 60 * 1000;
        const kanitlar = db
          .select()
          .from(evidenceFiles)
          .where(and(eq(evidenceFiles.workspaceId, input.workspaceId), gte(evidenceFiles.createdAt, donemBaslangic)))
          .orderBy(desc(evidenceFiles.createdAt))
          .all()
          .slice(0, 10);
        const testler = db
          .select()
          .from(tests)
          .where(and(eq(tests.workspaceId, input.workspaceId), gte(tests.createdAt, donemBaslangic)))
          .orderBy(desc(tests.createdAt))
          .all()
          .slice(0, 20);
        const icerikler = db.select().from(contentItems).where(eq(contentItems.workspaceId, input.workspaceId)).all();
        const icerikSayilari: Record<string, number> = {};
        for (const c of icerikler) icerikSayilari[c.durum] = (icerikSayilari[c.durum] ?? 0) + 1;
        const sonuc = await haftalikOzetUret({
          musteriAdi: ws.musteriAdi,
          kanitlar: kanitlar.map((k) => ({ kazananMesaj: k.kazananMesaj, ogrenim: k.ogrenim, createdAt: k.createdAt })),
          testler: testler.map((t) => ({ olcut: t.olcut, durum: t.durum, sonuc: t.sonuc, pDegeri: t.pDegeri, deneme: t.deneme })),
          icerikSayilari,
        });
        const sinyal = {
          id: newId("sgn"),
          workspaceId: input.workspaceId,
          tip: "haftalikOzet",
          icerik: JSON.stringify({
            ...sonuc.ozet,
            mod: sonuc.mod,
            donem: { baslangic: donemBaslangic, bitis: simdi },
            donemdeVeriVar: kanitlar.length > 0 || testler.length > 0,
          }),
          okundu: 0,
          durum: "acik",
          ertelemeBitis: null,
          createdAt: simdi,
        };
        db.insert(signals).values(sinyal).run();
        logAjan(
          input.workspaceId,
          "analist",
          `Weekly brief: ${kanitlar.length} evidence file(s), ${testler.length} test(s)`,
          sonuc.ozet.ozet,
          "uygulanamaz",
          sonuc.mod,
          sonuc.tokenSayisi,
        );
        return sinyal;
      }),

    // Eskime kontrolü — kullanıcı düğmesiyle ("Şimdi yeniden tara"); cron yok.
    // Karşılaştırma KABUL EDİLMİŞ ESAS kayda yapılır (kademeli drift kapatıldı);
    // alarm ateşlenince yeni tarama yeni esas olur. Dedupe: açık/ertelenmiş alarm
    // veya son 30 gün içinde aynı referansa açılmış alarm varken yenisi açılmaz.
    eskimeKontrol: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        bellekOnayZorla(input.workspaceId);
        const simdi = Date.now();
        const eskiAlarmlar: AlarmKaydi[] = db
          .select()
          .from(signals)
          .where(and(eq(signals.workspaceId, input.workspaceId), eq(signals.tip, "eskimeAlarmi")))
          .all()
          .map((s) => {
            let referansId = "";
            try {
              referansId = (JSON.parse(s.icerik) as { referansId?: string }).referansId ?? "";
            } catch {
              /* eski kayıt */
            }
            return { referansId, durum: s.durum, ertelemeBitis: s.ertelemeBitis, createdAt: s.createdAt };
          });
        const yeniAlarmlar: string[] = [];
        const alarmYaz = (baslik: string, govde: string, referansId: string) => {
          db.insert(signals)
            .values({
              id: newId("sgn"),
              workspaceId: input.workspaceId,
              tip: "eskimeAlarmi",
              icerik: JSON.stringify({ baslik, govde, referansId }),
              okundu: 0,
              durum: "acik",
              ertelemeBitis: null,
              createdAt: simdi,
            })
            .run();
          eskiAlarmlar.push({ referansId, durum: "acik", ertelemeBitis: null, createdAt: simdi });
          yeniAlarmlar.push(referansId);
        };

        // Kural 1: kanıt dosyasındaki mesaj 30+ gündür yenilenmediyse
        const kanitlar = db.select().from(evidenceFiles).where(eq(evidenceFiles.workspaceId, input.workspaceId)).all();
        for (const k of kanitlar) {
          if (kanitAlarmiGerekirMi({ id: k.id, createdAt: k.createdAt }, eskiAlarmlar, simdi)) {
            const yas = Math.floor((simdi - k.createdAt) / (24 * 60 * 60 * 1000));
            alarmYaz(
              "Positioning staleness: proven message is getting old",
              `"${k.kazananMesaj.slice(0, 140)}" has not been refreshed for ${yas} days. Markets move — re-test this claim against a new challenger.`,
              k.id,
            );
          }
        }

        // Kural 2: sayfa, ESAS kaydından %20'den fazla uzaklaştıysa
        const anliklar = db
          .select()
          .from(crawlSnapshots)
          .where(eq(crawlSnapshots.workspaceId, input.workspaceId))
          .orderBy(desc(crawlSnapshots.zaman))
          .all();
        const esasByUrl = new Map<string, (typeof anliklar)[number]>();
        for (const s of anliklar) {
          if (!esasByUrl.has(s.url)) {
            // en yeni→eski geziyoruz; esas=1 olan ilk kayıt esastır, yoksa en eski kayıt
            const adaylar = anliklar.filter((x) => x.url === s.url);
            esasByUrl.set(s.url, adaylar.find((x) => x.esas === 1) ?? adaylar[adaylar.length - 1]);
          }
        }
        let taranan = 0;
        const taramaHatalari: string[] = [];
        for (const [url, esas] of esasByUrl) {
          try {
            const scan = await scanUrl(url);
            taranan++;
            if (!scan.metin) continue;
            const yeniHash = createHash("sha256").update(scan.metin).digest("hex");
            const { gerek, fark } = taramaAlarmiGerekirMi(
              { hash: esas.hash, metin: esas.metin },
              { hash: yeniHash, metin: scan.metin },
              metinFarkiYuzde,
            );
            if (yeniHash === esas.hash) continue;
            if (gerek && alarmAcilabilirMi(url, eskiAlarmlar, simdi)) {
              // Alarm → yeni tarama yeni esas olur (alarm sonrası taban sıfırlanır)
              db.update(crawlSnapshots)
                .set({ esas: 0 })
                .where(and(eq(crawlSnapshots.workspaceId, input.workspaceId), eq(crawlSnapshots.url, url)))
                .run();
              db.insert(crawlSnapshots)
                .values({ id: newId("crw"), workspaceId: input.workspaceId, url: scan.finalUrl, tip: esas.tip, metin: scan.metin, hash: yeniHash, esas: 1, zaman: simdi })
                .run();
              alarmYaz(
                `${esas.tip === "rakip" ? "Competitor" : "Product"} page changed: ${url}`,
                `The page text moved ${Math.round(fark * 100)}% away from the accepted baseline. If the competitor repositioned, your proven messages may need a fresh look.`,
                url,
              );
            } else {
              // Eşik altı değişim: tarihçeye işlenir ama esas YERİNDE kalır —
              // küçük adımlar birikimli olarak esastan uzaklaşmayı görünmez kılamaz.
              db.insert(crawlSnapshots)
                .values({ id: newId("crw"), workspaceId: input.workspaceId, url: scan.finalUrl, tip: esas.tip, metin: scan.metin, hash: yeniHash, esas: 0, zaman: simdi })
                .run();
            }
          } catch (e) {
            taramaHatalari.push(`${url}: ${e instanceof Error ? e.message : "scan failed"}`);
          }
        }
        logAjan(
          input.workspaceId,
          "analist",
          `Staleness check: ${kanitlar.length} evidence file(s), ${esasByUrl.size} URL(s)`,
          `${yeniAlarmlar.length} new alarm(s)${taramaHatalari.length ? `; ${taramaHatalari.length} scan error(s)` : ""}`,
          "uygulanamaz",
          "yerel",
        );
        return { yeniAlarm: yeniAlarmlar.length, tarananUrl: taranan, taramaHatalari };
      }),

    // Rakip sayfası kaydı — eskime alarmının karşılaştırma tabanını kurar
    rakipEkle: protectedProcedure
      .input(z.object({ workspaceId: z.string(), url: z.string().trim().min(4).max(500) }))
      .mutation(async ({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        bellekOnayZorla(input.workspaceId);
        const scan = await scanUrl(input.url);
        if (!scan.metin) {
          throw new TRPCError({ code: "BAD_REQUEST", message: scan.not || "No text could be extracted from this URL." });
        }
        db.insert(crawlSnapshots)
          .values({
            id: newId("crw"),
            workspaceId: input.workspaceId,
            url: scan.finalUrl,
            tip: "rakip",
            metin: scan.metin,
            hash: createHash("sha256").update(scan.metin).digest("hex"),
            esas: 1, // bu kayıt karşılaştırma tabanıdır — drift buradan ölçülür
            zaman: Date.now(),
          })
          .run();
        logAjan(input.workspaceId, "arastirmaci", `Competitor baseline: ${input.url}`, `${scan.metin.length} characters. Title: ${scan.title}`, "uygulanamaz", "tarama");
        return { ok: true, url: scan.finalUrl, title: scan.title };
      }),

    okundu: protectedProcedure
      .input(z.object({ workspaceId: z.string(), sinyalId: z.string() }))
      .mutation(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        db.update(signals)
          .set({ okundu: 1, durum: "okundu" })
          .where(and(eq(signals.id, input.sinyalId), eq(signals.workspaceId, input.workspaceId)))
          .run();
        return { ok: true };
      }),

    // Alarm yaşam döngüsü: ertelendi (7 gün susar) / çözüldü (yeniden doğrulama kaydı)
    sinyalDurum: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          sinyalId: z.string(),
          durum: z.enum(["okundu", "ertelendi", "cozuldu"]),
        }),
      )
      .mutation(({ ctx, input }) => {
        uyeZorla(input.workspaceId, ctx.user.id);
        const simdi = Date.now();
        db.update(signals)
          .set({
            durum: input.durum,
            okundu: 1,
            ertelemeBitis: input.durum === "ertelendi" ? simdi + ERTELEME_GUN * 24 * 60 * 60 * 1000 : null,
          })
          .where(and(eq(signals.id, input.sinyalId), eq(signals.workspaceId, input.workspaceId)))
          .run();
        return { ok: true };
      }),
  }),

  // ===== Bölüm 15.2 — Ulaşım hazırlık listesi (yalnız platform sahibi) =====
  // Hiçbir e-posta otomatik gönderilmez; taslak kopyala-yapıştır içindir.
  ulasim: router({
    listele: protectedProcedure.query(({ ctx }) => {
      if (!platformSahibiMi(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This screen is visible only to the platform owner." });
      }
      const satirlar = db.select().from(outreachDrafts).orderBy(desc(outreachDrafts.createdAt)).all();
      const basvurular = new Set(db.select().from(pilotApplications).all().map((p) => p.eposta));
      // Otomatik eşleşme: e-posta pilot_applications'ta varsa durum "pilot-basvurdu"
      for (const s of satirlar) {
        if (s.eposta && s.durum !== "pilot-basvurdu" && basvurular.has(s.eposta.toLocaleLowerCase("en"))) {
          db.update(outreachDrafts).set({ durum: "pilot-basvurdu" }).where(eq(outreachDrafts.id, s.id)).run();
          s.durum = "pilot-basvurdu";
        }
      }
      return satirlar;
    }),

    ekle: protectedProcedure
      .input(
        z.object({
          url: z.string().trim().min(4, "URL is required.").max(500),
          ajansAdi: z.string().trim().max(200).optional().default(""),
          eposta: z.string().trim().regex(EPOSTA_RE, "Enter a valid email address.").optional().or(z.literal("")).default(""),
        }),
      )
      .mutation(({ ctx, input }) => {
        if (!platformSahibiMi(ctx.user.email)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This screen is visible only to the platform owner." });
        }
        // v2 Bölüm 15.2: yalnız kurumsal genel iletişim adresi — kişisel alan adları reddedilir
        if (input.eposta && kisiselEpostaMi(input.eposta)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only corporate contact addresses are accepted (e.g. hello@agency.com). Personal addresses (Gmail, Outlook, Yahoo…) are not collected.",
          });
        }
        const satir = {
          id: newId("out"),
          url: input.url,
          ajansAdi: input.ajansAdi,
          eposta: input.eposta.toLocaleLowerCase("en"),
          konu: "",
          taslak: "",
          raporOzeti: "",
          durum: "taslak",
          createdAt: Date.now(),
        };
        db.insert(outreachDrafts).values(satir).run();
        return satir;
      }),

    // Siteyi tarar, mesaj haritasını çıkarır, kişiselleştirilmiş e-posta TASLAĞI yazar (gönderim yok)
    taslakUret: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!platformSahibiMi(ctx.user.email)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This screen is visible only to the platform owner." });
        }
        const satir = db.select().from(outreachDrafts).where(eq(outreachDrafts.id, input.id)).get();
        if (!satir) throw new TRPCError({ code: "NOT_FOUND", message: "Row not found." });
        const scan = await scanUrl(satir.url);
        if (!scan.metin) {
          throw new TRPCError({ code: "BAD_REQUEST", message: scan.not || "No text could be extracted from this URL." });
        }
        const { harita, mod } = await mesajHaritasiUret(scan.title, scan.metin);
        const ad = satir.ajansAdi || scan.title || satir.url;
        const konu = `Your homepage's main claim, mapped — ${ad}`;
        const taslak = [
          `Hello,`,
          ``,
          `I ran your site through our message-mapping tool. Your main claim reads as: "${harita.anaIddia}".`,
          harita.eksikKanitlar.length > 0
            ? `The evidence gap that stood out most: ${harita.eksikKanitlar[0]}.`
            : `Your evidence base looks unusually complete — the opportunity is testing which proof converts best.`,
          ``,
          `We built Konum so agencies can offer this kind of evidence-first positioning to their own clients, under their own brand. Happy to send the full one-page map (score: ${harita.skor}/100) or walk you through it in 15 minutes.`,
          ``,
          `Best regards`,
        ].join("\n");
        db.update(outreachDrafts)
          .set({
            konu,
            taslak,
            raporOzeti: JSON.stringify({ anaIddia: harita.anaIddia, skor: harita.skor, eksikKanitlar: harita.eksikKanitlar, mod }),
          })
          .where(eq(outreachDrafts.id, satir.id))
          .run();
        return { ok: true, mod };
      }),

    durumGuncelle: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          durum: z.enum(["taslak", "gonderildi-manuel", "yanit-geldi", "pilot-basvurdu"]),
        }),
      )
      .mutation(({ ctx, input }) => {
        if (!platformSahibiMi(ctx.user.email)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This screen is visible only to the platform owner." });
        }
        db.update(outreachDrafts).set({ durum: input.durum }).where(eq(outreachDrafts.id, input.id)).run();
        return { ok: true };
      }),
  }),

  // ===== /teshis — ücretsiz Mesaj Haritası (v2 Bölüm 15) =====
  // Limitler [DV]: IP başına 3/gün, global 100/gün. E-posta isteğe bağlı + rıza.
  teshis: router({
    olustur: publicProcedure
      .input(
        z.object({
          url: z.string().trim().min(4, "URL is required.").max(500),
          eposta: z.string().trim().regex(EPOSTA_RE, "Enter a valid email address.").optional().or(z.literal("")),
          riza: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (input.eposta && !input.riza) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Storing your email requires consent." });
        }
        const gunBaslangic = new Date();
        gunBaslangic.setHours(0, 0, 0, 0);
        const bugun = db.select().from(diagnosisRequests).where(gte(diagnosisRequests.zaman, gunBaslangic.getTime())).all();
        if (bugun.length >= 100) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "The daily free analysis capacity is full (100/day). Please try tomorrow." });
        }
        const ipHash = gunlukIpHash(ctx.ip); // HMAC + günlük tuz + IPv6 /64 (danışma turu 2)
        const ipSayisi = bugun.filter((r) => r.ipHash === ipHash).length;
        if (ipSayisi >= 3) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You have used today's 3 free analyses. Please try tomorrow." });
        }

        let scan: Awaited<ReturnType<typeof scanUrl>>;
        try {
          scan = await scanUrl(input.url);
        } catch (e) {
          if (e instanceof SsrfError) {
            throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
          }
          throw e;
        }
        if (!scan.metin || scan.metin.length < 100) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: scan.robotsIzni
              ? "Not enough text could be extracted from this page for a meaningful analysis."
              : "This site's robots.txt does not allow scanning.",
          });
        }
        const sonuc = await mesajHaritasiUret(scan.title, scan.metin);
        // Tahmin edilemez rapor kimliği (danışma turu 2): 64-bit kriptografik rastgele
        const id = `tsh_${randomBytes(8).toString("hex")}`;
        db.insert(diagnosisRequests)
          .values({
            id,
            url: scan.finalUrl,
            eposta: input.eposta ? input.eposta.toLocaleLowerCase("en") : null,
            rapor: JSON.stringify({ ...sonuc.harita, baslik: scan.title, mod: sonuc.mod }),
            ipHash,
            zaman: Date.now(),
          })
          .run();
        return { id, harita: sonuc.harita, baslik: scan.title, mod: sonuc.mod };
      }),

    getir: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
      const r = db.select().from(diagnosisRequests).where(eq(diagnosisRequests.id, input.id)).get();
      if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      const parsed = JSON.parse(r.rapor || "{}") as Record<string, unknown>;
      return { id: r.id, url: r.url, zaman: r.zaman, ...parsed };
    }),
  }),

  ayarlar: router({
    entegrasyonlar: protectedProcedure.query(() => entegrasyonlar),

    // LLM key status — the key itself is never returned, only its presence
    llmDurumu: protectedProcedure.query(({ ctx }) => {
      if (!platformSahibiMi(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This setting is only available to the platform owner." });
      }
      const { kaynak } = anthropicAnahtari();
      return {
        saglayici: llmSaglayici(),
        model: "claude-haiku-5-5",
        anahtarKaynagi: kaynak, // env | dosya | yok
        aktifMod: llmAktifMi() ? ("llm" as const) : ("simulasyon" as const),
      };
    }),

    // The key is written to a secret file outside the project on the server; never shown again (Cem's decision).
    // Before it is trusted, a live test call verifies it — a rejected key is deleted again,
    // otherwise the system would silently stay in simulation mode forever.
    llmAnahtariKaydet: protectedProcedure
      .input(z.object({ anahtar: z.string().trim().min(10, "The key looks too short.") }))
      .mutation(async ({ ctx, input }) => {
        if (!platformSahibiMi(ctx.user.email)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This setting is only available to the platform owner." });
        }
        anthropicAnahtariYaz(input.anahtar);
        const d = await anahtariDogrula(input.anahtar);
        if (d.sonuc === "gecersiz") {
          anthropicAnahtariSil();
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `The key was not saved: ${d.mesaj} Check it and paste again.`,
          });
        }
        return {
          ok: true,
          dogrulama: d.sonuc === "gecerli" ? ("gecerli" as const) : ("dogrulanamadi" as const),
          mesaj: d.mesaj,
        };
      }),

    llmAnahtariKaldir: protectedProcedure.mutation(({ ctx }) => {
      if (!platformSahibiMi(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This setting is only available to the platform owner." });
      }
      anthropicAnahtariSil();
      return { ok: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
