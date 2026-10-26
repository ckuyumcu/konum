export default function Terms() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24">
        <p className="eyebrow text-[#c52a00] mb-3">KonumOS — legal</p>
        <h1 className="font-display font-black text-4xl leading-tight mb-8">Terms of use</h1>

        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>
            These terms govern the use of KonumOS, a product preview by AIWork School. Questions:
            <a href="mailto:hello@konumos.com" className="underline"> hello@konumos.com</a>
          </p>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">Product preview status</h2>
          <p>
            KonumOS is in pilot. Features may change, break or be removed. Demo figures on the site are simulated and
            labeled as such; they are not promises of results.
          </p>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">Human approval rule</h2>
          <p>
            The platform never publishes, posts or sends anything on your behalf without your explicit approval. You
            are responsible for what you approve and for complying with the rules of the channels you publish to.
          </p>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">Acceptable use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>No scraping or outreach targeting personal (consumer) email addresses.</li>
            <li>No misleading claims: anything labeled simulated stays labeled when you reuse it.</li>
            <li>No unlawful content, spam, or abuse of the sites you scan.</li>
          </ul>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">Pricing</h2>
          <p>
            The pilot target price ($149/workspace/month) is a target, not a commitment; final pilot terms are agreed
            in writing with each pilot participant before any payment.
          </p>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">Liability</h2>
          <p>
            The service is provided "as is" during the preview. To the extent permitted by law, AIWork School's
            liability is limited to the amount you paid us in the three months before the event giving rise to the
            claim.
          </p>

          <p className="text-sm text-foreground/50 pt-4">Last updated: October 2026.</p>
          <p className="pt-2">
            <a href="/" className="underline font-semibold">← Back to the main page</a>
          </p>
        </div>
      </main>
    </div>
  )
}
