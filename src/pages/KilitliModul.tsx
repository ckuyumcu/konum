import { Link } from "react-router";
import { useShell } from "../app/AppShell";

const ACIKLAMALAR: Record<string, { ad: string; asama: number; ne: string }> = {
  kanit: {
    ad: "Evidence Engine",
    asama: 2,
    ne: "The Strategist Assistant proposes 2–3 message hypotheses; you pick one, and the Test Designer sets up a small-budget A/B test plan. The winning variant is recorded in the evidence file.",
  },
  icra: {
    ad: "Execution Studio",
    asama: 3,
    ne: "Channel variations are produced from the proven message: Instagram copy, Meta Ads primary text, Google Ads headlines, email subject and body.",
  },
  onay: {
    ad: "Approval Center",
    asama: 3,
    ne: "The single publishing gate. Approve / Request revision / Reject for every item. No bulk approval — each item requires an individual decision.",
  },
  radar: {
    ad: "Signal Radar",
    asama: 4,
    ne: "The Analyst agent writes the weekly 'what we learned' digest and raises an alarm if the evidence file goes stale or the competitor message map shifts.",
  },
};

export default function KilitliModul({ modul }: { modul: string }) {
  const { bellekOnayli } = useShell();
  const bilgi = ACIKLAMALAR[modul];

  if (!bilgi) return <p className="text-muted-foreground">Module not found.</p>;

  if (!bellekOnayli) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <svg className="mx-auto mb-4 text-muted-foreground" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <p className="eyebrow text-muted-foreground mb-2">{bilgi.ad.toLocaleUpperCase("en")}</p>
        <h1 className="font-display text-2xl mb-3">This module is locked</h1>
        <p className="text-muted-foreground mb-6">
          {bilgi.ad} won&apos;t run before the Strategy Memory is approved — memory is the single
          strategy source the agents rely on. Review and approve the memory first.
        </p>
        <Link
          to="../bellek"
          className="inline-flex h-11 px-5 items-center rounded-lg bg-[#ff3500] text-[#181818] font-bold transition-transform duration-200 active:scale-[0.97]"
        >
          Go to Strategy Memory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-muted-foreground mb-2">{bilgi.ad.toLocaleUpperCase("en")}</p>
      <h1 className="font-display text-2xl mb-4">{bilgi.ad}</h1>
      <p className="text-muted-foreground mb-6">{bilgi.ne}</p>
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <strong>In scope for Phase {bilgi.asama}.</strong> Your memory approval is done; this module
        will be built in the next phase. There are no fake buttons or demo data on this screen.
      </p>
    </div>
  );
}
