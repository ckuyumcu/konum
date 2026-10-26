export default function Privacy() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24">
        <p className="eyebrow text-[#c52a00] mb-3">Konum — legal</p>
        <h1 className="font-display font-black text-4xl leading-tight mb-8">Privacy notice</h1>

        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>
            Konum is a product preview built by AIWork School. This notice explains, in plain language, what we store
            and why. Questions: <a href="mailto:hello@konumos.com" className="underline">hello@konumos.com</a>
          </p>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">What we store</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Pilot / report forms:</strong> the email address and (optional) agency or company name you type.
              Used only to contact you about the thing you asked for. Never sold, never shared for marketing by others.
            </li>
            <li>
              <strong>Account data:</strong> name and email used to sign in to the workspace area.
            </li>
            <li>
              <strong>Workspace content:</strong> site URLs you ask us to scan, strategy text you approve, drafts the
              system produces, and test results you enter. This is your working material; you can export it.
            </li>
            <li>
              <strong>LLM API keys:</strong> if you add one in Settings, it is written to a server-side local secrets
              file outside the project directory. It is never sent back to the browser, never shown again, and never
              committed to version control.
            </li>
          </ul>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">What we do not do</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not collect personal (consumer) email addresses for outreach lists.</li>
            <li>We do not publish, post or send anything automatically — every outward action waits for human approval.</li>
            <li>We do not use tracking cookies or third-party ad pixels on this page.</li>
          </ul>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">Simulated data</h2>
          <p>
            Demo numbers on the landing page are simulated and are labeled as such wherever they appear. They
            illustrate how the system behaves; they are not customer results.
          </p>

          <h2 className="font-display font-bold text-xl text-foreground pt-2">Your controls</h2>
          <p>
            Ask us any time to show, correct or delete what we hold about you:
            <a href="mailto:hello@konumos.com" className="underline"> hello@konumos.com</a>. Deletion
            requests are honored without argument.
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
