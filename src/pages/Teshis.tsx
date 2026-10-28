import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { trpc } from "../lib/trpc";

const easeOut = [0.16, 1, 0.3, 1] as const;

interface Harita {
  anaIddia: string;
  gucluKanitlar: string[];
  eksikKanitlar: string[];
  oneriler: string[];
  skor: number;
}

interface Sonuc {
  id: string;
  harita: Harita;
  baslik: string;
  mod: string;
}

export default function Teshis() {
  const [url, setUrl] = useState("");
  const [eposta, setEposta] = useState("");
  const [riza, setRiza] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);

  async function analiz(e: React.FormEvent) {
    e.preventDefault();
    setMesgul(true);
    setHata(null);
    try {
      const r = await trpc.teshis.olustur.mutate({ url: url.trim(), eposta: eposta.trim(), riza });
      setSonuc(r as Sonuc);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "The analysis failed. Please try again.");
    } finally {
      setMesgul(false);
    }
  }

  const skor = sonuc?.harita.skor ?? 0;
  const skorRenk = skor >= 60 ? "#0d6e3f" : skor >= 35 ? "#b45309" : "#c52a00";

  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-clip">
      <div className="noise-layer" aria-hidden="true" />
      <div className="blob bg-[#ff3500]/20 w-[400px] h-[400px] -top-24 -right-24 fixed" aria-hidden="true" />
      <div className="blob bg-[#8b5cf6]/15 w-[340px] h-[340px] bottom-0 -left-24 fixed" style={{ animationDelay: "-6s" }} aria-hidden="true" />

      <header className="border-b border-border relative">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="eyebrow text-foreground">KONUM</Link>
          <Link to="/#pilot" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Early access →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 relative">
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeOut }} className="eyebrow text-[#c52a00] mb-4">
          Free tool · Message Map
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] mb-4"
        >
          Can your message be <span className="gradient-text">proven?</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.14 }}
          className="text-lg text-foreground/70 mb-10 max-w-[58ch]"
        >
          Drop your product page URL. We scan it and hand you a blunt report: your core claim, the proof you already
          show, the claims you can&apos;t back up — and three concrete fixes. Free, 3 analyses a day.
        </motion.p>

        {!sonuc ? (
          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
            onSubmit={(e) => void analiz(e)}
            className="rounded-xl border border-border bg-white/60 p-7 grid gap-4 shadow-[0_4px_10px_rgba(0,0,0,0.06),0_24px_48px_-28px_rgba(0,0,0,0.22)]"
          >
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Product page URL</span>
              <input
                required
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourproduct.com"
                className="h-12 rounded-lg border-2 border-foreground/25 bg-[#fcfcf9] px-4 text-base font-medium placeholder:text-foreground/35 focus:border-foreground focus:outline-none"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">
                Email <span className="font-normal text-muted-foreground">(optional — stored with this analysis)</span>
              </span>
              <input
                type="email"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="you@company.com"
                className="h-12 rounded-lg border-2 border-foreground/25 bg-[#fcfcf9] px-4 text-base font-medium placeholder:text-foreground/35 focus:border-foreground focus:outline-none"
              />
            </label>
            {eposta.trim() && (
              <label className="flex items-start gap-3 text-sm text-foreground/70 cursor-pointer">
                <input type="checkbox" checked={riza} onChange={(e) => setRiza(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#181818]" />
                <span>
                  I agree to my email being stored with this analysis.{" "}
                  <a href="/privacy" className="underline decoration-foreground/40 hover:text-foreground">
                    Privacy notice
                  </a>
                  .
                </span>
              </label>
            )}
            <button
              type="submit"
              disabled={mesgul}
              className="h-12 rounded-lg bg-[#ff3500] text-[#181818] font-bold text-lg transition-transform duration-200 active:scale-[0.97] hover:bg-[#ff4d1f] disabled:opacity-50"
            >
              {mesgul ? "Scanning and analyzing…" : "Map my message"}
            </button>
            {hata && (
              <p role="alert" className="rounded-lg border border-[#c52a00]/40 bg-[#c52a00]/5 text-[#c52a00] px-4 py-3 text-sm font-semibold">
                {hata}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              We respect robots.txt and only read the public page. No email is required to see your report.
            </p>
          </motion.form>
        ) : (
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: easeOut }} className="grid gap-6">
            <div className="rounded-xl border border-border bg-white/60 p-7">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                <div>
                  <p className="eyebrow text-muted-foreground mb-1">MESSAGE MAP</p>
                  <p className="font-semibold">{sonuc.baslik || url}</p>
                </div>
                <div className="text-center">
                  <p className="font-display font-black text-5xl" style={{ color: skorRenk }}>
                    {skor}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">evidence score / 100</p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-[#efefe4] overflow-hidden mb-6">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, #f5a409, ${skorRenk})` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${skor}%` }}
                  transition={{ duration: 1.2, ease: easeOut }}
                />
              </div>
              <p className="eyebrow text-muted-foreground mb-1">CORE CLAIM</p>
              <p className="text-lg font-medium mb-6">{sonuc.harita.anaIddia}</p>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="eyebrow text-[#0d6e3f] mb-2">PROOF YOU ALREADY SHOW</p>
                  <ul className="space-y-2 text-sm">
                    {sonuc.harita.gucluKanitlar.length > 0 ? (
                      sonuc.harita.gucluKanitlar.map((g) => <li key={g}>✓ {g}</li>)
                    ) : (
                      <li className="text-muted-foreground">No concrete proof found on the page.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow text-[#c52a00] mb-2">CLAIMS WITHOUT PROOF</p>
                  <ul className="space-y-2 text-sm">
                    {sonuc.harita.eksikKanitlar.map((g) => (
                      <li key={g}>✗ {g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="eyebrow text-muted-foreground mt-6 mb-2">THREE FIXES</p>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                {sonuc.harita.oneriler.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ol>

              {sonuc.mod === "simulasyon" && (
                <p className="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-[#c52a00] border border-[#c52a00]/40 rounded-full px-3 py-1">
                  Simulation output — the live model is not connected yet
                </p>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <a
                href={`/api/teshis/${sonuc.id}.pdf`}
                className="inline-flex h-11 px-5 items-center rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold transition-transform duration-200 active:scale-[0.97]"
              >
                Download the report (PDF)
              </a>
              <button
                onClick={() => {
                  setSonuc(null);
                  setUrl("");
                }}
                className="h-11 px-5 rounded-lg border-2 border-foreground/20 font-bold text-sm transition-all duration-150 hover:border-foreground"
              >
                Analyze another site
              </button>
            </div>

            <p className="rounded-xl border border-[#ff3500]/30 bg-[#ff3500]/5 p-5 text-sm">
              <strong>This Message Map is a starting point for human review.</strong> It does not prove demand or a campaign result.
              The v1 preview does not run live tests, spend your budget or publish into your accounts.{" "}
              <Link to="/#pilot" className="underline font-semibold">Join the pilot →</Link>
            </p>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-border py-8 relative">
        <p className="max-w-3xl mx-auto px-6 text-xs text-muted-foreground">
          © 2026 KonumOS, an AIWork School company. Free analyses are limited to 3 per day per visitor, 100 per day in total.
        </p>
      </footer>
    </div>
  );
}
