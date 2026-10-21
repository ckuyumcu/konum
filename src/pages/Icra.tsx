import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";
import { tarihYaz } from "../lib/format";

interface Kanit {
  id: string;
  kazananMesaj: string;
  ogrenim: string;
  createdAt: number;
}

interface Icerik {
  id: string;
  evidenceId: string;
  kanal: string;
  baslik: string;
  govde: string;
  durum: string;
  denetciNotu: string;
  surum: number;
  kuyrugaGiris: number | null;
  createdAt: number;
}

const KANAL_ETIKET: Record<string, string> = { eposta: "Email", sosyal: "Social", reklam: "Ad" };

const DURUM_ETIKET: Record<string, { ad: string; renk: string }> = {
  denetimde: { ad: "Auditor review", renk: "text-[#c52a00] border-[#c52a00]/40" },
  onayKuyrugu: { ad: "In approval queue", renk: "text-[#b45309] border-[#b45309]/40" },
  revize: { ad: "Revision requested", renk: "text-[#b45309] border-[#b45309]/40" },
  onayli: { ad: "Approved", renk: "text-[#0d6e3f] border-[#0d6e3f]/40" },
  reddedildi: { ad: "Rejected", renk: "text-muted-foreground border-border" },
  paketlendi: { ad: "Packaged", renk: "text-[#0d6e3f] border-[#0d6e3f]/40" },
};

export default function Icra() {
  const { workspaceId, bellekOnayli } = useShell();
  const [kanitlar, setKanitlar] = useState<Kanit[]>([]);
  const [icerikler, setIcerikler] = useState<Icerik[]>([]);
  const [mesgul, setMesgul] = useState("");
  const [duzenleme, setDuzenleme] = useState<Icerik | null>(null);
  const [dBaslik, setDBaslik] = useState("");
  const [dGovde, setDGovde] = useState("");

  const yenile = useCallback(() => {
    trpc.kanit.kanitlar.query({ workspaceId }).then((r) => setKanitlar(r as Kanit[]));
    trpc.icra.icerikler.query({ workspaceId }).then((r) => setIcerikler(r as Icerik[]));
  }, [workspaceId]);

  useEffect(yenile, [yenile]);

  if (!bellekOnayli) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <h1 className="font-display text-2xl mb-3">This module is locked</h1>
        <p className="text-muted-foreground">Approve the Strategy Memory first — the Execution Studio writes from that single source.</p>
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

  function duzenleAc(item: Icerik) {
    setDuzenleme(item);
    setDBaslik(item.baslik);
    setDGovde(item.govde);
  }

  return (
    <div className="max-w-4xl grid gap-12">
      <section>
        <p className="eyebrow text-muted-foreground mb-1">EXECUTION STUDIO</p>
        <h1 className="font-display text-2xl mb-6">Proven messages → channel variations</h1>
        {kanitlar.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            No evidence yet. When the Evidence Engine records a statistically proven winning message, it appears here and
            you can turn it into email, social and ad variations with one click.
          </p>
        ) : (
          <ul className="grid gap-4">
            {kanitlar.map((k, i) => (
              <motion.li
                key={k.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-[#0d6e3f]/30 bg-[#0d6e3f]/5 p-5 flex items-start justify-between gap-4 flex-wrap"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{tarihYaz(k.createdAt)}</p>
                  <p className="font-semibold mb-1">&ldquo;{k.kazananMesaj}&rdquo;</p>
                  <p className="text-sm text-muted-foreground">{k.ogrenim}</p>
                </div>
                <button
                  disabled={mesgul !== ""}
                  onClick={() =>
                    void islem(
                      `var-${k.id}`,
                      async () => {
                        const r = await trpc.icra.varyasyonUret.mutate({ workspaceId, evidenceId: k.id });
                        if (r.mod === "simulasyon") {
                          toast.warning("Simulation output — real generation starts once the LLM connection is set up.");
                        }
                        if (r.denetci.karar !== "gecti") {
                          toast.warning(`Auditor held the draft: ${r.denetci.gerekce}`);
                        }
                      },
                      "Channel variations produced.",
                    )
                  }
                  className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold text-sm shrink-0 transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                >
                  {mesgul === `var-${k.id}` ? "Writer is working…" : "Generate channel variations"}
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-6">Content items</h2>
        {icerikler.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            No content yet. Generate variations from an evidence file above; items that pass the Auditor go straight to
            the Approval Center queue.
          </p>
        ) : (
          <ul className="grid gap-4">
            {icerikler.map((c) => {
              const durum = DURUM_ETIKET[c.durum] ?? DURUM_ETIKET.denetimde;
              const duzenlenebilir = ["denetimde", "onayKuyrugu", "revize", "onayli"].includes(c.durum);
              return (
                <li key={c.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {KANAL_ETIKET[c.kanal] ?? c.kanal} · v{c.surum}
                    </p>
                    <span className={`text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${durum.renk}`}>
                      {durum.ad}
                    </span>
                  </div>
                  <p className="font-semibold mb-1">{c.baslik}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.govde}</p>
                  {c.denetciNotu && (
                    <p className="mt-3 text-sm rounded-lg border border-[#c52a00]/30 bg-[#c52a00]/5 text-[#c52a00] px-3 py-2">
                      Auditor: {c.denetciNotu}
                    </p>
                  )}
                  {duzenlenebilir && (
                    <div className="mt-4">
                      <button
                        onClick={() => duzenleAc(c)}
                        className="h-10 px-4 rounded-lg border border-[#181818] font-semibold text-sm transition-transform duration-200 active:scale-[0.97]"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {duzenleme && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDuzenleme(null)}>
          <div
            className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl mb-1">
              Edit — {KANAL_ETIKET[duzenleme.kanal] ?? duzenleme.kanal} v{duzenleme.surum}
            </h3>
            {duzenleme.durum === "onayli" && (
              <p className="mb-4 text-sm rounded-lg border border-[#b45309]/40 bg-[#b45309]/5 text-[#b45309] px-3 py-2">
                This item is approved. Saving a change invalidates that approval and sends the item back to the approval
                queue.
              </p>
            )}
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Headline</label>
            <input
              value={dBaslik}
              onChange={(e) => setDBaslik(e.target.value)}
              className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm mb-4"
            />
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Body</label>
            <textarea
              rows={8}
              value={dGovde}
              onChange={(e) => setDGovde(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDuzenleme(null)} className="h-10 px-4 rounded-lg border border-border text-sm font-semibold">
                Cancel
              </button>
              <button
                disabled={mesgul !== "" || dBaslik.trim().length < 3 || dGovde.trim().length < 10}
                onClick={() =>
                  void islem(
                    "kaydet",
                    async () => {
                      const r = await trpc.icra.duzenle.mutate({
                        workspaceId,
                        icerikId: duzenleme.id,
                        baslik: dBaslik.trim(),
                        govde: dGovde.trim(),
                      });
                      if (r.durum === "onayKuyrugu" && duzenleme.durum === "onayli") {
                        toast.warning("Approval invalidated — the item returned to the approval queue.");
                      }
                      setDuzenleme(null);
                    },
                    "Saved.",
                  )
                }
                className="h-10 px-5 rounded-lg bg-[#ff3500] text-[#181818] font-bold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
              >
                {mesgul === "kaydet" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
