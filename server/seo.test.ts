import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { pageSeo, isPrivatePage } from "./seo.ts";

const original = readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const route of ["/", "/teshis", "/privacy", "/terms"]) {
  const result = pageSeo(original, route);
  assert.equal((result.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(result.includes(`href="https://konumos.com${route}"`));
  assert.equal((result.match(/<title>/g) || []).length, 1);
  assert.ok(!result.includes('content="noindex,nofollow"'));
  if (route !== "/") {
    assert.ok(!result.includes('"@type":"WebApplication"'));
    assert.notEqual(result.match(/<title>(.*?)<\/title>/)?.[1], original.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  assert.equal(result.match(/<body>[\s\S]*<\/body>/)?.[0], original.match(/<body>[\s\S]*<\/body>/)?.[0]);
}
assert.equal(pageSeo(original, "/privacy/"), pageSeo(original, "/privacy"));
for (const route of ["/giris", "/giris/", "/app", "/app/", "/app/konsol", "/app/example/bellek"]) {
  const result = pageSeo(original, route);
  assert.ok(isPrivatePage(route));
  assert.ok(result.includes('content="noindex,nofollow"'));
  assert.ok(!result.includes('rel="canonical"'));
  assert.ok(!result.includes('application/ld+json'));
}
assert.ok(!isPrivatePage("/application"));
assert.equal(pageSeo(original, "/unknown"), original);
const server = readFileSync(new URL("./serve.ts", import.meta.url), "utf8");
assert.ok(server.includes('res.setHeader("X-Robots-Tag", "noindex, nofollow")'));
assert.ok(server.includes('pageSeo(icerik.toString("utf8"), yol)'));
console.log("PASS: four public identities, trailing slash canonical, private route noindex and unchanged body; server wiring checked");
