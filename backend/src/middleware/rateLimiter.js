import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,    // jendela 5 menit
    max: 20,                      // maks 20 percobaan GAGAL per IP per jendela
    message: {
        error: "Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // login berhasil tidak menghabiskan kuota
});