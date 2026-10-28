// Public page identity only. Authentication and application behavior stay in app.ts.
const SITE = "https://konumos.com";
const PUBLIC: Record<string, { title: string; description: string }> = {
  "/": {
    title: "KonumOS | Marketing Workflows with Human Approval",
    description: "KonumOS is a marketing workflow preview for agencies: strategy memory, research hypotheses, draft variations and human approval. Demos use simulated data.",
  },
  "/teshis": {
    title: "Homepage Message Map Scan | KonumOS",
    description: "Review the messaging on a public homepage with the KonumOS Message Map. Use the findings as questions to investigate, not proof of sales or demand.",
  },
  "/privacy": {
    title: "Privacy Notice | KonumOS",
    description: "Read the KonumOS privacy notice for the product preview and pilot application, including the published data-handling and contact information.",
  },
  "/terms": {
    title: "Terms of Use | KonumOS",
    description: "Read the terms for the KonumOS product preview and pilot. Review the published limits, responsibilities and contact information before use.",
  },
};

export const isPrivatePage = (pathname: string) => {
  pathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return pathname === "/giris" || pathname === "/app" || pathname.startsWith("/app/");
};
const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function pageSeo(html: string, pathname: string): string {
  pathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (isPrivatePage(pathname)) {
    return html.replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, "")
      .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<meta\b[^>]*name="robots"[^>]*>/gi, "")
      .replace("</head>", '<meta name="robots" content="noindex,nofollow" /></head>');
  }
  const meta = PUBLIC[pathname];
  if (!meta) return html;
  let result = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(meta.title)}</title>`)
    .replace(/<meta\b[^>]*name="description"[^>]*>/i, `<meta name="description" content="${escape(meta.description)}" />`)
    .replace(/<meta\b[^>]*property="og:title"[^>]*>/i, `<meta property="og:title" content="${escape(meta.title)}" />`)
    .replace(/<meta\b[^>]*property="og:description"[^>]*>/i, `<meta property="og:description" content="${escape(meta.description)}" />`)
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, "")
    .replace(/<meta\b[^>]*property="og:url"[^>]*>/gi, "");
  if (pathname !== "/") result = result.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "");
  return result.replace("</head>", `<link rel="canonical" href="${SITE}${pathname}" /><meta property="og:url" content="${SITE}${pathname}" /></head>`);
}
