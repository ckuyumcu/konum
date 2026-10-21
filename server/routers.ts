import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";
import { desc, eq, and, gte } from "drizzle-orm";
import {
  router,
  publicProcedure,
  protectedProcedure,
  uyeZorla,
  onayYetkisiZorla,
} from "./trpc";
import { db, newId } from "./db";
import {
  agentLogs,
  crawlSnapshots,
  pilotApplications,
  strategyBeliefs,
  workspaces,
  workspaceMembers,
} from "./schema";
import { scanUrl } from "./agents/scanner";
import { bellekTaslagiUret } from "./agents/bellek";
import { gecisZorla } from "./durum";
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
const GUNLUK_LLM_SINIRI = 50;

function gunlukLlmSiniriZorla(workspaceId: string) {
  const gunBaslangic = new Date();
  gunBaslangic.setHours(0, 0, 0, 0);
  const kayitlar = db
    .select()
    .from(agentLogs)
    .where(and(eq(agentLogs.workspaceId, workspaceId), gte(agentLogs.zaman, gunBaslangic.getTime())))
    .all()
    .filter((l) => l.mod === "llm");
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
        const ws = {
          id: newId("ws"),
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
