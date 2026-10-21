import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

type Variant = { label: string; text: string; ctr: number; note: string }
type Product = { id: string; name: string; a: Variant; b: Variant; why: string }

const products: Product[] = [
  {
    id: 'kahve',
    name: 'Boutique coffee subscription',
    a: {
      label: 'A · Generic AI tone',
      text: 'Quality coffee delivered to your door! Fresh, tasty, affordable. Try it now!',
      ctr: 1.8,
      note: 'Sentences anyone could write. No claim, no evidence, no story.',
    },
    b: {
      label: 'B · Evidence-driven',
      text: 'The roast date is printed on your bag: roasted 12 days ago, shipped yesterday.',
      ctr: 4.6,
      note: 'A concrete, verifiable claim with a story behind it.',
    },
    why: 'Variant B offers a specific piece of evidence: the roast date. "Quality" is a claim; "roasted 12 days ago" is evidence. The Evidence Engine searches for exactly this difference.',
  },
  {
    id: 'saas',
    name: 'SaaS appointment tool',
    a: {
      label: 'A · Generic AI tone',
      text: 'Manage your appointments easily! Modern interface, quick setup. Try it free!',
      ctr: 2.1,
      note: 'A feature list without a single benefit statement.',
    },
    b: {
      label: 'B · Evidence-driven',
      text: 'A no-show client is an hour gone forever. Reminders go out on the channel your clients actually answer.',
      ctr: 4.1,
      note: 'Names the pain plainly and ties the fix to behavior.',
    },
    why: 'Variant B describes the problem in the customer\'s own words ("an hour gone forever"). That language is mined from customer conversations — the Evidence Engine scans for it automatically.',
  },
  {
    id: 'seramik',
    name: 'Handmade ceramics',
    a: {
      label: 'A · Generic AI tone',
      text: 'Add elegance to your home with handmade ceramics! Crafted with care, on sale now.',
      ctr: 1.4,
      note: '"Elegance" can\'t be measured; every ceramicist says the same thing.',
    },
    b: {
      label: 'B · Evidence-driven',
      text: 'This pattern came out of a single kiln firing: 40 pieces made, 11 left. The next firing is in 3 weeks.',
      ctr: 5.2,
      note: 'Scarcity + calendar + concrete numbers: a collector\'s feel.',
    },
    why: 'Variant B grounds the purchase decision in a narrative. Same product, same price — the difference is the evidence the message carries.',
  },
]

export default function Demo() {
  const [selected, setSelected] = useState<Product>(products[0])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const winner = useMemo(() => (selected.b.ctr > selected.a.ctr ? 'B' : 'A'), [selected])

  const start = () => {
    setDone(false)
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      setDone(true)
    }, 1900)
  }

  const pick = (p: Product) => {
    setSelected(p)
    setDone(false)
    setRunning(false)
  }

  const barWidth = (ctr: number) => `${Math.round((ctr / 6) * 100)}%`

  return (
    <section id="demo" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#c52a00] mb-4"
        >
          Live demo · Evidence Engine
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[22ch]"
        >
          Which message wins? Don&apos;t guess — <span className="hl">test it.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
          className="mt-5 max-w-[66ch] text-lg text-foreground/70"
        >
          The simulation below shows the Evidence Engine&apos;s logic: two message variants enter a small-budget test,
          and the winner is recorded in the evidence file.{' '}
          <span className="text-sm text-foreground/50">(The numbers you see are sample/simulation data, not real campaign results.)</span>
        </motion.p>

        <div className="mt-10 flex flex-wrap gap-3" role="tablist" aria-label="Product selection">
          {products.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={selected.id === p.id}
              onClick={() => pick(p)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold border-2 transition-all duration-150 cursor-pointer active:scale-[0.97] ${
                selected.id === p.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-foreground/20 hover:border-foreground bg-transparent'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-5">
          {[selected.a, selected.b].map((v, idx) => (
            <motion.div
              key={selected.id + idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: easeOut, delay: idx * 0.06 }}
              className="rounded-xl border border-border bg-white/60 p-6"
            >
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3">{v.label}</p>
              <p className="font-display font-bold text-xl leading-snug min-h-[4.5rem]">&ldquo;{v.text}&rdquo;</p>
              <p className="mt-3 text-sm text-foreground/60">{v.note}</p>
              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="uppercase tracking-widest text-foreground/50">Click-through rate</span>
                  <span className="font-mono">{(done || running) && `${v.ctr.toFixed(1)}%`}</span>
                </div>
                <div className="h-3 rounded-full bg-[#efefe4] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${idx === 1 ? 'bg-[#ff3500]' : 'bg-foreground/35'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: done || running ? barWidth(v.ctr) : '0%' }}
                    transition={{ duration: 1.5, ease: easeOut }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={start}
            disabled={running}
            className="inline-flex items-center rounded-md bg-foreground text-background px-6 py-3 text-base font-bold transition-all duration-150 hover:bg-[#c52a00] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {running ? 'Test running…' : done ? 'Run the test again' : 'Run the test'}
          </button>
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="flex-1 min-w-[260px] rounded-lg border-l-4 border-[#ff3500] bg-[#fcfcf9] border border-border p-4"
              >
                <p className="font-bold text-sm">
                  Variant {winner} won → recorded in the evidence file → Execution Studio is preparing 3 channel variations
                  <span className="cursor-blink text-[#c52a00]" aria-hidden="true"> ▌</span>
                </p>
                <p className="mt-1.5 text-sm text-foreground/70">{selected.why}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-[#fcfcf9] p-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-foreground/80">
            Curious what your own site's evidence looks like? Scan your homepage — free, no account.
          </p>
          <a
            href="/teshis"
            className="inline-flex items-center rounded-md bg-[#ff3500] text-white px-5 py-2.5 text-sm font-bold transition-all duration-150 hover:bg-[#c52a00] active:scale-[0.97]"
          >
            Try the free Message Map →
          </a>
        </div>
      </div>
    </section>
  )
}
