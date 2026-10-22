import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";
import { tarihYaz } from "../lib/format";

interface Sinyal {
  id: string;
  tip: string; // haftalikOzet | eskimeAlarmi
  icerik: string; // JSON
  okundu: number;
  durum: string; // acik | okundu | ertelendi | cozuldu
  ertelemeBitis: number | null;
  createdAt: number;
}

interface OzetIcerik {
  ozet?: string;
  ogrenimler?: string[];
  sonrakiOneri?: string;
  mod?: string;
  baslik?: string;
  govde?: string;
  donem?: { baslangic: number; bitis: number };
  donemdeVeriVar?: boolean;
}

function icerikOku(icerik: string): OzetIcerik {
  try {
    return JSON.parse(icerik) as OzetIcerik;
  } catch {
    return { govde: icerik };
  }
}

export default function Radar() {
  const { workspaceId, bellekOnayli } = useShell();
  const [sinyaller, setSinyaller] = useState<Sinyal[]>([]);
  const [mesgul, setMesgul] = useState("");
  const [rakipUrl, setRakipUrl] = useState("");

  const yenile = useCallback(() => {
    trpc.radar.sinyaller.query({ workspaceId }).then((r) => setSinyaller(r as Sinyal[]));
  }, [workspaceId]);

  useEffect(yenile, [yenile]);

  if (!bellekOnayli) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <h1 className="font-display text-2xl mb-3">This module is locked</h1>
        <p className="text-muted-foreground">Approve the Strategy Memory first — the Signal Radar reads against that single source.</p>
      </div>
    );
  }

  async function islem(anahtar: string, fn: () => Promise<unknown>, basari: string) {
    setMesgul(anahtar);
    try {
      await fn();
      toast.success(basari);
      yenile();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The operation failed.");
    } finally {
      setMesgul("");
    }
  }

  const okunmamis = sinyaller.filter((s) => s.durum === "acik").length;

  return (
    <div className="max-w-4xl grid gap-12">
      <section>
        <p className="eyebrow text-muted-foreground mb-1">SIGNAL RADAR</p>
        <h1 className="font-display text-2xl mb-2">What did we learn — and what is going stale</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The Analyst is read-only: it reads test results, evidence files and page scans; it never changes anything.{" "}
          <strong>There is no automatic scheduling</strong> — summaries and staleness checks run when you press the
          buttons below.
        </p>
        <div className="flex gap-3 flex-wrap mb-8">
          <button
            disabled={mesgul !== ""}
            onClick={() => void islem("ozet", () => trpc.radar.ozetUret.mutate({ workspaceId }), "Weekly brief produced.")}
            className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            {mesgul === "ozet" ? "Analyst is reading…" : "Generate weekly brief"}
          </button>
          <button
            disabled={mesgul !== ""}
            onClick={() =>
              void islem(
                "eskime",
                async () => {
                  const r = await trpc.radar.eskimeKontrol.mutate({ workspaceId });
                  if (r.taramaHatalari.length > 0) toast.warning(`${r.taramaHatalari.length} URL could not be scanned.`);
                },
                "Staleness check completed.",
              )
            }
            className="h-11 px-5 rounded-lg border border-[#181818] font-semibold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            {mesgul === "eskime" ? "Rescanning…" : "Rescan now"}
          </button>
          {okunmamis > 0 && (
            <span className="self-center text-xs font-bold uppercase tracking-widest text-[#c52a00]">{okunmamis} unread</span>
          )}
        </div>

        <form
          className="flex items-end gap-2 flex-wrap rounded-xl border border-border bg-card p-4 mb-8"
          onSubmit={(e) => {
            e.preventDefault();
            void islem("rakip", () => trpc.radar.rakipEkle.mutate({ workspaceId, url: rakipUrl.trim() }), "Competitor baseline recorded.");
            setRakipUrl("");
          }}
        >
          <div className="flex-1 min-w-56">
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Competitor page URL
            </label>
            <input
              required
              value={rakipUrl}
              onChange={(e) => setRakipUrl(e.target.value)}
              placeholder="https://competitor.example"
              className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={mesgul !== "" || rakipUrl.trim().length < 4}
            className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold text-sm disabled:opacity-50"
          >
            {mesgul === "rakip" ? "Scanning…" : "Record baseline"}
          </button>
          <p className="w-full text-xs text-muted-foreground">
            The staleness alarm fires when a competitor page's text changes by more than 20% between scans, or when a
            proven message goes 30+ days without being refreshed.
          </p>
        </form>

        {sinyaller.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            No signals yet. Generate the weekly brief or run a staleness check — both write their results here.
          </p>
        ) : (
          <ul className="grid gap-4">
            {sinyaller.map((s, i) => {
              const c = icerikOku(s.icerik);
              const alarm = s.tip === "eskimeAlarmi";
              const acik = s.durum === "acik";
              return (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-xl border p-5 bg-card ${
                    acik ? (alarm ? "border-[#c52a00]/50" : "border-[#ff3500]/60") : "border-border opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${
                        alarm ? "text-[#c52a00] border-[#c52a00]/40" : "text-[#181818] border-[#181818]/30"
                      }`}
                    >
                      {alarm ? "Staleness alarm" : "Weekly brief"}
                      {!acik && (
                        <span className="normal-case font-semibold">
                          {" "}
                          · {s.durum === "ertelendi" ? `snoozed${s.ertelemeBitis ? ` until ${tarihYaz(s.ertelemeBitis)}` : ""}` : s.durum === "cozuldu" ? "resolved" : "read"}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{tarihYaz(s.createdAt)}</span>
                      {acik && (
                        <>
                          <button
                            onClick={() =>
                              void islem(`oku-${s.id}`, () => trpc.radar.sinyalDurum.mutate({ workspaceId, sinyalId: s.id, durum: "okundu" }), "Marked as read.")
                            }
                            className="text-xs font-semibold underline underline-offset-2 text-muted-foreground hover:text-foreground"
                          >
                            Mark as read
                          </button>
                          {alarm && (
                            <>
                              <button
                                onClick={() =>
                                  void islem(`erte-${s.id}`, () => trpc.radar.sinyalDurum.mutate({ workspaceId, sinyalId: s.id, durum: "ertelendi" }), "Snoozed for 7 days.")
                                }
                                className="text-xs font-semibold underline underline-offset-2 text-muted-foreground hover:text-foreground"
                              >
                                Snooze 7 days
                              </button>
                              <button
                                onClick={() =>
                                  void islem(`coz-${s.id}`, () => trpc.radar.sinyalDurum.mutate({ workspaceId, sinyalId: s.id, durum: "cozuldu" }), "Marked as resolved.")
                                }
                                className="text-xs font-semibold underline underline-offset-2 text-[#0d6e3f]"
                              >
                                Resolved
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {alarm ? (
                    <>
                      <p className="font-semibold mb-1">{c.baslik}</p>
                      <p className="text-sm text-muted-foreground">{c.govde}</p>
                    </>
                  ) : (
                    <>
                      {c.donem && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Period: {tarihYaz(c.donem.baslangic)} – {tarihYaz(c.donem.bitis)} (last 7 days)
                          {c.donemdeVeriVar === false && " — no new tests or evidence in this period"}
                        </p>
                      )}
                      <p className="font-medium mb-3">{c.ozet}</p>
                      {c.ogrenimler && c.ogrenimler.length > 0 && (
                        <ul className="grid gap-1 mb-3">
                          {c.ogrenimler.map((o, j) => (
                            <li key={j} className="text-sm text-muted-foreground">
                              — {o}
                            </li>
                          ))}
                        </ul>
                      )}
                      {c.sonrakiOneri && (
                        <p className="text-sm rounded-lg border border-[#0d6e3f]/30 bg-[#0d6e3f]/5 px-3 py-2">
                          <strong>Next:</strong> {c.sonrakiOneri}
                        </p>
                      )}
                      {c.mod === "simulasyon" && (
                        <p className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-[#c52a00] border border-[#c52a00]/40 rounded-full px-3 py-1">
                          Simulation output — real analysis starts once the LLM connection is set up
                        </p>
                      )}
                    </>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
