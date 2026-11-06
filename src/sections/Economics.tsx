import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

export default function Economics() {
  return (
    <section id="math" className="py-20 md:py-32 relative overflow-hidden">
      <div className="blob bg-[#f5a409]/25 w-[360px] h-[360px] -top-10 -right-24" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
        <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="eyebrow text-[#c52a00] mb-4">
          Pilot scope
        </motion.p>
        <h2 className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[24ch]">
          Agree the work before the pilot starts.
        </h2>
        <p className="mt-5 max-w-[66ch] text-lg text-foreground/70">
          Start with one workspace and a defined marketing question. Confirm the deliverables, responsibilities and current product limits in writing.
        </p>
        <div className="mt-12 grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-white/60 p-7">
            <h3 className="font-display font-bold text-2xl mb-4">What to agree</h3>
            <ul className="list-disc pl-5 space-y-3 text-foreground/75">
              <li>The product, audience and sources to review.</li>
              <li>The draft variations, approval steps and export formats.</li>
              <li>Who runs any real tests, enters results and publishes the approved material.</li>
              <li>The usage limits, support scope, duration and cancellation terms.</li>
            </ul>
            <p className="mt-6 text-sm text-foreground/65">
              v1 does not run campaigns, publish into your accounts or spend an advertising budget. A simulated example is not a customer result.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-[#181818] text-[#fcfcf9] p-7 flex flex-col">
            <p className="eyebrow text-[#ff8a66] mb-6">Pilot price target</p>
            <p className="font-display font-black text-6xl">$149<span className="text-xl font-bold text-[#fcfcf9]/60"> / workspace / month</span></p>
            <p className="mt-6 text-sm text-[#fcfcf9]/75 leading-relaxed">
              This is a pilot target, not an active subscription or an agreed quote. The final price and any applicable taxes, limits or additional charges must be confirmed in writing before you accept an engagement.
            </p>
            <p className="mt-5 text-sm text-[#fcfcf9]/75 leading-relaxed">
              Applying for early access does not create a payment obligation. No conversion rate, customer count or revenue is guaranteed.
            </p>
            <a href="#pilot" className="mt-8 inline-flex w-fit rounded-md bg-[#ff8a66] px-5 py-3 font-bold text-[#181818]">Ask about a pilot</a>
          </div>
        </div>
      </div>
    </section>
  )
}
