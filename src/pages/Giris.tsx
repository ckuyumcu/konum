import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

// Local sign-in: email + invite code (Kimi OAuth is unavailable in this environment — documented in README).
// Users without an invite cannot enter the app (v2 Section 4).
export default function Giris() {
  const navigate = useNavigate();
  const [eposta, setEposta] = useState("");
  const [davetKodu, setDavetKodu] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setMesgul(true);
    setHata(null);
    try {
      const res = await fetch("/api/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eposta, davetKodu }),
      });
      const json = (await res.json()) as { ok?: boolean; hata?: string };
      if (!res.ok) {
        setHata(json.hata || "Sign-in failed.");
        return;
      }
      navigate("/app");
    } catch {
      setHata("Could not reach the server. Is the dev server running?");
    } finally {
      setMesgul(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#181818] text-[#fcfcf9] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <p className="eyebrow text-[#ff3500] mb-4">KONUM</p>
        <h1 className="font-display text-4xl leading-tight mb-3">
          Sign in to the marketing operating system
        </h1>
        <p className="text-[#fcfcf9]/70 mb-8">
          Accounts are opened by invitation. If you don&apos;t have an invite code, contact the platform owner.
        </p>

        <form onSubmit={(e) => void gonder(e)} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Email</span>
            <input
              type="email"
              required
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              placeholder="you@youragency.com"
              className="h-12 rounded-lg border border-white/20 bg-white/5 px-3 text-base text-[#fcfcf9] placeholder:text-[#fcfcf9]/35"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Invite code</span>
            <input
              required
              value={davetKodu}
              onChange={(e) => setDavetKodu(e.target.value)}
              placeholder="E.g. KONUM-XXXX-1"
              className="h-12 rounded-lg border border-white/20 bg-white/5 px-3 text-base text-[#fcfcf9] placeholder:text-[#fcfcf9]/35"
            />
          </label>

          {hata && (
            <p role="alert" className="rounded-lg border border-[#ff3500]/50 bg-[#ff3500]/10 px-4 py-3 text-sm">
              {hata}
            </p>
          )}

          <button
            type="submit"
            disabled={mesgul}
            className="h-12 rounded-lg bg-[#ff3500] text-[#181818] font-bold text-lg transition-transform duration-200 active:scale-[0.97] hover:bg-[#ff4d1f] disabled:opacity-50"
          >
            {mesgul ? "Checking…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#fcfcf9]/50">
          Local development build: a local session is opened with email + invite code instead of Kimi OAuth.
        </p>
      </motion.div>
    </div>
  );
}
