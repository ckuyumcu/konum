import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const rows = [
  {
    n: '01',
    title: 'Building products got cheap. Attention got expensive.',
    body: 'Dozens of near-identical products do the same job. Buyers can\'t tell them apart; the question is no longer "can we build it?" but "why would anyone pick ours?".',
  },
  {
    n: '02',
    title: 'AI recommends the same average campaign to everyone.',
    body: 'The tools write copy, but they don\'t write difference. Difference still comes from the human who builds the story, knows the audience, and positions the product.',
  },
  {
    n: '03',
    title: 'No sales is the system\'s fault, not the product\'s.',
    body: 'Message, audience, and evidence — none of them are one-off tasks. Marketing is not a launch; it\'s a continuously operated line. Most teams don\'t have that line.',
  },
]

export default function Problem() {
  return (
    <section id="problem" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="eyebrow text-[#c52a00] mb-4"
            >
              The Problem
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
              className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02]"
            >
              You built five sites.
              <br />
              Sales? <span className="hl">Zero.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.14 }}
              className="mt-6 text-lg text-foreground/70 max-w-[48ch]"
            >
              Sound familiar? The product works, the design is fine — but you reach no one. This isn&apos;t a software
              problem; it&apos;s a <strong className="text-foreground">marketing operations</strong> problem.
            </motion.p>
            <motion.svg
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              width="120"
              height="28"
              viewBox="0 0 120 28"
              className="mt-8"
              aria-hidden="true"
            >
              <path
                d="M4 20 C 24 6, 44 26, 64 12 S 104 22, 116 10"
                fill="none"
                stroke="#ff3500"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </motion.svg>
          </div>
        </div>
        <div className="lg:col-span-7 space-y-0">
          {rows.map((r, i) => (
            <motion.article
              key={r.n}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: easeOut, delay: i * 0.08 }}
              className="border-t border-border py-9 grid sm:grid-cols-12 gap-4"
            >
              <span className="sm:col-span-2 font-mono text-sm font-bold text-[#c52a00] pt-1">{r.n}</span>
              <div className="sm:col-span-10">
                <h3 className="font-display font-bold text-2xl md:text-[1.7rem] leading-snug mb-3">{r.title}</h3>
                <p className="text-foreground/70 max-w-[58ch]">{r.body}</p>
              </div>
            </motion.article>
          ))}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="border-t border-border pt-9 text-lg font-semibold"
          >
            The easier it gets to ship code, the harder it gets to earn attention.{' '}
            <span className="text-[#c52a00]">The era of marketers is beginning</span> — with infrastructure worthy of them.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
