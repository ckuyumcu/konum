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

// Maliyet koruması — v2 Bölüm 4: workspace başına günlük LLM çağrı sınırı.
// Eşik [DV — varsayılan]: 50/gün; Ayarlar'da değiştirilebilir yapılacak (Aşama 4).
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
      message: `Bu çalışma alanı için günlük LLM çağrı sınırı doldu (${GUNLUK_LLM_SINIRI}). Yarın yeniden deneyin.`,
    });
  }
}

const entegrasyonlar = [
  { ad: "Web sitesi tarama", durum: "aktif", aciklama: "Ürün URL'sinden metin çıkarımı; robots.txt'ye saygılı, SSRF korumalı." },
  { ad: "Dosya yükleme (.txt/.csv, en fazla 5 MB)", durum: "planlandi", aciklama: "Müşteri yorumları / SSS / destek metinleri — Aşama 2 kapsamında." },
  { ad: "Meta Ads / Instagram", durum: "planlandi", aciklama: "Planlandı — pilot aşamasında (v1.1 hedefi)." },
  { ad: "Google Ads", durum: "planlandi", aciklama: "Planlandı — pilot aşamasında (v1.1 hedefi)." },
  { ad: "E-posta (Mailchimp / Klaviyo)", durum: "planlandi", aciklama: "Planlandı — pilot aşamasında (v1.1 hedefi)." },
  { ad: "Analytics bağlantısı", durum: "planlandi", aciklama: "Planlandı — pilot aşamasında (v1.1 hedefi)." },
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

  // Landing pilot formu — herkese açık tek prosedür (v2 Bölüm 8, Aşama 1)
  pilot: router({
    basvur: publicProcedure
      .input(
        z.object({
          eposta: z.string().trim().regex(EPOSTA_RE, "Geçerli bir e-posta adresi girin."),
          ajansAdi: z.string().trim().max(200).optional().default(""),
          musteriSayisi: z.string().trim().max(50).optional().default(""),
          riza: z.literal(true, { error: "Aydınlatma metnini onaylamadan başvuru alınamaz." }),
        }),
      )
      .mutation(({ input }) => {
        db.insert(pilotApplications)
          .values({
            id: newId("plt"),
            eposta: input.eposta.toLocaleLowerCase("tr"),
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
          musteriAdi: z.string().trim().min(2, "Müşteri adı en az 2 karakter olmalı."),
          sektor: z.string().trim().min(2, "Sektör gerekli."),
          urunUrl: z.string().trim().min(4, "Ürün URL'si gerekli."),
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

    // Kurulum sihirbazı adım 1: URL tara (Araştırmacı) — SSRF korumalı
    tara: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { ws } = uyeZorla(input.workspaceId, ctx.user.id);
        if (!ws.urunUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Ürün URL'si tanımlı değil." });
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
          `URL taraması: ${ws.urunUrl}`,
          scan.metin
            ? `${scan.metin.length} karakter metin çıkarıldı. Başlık: ${scan.title}`
            : scan.not || "Metin çıkarılamadı.",
          "uygulanamaz",
          "tarama",
        );
        return scan;
      }),

    // Kurulum sihirbazı adım 2: taramadan bellek taslağı üret (Stratejist Yrd. → Denetçi)
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
          taramaOzeti: `Kaynak: ${input.taramaBaslik || ws.urunUrl} — ${input.taramaMetni.length} karakter`,
          onayDurumu: "taslak",
          guncelleyen: `Stratejist Yardımcısı (${sonuc.mod})`,
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
          `Bellek taslağı — kaynak: ${input.taramaBaslik || ws.urunUrl}`,
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
        if (!bellek) throw new TRPCError({ code: "NOT_FOUND", message: "Önce kurulum sihirbazıyla taslak üretin." });
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

    // İnsan onayı — durum geçişi sunucudaki tek durum makinesinden geçer (v2 B3 k9)
    onayla: protectedProcedure
      .input(z.object({ workspaceId: z.string() }))
      .mutation(({ ctx, input }) => {
        onayYetkisiZorla(input.workspaceId, ctx.user.id);
        const bellek = db
          .select()
          .from(strategyBeliefs)
          .where(eq(strategyBeliefs.workspaceId, input.workspaceId))
          .get();
        if (!bellek) throw new TRPCError({ code: "NOT_FOUND", message: "Onaylanacak bellek taslağı yok." });
        gecisZorla("bellek", bellek.onayDurumu, "onaylandi");
        if (bellek.hikaye.trim().length < 20 || bellek.konumlandirma.trim().length < 20) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Hikâye ve konumlandırma alanları anlamlı uzunlukta olmadan bellek onaylanamaz.",
          });
        }
        db.update(strategyBeliefs)
          .set({ onayDurumu: "onaylandi", guncelleyen: ctx.user.name, guncellemeZamani: Date.now() })
          .where(eq(strategyBeliefs.id, bellek.id))
          .run();
        logAjan(
          input.workspaceId,
          "denetci",
          "Bellek insan onayı",
          `${ctx.user.name} Strateji Belleği'ni onayladı; modül kilitleri açıldı.`,
          "gecti",
          "insan",
        );
        return { ok: true };
      }),
  }),

  ajanlar: router({
    // Ajan günlüğü yalnızca workspace üyelerine açıktır (v2 Bölüm 6.4)
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

    // LLM anahtar durumu — anahtarın kendisi asla dönmez, yalnız varlık bilgisi
    llmDurumu: protectedProcedure.query(({ ctx }) => {
      if (!platformSahibiMi(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bu ayar yalnızca platform sahibine açıktır." });
      }
      const { kaynak } = anthropicAnahtari();
      return {
        saglayici: llmSaglayici(),
        model: "claude-haiku-5-5",
        anahtarKaynagi: kaynak, // env | dosya | yok
        aktifMod: llmAktifMi() ? ("llm" as const) : ("simulasyon" as const),
      };
    }),

    // Anahtar sunucuda proje dışı gizli dosyaya yazılır; bir daha gösterilmez (Cem'in kararı)
    llmAnahtariKaydet: protectedProcedure
      .input(z.object({ anahtar: z.string().trim().min(10, "Anahtar çok kısa görünüyor.") }))
      .mutation(({ ctx, input }) => {
        if (!platformSahibiMi(ctx.user.email)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Bu ayar yalnızca platform sahibine açıktır." });
        }
        anthropicAnahtariYaz(input.anahtar);
        return { ok: true };
      }),

    llmAnahtariKaldir: protectedProcedure.mutation(({ ctx }) => {
      if (!platformSahibiMi(ctx.user.email)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bu ayar yalnızca platform sahibine açıktır." });
      }
      anthropicAnahtariSil();
      return { ok: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
