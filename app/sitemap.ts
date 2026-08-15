import type { MetadataRoute } from "next";
import { getEventSlugs } from "@/lib/queries";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://freshpools.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1, lastModified: now },
    { url: `${base}/hackathons`, changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: `${base}/for-companies`, changeFrequency: "monthly", priority: 0.9, lastModified: now },
    { url: `${base}/for-colleges`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
  ];

  // Event pages only — app routes are all noindex.
  const events = await getEventSlugs();
  const eventRoutes: MetadataRoute.Sitemap = events.map(({ slug }) => ({
    url: `${base}/hackathons/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...eventRoutes];
}
