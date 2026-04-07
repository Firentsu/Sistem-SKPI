/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tidak ada API routes di sini, semua request ke backend terpisah
  // NEXT_PUBLIC_API_URL diset di .env.local

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
