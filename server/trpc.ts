import { initTRPC, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "./db";
import { sessions, users, workspaces, workspaceMembers, strategyBeliefs } from "./schema";

// Kimi OAuth bu ortamda yok → e-posta + davet kodu ile yerel oturum (v2 güncelleme
// maddesi 4; README'de belgelendi). Davetsiz kullanıcı uygulamaya giremez.

export interface OturumKullanici {
  id: string;
  email: string;
  name: string;
}

export interface Context {
  user: OturumKullanici | null;
}

export const OTURUM_CEREZI = "konum_oturum";

function cerezOku(header: string | null, ad: string): string | null {
  if (!header) return null;
  for (const parca of header.split(";")) {
    const [k, ...v] = parca.trim().split("=");
    if (k === ad) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function createContext(opts?: FetchCreateContextFnOptions): Context {
  const cookieHeader = opts?.req.headers.get("cookie") ?? null;
  const token = cerezOku(cookieHeader, OTURUM_CEREZI);
  if (!token) return { user: null };
  const oturum = db.select().from(sessions).where(eq(sessions.token, token)).get();
  if (!oturum || oturum.expiresAt < Date.now()) return { user: null };
  const user = db.select().from(users).where(eq(users.id, oturum.userId)).get();
  if (!user) return { user: null };
  return { user: { id: user.id, email: user.email, name: user.name } };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Giriş zorunlu prosedürler
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Oturum gerekli. Lütfen giriş yapın." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export type Rol = "sahip" | "editor" | "onaylayici" | "izleyici";

// Üyelik doğrulaması — v2 Bölüm 6.2: her workspace yalnızca üyelerine görünür.
export function uyeZorla(workspaceId: string, userId: string) {
  const ws = db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).get();
  if (!ws) throw new TRPCError({ code: "NOT_FOUND", message: "Çalışma alanı bulunamadı." });
  const uyelik = db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .get();
  if (!uyelik) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu çalışma alanına erişim yetkiniz yok." });
  }
  return { ws, rol: uyelik.rol as Rol };
}

// Onay/red yetkisi yalnız sahip ve onaylayıcı rolündedir (v2 Bölüm 6.2)
export function onayYetkisiZorla(workspaceId: string, userId: string) {
  const { ws, rol } = uyeZorla(workspaceId, userId);
  if (rol !== "sahip" && rol !== "onaylayici") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Onay/red yetkisi sahip ve onaylayıcı rollerindedir." });
  }
  return { ws, rol };
}

// Bellek kilidi — v2 Bölüm 2: bellek onaylanmadan diğer modüller sunucuda da kilitli.
export function bellekOnayZorla(workspaceId: string) {
  const bellek = db
    .select()
    .from(strategyBeliefs)
    .where(eq(strategyBeliefs.workspaceId, workspaceId))
    .get();
  if (!bellek || bellek.onayDurumu !== "onaylandi") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Strateji Belleği onaylanmadan bu modül kullanılamaz. Önce belleği onaylayın.",
    });
  }
  return bellek;
}
