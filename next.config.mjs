import path from "node:path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Cover + three gallery images, up to 5 MiB each, plus multipart fields.
      bodySizeLimit: "22mb"
    }
  },
  async redirects() {
    return [
      {
        source: "/tula/kuda-poiti-odnomu",
        destination: "/tula/mozhno-odnomu",
        permanent: true
      }
    ];
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(process.cwd());
    return config;
  }
};

export default nextConfig;
