export default function Footer() {
  return (
    <footer className="bg-[#181818] text-[#fcfcf9] py-14">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
                <circle cx="12" cy="15" r="9" fill="#ff3500" />
                <circle cx="21" cy="15" r="5.5" fill="none" stroke="#fcfcf9" strokeWidth="2.5" />
              </svg>
              <span className="font-display font-bold text-xl">Konum</span>
            </div>
            <p className="text-sm text-[#fcfcf9]/60 max-w-[42ch]">
              The agent-powered continuous product marketing operating system. Strategy from you, routine execution from agents.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#ff8a66]">
              An AIWork School company
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm" aria-label="Footer navigation">
            <a href="#sorun" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">The Problem</a>
            <a href="#nasil" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">How it works</a>
            <a href="#teardown" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">What we learned</a>
            <a href="#demo" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Live demo</a>
            <a href="#ekonomi" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">The math</a>
            <a href="#pilot" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Pilot program</a>
            <a href="#sss" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">FAQ</a>
          </nav>
        </div>
        <div className="mt-12 pt-6 border-t border-[#fcfcf9]/15 flex flex-col md:flex-row justify-between gap-3 text-xs text-[#fcfcf9]/45">
          <span>© 2026 Konum, an AIWork School company — product preview. Demo data is simulated.</span>
          <span>This page makes no market-size or revenue claims; unverified assumptions are tested in the pilot program.</span>
        </div>
      </div>
    </footer>
  )
}
