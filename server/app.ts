import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { setCookie, deleteCookie } from "hono/cookie";
import { and, eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { createContext, OTURUM_CEREZI } from "./trpc";
import { db, newId } from "./db";
import { invites, sessions, users, workspaceMembers } from "./schema";
import { envYukle } from "./config";

envYukle();

const OTURUM_SURESI = 1000 * 60 * 60 * 24 * 14; // 14 gün

// Yerel geliştirme tohumu: ilk açılışta tek davet üretilir (README'de belgelendi).
// Üretimde davetler platform sahibi tarafından Ajans Konsolu'ndan üretilecek.
function tohumlama() {
  const varMi = db.select().from(invites).all();
  if (varMi.length === 0) {
    db.insert(invites)
      .values({
        id: newId("inv"),
        eposta: "cem@konum.local",
        rol: "sahip",
        workspaceId: null,
        token: "KONUM-PILOT-1",
        sonKullanma: Date.now() + 1000 * 60 * 60 * 24 * 365,
        kullanildi: 0,
        createdAt: Date.now(),
      })
      .run();
  }
}

export function createServerApp(): Hono {
  tohumlama();
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, servis: "konum-api" }));

  // Giriş: e-posta + davet kodu (Kimi OAuth yerel eşdeğeri — v2 güncelleme 4)
  app.post("/giris", async (c) => {
    const govde = await c.req.json().catch(() => null);
    const eposta = String(govde?.eposta ?? "").trim().toLocaleLowerCase("tr");
    const kod = String(govde?.davetKodu ?? "").trim();
    if (!eposta || !kod) {
      return c.json({ hata: "E-posta ve davet kodu gerekli." }, 400);
    }
    const davet = db.select().from(invites).where(eq(invites.token, kod)).get();
    if (!davet || davet.sonKullanma < Date.now() || davet.eposta.toLocaleLowerCase("tr") !== eposta) {
      return c.json({ hata: "Davet kodu bu e-posta için geçerli değil. Davetin yoksa platform sahibine yaz." }, 403);
    }
    let user = db.select().from(users).where(eq(users.email, eposta)).get();
    // Davet tek kullanımlıktır; ancak hesabı zaten açılmış kullanıcı aynı e-posta +
    // davet koduyla yeniden giriş yapabilir (yerel geliştirme eşdeğeri — README).
    if (davet.kullanildi === 1 && !user) {
      return c.json({ hata: "Bu davet kodu daha önce kullanılmış." }, 403);
    }
    if (!user) {
      user = { id: newId("usr"), email: eposta, name: eposta.split("@")[0], createdAt: Date.now() };
      db.insert(users).values(user).run();
    }
    db.update(invites).set({ kullanildi: 1 }).where(eq(invites.id, davet.id)).run();
    if (davet.workspaceId) {
      const uyeMi = db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, davet.workspaceId), eq(workspaceMembers.userId, user.id)))
        .get();
      if (!uyeMi) {
        db.insert(workspaceMembers)
          .values({ id: newId("mem"), workspaceId: davet.workspaceId, userId: user.id, rol: davet.rol, createdAt: Date.now() })
          .run();
      }
    }

    const token = newId("oturum");
    db.insert(sessions)
      .values({ token, userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + OTURUM_SURESI })
      .run();
    setCookie(c, OTURUM_CEREZI, token, {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      maxAge: OTURUM_SURESI / 1000,
    });
    return c.json({ ok: true, kullanici: { id: user.id, email: user.email, name: user.name } });
  });

  app.post("/cikis", (c) => {
    deleteCookie(c, OTURUM_CEREZI, { path: "/" });
    return c.json({ ok: true });
  });

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (opts) => createContext(opts) as unknown as Record<string, unknown>,
    }),
  );

  return app;
}
