import type { Plugin } from "vite";
import { createServerApp } from "./app";

// Hono uygulamasını Vite dev sunucusuna /api altında bağlar.
// Böylece `npm run dev` tek komutla hem arayüzü hem API'yi servis eder.
export function konumApi(): Plugin {
  return {
    name: "konum-api",
    configureServer(server) {
      const app = createServerApp();
      server.middlewares.use("/api", async (req, res) => {
        const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === "string") headers.set(k, v);
        }
        const body = await new Promise<Buffer>((resolve) => {
          const chunks: Buffer[] = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => resolve(Buffer.concat(chunks)));
          req.on("error", () => resolve(Buffer.alloc(0)));
        });
        const request = new Request(url.toString(), {
          method: req.method,
          headers,
          body: body.length > 0 ? new Uint8Array(body) : undefined,
        });
        const response = await app.fetch(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() !== "set-cookie") res.setHeader(key, value);
        });
        // Set-Cookie başlıklarını ayrık olarak aktar (birleştirme bozulmasın)
        const setCookies =
          typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
            ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
            : [];
        if (setCookies.length > 0) res.setHeader("set-cookie", setCookies);
        const buf = Buffer.from(await response.arrayBuffer());
        res.end(buf);
      });
    },
  };
}
