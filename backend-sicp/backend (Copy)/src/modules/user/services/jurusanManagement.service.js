const db = require("../../../shared/config/db");

const pindahkanJurusanDosen = async (
  dosenId,
  jurusanId
) => {
  const [dosen] = await db.query(
    `
    SELECT id
    FROM dosen
    WHERE id = ?
    `,
    [dosenId]
  );

  if (dosen.length === 0) {
    throw new Error("Dosen tidak ditemukan");
  }

  const [jurusan] = await db.query(
    `
    SELECT id
    FROM jurusan
    WHERE id = ?
    `,
    [jurusanId]
  );

  if (jurusan.length === 0) {
    throw new Error("Jurusan tidak ditemukan");
  }

  await db.query(
    `
    UPDATE dosen
    SET jurusan_id = ?
    WHERE id = ?
    `,
    [jurusanId, dosenId]
  );

  return {
    success: true,
    message: "Jurusan dosen berhasil diperbarui"
  };
};

const pindahkanJurusanAdmin = async (
  userId,
  jurusanId
) => {
  const [admin] = await db.query(
    `
    SELECT id, role
    FROM users
    WHERE id = ?
    `,
    [userId]
  );

  if (admin.length === 0) {
    throw new Error("Admin tidak ditemukan");
  }

  if (admin[0].role !== "admin") {
    throw new Error("User bukan admin");
  }

  const [jurusan] = await db.query(
    `
    SELECT id
    FROM jurusan
    WHERE id = ?
    `,
    [jurusanId]
  );

  if (jurusan.length === 0) {
    throw new Error("Jurusan tidak ditemukan");
  }

  const [existing] = await db.query(
    `
    SELECT id
    FROM admin_profile
    WHERE user_id = ?
    `,
    [userId]
  );

  if (existing.length > 0) {
    await db.query(
      `
      UPDATE admin_profile
      SET jurusan_id = ?
      WHERE user_id = ?
      `,
      [jurusanId, userId]
    );
  } else {
    await db.query(
      `
      INSERT INTO admin_profile
      (
        user_id,
        jurusan_id
      )
      VALUES (?, ?)
      `,
      [userId, jurusanId]
    );
  }

  return {
    success: true,
    message: "Jurusan admin berhasil diperbarui"
  };
};

module.exports = {
  pindahkanJurusanDosen,
  pindahkanJurusanAdmin
}; 