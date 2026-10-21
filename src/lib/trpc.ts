import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../server/routers";

// Sunucu Vite dev sunucusuna /api altında bağlı (server/vite-plugin.ts).
// API anahtarı istemciye asla gelmez; tüm LLM çağrıları sunucudadır.
export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});
