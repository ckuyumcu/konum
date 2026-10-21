// Web scanning helper of the Researcher agent — v2 Section 5:
// respects robots.txt; http/https only; private/internal IPs and localhost FORBIDDEN (SSRF);
// re-checks after redirects; 10 s timeout; 2 MB response limit.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface ScanResult {
  url: string;
  finalUrl: string;
  title: string;
  metin: string;
  robotsIzni: boolean;
  not?: string;
}

export class SsrfError extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "SsrfError";
  }
}

const MAX_METIN = 12_000;
const MAX_YANIT = 2 * 1024 * 1024; // 2 MB
const ZAMAN_ASIMI = 10_000; // 10 sn
const MAX_YONLENDIRME = 5;

// Private/internal network and reserved blocks
function ozelMi(ip: string): boolean {
  if (isIP(ip) === 4) {
    const b = ip.split(".").map(Number);
    return (
      b[0] === 10 || // 10/8
      b[0] === 127 || // loopback
      (b[0] === 172 && b[1] >= 16 && b[1] <= 31) || // 172.16/12
      (b[0] === 192 && b[1] === 168) || // 192.168/16
      (b[0] === 169 && b[1] === 254) || // link-local (incl. 169.254.169.254 metadata)
      b[0] === 0 || // 0/8
      (b[0] === 100 && b[1] >= 64 && b[1] <= 127) || // CGNAT
      b[0] >= 224 // multicast + reserved
    );
  }
  if (isIP(ip) === 6) {
    const a = ip.toLowerCase();
    return (
      a === "::1" ||
      a === "::" ||
      a.startsWith("fc") ||
      a.startsWith("fd") || // unique-local
      a.startsWith("fe80") || // link-local
      a.startsWith("::ffff:") // IPv4-mapped — the v4 part is checked separately
    );
  }
  return false;
}

function engelliAnamakine(host: string): boolean {
  const h = host.toLowerCase();
  return h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".lan");
}

/** SSRF protection: the URL target must be the public internet. Also called from tests. */
export async function hedefGuvenliMi(rawUrl: string): Promise<{ guvenli: boolean; gerekce?: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { guvenli: false, gerekce: "Invalid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { guvenli: false, gerekce: `Only http/https can be scanned (not ${url.protocol}).` };
  }
  const host = url.hostname;
  if (engelliAnamakine(host)) {
    return { guvenli: false, gerekce: "Local/internal network addresses cannot be scanned." };
  }
  if (isIP(host)) {
    return ozelMi(host)
      ? { guvenli: false, gerekce: "Private/internal IP addresses cannot be scanned." }
      : { guvenli: true };
  }
  try {
    const kayitlar = await lookup(host, { all: true, verbatim: true });
    if (kayitlar.length === 0 || kayitlar.some((k) => ozelMi(k.address))) {
      return { guvenli: false, gerekce: "The domain resolves to a private/internal address; scan blocked." };
    }
    return { guvenli: true };
  } catch {
    return { guvenli: false, gerekce: "The domain could not be resolved." };
  }
}

async function robotsAllows(url: string, ua: string): Promise<boolean> {
  try {
    const origin = new URL(url).origin;
    const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(ZAMAN_ASIMI) });
    if (!res.ok) return true;
    const txt = (await res.text()).slice(0, 64_000);
    const path = new URL(url).pathname;
    let appliesToUs = false;
    let blocked = false;
    for (const line of txt.split("\n")) {
      const l = line.trim();
      if (/^user-agent:\s*\*/i.test(l)) appliesToUs = true;
      else if (/^user-agent:/i.test(l)) appliesToUs = l.toLowerCase().includes(ua.toLowerCase());
      else if (appliesToUs && /^disallow:\s*\S+/i.test(l)) {
        const rule = l.split(":")[1].trim();
        if (path.startsWith(rule)) blocked = true;
      }
    }
    return !blocked;
  } catch {
    return true;
  }
}

function htmlToText(html: string): { title: string; metin: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<\/(p|div|section|article|h[1-6]|li|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const metin = decodeEntities(body)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim()
    .slice(0, MAX_METIN);
  return { title, metin };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ");
}

async function sinirliOku(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const parcalar: Uint8Array[] = [];
  let toplam = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    toplam += value.byteLength;
    if (toplam > MAX_YANIT) {
      await reader.cancel();
      throw new Error("Response exceeded the 2 MB limit; scan stopped.");
    }
    parcalar.push(value);
  }
  const birlesik = new Uint8Array(toplam);
  let o = 0;
  for (const p of parcalar) {
    birlesik.set(p, o);
    o += p.byteLength;
  }
  return new TextDecoder().decode(birlesik);
}

export async function scanUrl(inputUrl: string): Promise<ScanResult> {
  let url = inputUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const ua = "KonumBot/0.1 (+arastirmaci-ajan)";

  // SSRF: initial target check
  const ilk = await hedefGuvenliMi(url);
  if (!ilk.guvenli) throw new SsrfError(ilk.gerekce || "Target is not safe.");

  const izin = await robotsAllows(url, "KonumBot");
  if (!izin) {
    return {
      url: inputUrl,
      finalUrl: url,
      title: "",
      metin: "",
      robotsIzni: false,
      not: "robots.txt does not allow scanning this page; no scan was performed.",
    };
  }

  // Follow redirects manually: the SSRF check is repeated at every hop
  let mevcut = url;
  let res: Response | null = null;
  for (let i = 0; i <= MAX_YONLENDIRME; i++) {
    res = await fetch(mevcut, {
      headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml" },
      redirect: "manual",
      signal: AbortSignal.timeout(ZAMAN_ASIMI),
    });
    if (res.status >= 300 && res.status < 400) {
      const hedef = res.headers.get("location");
      if (!hedef) break;
      mevcut = new URL(hedef, mevcut).toString();
      const kontrol = await hedefGuvenliMi(mevcut);
      if (!kontrol.guvenli) {
        throw new SsrfError(`Redirect leads to an unsafe target: ${kontrol.gerekce}`);
      }
      res = null;
      continue;
    }
    break;
  }
  if (!res) throw new Error("Too many redirects.");
  if (!res.ok) throw new Error(`Site response: HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.includes("html")) throw new Error(`Non-HTML content (${type})`);

  const html = await sinirliOku(res);
  const { title, metin } = htmlToText(html);
  const sonuc: ScanResult = { url: inputUrl, finalUrl: mevcut, title, metin, robotsIzni: true };
  if (metin.length < 200) {
    sonuc.not = "Little text could be extracted from the page (it may be a JavaScript-rendered site).";
  }
  return sonuc;
}
