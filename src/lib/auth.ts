import { trpc } from "./trpc";

// Redirects to /giris when there is no session; returns the user otherwise.
export async function oturumZorla(): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const me = await trpc.auth.me.query();
    if (!me) {
      window.location.assign("/giris");
      return null;
    }
    return me;
  } catch {
    window.location.assign("/giris");
    return null;
  }
}
