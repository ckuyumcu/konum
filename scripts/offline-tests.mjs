// Test-only guard. No request can leave this process unless an individual test
// replaces fetch with a local response fixture. This file is never imported by production.
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { syncBuiltinESMExports } from 'node:module';
const blocked = () => { throw new Error('Offline test: network access is disabled'); };
globalThis.fetch = async () => blocked();
http.request = blocked;
http.get = blocked;
https.request = blocked;
https.get = blocked;
net.connect = blocked;
net.createConnection = blocked;
tls.connect = blocked;
syncBuiltinESMExports();
