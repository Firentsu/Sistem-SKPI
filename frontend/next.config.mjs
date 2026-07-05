/** @type {import('next').NextConfig} */

// Semua request ke backend terpisah (NEXT_PUBLIC_API_URL diset di env).
// Untuk next/image, host backend harus didaftarkan agar gambar /uploads tampil.
const remotePatterns = [
  {
    protocol: "http",
    hostname: "localhost",
    port: "5000",
    pathname: "/uploads/**",
  },
];

// Tambahkan host backend produksi secara otomatis dari NEXT_PUBLIC_API_URL.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
if (apiUrl) {
  try {
    const u = new URL(apiUrl);
    remotePatterns.push({
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/uploads/**",
    });
  } catch {
    // abaikan bila NEXT_PUBLIC_API_URL bukan URL valid
  }
}

const nextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
