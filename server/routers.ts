import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "node:crypto";
import { desc, eq, gte } from "drizzle-orm";
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
  crawlSnapshots,
  diagnosisRequests,
  evidenceFiles,
  hypotheses,
  organizations,
  pilotApplications,
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
import { gecisZorla } from "./durum";
import { kazananKarari, payPaydaGecerliMi } from "./stats";
import { gunlukIpHash } from "./guvenlik";
import {
  anthropicAnahtari,
  anthropicAnahtariSil,
  anthropicAnahtariYaz,
  platformSahibiMi,
} from "./config";
import { llmAktifMi, llmSaglayici } from "./agents/llm";

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
        return { ...ws!, rol: u.rol, bellekDurumu: bellek?.onayDurumu ?? "yok" };
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
          taramaMetni: z.string().max(12000),
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

    // The key is written to a secret file outside the project on the server; never shown again (Cem's decision)
    llmAnahtariKaydet: protectedProcedure
      .input(z.object({ anahtar: z.string().trim().min(10, "The key looks too short.") }))
      .mutation(({ ctx, input }) => {
        if (!platformSahibiMi(ctx.user.email)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This setting is only available to the platform owner." });
        }
        anthropicAnahtariYaz(input.anahtar);
        return { ok: true };
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
