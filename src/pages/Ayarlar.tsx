import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";
import { AJAN_ADLARI, tarihYaz } from "../lib/format";

interface LlmDurum {
  saglayici: string;
  model: string;
  anahtarKaynagi: "env" | "dosya" | "yok";
  aktifMod: "llm" | "simulasyon";
}

// LLM key section — visible only to the platform owner (also enforced on the server).
// Once entered, the key is never shown again; it never returns to the client.
function LlmAyar() {
  const [durum, setDurum] = useState<LlmDurum | null>(null);
  const [anahtar, setAnahtar] = useState("");
  const [mesgul, setMesgul] = useState(false);

  const yenile = () => {
    trpc.ayarlar.llmDurumu
      .query()
      .then((d) => setDurum(d as LlmDurum))
      .catch(() => setDurum(null));
  };
  useEffect(yenile, []);

  if (!durum) return null;

  return (
    <section>
      <h2 className="font-display text-2xl mb-4">LLM connection</h2>
      <div className="rounded-xl border border-border bg-card p-5 grid gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap text-sm">
          <p>
            Provider: <strong>{durum.saglayici}</strong> · Model: <strong>{durum.model}</strong>
          </p>
          <span
            className={`text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${
              durum.aktifMod === "llm"
                ? "text-[#0d6e3f] border-[#0d6e3f]/40"
                : "text-[#c52a00] border-[#c52a00]/40"
            }`}
          >
            {durum.aktifMod === "llm" ? "Live calls active" : "Simulation mode"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Key status:{" "}
          {durum.anahtarKaynagi === "env"
            ? "Defined in the .env file"
            : durum.anahtarKaynagi === "dosya"
              ? "Defined in the secret file (entered here)"
              : "Not set — agents are producing simulation-labeled drafts."}
        </p>
        <form
          className="flex gap-3 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            setMesgul(true);
            trpc.ayarlar.llmAnahtariKaydet
              .mutate({ anahtar })
              .then(() => {
                setAnahtar("");
                toast.success("Key saved; it will not be shown again.");
                yenile();
              })
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save."))
              .finally(() => setMesgul(false));
          }}
        >
          <input
            type="password"
            value={anahtar}
            onChange={(e) => setAnahtar(e.target.value)}
            placeholder="sk-ant-…"
            autoComplete="off"
            className="flex-1 min-w-56 h-11 rounded-lg border border-input bg-card px-3 text-base"
          />
          <button
            type="submit"
            disabled={mesgul || anahtar.trim().length < 10}
            className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            Save key
          </button>
          {durum.anahtarKaynagi === "dosya" && (
            <button
              type="button"
              onClick={() => {
                setMesgul(true);
                trpc.ayarlar.llmAnahtariKaldir
                  .mutate()
                  .then(() => {
                    toast.success("Key deleted.");
                    yenile();
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Could not delete."))
                  .finally(() => setMesgul(false));
              }}
              className="h-11 px-5 rounded-lg border border-[#c52a00] text-[#c52a00] font-semibold transition-transform duration-200 active:scale-[0.97]"
            >
              Remove key
            </button>
          )}
        </form>
        <p className="text-xs text-muted-foreground">
          The key is written to a secret file outside the project on the server (~/.konum), never enters git,
          and never returns to the client. Alternative: add ANTHROPIC_API_KEY to the .env file at the project root.
        </p>
      </div>
    </section>
  );
}

interface Entegrasyon {
  ad: string;
  durum: string;
  aciklama: string;
}

interface LogSatiri {
  id: string;
  ajan: string;
  girdiOzeti: string;
  ciktiOzeti: string;
  denetciKarari: string;
  mod: string;
  zaman: number;
}

export default function Ayarlar() {
  const { workspaceId } = useShell();
  const [entegrasyonlar, setEntegrasyonlar] = useState<Entegrasyon[]>([]);
  const [loglar, setLoglar] = useState<LogSatiri[]>([]);
  const [platformSahibi, setPlatformSahibi] = useState(false);

  useEffect(() => {
    trpc.ayarlar.entegrasyonlar.query().then((e) => setEntegrasyonlar(e as Entegrasyon[]));
    trpc.ajanlar.logs.query({ workspaceId }).then((l) => setLoglar(l as LogSatiri[]));
    trpc.auth.me.query().then((me) => setPlatformSahibi(Boolean(me?.platformSahibi)));
  }, [workspaceId]);

  return (
    <div className="max-w-3xl grid gap-12">
      {platformSahibi && <LlmAyar />}
      <section>
        <p className="eyebrow text-muted-foreground mb-1">SETTINGS</p>
        <h1 className="font-display text-2xl mb-6">Integrations</h1>
        <ul className="grid gap-3">
          {entegrasyonlar.map((e) => (
            <li key={e.ad} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{e.ad}</p>
                <p className="text-sm text-muted-foreground">{e.aciklama}</p>
              </div>
              <span
                className={`shrink-0 text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${
                  e.durum === "aktif"
                    ? "text-[#0d6e3f] border-[#0d6e3f]/40"
                    : "text-muted-foreground border-border"
                }`}
              >
                {e.durum === "aktif" ? "Active" : "Planned"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          No integration is shown as "connected" unless its API is actually wired up.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Data processing</h2>
        <div className="rounded-xl border border-border bg-card p-5 text-sm grid gap-3">
          <p>
            Customer texts you upload (reviews, FAQs, support logs) are masked before being sent to the LLM:
            names, emails, and phone numbers are anonymized.
          </p>
          <p>
            Every agent call is written to the log below; approvals and rejections are recorded too.
            This transparency is a boundary of responsibility you can show your clients.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Agent log</h2>
        {loglar.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-border bg-card p-5">
            No agent records yet. When you run the setup wizard, Researcher, Strategist, and
            Auditor records will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Input</th>
                  <th className="px-4 py-3 font-semibold">Output</th>
                  <th className="px-4 py-3 font-semibold">Auditor</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                </tr>
              </thead>
              <tbody>
                {loglar.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 align-top last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{tarihYaz(l.zaman)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{AJAN_ADLARI[l.ajan] ?? l.ajan}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-56">{l.girdiOzeti}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-56">{l.ciktiOzeti}</td>
                    <td className="px-4 py-3">
                      {l.denetciKarari === "uygulanamaz" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : l.denetciKarari.startsWith("reddedildi") ? (
                        <span className="text-[#c52a00]">{l.denetciKarari}</span>
                      ) : (
                        <span className="text-[#0d6e3f]">Passed</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.mod === "simulasyon" ? (
                        <span className="text-[#c52a00] font-semibold">Simulation</span>
                      ) : l.mod === "llm" ? (
                        <span className="text-[#0d6e3f] font-semibold">LLM</span>
                      ) : (
                        <span className="text-muted-foreground">{l.mod}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
