import "./globals.css";

export const metadata = {
  title: "SKPI — Institut Shanti Bhuana",
  description: "Sistem Surat Keterangan Pendamping Ijazah",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}