import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,    // 1 menit (buat testing)
    max: 3,                       // maksimal 3 percobaan (buat testing)
    message: {
        error: "Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});