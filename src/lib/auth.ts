import { trpc } from "./trpc";

// Oturum yoksa /giris'e yönlendirir; varsa kullanıcıyı döndürür.
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
