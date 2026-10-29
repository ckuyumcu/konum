import { strict as assert } from "node:assert";
import { test } from "node:test";
import { scanUrl, SsrfError } from "./scanner.ts";

// All HTTP responses are in memory. No DNS, external scan, database or model call.
const origin = "https://93.184.216.34";
const secondOrigin = "https://93.184.216.35";
const html = () => new Response("<title>Fixture</title><p>" + "Public fixture text. ".repeat(20) + "</p>", {
  headers: { "content-type": "text/html" },
});

test("robots redirect is manual and a private target is never requested", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, options?: RequestInit) => {
    const url = String(input);
    requested.push(url);
    if (url === `${origin}/robots.txt`) {
      assert.equal(options?.redirect, "manual", "fetch must not automatically follow an unchecked robots redirect");
      return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  await assert.rejects(() => scanUrl(`${origin}/product`), (error: unknown) => error instanceof SsrfError);
  assert.deepEqual(requested, [`${origin}/robots.txt`]);
});

test("the redirected page is blocked by its own robots rules", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    if (url === `${origin}/robots.txt`) return new Response("User-agent: *\nDisallow: /private");
    if (url === `${origin}/product`) return new Response(null, { status: 302, headers: { location: "/private" } });
    if (url === `${origin}/private`) return html();
    throw new Error(`Unexpected request: ${url}`);
  });
  const result = await scanUrl(`${origin}/product`);
  assert.equal(result.robotsIzni, false);
  assert.equal(result.metin, "");
  assert.equal(requested.includes(`${origin}/private`), false);
});

test("cross-origin page redirects check the destination robots before reading it", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    if (url === `${origin}/robots.txt`) return new Response("User-agent: *\nDisallow:");
    if (url === `${origin}/product`) return new Response(null, { status: 302, headers: { location: `${secondOrigin}/product` } });
    if (url === `${secondOrigin}/robots.txt`) return new Response("User-agent: *\nDisallow: /");
    if (url === `${secondOrigin}/product`) return html();
    throw new Error(`Unexpected request: ${url}`);
  });
  const result = await scanUrl(`${origin}/product`);
  assert.equal(result.robotsIzni, false);
  assert.equal(requested.includes(`${secondOrigin}/robots.txt`), true);
  assert.equal(requested.includes(`${secondOrigin}/product`), false);
});

test("robots server failure does not silently permit a scan", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    return url.endsWith("/robots.txt") ? new Response(null, { status: 503 }) : html();
  });
  await assert.rejects(() => scanUrl(`${origin}/product`), /robots\.txt/i);
  assert.deepEqual(requested, [`${origin}/robots.txt`]);
});

test("robots network failure does not silently permit a scan", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new Error("fixture network failure"); });
  await assert.rejects(() => scanUrl(`${origin}/product`), /robots\.txt/i);
});

test("a missing robots file still permits a public HTML page", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    return String(input).endsWith("/robots.txt") ? new Response(null, { status: 404 }) : html();
  });
  const result = await scanUrl(`${origin}/product`);
  assert.equal(result.robotsIzni, true);
  assert.equal(result.title, "Fixture");
  assert.ok(result.metin.includes("Public fixture text."));
});

test("a safe robots redirect retains the rules for the original product URL", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    if (url === `${origin}/robots.txt`) return new Response(null, { status: 302, headers: { location: `${secondOrigin}/rules.txt` } });
    if (url === `${secondOrigin}/rules.txt`) return new Response("User-agent: *\nDisallow: /product");
    if (url === `${origin}/product`) return html();
    throw new Error(`Unexpected request: ${url}`);
  });
  const result = await scanUrl(`${origin}/product`);
  assert.equal(result.robotsIzni, false);
});

test("oversized robots content is bounded before a page is requested", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    return url.endsWith("/robots.txt") ? new Response("#".repeat(513 * 1024)) : html();
  });
  await assert.rejects(() => scanUrl(`${origin}/product`), /robots\.txt/i);
  assert.deepEqual(requested, [`${origin}/robots.txt`]);
});

test("KonumBot-specific disallow still applies", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    return url.endsWith("/robots.txt") ? new Response("User-agent: KonumBot\nDisallow: /") : html();
  });
  const result = await scanUrl(`${origin}/product`);
  assert.equal(result.robotsIzni, false);
  assert.deepEqual(requested, [`${origin}/robots.txt`]);
});

test("an allowed public page redirect is still followed", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nDisallow: /private");
    if (url === `${origin}/product`) return new Response(null, { status: 301, headers: { location: "/public" } });
    if (url === `${origin}/public`) return html();
    throw new Error(`Unexpected request: ${url}`);
  });
  const result = await scanUrl(`${origin}/product`);
  assert.equal(result.finalUrl, `${origin}/public`);
  assert.equal(result.robotsIzni, true);
  assert.equal(result.title, "Fixture");
});

test("page redirect to a private address is rejected before fetching it", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nDisallow:");
    return new Response(null, { status: 302, headers: { location: "http://10.0.0.1/" } });
  });
  await assert.rejects(() => scanUrl(`${origin}/product`), (error: unknown) => error instanceof SsrfError);
  assert.deepEqual(requested, [`${origin}/robots.txt`, `${origin}/product`]);
});

test("robots redirect loops stop after the existing hop limit", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: `${origin}/robots.txt` } });
  });
  await assert.rejects(() => scanUrl(`${origin}/product`), /robots\.txt/i);
  assert.equal(calls, 6);
});
