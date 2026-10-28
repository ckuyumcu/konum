import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const faqs = [
  {
    q: 'Does the AI do everything on its own?',
    a: 'No. This is a product preview with simulated demonstrations. Strategy, hypothesis selection, real tests, budgets and publication stay with the human. In v1, KonumOS prepares work for review and export; it does not act in your accounts.',
  },
  {
    q: 'What happens to my ad accounts and data?',
    a: 'Your accounts stay with you. In this release (v1) the platform performs no actions in any of your accounts and never touches your budget; it produces publish-ready packages and you do the publishing. Ad account connections will open during the pilot phase. Client data is anonymized by default; scope and the contract set will be finalized together in the pilot program.',
  },
  {
    q: 'Are the numbers on this page real?',
    a: 'No. The test results in the demo section are simulation data generated to show the Evidence Engine\'s logic, and they are clearly labeled as such on the page. Real results only come from real tests — saying "insufficient data" is also a legitimate output of the platform.',
  },
  {
    q: 'How are you different from competing platforms?',
    a: 'Execution tools have commoditized: producing variations is something everyone can do now. The preview centers on an Evidence Engine workflow: record hypotheses, plan tests and keep the sources behind a decision. It does not prove a claim or run a live test by itself. And it\'s white-label: the agency sells it as its own methodology.',
  },
  {
    q: 'Is there lock-in? Can I take my data?',
    a: 'Evidence files and strategy documents are exportable assets. We know expert users are allergic to lock-in — trust is part of the sale.',
  },
  {
    q: 'How much does it cost?',
    a: 'Our pilot target is $149 per workspace per month, and our own math is on this page: a workspace costs us about $3 a month to run at full throttle. The final number is set together with the first 10 pilot agencies, against the value we actually prove — we don\'t pretend the price list is finished before the value is.',
  },
]

export default function Faq() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-[#efefe4] border-t border-border">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#c52a00] mb-4"
        >
          Frequently asked
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] mb-12"
        >
          Still on your mind
        </motion.h2>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((f, i) => (
            <motion.details
              key={f.q}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: easeOut, delay: i * 0.04 }}
              className="group py-5"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-display font-bold text-lg md:text-xl [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-200 group-open:rotate-45"
                >
                  <path d="M9 3v12M3 9h12" stroke="#c52a00" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="mt-4 text-foreground/70 max-w-[68ch]">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}
