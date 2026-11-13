import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/chat",
          "/docs/api-keys",
          "/terms",
          "/privacy",
          "/cookies",
          "/acceptable-use",
          "/ai-output",
          "/moderation",
          "/law",
          "/law-enforcement",
        ],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: "https://roleflow.site/sitemap.xml",
  };
}
