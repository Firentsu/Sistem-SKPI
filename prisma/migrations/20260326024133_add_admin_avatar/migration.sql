/*
  Warnings:

  - A unique constraint covering the columns `[id_user]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `admin` ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX `Admin_id_user_key` ON `Admin`(`id_user`);
