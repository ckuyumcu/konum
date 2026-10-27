// Üretim sunucusu — bağımsız giriş noktası (Vite olmadan).
// API'yi /api altında, derlenmiş arayüzü dist/ klasöründen sunar; SPA fallback index.html'e düşer.
// Çalıştırma: npm run build && npm start  (systemd servisi deploy/YAYIN.md'de)

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServerApp } from "./app";

const KOK = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(KOK, "dist");
const PORT = Number(process.env.PORT || 3000);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

const app = createServerApp();

async function govdeOku(req: IncomingMessage): Promise<Buffer> {
  const parcalar: Buffer[] = [];
  return new Promise((resolve) => {
    req.on("data", (c) => parcalar.push(c));
    req.on("end", () => resolve(Buffer.concat(parcalar)));
    req.on("error", () => resolve(Buffer.alloc(0)));
  });
}

async function apiServis(req: IncomingMessage, res: ServerResponse) {
  // Geliştirme sunucusuyla aynı davranış: /api öneki soyulur, uygulama /health, /giris, /trpc/... görür.
  const soyulmus = (req.url || "/").replace(/^\/api(?=\/|$|\?)/, "") || "/";
  const url = new URL(soyulmus, `http://${req.headers.host || "localhost"}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
  }
  const govde = await govdeOku(req);
  const istek = new Request(url.toString(), {
    method: req.method,
    headers,
    body: govde.length > 0 ? new Uint8Array(govde) : undefined,
  });
  const yanit = await app.fetch(istek);
  res.statusCode = yanit.status;
  yanit.headers.forEach((v, k) => {
    if (k.toLowerCase() !== "set-cookie") res.setHeader(k, v);
  });
  const setCookies =
    typeof (yanit.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (yanit.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : [];
  if (setCookies.length > 0) res.setHeader("set-cookie", setCookies);
  res.end(Buffer.from(await yanit.arrayBuffer()));
}

async function statikServis(req: IncomingMessage, res: ServerResponse) {
  // Bozuk kodlanmış adresler (tarama botları vb.) süreci düşürmesin
  let yol: string;
  try {
    yol = decodeURIComponent(new URL(req.url || "/", "http://x").pathname);
  } catch {
    res.statusCode = 400;
    return res.end("Bad Request");
  }
  // dizin dışına çıkışı engelle
  const guvenli = path.normalize(yol).replace(/^(\.\.[/\\])+/, "");
  let dosya = path.join(DIST, guvenli);
  if (!dosya.startsWith(DIST)) {
    res.statusCode = 403;
    return res.end();
  }
  if (!existsSync(dosya) || statSync(dosya).isDirectory()) {
    // SPA fallback — bilinmeyen yollar index.html'e düşer
    dosya = path.join(DIST, "index.html");
  }
  try {
    const icerik = await readFile(dosya);
    res.setHeader("Content-Type", MIME[path.extname(dosya).toLowerCase()] ?? "application/octet-stream");
    if (/\.(js|css|svg|png|jpg|webp|woff2?)$/.test(dosya) && dosya.includes("assets")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "no-cache");
    }
    res.end(icerik);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}

// Beklenmeyen hata hiçbir zaman süreci düşürmesin
function guvenliSonlandir(res: ServerResponse) {
  try {
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  } catch {
    /* bağlantı zaten kopmuş olabilir */
  }
}

createServer((req, res) => {
  try {
    if ((req.url || "").startsWith("/api")) {
      void apiServis(req, res).catch(() => guvenliSonlandir(res));
    } else {
      void statikServis(req, res).catch(() => guvenliSonlandir(res));
    }
  } catch {
    guvenliSonlandir(res);
  }
}).listen(PORT, () => {
  console.log(`konum üretim sunucusu: http://localhost:${PORT} (mod: ${process.env.KONUM_ENV ?? "gelistirme"})`);
});
