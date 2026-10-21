import { initTRPC, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "./db";
import { sessions, users, workspaces, workspaceMembers, strategyBeliefs } from "./schema";

// Kimi OAuth is unavailable in this environment → local session via email + invite code
// (v2 update item 4; documented in README). Users without an invite cannot enter the app.

export interface OturumKullanici {
  id: string;
  email: string;
  name: string;
}

export interface Context {
  user: OturumKullanici | null;
  ip: string;
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
  const headers = opts?.req.headers;
  const ip =
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers?.get("x-real-ip") ||
    "yerel";
  const cookieHeader = headers?.get("cookie") ?? null;
  const token = cerezOku(cookieHeader, OTURUM_CEREZI);
  if (!token) return { user: null, ip };
  const oturum = db.select().from(sessions).where(eq(sessions.token, token)).get();
  if (!oturum || oturum.expiresAt < Date.now()) return { user: null, ip };
  const user = db.select().from(users).where(eq(users.id, oturum.userId)).get();
  if (!user) return { user: null, ip };
  return { user: { id: user.id, email: user.email, name: user.name }, ip };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Procedures requiring sign-in
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session required. Please sign in." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export type Rol = "sahip" | "editor" | "onaylayici" | "izleyici";

// Membership check — v2 Section 6.2: every workspace is visible only to its members.
export function uyeZorla(workspaceId: string, userId: string) {
  const ws = db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).get();
  if (!ws) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
  const uyelik = db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .get();
  if (!uyelik) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this workspace." });
  }
  return { ws, rol: uyelik.rol as Rol };
}

// Approve/reject authority belongs only to the owner and approver roles (v2 Section 6.2)
export function onayYetkisiZorla(workspaceId: string, userId: string) {
  const { ws, rol } = uyeZorla(workspaceId, userId);
  if (rol !== "sahip" && rol !== "onaylayici") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Approve/reject authority belongs to the owner and approver roles." });
  }
  return { ws, rol };
}

// Memory lock — v2 Section 2: until the memory is approved, other modules stay locked on the server too.
export function bellekOnayZorla(workspaceId: string) {
  const bellek = db
    .select()
    .from(strategyBeliefs)
    .where(eq(strategyBeliefs.workspaceId, workspaceId))
    .get();
  if (!bellek || bellek.onayDurumu !== "onaylandi") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "This module cannot be used before the Strategy Memory is approved. Please approve the memory first.",
    });
  }
  return bellek;
}
