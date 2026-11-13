import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://roleflow.site";
  const now = new Date();

  const routes = [
    { url: "", changeFrequency: "daily" as const, priority: 1.0 },
    { url: "/chat", changeFrequency: "daily" as const, priority: 0.9 },
    { url: "/docs/api-keys", changeFrequency: "weekly" as const, priority: 0.8 },
    { url: "/moderation", changeFrequency: "monthly" as const, priority: 0.7 },
    { url: "/terms", changeFrequency: "monthly" as const, priority: 0.6 },
    { url: "/privacy", changeFrequency: "monthly" as const, priority: 0.6 },
    { url: "/acceptable-use", changeFrequency: "monthly" as const, priority: 0.6 },
    { url: "/ai-output", changeFrequency: "monthly" as const, priority: 0.5 },
    { url: "/cookies", changeFrequency: "monthly" as const, priority: 0.5 },
    { url: "/law", changeFrequency: "monthly" as const, priority: 0.5 },
    { url: "/law-enforcement", changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
