import path from "node:path";

/** @type {import("next").NextConfig} */
const nextConfig = {
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
