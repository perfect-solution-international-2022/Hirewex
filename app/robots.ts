import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirewex.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/service", "/service/", "/jobs", "/profile-preview/"],
        disallow: [
          "/admin/",
          "/api/",
          "/freelancer/",
          "/buyer/",
          "/(protected)/",
          "/settings/",
          "/chat/",
          "/checkout/",
          "/submitted-work/",
          "/my-bids/",
          "/dashboard/",
          "/auth",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
