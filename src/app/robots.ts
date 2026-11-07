import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://traxva.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/invite/"],
        disallow: ["/admin/", "/api/", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
