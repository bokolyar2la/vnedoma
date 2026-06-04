import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/admin/*"]
      }
    ],
    sitemap: "https://vnedoma.com/sitemap.xml",
    host: "https://vnedoma.com"
  };
}
