import path from "node:path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Cover (5 MiB) + three gallery videos (20 MiB each) + multipart fields.
      bodySizeLimit: "67mb"
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
