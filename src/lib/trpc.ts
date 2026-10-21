import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../server/routers";

// The server is attached to the Vite dev server under /api (server/vite-plugin.ts).
// The API key never reaches the client; all LLM calls live on the server.
export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});
