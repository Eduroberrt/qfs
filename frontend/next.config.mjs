/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  basePath: isProd ? "/Crypgo" : "",
  assetPrefix: isProd ? "/Crypgo/" : "",
  // Disable static export for development to enable proper CSS loading
  ...(isProd && { output: "export" }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

 