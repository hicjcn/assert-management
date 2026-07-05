import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "资产管家",
    short_name: "资产管家",
    description: "手机优先的自部署个人资产管理工具",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#99f6e4",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
