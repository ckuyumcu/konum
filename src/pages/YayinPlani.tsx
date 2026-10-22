import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";

interface PlanOge {
  id: string;
  contentItemId: string;
  kanal: string;
  planlananTarih: string;
  durum: string; // planlandi | disaAktarildi | yayinlandiManuel | iptal
  not: string;
  olusturan: string;
  createdAt: number;
  updatedAt: number;
  baslik: string;
  icerikDurum: string;
}

interface AdayOge {
  id: string;
  kanal: string;
  baslik: string;
  durum: string;
  aktifPlanId: string | null;
}

const KANAL_AD: Record<string, string> = { eposta: "Email", sosyal: "Social", reklam: "Ad" };

const DURUM_STIL: Record<string, { ad: string; sinif: string }> = {
  planlandi: { ad: "Planned", sinif: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  disaAktarildi: { ad: "Exported", sinif: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  yayinlandiManuel: { ad: "Published (manual)", sinif: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  iptal: { ad: "Cancelled", sinif: "border-border bg-muted text-muted-foreground" },
};

function bugunStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function YayinPlani() {
  const { workspaceId, bellekOnayli } = useShell();
  const [planlar, setPlanlar] = useState<PlanOge[]>([]);
  const [adaylar, setAdaylar] = useState<AdayOge[]>([]);
  const [mesgul, setMesgul] = useState("");
  const [kanalFiltre, setKanalFiltre] = useState("hepsi");
  const [ekleAcik, setEkleAcik] = useState(false);
  const [seciliIcerik, setSeciliIcerik] = useState("");
  const [tarih, setTarih] = useState(bugunStr());
  const [not, setNot] = useState("");
  const [metinPencere, setMetinPencere] = useState<{ baslik: string; metin: string } | null>(null);
  const [yayinOnay, setYayinOnay] = useState<PlanOge | null>(null);

  const yenile = useCallback(() => {
    trpc.yayinPlani.liste.query({ workspaceId }).then((r) => setPlanlar(r as PlanOge[]));
    trpc.yayinPlani.planlanabilir.query({ workspaceId }).then((r) => setAdaylar(r as AdayOge[]));
  }, [workspaceId]);

  useEffect(yenile, [yenile]);

  const islem = useCallback(
    async (anahtar: string, fn: () => Promise<unknown>, basari: string) => {
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
    },
    [yenile],
  );

  const disariAktar = useCallback(
    async (plan: PlanOge) => {
      setMesgul(`aktar-${plan.id}`);
      try {
        const r = await trpc.yayinPlani.disariAktar.mutate({ workspaceId, planId: plan.id });
        setMetinPencere({ baslik: plan.baslik || KANAL_AD[plan.kanal] || plan.kanal, metin: r.metin });
        yenile();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Export failed.");
      } finally {
        setMesgul("");
      }
    },
    [workspaceId, yenile],
  );

  if (!bellekOnayli) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <h1 className="font-display text-2xl mb-3">This module is locked</h1>
        <p className="text-sm text-muted-foreground">Approve the Strategy Memory first — every module reads from it.</p>
      </div>
    );
  }

  const filtreli = planlar.filter((p) => kanalFiltre === "hepsi" || p.kanal === kanalFiltre);
  const ekleyebilir = adaylar.filter((a) => !a.aktifPlanId);

  return (
    <div className="mx-auto max-w-4xl px-1 py-2">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-bold">Publish Plan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The platform never posts to your accounts. Export the text, publish it yourself, then mark it here — the
          record stays honest. <span className="font-semibold text-foreground">Auto-publishing arrives in v1.1.</span>
        </p>
      </motion.header>

      {/* Channel filter + add */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {["hepsi", "eposta", "sosyal", "reklam"].map((k) => (
          <button
            key={k}
            onClick={() => setKanalFiltre(k)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 min-h-11 sm:min-h-0 ${
              kanalFiltre === k
                ? "border-[#ff3500]/50 bg-[#ff3500]/10 text-[#ff3500]"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {k === "hepsi" ? "All" : KANAL_AD[k]}
          </button>
        ))}
        <button
          onClick={() => setEkleAcik((a) => !a)}
          className="ml-auto rounded-lg bg-[#ff3500] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 min-h-11"
        >
          {ekleAcik ? "Close" : "+ Add to plan"}
        </button>
      </div>

      {/* Add panel */}
      {ekleAcik && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-xl border border-border bg-card p-5"
        >
          {ekleyebilir.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved content waiting for a plan. Approve items in the Approval Center first.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Approved content
                <select
                  value={seciliIcerik}
                  onChange={(e) => setSeciliIcerik(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground min-h-11"
                >
                  <option value="">Select…</option>
                  {ekleyebilir.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{KANAL_AD[a.kanal] ?? a.kanal}] {a.baslik || "(untitled)"} — {a.durum === "paketlendi" ? "packaged" : "approved"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
                Date
                <input
                  type="date"
                  value={tarih}
                  min={bugunStr()}
                  onChange={(e) => setTarih(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground min-h-11"
                />
              </label>
              <button
                disabled={!seciliIcerik || mesgul === "planla"}
                onClick={() =>
                  void islem(
                    "planla",
                    () =>
                      trpc.yayinPlani.planla.mutate({ workspaceId, contentItemId: seciliIcerik, planlananTarih: tarih, not }),
                    "Added to the plan.",
                  ).then(() => {
                    setSeciliIcerik("");
                    setNot("");
                    setEkleAcik(false);
                  })
                }
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-40 min-h-11"
              >
                {mesgul === "planla" ? "Adding…" : "Plan it"}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Plan list */}
      <ul className="mt-6 grid gap-3">
        {filtreli.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing here yet. Approved content you add to the plan shows up in this list.
          </li>
        )}
        {filtreli.map((p, i) => {
          const stil = DURUM_STIL[p.durum] ?? DURUM_STIL.planlandi;
          const gecti = p.durum !== "yayinlandiManuel" && p.durum !== "iptal" && p.planlananTarih < bugunStr();
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-semibold">
                      {KANAL_AD[p.kanal] ?? p.kanal}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${stil.sinif}`}>{stil.ad}</span>
                    {gecti && (
                      <span className="rounded-full border border-[#c52a00]/40 bg-[#c52a00]/10 px-2.5 py-0.5 text-xs font-bold text-[#c52a00]">
                        Date passed
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug">{p.baslik || "(untitled)"}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.planlananTarih} · planned by {p.olusturan}
                    {p.not ? ` · ${p.not}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(p.durum === "planlandi" || p.durum === "disaAktarildi") && (
                    <>
                      <button
                        disabled={mesgul === `aktar-${p.id}`}
                        onClick={() => void disariAktar(p)}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted min-h-11 sm:min-h-0"
                      >
                        {mesgul === `aktar-${p.id}` ? "Preparing…" : p.durum === "planlandi" ? "Copy publish text" : "Copy again"}
                      </button>
                      {p.durum === "disaAktarildi" && (
                        <button
                          onClick={() => setYayinOnay(p)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 min-h-11 sm:min-h-0"
                        >
                          Mark as published (manual)
                        </button>
                      )}
                      <button
                        onClick={() =>
                          void islem(
                            `iptal-${p.id}`,
                            () => trpc.yayinPlani.durumGuncelle.mutate({ workspaceId, planId: p.id, hedef: "iptal" }),
                            "Plan cancelled.",
                          )
                        }
                        className="rounded-lg border border-[#c52a00]/40 px-3 py-2 text-xs font-semibold text-[#c52a00] transition-colors hover:bg-[#c52a00]/5 min-h-11 sm:min-h-0"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {p.durum === "iptal" && (
                    <button
                      onClick={() =>
                        void islem(
                          `geri-${p.id}`,
                          () => trpc.yayinPlani.durumGuncelle.mutate({ workspaceId, planId: p.id, hedef: "planlandi" }),
                          "Plan reactivated.",
                        )
                      }
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted min-h-11 sm:min-h-0"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {/* Export text modal */}
      {metinPencere && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">{metinPencere.baslik}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste this into your own account. Nothing is posted automatically.
            </p>
            <textarea
              readOnly
              value={metinPencere.metin}
              rows={10}
              className="mt-4 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
              onFocus={(e) => e.target.select()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setMetinPencere(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold min-h-11 sm:min-h-0"
              >
                Close
              </button>
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(metinPencere.metin).then(
                    () => toast.success("Copied."),
                    () => toast.error("Copy failed — select the text manually."),
                  );
                }}
                className="rounded-lg bg-[#ff3500] px-4 py-2 text-sm font-semibold text-white min-h-11 sm:min-h-0"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark-as-published confirm */}
      {yayinOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Mark as published?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Confirm only if you actually published this in your own {KANAL_AD[yayinOnay.kanal] ?? yayinOnay.kanal}{" "}
              account. This is written to the audit trail and cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setYayinOnay(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold min-h-11 sm:min-h-0"
              >
                Not yet
              </button>
              <button
                onClick={() => {
                  const p = yayinOnay;
                  setYayinOnay(null);
                  void islem(
                    `yayin-${p.id}`,
                    () => trpc.yayinPlani.durumGuncelle.mutate({ workspaceId, planId: p.id, hedef: "yayinlandiManuel" }),
                    "Marked as published.",
                  );
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white min-h-11 sm:min-h-0"
              >
                Yes, it's live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
