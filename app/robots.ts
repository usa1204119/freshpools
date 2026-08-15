import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://freshpools.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in areas and auth screens hold nothing a crawler should index.
      disallow: ["/me/", "/co/", "/admin/", "/api/", "/login", "/signup", "/onboarding"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
