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
              Ajanlarla çalışan sürekli ürün pazarlama işletim sistemi. Strateji senden, rutin icra ajanlardan.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm" aria-label="Alt gezinme">
            <a href="#sorun" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Sorun</a>
            <a href="#nasil" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Nasıl çalışır</a>
            <a href="#teardown" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Öğrendiklerimiz</a>
            <a href="#demo" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Canlı demo</a>
            <a href="#pilot" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">Pilot program</a>
            <a href="#sss" className="text-[#fcfcf9]/70 hover:text-[#fcfcf9] transition-colors duration-150">SSS</a>
          </nav>
        </div>
        <div className="mt-12 pt-6 border-t border-[#fcfcf9]/15 flex flex-col md:flex-row justify-between gap-3 text-xs text-[#fcfcf9]/45">
          <span>© 2026 Konum — ürün önizlemesi. Demo veriler simülasyondur.</span>
          <span>Bu sayfa pazar büyüklüğü veya gelir iddiası içermez; doğrulanmamış varsayımlar pilot programda test edilir.</span>
        </div>
      </div>
    </footer>
  )
}
