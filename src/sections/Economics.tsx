import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

// Unit economics — owner directive 2026-10-21: show what a client costs us
// and what we charge. Every figure carries its assumption; no invented totals.
const costs = [
  { item: 'LLM calls (claude-haiku-5-5)', basis: '50 calls/day cap × 30 days, ~2K in / ~0.5K out tokens per call', usd: 0.7 },
  { item: 'Hosting share', basis: 'One VPS, ~50 workspaces per instance', usd: 1.5 },
  { item: 'Email + domain + monitoring', basis: 'Shared infrastructure, per workspace', usd: 0.8 },
]
const totalCost = costs.reduce((a, c) => a + c.usd, 0)
const pilotPrice = 149

export default function Economics() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const margin = Math.round(((pilotPrice - totalCost) / pilotPrice) * 100)

  return (
    <section id="ekonomi" className="py-20 md:py-32 relative overflow-hidden">
      <div className="blob bg-[#f5a409]/25 w-[360px] h-[360px] top-10 -right-24" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#c52a00] mb-4"
        >
          The math, out in the open
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[24ch]"
        >
          A client costs us <span className="gradient-text">about $3 a month.</span> We charge for the proof, not the tokens.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
          className="mt-5 max-w-[66ch] text-lg text-foreground/70"
        >
          Most tools resell compute with a markup and call it a product. We&apos;d rather show you the receipt.
          Here is what one client workspace costs us at full throttle — and what we plan to charge in the pilot.
        </motion.p>

        <div ref={ref} className="mt-12 grid lg:grid-cols-2 gap-6">
          {/* Cost breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="rounded-xl border border-border bg-white/60 p-7"
          >
            <p className="eyebrow text-foreground/50 mb-6">What one workspace costs us / month</p>
            <ul className="space-y-5">
              {costs.map((c) => (
                <li key={c.item}>
                  <div className="flex justify-between text-sm font-semibold mb-1.5">
                    <span>{c.item}</span>
                    <span className="font-mono">${c.usd.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#efefe4] overflow-hidden">
                    {inView && (
                      <div
                        className="fill-bar-x h-full rounded-full bg-gradient-to-r from-[#ff3500] to-[#f43f5e]"
                        style={{ width: `${Math.max(4, (c.usd / pilotPrice) * 100)}%` }}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-foreground/50">{c.basis}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-border flex justify-between items-baseline">
              <span className="font-bold">Total cost per client</span>
              <span className="font-display font-black text-3xl text-[#c52a00]">≈ ${totalCost.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-xs text-foreground/50">
              LLM rate: $0.10 / 1M input, $0.50 / 1M output tokens (Anthropic rate card, October 2026). Assumptions, not promises.
            </p>
          </motion.div>

          {/* Price + margin */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: easeOut, delay: 0.1 }}
            className="rounded-xl border border-border bg-[#181818] text-[#fcfcf9] p-7 flex flex-col"
          >
            <p className="eyebrow text-[#ff8a66] mb-6">What we charge in the pilot</p>
            <p className="font-display font-black text-6xl">
              ${pilotPrice}
              <span className="text-xl font-bold text-[#fcfcf9]/60"> / workspace / month</span>
            </p>
            <div className="mt-8">
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span>Gross margin at pilot price</span>
                <span className="font-mono text-[#f5a409]">{inView ? `${margin}%` : '—'}</span>
              </div>
              <div className="h-3.5 rounded-full bg-[#fcfcf9]/10 overflow-hidden">
                {inView && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#f5a409] via-[#ff3500] to-[#8b5cf6] transition-all duration-1000"
                    style={{ width: `${margin}%` }}
                  />
                )}
              </div>
            </div>
            <p className="mt-8 text-sm text-[#fcfcf9]/65 leading-relaxed">
              That margin is the point: when intelligence is nearly free, the product isn&apos;t the tokens — it&apos;s the
              evidence discipline. Price is finalized with the first 10 pilot agencies, against the value we actually prove.
            </p>
            <p className="mt-auto pt-6 text-xs text-[#fcfcf9]/45">
              Pilot target, not a published price list. The final number is set with pilot agencies on measured value.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
