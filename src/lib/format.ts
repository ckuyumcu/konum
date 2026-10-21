export function tarihYaz(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const AJAN_ADLARI: Record<string, string> = {
  arastirmaci: "Researcher",
  stratejist: "Strategist Assistant",
  testTasarimcisi: "Test Designer",
  icerikUretici: "Content Producer",
  yayinci: "Publisher",
  analist: "Analyst",
  denetci: "Auditor",
  disDanisman: "External Advisor",
};
