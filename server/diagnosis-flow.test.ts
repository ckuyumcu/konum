import { strict as assert } from "node:assert";
import { after, beforeEach, test, type TestContext } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const directory = mkdtempSync(path.join(tmpdir(), "konum-diagnosis-flow-"));
process.env.KONUM_DB_PATH = path.join(directory, "test.db");
process.env.KONUM_SECRET_DIR = path.join(directory, "secrets");
process.env.KONUM_ENV = "production";
process.env.LLM_PROVIDER = "simulation";
delete process.env.ANTHROPIC_API_KEY;
delete process.env.KONUM_PLATFORM_SAHIBI;
delete process.env.KONUM_PILOT_DAVET;

const { appRouter } = await import("./routers");
const { createServerApp } = await import("./app");
const { sqlite } = await import("./db");
const app = createServerApp();
const origin = "https://93.184.216.34";
const caller = () => appRouter.createCaller({ user: null, ip: "198.51.100.10" });
const input = { url: `${origin}/product`, eposta: "", riza: false };
const productHtml = "<title>Fixture product</title><p>" + "A sample product page for a local-only workflow check. ".repeat(8) + "</p>";
const reportCount = () => (sqlite.prepare("SELECT COUNT(*) AS n FROM diagnosis_requests").get() as { n: number }).n;

beforeEach(() => {
  sqlite.exec("DELETE FROM diagnosis_requests");
});

after(() => {
  sqlite.close();
  rmSync(directory, { recursive: true, force: true });
});

function mockPage(t: TestContext, page = productHtml, robots = "User-agent: *\nDisallow:") {
  const requests: string[] = [];
  t.mock.method(globalThis, "fetch", async (target: string | URL | Request) => {
    const url = String(target);
    requests.push(url);
    if (url === `${origin}/robots.txt`) return new Response(robots);
    if (url === input.url) return new Response(page, { headers: { "content-type": "text/html" } });
    throw new Error("Unexpected request in offline diagnosis fixture");
  });
  return requests;
}

test("anonymous report stays available through retrieval and PDF, with simulation mode preserved", async (t) => {
  mockPage(t);
  const result = await caller().teshis.olustur(input);
  assert.equal(result.mod, "simulasyon");
  assert.equal(result.baslik, "Fixture product");
  assert.equal(result.harita.oneriler.length, 3);
  const retrieved = await caller().teshis.getir({ id: result.id });
  assert.equal(retrieved.mod, "simulasyon");
  assert.equal(retrieved.url, input.url);
  assert.equal("eposta" in retrieved, false);
  const response = await app.request(`/teshis/${result.id}.pdf`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  const pdf = Buffer.from(await response.arrayBuffer()).toString("latin1");
  assert.ok(pdf.startsWith("%PDF-"));
  assert.match(pdf, /SIMULATION - NOT A LIVE ANALYSIS/);
  assert.match(pdf, /not a sales forecast/);
});

test("email is optional; consent is checked before scanning and an accepted address is stored consistently", async (t) => {
  const requests = mockPage(t);
  await assert.rejects(() => caller().teshis.olustur({ ...input, eposta: "QA@Example.Test", riza: false }), /consent/i);
  assert.equal(requests.length, 0);
  await caller().teshis.olustur({ ...input, eposta: "QA@Example.Test", riza: true });
  assert.equal((sqlite.prepare("SELECT eposta FROM diagnosis_requests").get() as { eposta: string }).eposta, "qa@example.test");
});

test("a blocked robots path creates no report and consumes no completed-analysis quota", async (t) => {
  const requests = mockPage(t, productHtml, "User-agent: *\nDisallow: /");
  await assert.rejects(() => caller().teshis.olustur(input), /robots/i);
  assert.deepEqual(requests, [`${origin}/robots.txt`]);
  assert.equal(reportCount(), 0);
});

test("an unreadable page creates no report instead of an apparently successful empty result", async (t) => {
  mockPage(t, "<title>Empty</title><p>Too short</p>");
  await assert.rejects(() => caller().teshis.olustur(input), /not enough text/i);
  assert.equal(reportCount(), 0);
});

test("the fourth completed report is refused before another scan starts", async (t) => {
  const requests = mockPage(t);
  const client = caller();
  for (let n = 0; n < 3; n++) await client.teshis.olustur(input);
  const count = requests.length;
  await assert.rejects(() => client.teshis.olustur(input), /3 free analyses/i);
  assert.equal(requests.length, count);
  assert.equal(reportCount(), 3);
});

test("a missing report returns an actionable not-found result for both access paths", async () => {
  await assert.rejects(() => caller().teshis.getir({ id: "tsh_missing_fixture" }), /not found/i);
  const response = await app.request("/teshis/tsh_missing_fixture.pdf");
  assert.equal(response.status, 404);
});
