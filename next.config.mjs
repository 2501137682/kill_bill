/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/kill_bill",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
