-- CreateTable
CREATE TABLE `Users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('mahasiswa', 'admin') NOT NULL,
    `email` VARCHAR(191) NULL,
    `status_akun` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mahasiswa` (
    `id_mahasiswa` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NULL,
    `nim` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `id_prodi` INTEGER NULL,
    `angkatan` INTEGER NULL,
    `email` VARCHAR(191) NULL,
    `foto_profil` VARCHAR(191) NULL,
    `status_skpi` ENUM('belum', 'diajukan', 'direvisi', 'diterbitkan') NOT NULL DEFAULT 'belum',

    PRIMARY KEY (`id_mahasiswa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id_admin` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NULL,
    `nama_admin` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,

    PRIMARY KEY (`id_admin`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProgramStudi` (
    `id_prodi` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_prodi` VARCHAR(191) NOT NULL,
    `fakultas` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_prodi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JenisAktivitas` (
    `id_jenis` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_indo` VARCHAR(191) NOT NULL,
    `nama_eng` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_jenis`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KategoriAktivitas` (
    `id_kategori` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_indo` VARCHAR(191) NOT NULL,
    `nama_eng` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_kategori`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KelompokAktivitas` (
    `id_kelompok` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_indo` VARCHAR(191) NOT NULL,
    `nama_eng` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_kelompok`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LevelKegiatan` (
    `id_level` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_level` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_level`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PosisiKegiatan` (
    `id_posisi` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_posisi` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_posisi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeriodeAkademik` (
    `id_periode` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_periode` VARCHAR(191) NOT NULL,
    `semester` ENUM('Ganjil', 'Genap') NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_periode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KegiatanMahasiswa` (
    `id_kegiatan` INTEGER NOT NULL AUTO_INCREMENT,
    `id_mahasiswa` INTEGER NULL,
    `id_jenis` INTEGER NULL,
    `id_kategori` INTEGER NULL,
    `id_kelompok` INTEGER NULL,
    `id_level` INTEGER NULL,
    `id_posisi` INTEGER NULL,
    `nama_kegiatan` VARCHAR(191) NOT NULL,
    `nama_kegiatan_eng` VARCHAR(191) NULL,
    `penyelenggara` VARCHAR(191) NULL,
    `lokasi` VARCHAR(191) NULL,
    `tanggal_kegiatan` DATETIME(3) NULL,
    `periode_kegiatan` VARCHAR(191) NULL,
    `tingkat_prestasi` VARCHAR(191) NULL,
    `peringkat` VARCHAR(191) NULL,
    `status_verifikasi` ENUM('diproses', 'disetujui', 'ditolak', 'revisi') NOT NULL DEFAULT 'diproses',
    `catatan_admin` VARCHAR(191) NULL,

    PRIMARY KEY (`id_kegiatan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuktiKegiatan` (
    `id_bukti` INTEGER NOT NULL AUTO_INCREMENT,
    `id_kegiatan` INTEGER NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `tipe_file` VARCHAR(191) NULL,
    `ukuran_file` INTEGER NULL,
    `upload_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_bukti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IcpKategori` (
    `id_icp` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_indo` VARCHAR(191) NOT NULL,
    `nama_eng` VARCHAR(191) NOT NULL,
    `bobot_poin` INTEGER NOT NULL,

    PRIMARY KEY (`id_icp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IcpMahasiswa` (
    `id_icp_mahasiswa` INTEGER NOT NULL AUTO_INCREMENT,
    `id_mahasiswa` INTEGER NULL,
    `id_icp` INTEGER NULL,
    `total_poin` INTEGER NULL,

    PRIMARY KEY (`id_icp_mahasiswa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notifikasi` (
    `id_notifikasi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NULL,
    `judul` VARCHAR(191) NOT NULL,
    `pesan` VARCHAR(191) NOT NULL,
    `status_baca` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_notifikasi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PengajuanSkpi` (
    `id_pengajuan` INTEGER NOT NULL AUTO_INCREMENT,
    `id_mahasiswa` INTEGER NULL,
    `tanggal_pengajuan` DATETIME(3) NULL,
    `status_pengajuan` ENUM('menunggu', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu',
    `catatan_admin` VARCHAR(191) NULL,

    PRIMARY KEY (`id_pengajuan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Skpi` (
    `id_skpi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_mahasiswa` INTEGER NULL,
    `nomor_skpi` VARCHAR(191) NULL,
    `tanggal_terbit` DATETIME(3) NULL,
    `file_skpi` VARCHAR(191) NULL,
    `versi` INTEGER NULL,
    `status` ENUM('draft', 'resmi') NOT NULL DEFAULT 'draft',

    PRIMARY KEY (`id_skpi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RiwayatSkpi` (
    `id_riwayat` INTEGER NOT NULL AUTO_INCREMENT,
    `id_skpi` INTEGER NULL,
    `id_mahasiswa` INTEGER NULL,
    `tanggal_generate` DATETIME(3) NULL,
    `keterangan` VARCHAR(191) NULL,

    PRIMARY KEY (`id_riwayat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cpl` (
    `id_cpl` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_cpl` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,

    PRIMARY KEY (`id_cpl`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemplateSkpi` (
    `id_template` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_template` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_template`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SectionTemplate` (
    `id_section` INTEGER NOT NULL AUTO_INCREMENT,
    `id_template` INTEGER NULL,
    `judul_indo` VARCHAR(191) NOT NULL,
    `judul_eng` VARCHAR(191) NOT NULL,
    `urutan` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_section`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TandaTanganDigital` (
    `id_ttd` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_pejabat` VARCHAR(191) NOT NULL,
    `jabatan` VARCHAR(191) NOT NULL,
    `file_ttd` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_ttd`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Mahasiswa` ADD CONSTRAINT `Mahasiswa_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mahasiswa` ADD CONSTRAINT `Mahasiswa_id_prodi_fkey` FOREIGN KEY (`id_prodi`) REFERENCES `ProgramStudi`(`id_prodi`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KegiatanMahasiswa` ADD CONSTRAINT `KegiatanMahasiswa_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `Mahasiswa`(`id_mahasiswa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KegiatanMahasiswa` ADD CONSTRAINT `KegiatanMahasiswa_id_jenis_fkey` FOREIGN KEY (`id_jenis`) REFERENCES `JenisAktivitas`(`id_jenis`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KegiatanMahasiswa` ADD CONSTRAINT `KegiatanMahasiswa_id_kategori_fkey` FOREIGN KEY (`id_kategori`) REFERENCES `KategoriAktivitas`(`id_kategori`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KegiatanMahasiswa` ADD CONSTRAINT `KegiatanMahasiswa_id_kelompok_fkey` FOREIGN KEY (`id_kelompok`) REFERENCES `KelompokAktivitas`(`id_kelompok`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KegiatanMahasiswa` ADD CONSTRAINT `KegiatanMahasiswa_id_level_fkey` FOREIGN KEY (`id_level`) REFERENCES `LevelKegiatan`(`id_level`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KegiatanMahasiswa` ADD CONSTRAINT `KegiatanMahasiswa_id_posisi_fkey` FOREIGN KEY (`id_posisi`) REFERENCES `PosisiKegiatan`(`id_posisi`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BuktiKegiatan` ADD CONSTRAINT `BuktiKegiatan_id_kegiatan_fkey` FOREIGN KEY (`id_kegiatan`) REFERENCES `KegiatanMahasiswa`(`id_kegiatan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IcpMahasiswa` ADD CONSTRAINT `IcpMahasiswa_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `Mahasiswa`(`id_mahasiswa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IcpMahasiswa` ADD CONSTRAINT `IcpMahasiswa_id_icp_fkey` FOREIGN KEY (`id_icp`) REFERENCES `IcpKategori`(`id_icp`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifikasi` ADD CONSTRAINT `Notifikasi_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PengajuanSkpi` ADD CONSTRAINT `PengajuanSkpi_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `Mahasiswa`(`id_mahasiswa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Skpi` ADD CONSTRAINT `Skpi_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `Mahasiswa`(`id_mahasiswa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiwayatSkpi` ADD CONSTRAINT `RiwayatSkpi_id_skpi_fkey` FOREIGN KEY (`id_skpi`) REFERENCES `Skpi`(`id_skpi`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiwayatSkpi` ADD CONSTRAINT `RiwayatSkpi_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `Mahasiswa`(`id_mahasiswa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionTemplate` ADD CONSTRAINT `SectionTemplate_id_template_fkey` FOREIGN KEY (`id_template`) REFERENCES `TemplateSkpi`(`id_template`) ON DELETE SET NULL ON UPDATE CASCADE;
