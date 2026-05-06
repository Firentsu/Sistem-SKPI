import { NextResponse } from "next/server";

/* ══════════════════════════════════════════════════════════
   Parser CPL dari teks Word (tanpa API, 100% gratis)
   
   Pola teks hasil mammoth.js:
     [nomor]
     [teks Indonesia]
     [teks English]
     [nomor berikutnya]
     ...
   
   Section markers:
     "Sikap" / "Proposition of Attitude"
     "Pengetahuan" / "Knowledge"
     "Keterampilan Umum" / "General Competence"
     "Keterampilan Khusus" / "Spesific Competences"
     "Aktivitas" / "Activities"  ← akhir CPL
══════════════════════════════════════════════════════════ */

const SECTION_MARKERS = {
    sikap: ["Sikap", "Proposition of Attitude"],
    pengetahuan: ["Pengetahuan", "Knowledge"],
    keterampilan_umum: ["Keterampilan Umum", "General Competence"],
    keterampilan_khusus: ["Keterampilan Khusus", "Spesific Competence", "Specific Competence"],
    end: ["AKTIVITAS", "Activities, Achievements", "Poin Integritas", "ICP"],
};

function isNumber(str) {
    return /^\d{1,2}$/.test(str.trim());
}

function isEnglish(text) {
    // English CPL biasanya dimulai kata kerja bahasa Inggris
    const englishStarters = [
        "Able", "Have", "Has", "Believe", "Master", "Know", "Apply", "Demonstrate",
        "Contribute", "Acting", "Respect", "Work", "Obey", "Internalize", "Show",
        "Able to", "Can", "Understand", "Develop", "Implement", "Manage", "Design",
        "Very good", "Graduate", "Licensed", "Academic", "Framework", "Level", "Scale",
        "Institute", "Bachelor", "Sarjana", // kadang English campur
    ];
    return englishStarters.some(w => text.startsWith(w));
}

function extractSection(lines, startIdx) {
    const items = [];
    let i = startIdx;
    let pendingID = null;

    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) { i++; continue; }

        // Cek apakah ini akhir section
        const isEnd = SECTION_MARKERS.end.some(m => line.toUpperCase().includes(m.toUpperCase())) ||
            Object.values(SECTION_MARKERS).slice(0, 4).some(markers =>
                markers.some(m => line === m)
            );
        if (isEnd && i > startIdx + 2) break;

        if (isNumber(line)) {
            // Nomor urut — simpan ID sebelumnya jika ada
            if (pendingID) items.push(pendingID);
            pendingID = { text: "", en: "" };
            i++;
            continue;
        }

        if (pendingID) {
            if (!pendingID.text) {
                pendingID.text = line;
            } else if (!pendingID.en) {
                pendingID.en = line;
                items.push(pendingID);
                pendingID = null;
            }
        }
        i++;
    }
    if (pendingID && pendingID.text) items.push(pendingID);
    return { items, endIdx: i };
}

function findSectionStart(lines, markers, fromIdx = 0) {
    for (let i = fromIdx; i < lines.length; i++) {
        const l = lines[i].trim();
        if (markers.some(m => l === m || l.startsWith(m))) return i + 1;
    }
    return -1;
}

function extractMeta(lines) {
    const meta = {
        gelar: "", gelar_en: "", kode_prodi: "", konsentrasi: "",
        konsentrasi_en: "", sk_pendirian: "", akreditasi: "",
        nama_en: "",
    };

    for (let i = 0; i < Math.min(lines.length, 120); i++) {
        const l = lines[i].trim();
        if (!l) continue;

        // Gelar
        if (lines[i - 1]?.trim() === "Gelar" || lines[i - 1]?.trim() === "Degree") {
            if (!meta.gelar && !l.startsWith("Bachelor") && !l.startsWith("Sarjana Muda")) {
                if (l.includes("Sarjana") || l.includes("S.")) meta.gelar = l;
            }
            if (!meta.gelar_en && (l.startsWith("Bachelor") || l.startsWith("Master"))) {
                meta.gelar_en = l;
            }
        }
        // Nama program studi English
        if (lines[i - 2]?.trim() === "Program Studi" || lines[i - 1]?.trim() === "Study Program") {
            if (l.match(/^[A-Z]/) && !l.includes("Kelas") && !l.includes("Reguler") && !l.includes("Concentration")) {
                if (!meta.nama_en) meta.nama_en = l;
            }
        }
        // Konsentrasi
        if (l.startsWith("Konsentrasi:") || l.startsWith("Concentration:")) {
            const val = l.split(":")[1]?.trim() || "";
            if (l.startsWith("Konsentrasi")) meta.konsentrasi = val;
            else meta.konsentrasi_en = val;
        }
        // SK Pendirian
        if (l.startsWith("SK Menteri") || l.includes("725/M/2020")) {
            meta.sk_pendirian = l;
        }
        // Akreditasi
        if (l.startsWith("Institusi:") || l.startsWith("Prodi") && l.includes("Terakreditasi")) {
            if (!meta.akreditasi) meta.akreditasi = l;
            else meta.akreditasi += "\n" + l;
        }
    }

    // Fallback gelar dari baris ke-39-40 (posisi tetap di dokumen ISB)
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "1.7" || lines[i].trim() === "Gelar") {
            if (lines[i + 2] && lines[i + 2].includes("Sarjana")) meta.gelar = lines[i + 2].trim();
            if (lines[i + 3] && lines[i + 3].startsWith("Bachelor")) meta.gelar_en = lines[i + 3].trim();
            break;
        }
    }

    return meta;
}

function guessKode(prodi) {
    const map = {
        "Teknologi Informasi": "TI", "Sistem Informasi": "SI",
        "Manajemen": "MNJ", "Kewirausahaan": "KWU",
        "Pendidikan Guru Sekolah Dasar": "PGSD", "Agroekoteknologi": "AGR",
    };
    if (map[prodi]) return map[prodi];
    return prodi.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 4);
}

function parseWordText(rawText, prodi) {
    // Split per baris, bersihkan
    const lines = rawText
        .split("\n")
        .map(l => l.replace(/\r/g, "").trim())
        .filter(l => l.length > 0);

    // Cari posisi tiap section
    const sikapStart = findSectionStart(lines, SECTION_MARKERS.sikap);
    const pengtStart = findSectionStart(lines, SECTION_MARKERS.pengetahuan, sikapStart > 0 ? sikapStart : 0);
    const kuStart = findSectionStart(lines, SECTION_MARKERS.keterampilan_umum, pengtStart > 0 ? pengtStart : 0);
    const kkStart = findSectionStart(lines, SECTION_MARKERS.keterampilan_khusus, kuStart > 0 ? kuStart : 0);

    const sikap = sikapStart >= 0 ? extractSection(lines, sikapStart).items : [];
    const pengetahuan = pengtStart >= 0 ? extractSection(lines, pengtStart).items : [];
    const keterampilan_umum = kuStart >= 0 ? extractSection(lines, kuStart).items : [];
    const keterampilan_khusus = kkStart >= 0 ? extractSection(lines, kkStart).items : [];

    const meta = extractMeta(lines);

    return {
        nama_prodi: prodi,
        nama_en: meta.nama_en || prodi,
        kode_prodi: guessKode(prodi),
        gelar: meta.gelar || "",
        gelar_en: meta.gelar_en || "",
        konsentrasi: meta.konsentrasi || "",
        konsentrasi_en: meta.konsentrasi_en || "",
        sk_pendirian: meta.sk_pendirian || "SK Menteri Pendidikan dan Kebudayaan Republik Indonesia No. 725/M/2020",
        akreditasi: meta.akreditasi || "",
        sikap,
        pengetahuan,
        keterampilan_umum,
        keterampilan_khusus,
    };
}

/* ══ Route Handler ══ */
export async function POST(request) {
    try {
        const { text, prodi } = await request.json();

        if (!text || !prodi) {
            return NextResponse.json({ error: "text dan prodi wajib diisi" }, { status: 400 });
        }

        // Coba parse lokal dulu (tanpa API)
        const parsed = parseWordText(text, prodi);

        const totalCPL =
            parsed.sikap.length +
            parsed.pengetahuan.length +
            parsed.keterampilan_umum.length +
            parsed.keterampilan_khusus.length;

        // Jika berhasil parse cukup banyak CPL, kembalikan langsung
        if (totalCPL >= 10) {
            return NextResponse.json({ ok: true, data: parsed, method: "parser" });
        }

        // Fallback ke Gemini jika parser gagal dan GEMINI_API_KEY ada
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            return await extractWithGemini(text, prodi, geminiKey);
        }

        // Fallback ke Anthropic jika ada
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (anthropicKey && !anthropicKey.includes("xxxxxxx")) {
            return await extractWithAnthropic(text, prodi, anthropicKey);
        }

        // Jika parser menghasilkan sesuatu, tetap kembalikan
        if (totalCPL > 0) {
            return NextResponse.json({
                ok: true, data: parsed, method: "parser",
                warning: `Hanya ditemukan ${totalCPL} CPL. Pastikan file Word adalah template SKPI ISB.`
            });
        }

        return NextResponse.json({
            error: "Gagal mengekstrak CPL dari dokumen ini. Pastikan file Word adalah template SKPI Institut Shanti Bhuana dengan tabel CPL yang lengkap."
        }, { status: 422 });

    } catch (err) {
        console.error("[extract-cpl] error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

/* ══ Gemini (gratis) ══ */
async function extractWithGemini(text, prodi, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = buildPrompt(text, prodi);

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8000 },
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.trim().replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(raw);
    return NextResponse.json({ ok: true, data: parsed, method: "gemini" });
}

/* ══ Anthropic (berbayar) ══ */
async function extractWithAnthropic(text, prodi, apiKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            messages: [{ role: "user", content: buildPrompt(text, prodi) }],
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Claude API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    let raw = data.content?.[0]?.text || "";
    raw = raw.trim().replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(raw);
    return NextResponse.json({ ok: true, data: parsed, method: "anthropic" });
}

function buildPrompt(text, prodi) {
    return `Ekstrak SEMUA CPL dari dokumen SKPI program studi "${prodi}". Kembalikan JSON saja tanpa penjelasan:
{"nama_prodi":"${prodi}","nama_en":"...","kode_prodi":"...","gelar":"...","gelar_en":"...","konsentrasi":"","konsentrasi_en":"","sk_pendirian":"...","akreditasi":"...","sikap":[{"text":"...","en":"..."}],"pengetahuan":[{"text":"...","en":"..."}],"keterampilan_umum":[{"text":"...","en":"..."}],"keterampilan_khusus":[{"text":"...","en":"..."}]}

TEKS:
${text.slice(0, 14000)}`;
}