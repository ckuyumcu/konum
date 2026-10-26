import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

// v2 Section 8 (Phase 1, item 3): competitor brand names removed; format is
// "common market approach → KonumOS's difference". No competitor is praised in any card.
const lessons = [
  {
    from: 'Common approach: white-label dashboards',
    lesson: 'A multi-client console makes the agency the hero.',
    ours: 'KonumOS runs under the agency\'s own brand; the platform stays invisible, the agency shines.',
    span: 'lg:col-span-4',
  },
  {
    from: 'Common approach: single customer database',
    lesson: 'One source of truth feeds every output.',
    ours: 'For us that source is Strategy Memory — not a transaction log, but a memory of decisions.',
    span: 'lg:col-span-4',
  },
  {
    from: 'Common approach: brand voice settings',
    lesson: 'Without a defined brand voice, AI output goes generic.',
    ours: 'Banned phrases + the Auditor agent: no rule-breaking text ever reaches approval.',
    span: 'lg:col-span-4',
  },
  {
    from: 'Common approach: content calendars',
    lesson: 'Calendar and queue discipline is continuity itself.',
    ours: 'Execution Studio spreads proven messages across channels; the rhythm is the agent\'s, the decision is yours.',
    span: 'lg:col-span-6',
  },
  {
    from: 'Common approach: autonomous ad execution',
    lesson: 'Autonomy looks attractive; unapproved spend is risky.',
    ours: 'In KonumOS v1 nothing touches your accounts: it produces publish-ready packages, and the final touch stays human.',
    span: 'lg:col-span-6',
  },
  {
    from: 'Common approach: variation factories',
    lesson: 'Producing variations is easy; knowing which one won and why is valuable.',
    ours: 'The Evidence Engine documents the "why" with tests — the output is an exportable evidence file.',
    span: 'lg:col-span-12',
  },
]

export default function Teardown() {
  return (
    <section id="teardown" className="py-20 md:py-32 bg-[#efefe4]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#c52a00] mb-4"
        >
          What we learned from the market
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[24ch]"
        >
          Nobody can see closed-source code — but the <span className="hl">playbooks</span> are out in the open.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
          className="mt-6 max-w-[68ch] text-lg text-foreground/70"
        >
          We analyzed the public product pages, documentation, and pricing logic of the common approaches in the
          marketing software market. We took the proven patterns, inverted their weaknesses — and rebuilt everything{' '}
          <strong className="text-foreground">with our own original code</strong>. No copying, no plagiarism:
          competitive analysis and engineering.
        </motion.p>

        <div className="mt-14 grid lg:grid-cols-12 gap-5">
          {lessons.map((l, i) => (
            <motion.article
              key={l.from}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: easeOut, delay: (i % 3) * 0.08 }}
              className={`${l.span} rounded-xl border border-border bg-[#fcfcf9] p-6 md:p-7 flex flex-col`}
            >
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/45 mb-3">
                {l.from} <span className="text-[#c52a00]">→</span> lesson
              </p>
              <h3 className="font-display font-bold text-xl md:text-[1.35rem] leading-snug mb-3">{l.lesson}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed mt-auto pt-2 border-t border-border/70">
                <span className="font-bold text-foreground">In KonumOS: </span>
                {l.ours}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 text-xs text-foreground/50 max-w-[80ch]"
        >
          Note: the observations above are based on publicly available product information; market features may change.
          Each card will be re-verified against current sources before launch.
        </motion.p>
      </div>
    </section>
  )
}
