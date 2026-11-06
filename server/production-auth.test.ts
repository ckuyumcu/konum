import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.KONUM_DB_PATH = path.join(mkdtempSync(path.join(tmpdir(), 'konum-auth-')), 'test.db');
process.env.KONUM_SECRET_DIR = mkdtempSync(path.join(tmpdir(), 'konum-auth-secret-'));
process.env.RENDER = 'true';
delete process.env.KONUM_PLATFORM_SAHIBI;
delete process.env.KONUM_PILOT_DAVET;
delete process.env.ANTHROPIC_API_KEY;
const { createServerApp } = await import('./app');
const { platformSahibiMi } = await import('./config');
const { db, newId } = await import('./db');
const { invites } = await import('./schema');

test('production never creates a default owner invite', () => {
  createServerApp();
  assert.equal(db.select().from(invites).all().length, 0);
  assert.equal(platformSahibiMi('cem@konum.local'), false);
});

test('an existing development invite cannot sign in on a public deployment', async () => {
  db.insert(invites).values({id: newId('inv'), eposta:'cem@konum.local', rol:'sahip', workspaceId:null, token:'KONUM-PILOT-1', sonKullanma:Date.now()+60000, kullanildi:0, createdAt:Date.now()}).run();
  const app = createServerApp();
  const r = await app.request('/giris', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({eposta:'cem@konum.local', davetKodu:'KONUM-PILOT-1'})});
  assert.equal(r.status,403);
});

test('an explicitly provisioned owner can sign in with a Secure session cookie', async () => {
  process.env.KONUM_PLATFORM_SAHIBI = 'owner@example.test';
  const token = 'private-test-fixture-only';
  db.insert(invites).values({id:newId('inv'), eposta:'owner@example.test', rol:'sahip', workspaceId:null, token, sonKullanma:Date.now()+60000, kullanildi:0, createdAt:Date.now()}).run();
  const app = createServerApp();
  const r = await app.request('/giris', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({eposta:'owner@example.test', davetKodu:token})});
  assert.equal(r.status,200);
  assert.match(r.headers.get('set-cookie')||'', /Secure/);
  assert.match(r.headers.get('set-cookie')||'', /HttpOnly/);
  assert.equal(platformSahibiMi('owner@example.test'),true);
});
