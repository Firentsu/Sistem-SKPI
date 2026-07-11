# syntax=docker/dockerfile:1
# Backend SKPI — Node.js + LibreOffice untuk konversi DOCX → PDF.
# Railway memakai Dockerfile ini (root directory service = backend).
FROM node:20-bookworm-slim

# LibreOffice Writer (menyediakan perintah `libreoffice --convert-to pdf`) +
# font pengganti Times New Roman/Calibri/Cambria + openssl (dibutuhkan Prisma).
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-writer \
      fonts-liberation \
      fonts-crosextra-carlito \
      fonts-crosextra-caladea \
      openssl \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies. Sertakan devDependencies agar `prisma generate` bisa jalan.
COPY package*.json ./
RUN npm ci --include=dev

# Salin sumber, lalu generate Prisma Client untuk platform Linux container ini.
COPY . .
RUN npx prisma generate

# Railway menyuntikkan variabel PORT saat runtime; server.js sudah membacanya.
# `prisma migrate deploy` menerapkan migration yang belum jalan ke database Railway
# setiap kali container start, jadi schema DB selalu sinkron dengan kode.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
