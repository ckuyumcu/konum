import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const lessons = [
  {
    from: 'Your page → Message Map',
    lesson: 'See what supports your offer.',
    ours: 'Review the main claim, supporting material and three suggestions for a public product page. Choose what needs a closer look.',
    span: 'lg:col-span-6',
  },
  {
    from: 'One question → A/B plan',
    lesson: 'Give the next test a clear question.',
    ours: 'Set the message variants and measurement plan. Enter observed results manually or by CSV; a simulated preference is not a campaign result.',
    span: 'lg:col-span-6',
  },
  {
    from: 'Approved strategy → Channel drafts',
    lesson: 'Keep the offer consistent across channels.',
    ours: 'Prepare email, social and ad variations from the approved strategy. Review the wording and supporting sources before exporting.',
    span: 'lg:col-span-6',
  },
  {
    from: 'Test result → Decision history',
    lesson: 'Keep the reason for the next change.',
    ours: 'Record what was tested, where the result came from and what was approved. Keep simulated material separate from observed results.',
    span: 'lg:col-span-6',
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
          From one page to the next decision
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[24ch]"
        >
          Give every message <span className="hl">a reason to be tested.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
          className="mt-6 max-w-[68ch] text-lg text-foreground/70"
        >
          Start with the page you already have. Use the Message Map to choose a question, then keep the test plan,
          observed results and approved drafts connected in your workspace.
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
          Message Map is a public entry point. Workspace access is offered through a separately confirmed pilot.
          In v1, you run campaigns and publish exports yourself; KonumOS does not operate your ad accounts or spend your budget.
        </motion.p>
      </div>
    </section>
  )
}
