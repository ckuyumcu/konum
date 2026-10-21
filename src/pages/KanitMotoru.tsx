import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";
import { tarihYaz } from "../lib/format";

interface Hipotez {
  id: string;
  iddia: string;
  kitle: string;
  kanitOnerisi: string;
  durum: string;
  createdAt: number;
}

interface Varyant {
  id: string;
  rol: string;
  metin: string;
}

interface SonucSatiri {
  varyantId: string;
  gosterim: number;
  tiklama: number;
  donusum: number;
}

interface Test {
  id: string;
  hypothesisId: string;
  varyantlar: Varyant[];
  olcut: string;
  temelOran: number;
  mde: number;
  minimumOrneklem: number;
  durum: string;
  sonuc: string;
  kazananVaryantId: string | null;
  pDegeri: number | null;
  baslangic: number | null;
  createdAt: number;
  sonuclar: SonucSatiri[];
}

interface Kanit {
  id: string;
  kazananMesaj: string;
  ogrenim: string;
  createdAt: number;
}

const DURUM_ETIKET: Record<string, { ad: string; renk: string }> = {
  taslak: { ad: "Draft", renk: "text-muted-foreground border-border" },
  onayBekliyor: { ad: "Awaiting approval", renk: "text-[#b45309] border-[#b45309]/40" },
  calisiyor: { ad: "Running", renk: "text-[#c52a00] border-[#c52a00]/40" },
  tamamlandi: { ad: "Completed", renk: "text-[#0d6e3f] border-[#0d6e3f]/40" },
  yetersizVeri: { ad: "No winner shown (p ≥ 0.05)", renk: "text-muted-foreground border-border" },
};

export default function KanitMotoru() {
  const { workspaceId, bellekOnayli } = useShell();
  const [hipotezler, setHipotezler] = useState<Hipotez[]>([]);
  const [testler, setTestler] = useState<Test[]>([]);
  const [kanitlar, setKanitlar] = useState<Kanit[]>([]);
  const [mesgul, setMesgul] = useState("");
  const [csvAcik, setCsvAcik] = useState<string | null>(null);
  const [csvMetin, setCsvMetin] = useState("");
  const [formSatir, setFormSatir] = useState<Record<string, { gosterim: string; tiklama: string; donusum: string }>>({});

  const yenile = useCallback(() => {
    trpc.kanit.hipotezler.query({ workspaceId }).then((r) => setHipotezler(r as Hipotez[]));
    trpc.kanit.testler.query({ workspaceId }).then((r) => setTestler(r as Test[]));
    trpc.kanit.kanitlar.query({ workspaceId }).then((r) => setKanitlar(r as Kanit[]));
  }, [workspaceId]);

  useEffect(yenile, [yenile]);

  if (!bellekOnayli) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <h1 className="font-display text-2xl mb-3">This module is locked</h1>
        <p className="text-muted-foreground">Approve the Strategy Memory first — the Evidence Engine works against that single source.</p>
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
      if (e instanceof Error && e.message === "__sessiz") {
        yenile(); // uyarı zaten gösterildi
      } else {
        toast.error(e instanceof Error ? e.message : "The operation failed.");
      }
    } finally {
      setMesgul("");
    }
  }

  const toplamKol = (t: Test, vid: string) => {
    const rows = t.sonuclar.filter((r) => r.varyantId === vid);
    return {
      gosterim: rows.reduce((a, r) => a + r.gosterim, 0),
      tiklama: rows.reduce((a, r) => a + r.tiklama, 0),
      donusum: rows.reduce((a, r) => a + r.donusum, 0),
    };
  };

  return (
    <div className="max-w-4xl grid gap-12">
      <section>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="eyebrow text-muted-foreground mb-1">EVIDENCE ENGINE</p>
            <h1 className="font-display text-2xl">Hypothesis cards</h1>
          </div>
          <button
            disabled={mesgul !== ""}
            onClick={() => void islem("hipotez", () => trpc.kanit.hipotezUret.mutate({ workspaceId }), "Hypothesis cards produced.")}
            className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            {mesgul === "hipotez" ? "Strategist is thinking…" : "Generate hypotheses"}
          </button>
        </div>
        {hipotezler.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            No hypotheses yet. The Strategist Assistant reads the approved memory and proposes 2–3 provable message
            claims; you pick one, the Test Designer builds the plan.
          </p>
        ) : (
          <ul className="grid md:grid-cols-3 gap-4">
            {hipotezler.map((h, i) => (
              <motion.li
                key={h.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-xl border bg-card p-5 flex flex-col ${h.durum === "secildi" ? "border-[#0d6e3f]/50" : "border-border"}`}
              >
                <p className="font-semibold leading-snug mb-2">&ldquo;{h.iddia}&rdquo;</p>
                <p className="text-sm text-muted-foreground mb-2">{h.kitle}</p>
                <p className="text-xs text-muted-foreground mt-auto pt-3 border-t border-border/70">
                  <strong>Proof idea:</strong> {h.kanitOnerisi}
                </p>
                {h.durum === "oneri" && (
                  <button
                    disabled={mesgul !== ""}
                    onClick={() =>
                      void islem(`sec-${h.id}`, () => trpc.kanit.hipotezSec.mutate({ workspaceId, hypothesisId: h.id }), "Test plan drafted.")
                    }
                    className="mt-4 h-10 rounded-lg bg-[#ff3500] text-[#181818] font-bold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                  >
                    {mesgul === `sec-${h.id}` ? "Test Designer is planning…" : "Pick this one"}
                  </button>
                )}
                {h.durum === "secildi" && (
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#0d6e3f]">Selected — plan below</p>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-6">Tests</h2>
        {testler.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">No tests yet — pick a hypothesis first.</p>
        ) : (
          <ul className="grid gap-5">
            {testler.map((t) => {
              const durum = DURUM_ETIKET[t.durum] ?? DURUM_ETIKET.taslak;
              return (
                <li key={t.id} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <p className="text-sm text-muted-foreground">
                      Metric: <strong className="text-foreground">{t.olcut}</strong> · min sample:{" "}
                      <strong className="text-foreground">{t.minimumOrneklem.toLocaleString("en-US")} per arm</strong> · baseline{" "}
                      {(t.temelOran / 100).toFixed(1)}% + MDE {(t.mde / 100).toFixed(1)}pp
                    </p>
                    <span className={`text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${durum.renk}`}>
                      {durum.ad}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {t.varyantlar.map((v) => {
                      const toplam = toplamKol(t, v.id);
                      const kazandi = t.kazananVaryantId === v.id;
                      return (
                        <div key={v.id} className={`rounded-lg border p-4 ${kazandi ? "border-[#0d6e3f]/60 bg-[#0d6e3f]/5" : "border-border bg-background"}`}>
                          <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            Variant {v.id} · {v.rol === "kontrol" ? "control" : "challenger"}
                            {kazandi && <span className="text-[#0d6e3f]"> · winner</span>}
                          </p>
                          <p className="text-sm font-medium mb-3">&ldquo;{v.metin}&rdquo;</p>
                          <p className="text-xs text-muted-foreground">
                            {toplam.gosterim.toLocaleString("en-US")} impressions · {toplam.tiklama.toLocaleString("en-US")} clicks ·{" "}
                            {toplam.donusum.toLocaleString("en-US")} conversions
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {t.sonuc && <p className="text-sm text-muted-foreground mb-4">{t.sonuc}</p>}

                  <div className="flex gap-3 flex-wrap">
                    {t.durum === "taslak" && (
                      <button
                        disabled={mesgul !== ""}
                        onClick={() => void islem(`onaya-${t.id}`, () => trpc.kanit.testOnayaGonder.mutate({ workspaceId, testId: t.id }), "Sent to approval.")}
                        className="h-10 px-4 rounded-lg border border-[#181818] font-semibold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                      >
                        Send to approval
                      </button>
                    )}
                    {t.durum === "onayBekliyor" && (
                      <button
                        disabled={mesgul !== ""}
                        onClick={() => void islem(`onay-${t.id}`, () => trpc.kanit.testOnayla.mutate({ workspaceId, testId: t.id }), "Test started.")}
                        className="h-10 px-4 rounded-lg bg-[#ff3500] text-[#181818] font-bold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                      >
                        Approve and start the test
                      </button>
                    )}
                    {t.durum === "calisiyor" && (
                      <>
                        {t.varyantlar.map((v) => {
                          const f = formSatir[`${t.id}-${v.id}`] ?? { gosterim: "", tiklama: "", donusum: "" };
                          return (
                            <form
                              key={v.id}
                              className="flex items-end gap-2 flex-wrap rounded-lg border border-border p-3"
                              onSubmit={(e) => {
                                e.preventDefault();
                                void islem(
                                  `sonuc-${t.id}-${v.id}`,
                                  () =>
                                    trpc.kanit.sonucGir.mutate({
                                      workspaceId,
                                      testId: t.id,
                                      varyantId: v.id,
                                      gosterim: Number(f.gosterim),
                                      tiklama: Number(f.tiklama),
                                      donusum: Number(f.donusum),
                                    }),
                                  `Result recorded for variant ${v.id}.`,
                                );
                              }}
                            >
                              <span className="font-mono text-xs font-bold w-full">Variant {v.id} — add results</span>
                              {(["gosterim", "tiklama", "donusum"] as const).map((alan) => (
                                <input
                                  key={alan}
                                  required
                                  inputMode="numeric"
                                  placeholder={alan === "gosterim" ? "Impressions" : alan === "tiklama" ? "Clicks" : "Conversions"}
                                  value={f[alan]}
                                  onChange={(e) =>
                                    setFormSatir((s) => ({ ...s, [`${t.id}-${v.id}`]: { ...f, [alan]: e.target.value.replace(/[^\d]/g, "") } }))
                                  }
                                  className="w-28 h-10 rounded-md border border-input bg-background px-2 text-sm"
                                />
                              ))}
                              <button
                                type="submit"
                                disabled={mesgul !== ""}
                                className="h-10 px-4 rounded-md bg-[#181818] text-[#fcfcf9] text-sm font-semibold disabled:opacity-50"
                              >
                                Save
                              </button>
                            </form>
                          );
                        })}
                        <button
                          onClick={() => {
                            setCsvAcik(csvAcik === t.id ? null : t.id);
                            if (csvAcik !== t.id) {
                              trpc.kanit.csvSablonu.query({ workspaceId, testId: t.id }).then((r) => setCsvMetin(r.csv));
                            }
                          }}
                          className="h-10 px-4 rounded-lg border border-border text-sm font-semibold"
                        >
                          CSV entry
                        </button>
                        <button
                          disabled={mesgul !== ""}
                          onClick={() =>
                            void islem(`deger-${t.id}`, async () => {
                              const r = await trpc.kanit.degerlendir.mutate({ workspaceId, testId: t.id });
                              if ("gerekce" in r && r.gerekce) {
                                toast.warning(r.gerekce);
                                throw new Error("__sessiz");
                              }
                            }, "Test completed — winner recorded in the evidence file.")
                          }
                          className="h-10 px-4 rounded-lg bg-[#0d6e3f] text-white font-bold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                        >
                          Evaluate (z-test)
                        </button>
                      </>
                    )}
                  </div>

                  {csvAcik === t.id && t.durum === "calisiyor" && (
                    <div className="mt-4 rounded-lg border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Paste rows in the template format (<code>varyant_id,tarih,gosterim,tiklama,donusum</code> — header line required). Each row is one
                        day's increment; a day that was already imported is rejected, so re-uploading a file never double-counts.
                      </p>
                      <textarea
                        rows={4}
                        value={csvMetin}
                        onChange={(e) => setCsvMetin(e.target.value)}
                        className="w-full rounded-md border border-input bg-card px-3 py-2 font-mono text-xs"
                      />
                      <button
                        disabled={mesgul !== ""}
                        onClick={() =>
                          void islem(`csv-${t.id}`, () => trpc.kanit.csvSonucGir.mutate({ workspaceId, testId: t.id, csv: csvMetin }), "CSV results recorded.")
                        }
                        className="mt-2 h-10 px-4 rounded-md bg-[#181818] text-[#fcfcf9] text-sm font-semibold disabled:opacity-50"
                      >
                        Import CSV
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <h2 className="font-display text-2xl">Evidence files</h2>
          {kanitlar.length > 0 && (
            <button
              onClick={() =>
                void trpc.kanit.kanitDisaAktar.query({ workspaceId }).then((r) => {
                  const blob = new Blob([r.markdown], { type: "text/markdown" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "konum-evidence.md";
                  a.click();
                  URL.revokeObjectURL(a.href);
                })
              }
              className="h-10 px-4 rounded-lg border border-border text-sm font-semibold"
            >
              Export (Markdown)
            </button>
          )}
        </div>
        {kanitlar.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            No evidence yet. When a test finds a statistically significant winner (p &lt; 0.05), the winning message is
            recorded here — and written back into the Strategy Memory.
          </p>
        ) : (
          <ul className="grid gap-4">
            {kanitlar.map((k) => (
              <li key={k.id} className="rounded-xl border border-[#0d6e3f]/30 bg-[#0d6e3f]/5 p-5">
                <p className="text-xs text-muted-foreground mb-2">{tarihYaz(k.createdAt)}</p>
                <p className="font-semibold mb-1">&ldquo;{k.kazananMesaj}&rdquo;</p>
                <p className="text-sm text-muted-foreground">{k.ogrenim}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
