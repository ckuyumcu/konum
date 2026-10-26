import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const stages = [
  {
    id: 'bellek',
    title: 'Strategy Memory',
    who: 'Built by humans',
    whoAccent: false,
    body: 'Story, positioning, target audience, banned phrases, proven messages. The single source of truth every agent reads.',
    agents: [],
  },
  {
    id: 'kanit',
    title: 'Evidence Engine',
    who: 'Agents work · humans choose',
    whoAccent: true,
    body: 'Scans competitor messaging, mines the customer\'s language, generates hypotheses, designs small-budget tests. Saying "insufficient data" is also a valid output.',
    agents: ['Researcher', 'Strategist Asst.', 'Test Designer'],
  },
  {
    id: 'icra',
    title: 'Execution Studio',
    who: 'Agents produce · humans approve',
    whoAccent: true,
    body: 'Turns proven messages into Instagram, Meta Ads, Google Ads and email variations, then schedules them. The Auditor agent won\'t even send rule-breaking work to approval.',
    agents: ['Content Producer', 'Publisher', 'Auditor'],
  },
  {
    id: 'sinyal',
    title: 'Signal Radar',
    who: 'Agents watch · humans decide',
    whoAccent: true,
    body: 'Reads performance, writes the weekly "what we learned" digest, and raises an alarm when positioning goes stale. The decision is always yours.',
    agents: ['Analyst'],
  },
]

export default function Pipeline() {
  return (
    <section id="how" className="py-20 md:py-32 bg-[#181818] text-[#fcfcf9] relative overflow-hidden">
      <div className="blob bg-[#ff3500]/30 w-[420px] h-[420px] -top-24 -right-24" aria-hidden="true" />
      <div className="blob bg-[#8b5cf6]/25 w-[380px] h-[380px] top-1/3 -left-28" style={{ animationDelay: '-5s' }} aria-hidden="true" />
      <div className="blob bg-[#0d9488]/25 w-[320px] h-[320px] -bottom-20 right-1/4" style={{ animationDelay: '-9s' }} aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#ff3500] mb-4"
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02] max-w-[20ch]"
        >
          One line, <span className="gradient-text">four stations.</span>
          <br />
          <span className="text-[#fcfcf9]/60">The only door to production: your approval.</span>
        </motion.h2>

        <div className="relative mt-16">
          {/* Flowing connector line (desktop) */}
          <svg
            className="hidden lg:block absolute top-10 left-0 w-full h-6 pointer-events-none"
            viewBox="0 0 1200 24"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="0" y1="12" x2="1200" y2="12" stroke="#ff3500" strokeWidth="2" className="dash-flow" opacity="0.7" />
          </svg>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stages.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, ease: easeOut, delay: i * 0.1 }}
                className="relative rounded-xl border border-[#fcfcf9]/15 bg-[#fcfcf9]/[0.04] p-6 backdrop-blur-[2px]"
                style={{ rotate: ['-0.8deg', '0.6deg', '-0.5deg', '0.7deg'][i] }}
                whileHover={{ rotate: 0, y: -6 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
                    <span
                      className="pulse-dot absolute inline-flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: ['#ff3500', '#f43f5e', '#8b5cf6', '#0d9488'][i] }}
                    />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#fcfcf9]" />
                  </span>
                  <span className="font-mono text-xs font-bold text-[#fcfcf9]/50">0{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-2xl mb-1.5">{s.title}</h3>
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${s.whoAccent ? 'text-[#ff8a66]' : 'text-[#fcfcf9]'}`}>
                  {s.who}
                </p>
                <p className="text-sm leading-relaxed text-[#fcfcf9]/70">{s.body}</p>
                {s.agents.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {s.agents.map((a) => (
                      <span
                        key={a}
                        className="rounded-full border px-3 py-1 text-xs font-semibold text-[#fcfcf9]/80"
                        style={{ borderColor: `${['#ff3500', '#f43f5e', '#8b5cf6', '#0d9488'][i]}66` }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 text-sm text-[#fcfcf9]/50 max-w-[70ch]"
        >
          Architectural principle: agents can never publish directly. The only exit is the Approval Center — it is both
          quality control and the boundary of responsibility.{' '}
          <span className="hand inline-block -rotate-2 text-xl text-[#f5a409] align-middle" aria-hidden="true">
            nothing escapes this door →
          </span>
        </motion.p>
      </div>
    </section>
  )
}
