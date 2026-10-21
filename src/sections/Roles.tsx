import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const aiList = [
  'Scans competitor messaging and category language 24/7',
  'Generates message hypotheses and channel variations',
  'Sets up and runs small-budget A/B tests',
  'Schedules, measures performance, and reports',
  'Raises an alarm when positioning goes stale',
]

const humanList = [
  'Builds the story and the positioning',
  'Selects hypotheses and approves test budgets',
  'Gives the final sign-off on everything that ships',
  'Owns the client relationship and reputation',
  'Takes responsibility for the final call',
]

export default function Roles() {
  return (
    <section className="py-20 md:py-32 bg-[#ff3500] text-[#fcfcf9]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut }}
          className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02] max-w-[20ch]"
        >
          The line is clear: agents operate, humans decide.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.08 }}
          className="mt-5 max-w-[56ch] text-xl font-bold leading-snug"
        >
          The platform doesn&apos;t do the marketing for you; it applies your decisions to every client at the same quality.
        </motion.p>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {[
            { title: 'The agent does', items: aiList, dark: true },
            { title: 'The human decides', items: humanList, dark: false },
          ].map((col, ci) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: easeOut, delay: ci * 0.1 }}
              className={`rounded-xl p-7 md:p-9 ${
                col.dark ? 'bg-[#181818] text-[#fcfcf9]' : 'bg-[#fcfcf9] text-[#181818]'
              }`}
            >
              <p className={`eyebrow mb-6 ${col.dark ? 'text-[#ff8a66]' : 'text-[#c52a00]'}`}>{col.title}</p>
              <ul className="space-y-4">
                {col.items.map((it, i) => (
                  <li key={it} className="flex gap-3 items-baseline">
                    <span className={`font-mono text-xs font-bold ${col.dark ? 'text-[#ff8a66]' : 'text-[#c52a00]'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold leading-snug">{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-12 font-display font-bold text-2xl md:text-3xl text-center"
        >
          Nothing ships without your approval.
        </motion.p>
      </div>
    </section>
  )
}
