import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const
const steps = [
  { title: 'Record the question', body: 'Keep the audience, proposed message and supporting source together.' },
  { title: 'Review the material', body: 'A person checks the draft, the source and the limits before approval.' },
  { title: 'Record what happened', body: 'After a real test, record the result and its origin. Keep simulations separate.' },
]

export default function Metrics() {
  return (
    <section className="py-20 md:py-28 bg-[#181818] text-[#fcfcf9] relative overflow-hidden">
      <div className="blob bg-[#ff3500]/35 w-[420px] h-[420px] -top-24 -left-24" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
        <p className="eyebrow text-[#ff8a66] mb-4">Workflow preview</p>
        <h2 className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[24ch]">Keep the question, approval and result connected.</h2>
        <p className="mt-6 max-w-[66ch] text-[#fcfcf9]/70">
          This section describes the review cycle. It is not a live activity feed or a claim about time saved.
          In v1, people initiate the work, run real campaigns and publish approved exports themselves.
        </p>
        <div className="mt-12 grid sm:grid-cols-3 gap-5">
          {steps.map((step, index) => (
            <motion.article key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut, delay: index * 0.08 }} className="rounded-xl border border-[#fcfcf9]/15 bg-[#fcfcf9]/[0.05] p-6">
              <h3 className="font-display font-bold text-2xl">{step.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[#fcfcf9]/70">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
