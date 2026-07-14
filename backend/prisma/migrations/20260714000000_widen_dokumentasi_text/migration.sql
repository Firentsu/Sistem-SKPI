-- Lebarkan kolom TEXT (64KB) → MEDIUMTEXT (16MB) agar XML draw.io hasil import
-- (yang bisa >64KB, apalagi bila menyertakan gambar base64) bisa disimpan.
ALTER TABLE `Dokumentasi` MODIFY `konten` MEDIUMTEXT NULL;
ALTER TABLE `Dokumentasi` MODIFY `diagram_xml` MEDIUMTEXT NULL;
