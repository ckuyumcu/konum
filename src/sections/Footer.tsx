import AwsMark from '../components/AwsMark'

export default function Footer() {
  return (
    <footer className="relative bg-[#181818] text-[#fcfcf9] py-14 overflow-hidden">
      <div className="rainbow-underline absolute top-0 inset-x-0 h-1.5" aria-hidden="true" />
      <span className="confetti-dot w-2 h-2 bg-[#ff6a3d] top-16 left-[12%]" style={{ animationDelay: '-1s' }} aria-hidden="true" />
      <span className="confetti-dot w-2.5 h-2.5 bg-[#8b5cf6] top-28 right-[18%]" style={{ animationDelay: '-3.5s' }} aria-hidden="true" />
      <span className="confetti-dot w-1.5 h-1.5 bg-[#f5a409] top-40 left-[45%]" style={{ animationDelay: '-6s' }} aria-hidden="true" />
      <span className="confetti-dot w-2 h-2 bg-[#0d9488] bottom-24 right-[8%]" style={{ animationDelay: '-2.2s' }} aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
                <circle cx="12" cy="15" r="9" fill="#ff3500" />
                <circle cx="21" cy="15" r="5.5" fill="none" stroke="#fcfcf9" strokeWidth="2.5" />
              </svg>
              <span className="font-display font-bold text-xl">KonumOS</span>
            </div>
            <p className="text-sm text-[#fcfcf9]/60 max-w-[42ch]">
              The agent-powered continuous product marketing operating system. Strategy from you, routine execution from agents.
            </p>
            <div className="mt-4">
              <AwsMark accent="#ff6a3d" ink="#181818" dark text="An AIWork School company" />
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm" aria-label="Footer navigation">
            <a href="#problem" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">The Problem</a>
            <a href="#how" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">How it works</a>
            <a href="#teardown" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">What we learned</a>
            <a href="#demo" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Live demo</a>
            <a href="#math" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">The math</a>
            <a href="#pilot" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Pilot program</a>
            <a href="#faq" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">FAQ</a>
            <a href="/privacy" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Privacy notice</a>
            <a href="/terms" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Terms of use</a>
          </nav>
        </div>
        <div className="mt-10 rounded-lg border border-[#fcfcf9]/15 bg-[#fcfcf9]/[0.04] p-5 text-sm text-[#fcfcf9]/70 max-w-2xl">
          <p className="font-semibold text-[#fcfcf9]">Who builds KonumOS</p>
          <p className="mt-1.5">
            KonumOS is designed and built by <span className="font-semibold text-[#fcfcf9]">Cem Kuyumcu</span>, an energy
            &amp; construction engineer, inside AIWork School. Questions, pilot requests or a wrong number you spotted
            on this page: <a href="mailto:hello@konumos.com" className="underline decoration-[#fcfcf9]/40 hover:text-[#fcfcf9]">hello@konumos.com</a>
          </p>
        </div>
        <div className="mt-12 pt-6 border-t border-[#fcfcf9]/15 flex flex-col md:flex-row justify-between gap-3 text-xs text-[#fcfcf9]/45">
          <span>© 2026 KonumOS, an AIWork School company — product preview. Demo data is simulated.</span>
          <span>This page makes no market-size or revenue claims; unverified assumptions are tested in the pilot program.</span>
        </div>
      </div>
    </footer>
  )
}
