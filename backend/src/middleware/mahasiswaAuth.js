import prisma from "../lib/prisma.js";

/**
 * Middleware: cek sesi mahasiswa aktif.
 * Sesi disimpan di MySQL via express-session.
 * Jika valid → req.mahasiswaUser berisi user, req.mahasiswa berisi data mahasiswa.
 */
export async function requireMahasiswaAuth(req, res, next) {
    try {
        const { userId, mahasiswaId, role } = req.session ?? {};

        if (!userId || role !== "mahasiswa") {
            return res.status(401).json({ error: "Tidak terautentikasi" });
        }

        const user = await prisma.users.findUnique({
            where: { user_id: userId },
            include: {
                mahasiswa: { include: { programstudi: true } },
            },
        });

        if (!user || user.role !== "mahasiswa") {
            req.session.destroy(() => { });
            return res.status(403).json({ error: "Akses ditolak" });
        }

        if (user.status_akun === "nonaktif") {
            req.session.destroy(() => { });
            return res.status(403).json({ error: "Akun dinonaktifkan. Hubungi admin." });
        }

        const mahasiswa =
            user.mahasiswa.find((m) => m.id_mahasiswa === mahasiswaId) ??
            user.mahasiswa[0];

        if (!mahasiswa) {
            return res.status(403).json({ error: "Data mahasiswa tidak ditemukan" });
        }

        req.mahasiswaUser = user;
        req.mahasiswa = mahasiswa;
        next();
    } catch (err) {
        console.error("requireMahasiswaAuth error:", err);
        res.status(500).json({ error: "Server error" });
    }
}