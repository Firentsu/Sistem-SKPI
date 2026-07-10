-- CreateTable
CREATE TABLE `Dokumentasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(191) NOT NULL,
    `kategori` VARCHAR(50) NOT NULL,
    `deskripsi` VARCHAR(500) NULL,
    `konten` TEXT NULL,
    `file_url` VARCHAR(255) NULL,
    `diagram_xml` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
