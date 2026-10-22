import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";
import { oturumZorla } from "../lib/auth";
import { tarihYaz } from "../lib/format";

interface WorkspaceSatir {
  id: string;
  musteriAdi: string;
  sektor: string;
  bellekDurumu: string;
  bekleyenOnay: number;
  rol: string;
  beyazEtiket: string;
}

interface UlasimSatir {
  id: string;
  url: string;
  ajansAdi: string;
  eposta: string;
  konu: string;
  taslak: string;
  raporOzeti: string;
  durum: string;
  createdAt: number;
}

const DURUM_AD: Record<string, string> = {
  taslak: "Draft",
  "gonderildi-manuel": "Sent (manual)",
  "yanit-geldi": "Reply received",
  "pilot-basvurdu": "Applied to pilot",
};

export default function Konsol() {
  const [liste, setListe] = useState<WorkspaceSatir[]>([]);
  const [platformSahibi, setPlatformSahibi] = useState(false);
  const [ulasim, setUlasim] = useState<UlasimSatir[]>([]);
  const [mesgul, setMesgul] = useState("");
  const [beyazAcik, setBeyazAcik] = useState<string | null>(null);
  const [bForm, setBForm] = useState({ markaAdi: "", vurguRenk: "", alanAdi: "" });
  const [yeniUrl, setYeniUrl] = useState("");
  const [yeniAjans, setYeniAjans] = useState("");
  const [yeniEposta, setYeniEposta] = useState("");
  const [taslakAcik, setTaslakAcik] = useState<string | null>(null);

  const yenile = useCallback(() => {
    trpc.workspaces.list.query().then((r) => setListe(r as WorkspaceSatir[]));
  }, []);

  const ulasimYenile = useCallback(() => {
    trpc.ulasim.listele
      .query()
      .then((r) => setUlasim(r as UlasimSatir[]))
      .catch(() => setUlasim([]));
  }, []);

  useEffect(() => {
    void oturumZorla().then((k) => {
      if (!k) return;
      yenile();
      trpc.auth.me.query().then((me) => {
        if (me?.platformSahibi) {
          setPlatformSahibi(true);
          ulasimYenile();
        }
      });
    });
  }, [yenile, ulasimYenile]);

  async function islem(anahtar: string, fn: () => Promise<unknown>, basari: string) {
    setMesgul(anahtar);
    try {
      await fn();
      toast.success(basari);
      yenile();
      ulasimYenile();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The operation failed.");
    } finally {
      setMesgul("");
    }
  }

  function beyazAc(ws: WorkspaceSatir) {
    let mevcut = { markaAdi: "", vurguRenk: "", alanAdi: "" };
    try {
      mevcut = { ...mevcut, ...(JSON.parse(ws.beyazEtiket || "{}") as typeof mevcut) };
    } catch {
      /* boş bırak */
    }
    setBForm(mevcut);
    setBeyazAcik(ws.id);
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="eyebrow text-foreground">KONUM</Link>
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Workspaces
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 grid gap-12">
        <section className="min-w-0">
          <p className="eyebrow text-muted-foreground mb-2">AGENCY CONSOLE</p>
          <h1 className="font-display text-3xl mb-6">All your clients on one screen</h1>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left bg-[#efefe4]/60">
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Sector</th>
                  <th className="px-4 py-3 font-semibold">Memory</th>
                  <th className="px-4 py-3 font-semibold">Pending approvals</th>
                  <th className="px-4 py-3 font-semibold">White-label</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((ws) => (
                  <tr key={ws.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link to={`/app/${ws.id}/bellek`} className="font-medium underline-offset-2 hover:underline">
                        {ws.musteriAdi}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{ws.sektor}</td>
                    <td className="px-4 py-3">
                      {ws.bellekDurumu === "onaylandi" ? (
                        <span className="text-[#0d6e3f] font-semibold">Approved</span>
                      ) : (
                        <span className="text-[#c52a00] font-semibold">Setup pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ws.bekleyenOnay > 0 ? (
                        <Link to={`/app/${ws.id}/onay`} className="font-bold text-[#b45309] underline-offset-2 hover:underline">
                          {ws.bekleyenOnay} waiting
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ws.rol === "sahip" ? (
                        <button
                          onClick={() => beyazAc(ws)}
                          className="text-sm font-semibold underline underline-offset-2 text-muted-foreground hover:text-foreground"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">owner only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {liste.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No clients yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {beyazAcik && (
            <form
              className="mt-4 rounded-xl border border-border bg-card p-5 grid gap-3 max-w-xl"
              onSubmit={(e) => {
                e.preventDefault();
                void islem(
                  "beyaz",
                  () =>
                    trpc.workspaces.beyazEtiketGuncelle.mutate({
                      workspaceId: beyazAcik,
                      markaAdi: bForm.markaAdi.trim(),
                      vurguRenk: bForm.vurguRenk.trim(),
                      alanAdi: bForm.alanAdi.trim(),
                    }),
                  "White-label settings saved.",
                ).then(() => setBeyazAcik(null));
              }}
            >
              <h2 className="font-display text-lg">White-label — {liste.find((w) => w.id === beyazAcik)?.musteriAdi}</h2>
              <p className="text-xs text-muted-foreground">
                These settings are stored per workspace. The brand name appears in reports and exports; the custom
                domain is recorded here but mapping goes live in v1.1.
              </p>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brand name</label>
              <input
                value={bForm.markaAdi}
                onChange={(e) => setBForm((s) => ({ ...s, markaAdi: e.target.value }))}
                placeholder="Your agency's brand"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
              />
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Accent color (hex)</label>
              <input
                value={bForm.vurguRenk}
                onChange={(e) => setBForm((s) => ({ ...s, vurguRenk: e.target.value }))}
                placeholder="#ff3500"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-mono"
              />
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom domain (v1.1)</label>
              <input
                value={bForm.alanAdi}
                onChange={(e) => setBForm((s) => ({ ...s, alanAdi: e.target.value }))}
                placeholder="reports.youragency.com"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
              />
              <div className="flex gap-3 justify-end mt-1">
                <button type="button" onClick={() => setBeyazAcik(null)} className="h-10 px-4 rounded-lg border border-border text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mesgul !== ""}
                  className="h-10 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold text-sm disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </section>

        {platformSahibi && (
          <section className="min-w-0">
            <h2 className="font-display text-2xl mb-2">Outreach prep list</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Internal screen — only you see this. Enter agency URLs; the platform scans each site, maps its message and
              drafts a personalized intro email. <strong>Nothing is sent automatically</strong> — the draft is for
              copy-paste. Use corporate general contact addresses only; no personal addresses.
            </p>

            <form
              className="flex items-end gap-2 flex-wrap rounded-xl border border-border bg-card p-4 mb-6"
              onSubmit={(e) => {
                e.preventDefault();
                void islem(
                  "ekle",
                  () =>
                    trpc.ulasim.ekle.mutate({ url: yeniUrl.trim(), ajansAdi: yeniAjans.trim(), eposta: yeniEposta.trim() }),
                  "Row added.",
                ).then(() => {
                  setYeniUrl("");
                  setYeniAjans("");
                  setYeniEposta("");
                });
              }}
            >
              <input
                required
                value={yeniUrl}
                onChange={(e) => setYeniUrl(e.target.value)}
                placeholder="https://agency.example"
                className="flex-1 min-w-48 h-11 rounded-lg border border-input bg-background px-3 text-sm"
              />
              <input
                value={yeniAjans}
                onChange={(e) => setYeniAjans(e.target.value)}
                placeholder="Agency name (optional)"
                className="w-44 h-11 rounded-lg border border-input bg-background px-3 text-sm"
              />
              <input
                value={yeniEposta}
                onChange={(e) => setYeniEposta(e.target.value)}
                placeholder="hello@agency.com (optional)"
                className="w-56 h-11 rounded-lg border border-input bg-background px-3 text-sm"
              />
              <button
                type="submit"
                disabled={mesgul !== "" || yeniUrl.trim().length < 4}
                className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold text-sm disabled:opacity-50"
              >
                Add
              </button>
            </form>

            {ulasim.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">No outreach rows yet.</p>
            ) : (
              <ul className="grid gap-4">
                {ulasim.map((u) => (
                  <li key={u.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <p className="font-semibold">
                        {u.ajansAdi || u.url}
                        {u.ajansAdi && <span className="text-muted-foreground font-normal"> · {u.url}</span>}
                      </p>
                      <span
                        className={`text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${
                          u.durum === "pilot-basvurdu"
                            ? "text-[#0d6e3f] border-[#0d6e3f]/40"
                            : u.durum === "yanit-geldi"
                              ? "text-[#b45309] border-[#b45309]/40"
                              : "text-muted-foreground border-border"
                        }`}
                      >
                        {DURUM_AD[u.durum] ?? u.durum}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {u.eposta || "no email"} · added {tarihYaz(u.createdAt)}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        disabled={mesgul !== ""}
                        onClick={() =>
                          void islem(
                            `taslak-${u.id}`,
                            async () => {
                              const r = await trpc.ulasim.taslakUret.mutate({ id: u.id });
                              if (r.mod === "simulasyon") toast.warning("Simulation output — the draft sharpens once the LLM connection is set up.");
                            },
                            "Draft prepared.",
                          )
                        }
                        className="h-10 px-4 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold text-sm disabled:opacity-50"
                      >
                        {mesgul === `taslak-${u.id}` ? "Scanning & drafting…" : u.taslak ? "Rebuild draft" : "Scan & draft"}
                      </button>
                      {u.taslak && (
                        <button
                          onClick={() => setTaslakAcik(taslakAcik === u.id ? null : u.id)}
                          className="h-10 px-4 rounded-lg border border-border text-sm font-semibold"
                        >
                          {taslakAcik === u.id ? "Hide draft" : "View draft"}
                        </button>
                      )}
                      <select
                        value={u.durum}
                        onChange={(e) =>
                          void islem(
                            `durum-${u.id}`,
                            () => trpc.ulasim.durumGuncelle.mutate({ id: u.id, durum: e.target.value as UlasimSatir["durum"] as never }),
                            "Status updated.",
                          )
                        }
                        className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
                      >
                        {Object.entries(DURUM_AD).map(([deger, ad]) => (
                          <option key={deger} value={deger}>
                            {ad}
                          </option>
                        ))}
                      </select>
                    </div>
                    {taslakAcik === u.id && u.taslak && (
                      <div className="mt-4 rounded-lg border border-border bg-background p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Subject</p>
                        <p className="text-sm font-semibold mb-3">{u.konu}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Body</p>
                        <p className="text-sm whitespace-pre-wrap mb-3">{u.taslak}</p>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(`Subject: ${u.konu}\n\n${u.taslak}`);
                            toast.success("Copied to clipboard.");
                          }}
                          className="h-10 px-4 rounded-lg border border-[#181818] text-sm font-semibold"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
