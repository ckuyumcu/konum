import { createContext, useContext, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router";
import { trpc } from "../lib/trpc";
import { oturumZorla } from "../lib/auth";

interface ShellCtx {
  workspaceId: string;
  musteriAdi: string;
  bellekOnayli: boolean;
  yenile: () => void;
}

const Ctx = createContext<ShellCtx | null>(null);
export function useShell(): ShellCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("Shell context missing");
  return c;
}

const MODULLER = [
  { rota: "bellek", ad: "Strategy Memory", kilitlenebilir: false },
  { rota: "kanit", ad: "Evidence Engine", kilitlenebilir: true },
  { rota: "icra", ad: "Execution Studio", kilitlenebilir: true },
  { rota: "onay", ad: "Approval Center", kilitlenebilir: true },
  { rota: "yayin", ad: "Publish Plan", kilitlenebilir: true },
  { rota: "radar", ad: "Signal Radar", kilitlenebilir: true },
  { rota: "ayarlar", ad: "Settings", kilitlenebilir: false },
];

export default function AppShell() {
  const { workspaceId = "" } = useParams();
  const [hazir, setHazir] = useState(false);
  const [musteriAdi, setMusteriAdi] = useState("");
  const [bellekOnayli, setBellekOnayli] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [menuAcik, setMenuAcik] = useState(false);

  useEffect(() => {
    void oturumZorla().then((k) => k && setHazir(true));
  }, []);

  useEffect(() => {
    if (!hazir) return;
    let aktif = true;
    Promise.all([trpc.workspaces.get.query({ id: workspaceId }), trpc.bellek.get.query({ workspaceId })])
      .then(([ws, bellek]) => {
        if (!aktif) return;
        setMusteriAdi(ws.musteriAdi);
        setBellekOnayli(bellek?.onayDurumu === "onaylandi");
        setHata(null);
      })
      .catch((e) => aktif && setHata(e instanceof Error ? e.message : "Could not load."));
    return () => {
      aktif = false;
    };
  }, [workspaceId, tick, hazir]);

  if (!hazir) return null;

  if (hata) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6">
        <p role="alert" className="rounded-lg border border-[#c52a00]/40 bg-[#c52a00]/5 text-[#c52a00] px-4 py-3">
          {hata} <Link to="/app" className="underline">Back to workspaces</Link>
        </p>
      </div>
    );
  }

  const navListesi = (
    <ul className="grid gap-0.5 px-3">
      {MODULLER.map((m) => {
        const kilitli = m.kilitlenebilir && !bellekOnayli;
        return (
          <li key={m.rota}>
            <NavLink
              to={`/app/${workspaceId}/${m.rota}`}
              onClick={() => setMenuAcik(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 min-h-11 text-sm transition-colors duration-200 ${
                  isActive
                    ? "bg-white/10 text-[#fcfcf9] font-semibold"
                    : "text-[#fcfcf9]/70 hover:bg-white/5 hover:text-[#fcfcf9]"
                }`
              }
            >
              <span>{m.ad}</span>
              {kilitli && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Locked">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  return (
    <Ctx.Provider value={{ workspaceId, musteriAdi, bellekOnayli, yenile: () => setTick((t) => t + 1) }}>
      <div className="min-h-dvh flex bg-background text-foreground">
        {/* Desktop: left vertical navigation */}
        <aside className="hidden md:flex w-60 shrink-0 bg-[#181818] text-[#fcfcf9] flex-col min-h-dvh">
          <div className="px-5 py-5 border-b border-white/10">
            <Link to="/" className="eyebrow text-[#fcfcf9]">KONUM</Link>
          </div>
          <nav className="flex-1 py-4" aria-label="Modules">{navListesi}</nav>
          <div className="px-5 py-4 border-t border-white/10 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fcfcf9]/35">An AIWork School company</p>
            <Link to="/app" className="block text-xs text-[#fcfcf9]/50 hover:text-[#fcfcf9] transition-colors">
              ← Workspaces
            </Link>
          </div>
        </aside>

        {/* Mobile: slide-out menu (sheet) */}
        {menuAcik && (
          <div className="md:hidden fixed inset-0 z-50">
            <button
              aria-label="Close menu"
              onClick={() => setMenuAcik(false)}
              className="absolute inset-0 bg-black/50"
            />
            <aside className="absolute inset-y-0 left-0 w-64 bg-[#181818] text-[#fcfcf9] flex flex-col">
              <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
                <span className="eyebrow">KONUM</span>
                <button
                  onClick={() => setMenuAcik(false)}
                  aria-label="Close"
                  className="h-11 w-11 grid place-items-center rounded-lg hover:bg-white/10"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 py-4 overflow-auto" aria-label="Modules">{navListesi}</nav>
              <div className="px-5 py-4 border-t border-white/10 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#fcfcf9]/35">An AIWork School company</p>
                <Link to="/app" onClick={() => setMenuAcik(false)} className="block text-xs text-[#fcfcf9]/50">
                  ← Workspaces
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="min-h-14 border-b border-border flex items-center gap-3 px-4 md:px-6 py-2 bg-background">
            <button
              className="md:hidden h-11 w-11 grid place-items-center rounded-lg hover:bg-[#efefe4]"
              onClick={() => setMenuAcik(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <p className="text-sm flex-1 min-w-0 truncate">
              <span className="text-muted-foreground">Workspace:</span>{" "}
              <strong>{musteriAdi || "…"}</strong>
            </p>
            <p
              className={`shrink-0 text-xs font-bold uppercase tracking-widest ${
                bellekOnayli ? "text-[#0d6e3f]" : "text-[#c52a00]"
              }`}
            >
              {bellekOnayli ? "Memory approved" : "Memory approval pending"}
            </p>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
