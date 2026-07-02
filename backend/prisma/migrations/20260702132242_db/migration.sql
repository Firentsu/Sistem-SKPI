-- AlterTable
ALTER TABLE `mahasiswa` ADD COLUMN `gelar` VARCHAR(191) NULL,
    ADD COLUMN `gelar_eng` VARCHAR(191) NULL,
    ADD COLUMN `nomor_ijazah` VARCHAR(191) NULL,
    ADD COLUMN `tanggal_lulus` DATETIME(3) NULL,
    ADD COLUMN `tanggal_masuk` DATETIME(3) NULL,
    ADD COLUMN `tempat_lahir` VARCHAR(191) NULL,
    ADD COLUMN `tgl_lahir` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `tailscale_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_url` VARCHAR(191) NOT NULL DEFAULT '',
    `api_key` VARCHAR(191) NOT NULL DEFAULT '',
    `mahasiswa_ep` VARCHAR(191) NOT NULL DEFAULT '/api/users/by-role/mahasiswa',
    `icp_ep` VARCHAR(191) NOT NULL DEFAULT '/api/icp/balance/ranking',
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
