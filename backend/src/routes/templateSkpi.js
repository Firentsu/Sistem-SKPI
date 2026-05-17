/**
 * templateSkpi.js
 *
 * POST   /api/template-skpi/upload        — Upload .docx → auto convert ke PDF
 * GET    /api/template-skpi/list          — Daftar template
 * GET    /api/template-skpi/preview/:slug — Serve PDF langsung
 * DELETE /api/template-skpi/:slug         — Hapus template
 */
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import mammoth from "mammoth";
import PizZip from "pizzip";
import { requireAuth } from "../middleware/auth.js";

const execAsync = promisify(exec);
const router = express.Router();
const DIR = path.resolve("public/uploads/templates");
const PDF_DIR = path.resolve("public/uploads/templates/pdf");

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

/* ── Deteksi path LibreOffice ── */
function getLibreOfficeCmd() {
    if (process.platform === "win32") {
        const candidates = [
            "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
            "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        ];
        for (const p of candidates) {
            if (fs.existsSync(p)) return `"${p}"`;
        }
        return "soffice"; // fallback PATH
    }
    return "libreoffice"; // Linux/Mac
}

const LO_CMD = getLibreOfficeCmd();

/* ── Convert .docx → PDF via LibreOffice headless ── */
async function convertToPdf(docxPath, outDir) {
    const base = path.basename(docxPath, ".docx");
    const pdfPath = path.join(outDir, `${base}.pdf`);

    if (process.platform === "win32") {
        // ── Coba Microsoft Word via VBScript (support art borders) ──
        const docxWin = docxPath.replace(/\\/g, '\\\\');
        const pdfWin = pdfPath.replace(/\\/g, '\\\\');
        const vbs = [
            'Dim oWord, oDoc',
            'On Error Resume Next',
            'Set oWord = CreateObject("Word.Application")',
            'If Err.Number <> 0 Then WScript.Quit(1)',
            'oWord.Visible = False',
            'Set oDoc = oWord.Documents.Open("' + docxWin + '")',
            'If Err.Number <> 0 Then oWord.Quit : WScript.Quit(2)',
            'oDoc.SaveAs2 "' + pdfWin + '", 17',
            'oDoc.Close False',
            'oWord.Quit',
            'WScript.Quit(0)',
        ].join('\r\n');

        const vbsPath = path.join(outDir, base + '_convert.vbs');
        fs.writeFileSync(vbsPath, vbs, 'utf8');
        let wordOk = false;
        try {
            await execAsync('cscript //NoLogo "' + vbsPath + '"', { timeout: 60000 });
            wordOk = fs.existsSync(pdfPath);
        } catch { }
        try { fs.unlinkSync(vbsPath); } catch { }

        if (wordOk) return pdfPath;
        // Fallback ke LibreOffice
    }

    // ── LibreOffice (Linux / Windows fallback) ──
    const cmd = `${LO_CMD} --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`;
    await execAsync(cmd, { timeout: 60000 });
    if (!fs.existsSync(pdfPath)) throw new Error("Konversi PDF gagal — file tidak ditemukan.");
    return pdfPath;
}

/* ─────────────────────────────────────────────────────
   CPL INJECTOR — Inject CPL ke Word XML, regenerate PDF
───────────────────────────────────────────────────── */
function extractParaText(paraXml) {
    const parts = [];
    const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let m;
    while ((m = re.exec(paraXml)) !== null) parts.push(m[1]);
    return parts.join('');
}

function escXmlStr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function findNextParaPos(xml, fromPos) {
    let pos = fromPos;
    while (pos < xml.length) {
        const cand = xml.indexOf('<w:p', pos);
        if (cand === -1) return -1;
        const ch = xml[cand + 4];
        if (ch === '>' || ch === ' ' || ch === '\n' || ch === '\r') return cand;
        pos = cand + 1;
    }
    return -1;
}

function buildCplParagraph(templateXml, number, text) {
    const pPrM = templateXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const pPr  = pPrM ? pPrM[0] : '';
    const rM   = templateXml.match(/<w:r[ >][\s\S]*?<\/w:r>/);
    let rPr = '';
    if (rM) {
        const rPrM = rM[0].match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
        if (rPrM) rPr = rPrM[0];
    }
    return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escXmlStr(`${number}. ${text}`)}</w:t></w:r></w:p>`;
}

function injectCplSection(xml, markers, nextMarkerGroups, items) {
    let secPos = -1;
    for (const m of markers) {
        const p = xml.indexOf(m);
        if (p !== -1 && (secPos === -1 || p < secPos)) secPos = p;
    }
    if (secPos === -1) return xml;

    const headerEnd = xml.indexOf('</w:p>', secPos);
    if (headerEnd === -1) return xml;
    const afterHeader = headerEnd + 6;

    // Tentukan batas bawah section
    let limitPos = xml.length;
    for (const group of nextMarkerGroups) {
        for (const m of group) {
            const p = xml.indexOf(m, afterHeader);
            if (p !== -1 && p < limitPos) limitPos = p;
        }
    }

    // Kumpulkan semua paragraf bernomor dalam section ini
    let firstStart = -1, lastEnd = -1, templatePara = null;
    let pos = afterHeader;

    while (pos < limitPos) {
        const pStart = findNextParaPos(xml, pos);
        if (pStart === -1 || pStart >= limitPos) break;
        const pEnd = xml.indexOf('</w:p>', pStart);
        if (pEnd === -1) break;
        const pEndFull = pEnd + 6;

        const paraXml = xml.substring(pStart, pEndFull);
        const text = extractParaText(paraXml).trim();

        if (/^\d+[.\)]\s/.test(text)) {
            if (firstStart === -1) { firstStart = pStart; templatePara = paraXml; }
            lastEnd = pEndFull;
        }
        pos = pEndFull;
    }

    if (firstStart === -1 || !templatePara) return xml;

    const newParas = items.map((item, i) =>
        buildCplParagraph(templatePara, i + 1, item.id)
    ).join('');

    return xml.substring(0, firstStart) + newParas + xml.substring(lastEnd);
}

async function regeneratePreviewWithCpl(slug, cplData) {
    const docxPath = path.join(DIR, `${slug}.docx`);
    if (!fs.existsSync(docxPath)) return;

    const rawContent = fs.readFileSync(docxPath, 'binary');
    const zip = new PizZip(rawContent);
    const docFile = zip.file('word/document.xml');
    if (!docFile) return;

    let xml = docFile.asText();

    // Proses dari section paling bawah agar posisi tidak bergeser
    const SECS = [
        {
            key: 'keterampilan_khusus',
            markers: ['KETERAMPILAN KHUSUS', 'SPECIFIC COMPETENCE'],
            next: [],
        },
        {
            key: 'keterampilan_umum',
            markers: ['KETERAMPILAN UMUM', 'GENERAL COMPETENCE'],
            next: [['KETERAMPILAN KHUSUS', 'SPECIFIC COMPETENCE']],
        },
        {
            key: 'pengetahuan',
            markers: ['PENGETAHUAN', 'KNOWLEDGE'],
            next: [['KETERAMPILAN UMUM', 'GENERAL COMPETENCE'], ['KETERAMPILAN KHUSUS', 'SPECIFIC COMPETENCE']],
        },
        {
            key: 'sikap',
            markers: ['SIKAP', 'PROPOSITION OF ATTITUDE'],
            next: [['PENGETAHUAN', 'KNOWLEDGE'], ['KETERAMPILAN UMUM', 'GENERAL COMPETENCE'], ['KETERAMPILAN KHUSUS', 'SPECIFIC COMPETENCE']],
        },
    ];

    for (const sec of SECS) {
        const items = cplData[sec.key];
        if (!items?.length) continue;
        xml = injectCplSection(xml, sec.markers, sec.next, items);
    }

    zip.file('word/document.xml', xml);

    const tempSlug   = `${slug}_preview_tmp`;
    const tempDocx   = path.join(DIR, `${tempSlug}.docx`);
    const finalPdf   = path.join(PDF_DIR, `${slug}.pdf`);
    const tempPdf    = path.join(PDF_DIR, `${tempSlug}.pdf`);

    fs.writeFileSync(tempDocx, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));

    try {
        await convertToPdf(tempDocx, PDF_DIR);
        if (fs.existsSync(tempPdf)) {
            fs.copyFileSync(tempPdf, finalPdf);
            try { fs.unlinkSync(tempPdf); } catch {}
        }
    } finally {
        try { fs.unlinkSync(tempDocx); } catch {}
    }
}

/* ─────────────────────────────────────────────────────
   CPL EXTRACTOR — Parse CPL items dari teks .docx
───────────────────────────────────────────────────── */
function parseCplFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const result = { sikap: [], pengetahuan: [], keterampilan_umum: [], keterampilan_khusus: [] };
    let currentSection = null;

    const detectSection = (line) => {
        const up = line.toUpperCase();
        if (up.includes("KETERAMPILAN KHUSUS") || up.includes("SPECIFIC COMPETENCE")) return "keterampilan_khusus";
        if (up.includes("KETERAMPILAN UMUM")   || up.includes("GENERAL COMPETENCE"))  return "keterampilan_umum";
        if (up.includes("PENGETAHUAN")          || up.includes("KNOWLEDGE"))           return "pengetahuan";
        if (up.includes("SIKAP")               || up.includes("PROPOSITION OF ATTITUDE")) return "sikap";
        return null;
    };

    for (const line of lines) {
        if (line.length < 80) {
            const sec = detectSection(line);
            if (sec) { currentSection = sec; continue; }
        }
        if (currentSection) {
            const m = line.match(/^(\d+)[.\)]\s+(.+)/);
            if (m) result[currentSection].push({ id: m[2].trim(), en: "" });
        }
    }

    const total = Object.values(result).reduce((s, a) => s + a.length, 0);
    return total > 0 ? result : null;
}

async function extractCplFromDocx(buffer) {
    try {
        const { value } = await mammoth.extractRawText({ buffer });
        return parseCplFromText(value);
    } catch {
        return null;
    }
}

/* ─────────────────────────────────────────────────────
   MULTER
───────────────────────────────────────────────────── */
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === ".docx") return cb(null, true);
        file._rejected = true;
        cb(null, false);
    },
    limits: { fileSize: 20 * 1024 * 1024 },
});

function uploadSingle(req, res, next) {
    upload.single("file")(req, res, (err) => {
        if (err) return res.status(400).json({ ok: false, error: err.message });
        next();
    });
}

/* ─────────────────────────────────────────────────────
   POST /upload
   1. Simpan .docx
   2. Convert ke PDF via LibreOffice
   3. Return info
───────────────────────────────────────────────────── */
router.post("/upload", requireAuth, uploadSingle, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ ok: false, error: "File tidak ditemukan atau bukan .docx." });
    }

    const slug = (req.body.nama_prodi || "unknown")
        .trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const filename = `${slug}.docx`;
    const docxPath = path.join(DIR, filename);

    try {
        /* 1. Simpan .docx */
        fs.writeFileSync(docxPath, req.file.buffer);

        /* 2. Convert ke PDF */
        const pdfPath = await convertToPdf(docxPath, PDF_DIR);

        /* 3. Ekstrak CPL dari isi .docx */
        const extractedCpl = await extractCplFromDocx(req.file.buffer);

        return res.json({
            ok: true,
            nama_prodi: req.body.nama_prodi,
            filename,
            docx_url: `/uploads/templates/${filename}`,
            pdf_url: `/uploads/templates/pdf/${slug}.pdf`,
            size: req.file.size,
            pdf_size: fs.statSync(pdfPath).size,
            extracted_cpl: extractedCpl,
        });

    } catch (e) {
        console.error("Upload/convert error:", e);
        /* Jika convert gagal tapi docx sudah tersimpan, tetap anggap ok
           tapi kasih warning — preview akan gagal */
        if (fs.existsSync(docxPath)) {
            return res.status(500).json({
                ok: false,
                error: `File tersimpan tapi gagal konversi ke PDF: ${e.message}. ` +
                    `Pastikan LibreOffice terinstall di server.`,
            });
        }
        return res.status(500).json({ ok: false, error: e.message });
    }
});

/* ─────────────────────────────────────────────────────
   GET /list
───────────────────────────────────────────────────── */
router.get("/list", requireAuth, (req, res) => {
    const files = fs.existsSync(DIR)
        ? fs.readdirSync(DIR).filter(f => f.endsWith(".docx"))
        : [];

    const list = files.map(f => {
        const slug = f.replace(".docx", "");
        const stat = fs.statSync(path.join(DIR, f));
        const pdfFile = path.join(PDF_DIR, `${slug}.pdf`);
        return {
            filename: f,
            slug,
            nama_prodi: slug.replace(/_/g, " "),
            docx_url: `/uploads/templates/${f}`,
            pdf_url: fs.existsSync(pdfFile) ? `/uploads/templates/pdf/${slug}.pdf` : null,
            has_pdf: fs.existsSync(pdfFile),
            size: stat.size,
            updated_at: stat.mtime,
        };
    });

    return res.json({ ok: true, list });
});

/* ─────────────────────────────────────────────────────
   GET /preview/:slug  — Serve PDF langsung
───────────────────────────────────────────────────── */
router.get("/preview/:slug", requireAuth, (req, res) => {
    const slug = req.params.slug.replace(/[^a-zA-Z0-9_]/g, "");
    const pdfPath = path.join(PDF_DIR, `${slug}.pdf`);

    if (!fs.existsSync(pdfPath)) {
        /* Coba re-convert jika docx ada tapi pdf belum */
        const docxPath = path.join(DIR, `${slug}.docx`);
        if (fs.existsSync(docxPath)) {
            convertToPdf(docxPath, PDF_DIR)
                .then(() => {
                    if (fs.existsSync(pdfPath)) {
                        res.setHeader("Content-Type", "application/pdf");
                        res.setHeader("Content-Disposition", `inline; filename="${slug}.pdf"`);
                        fs.createReadStream(pdfPath).pipe(res);
                    } else {
                        res.status(500).json({ error: "Konversi PDF gagal." });
                    }
                })
                .catch(e => res.status(500).json({ error: "Gagal konversi: " + e.message }));
            return;
        }
        return res.status(404).json({ error: "Template PDF tidak ditemukan. Silakan upload ulang." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${slug}.pdf"`);
    res.setHeader("Cache-Control", "no-cache");
    fs.createReadStream(pdfPath).pipe(res);
});

/* ─────────────────────────────────────────────────────
   DELETE /:slug
───────────────────────────────────────────────────── */
router.delete("/:slug", requireAuth, (req, res) => {
    const slug = req.params.slug.replace(/[^a-zA-Z0-9_]/g, "");

    const docxPath = path.join(DIR, `${slug}.docx`);
    const pdfPath = path.join(PDF_DIR, `${slug}.pdf`);

    if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    return res.json({ ok: true });
});

/* ─────────────────────────────────────────────────────
   POST /cpl/:slug  — simpan CPL + regenerasi preview
───────────────────────────────────────────────────── */
router.post("/cpl/:slug", requireAuth, express.json(), async (req, res) => {
    const slug    = req.params.slug.replace(/[^a-zA-Z0-9_]/g, "");
    const cplData = req.body;

    if (!cplData || typeof cplData !== 'object') {
        return res.status(400).json({ ok: false, error: "Data CPL tidak valid." });
    }

    const cplPath = path.join(DIR, `${slug}_cpl.json`);
    fs.writeFileSync(cplPath, JSON.stringify(cplData), 'utf8');

    const hasTemplate = fs.existsSync(path.join(DIR, `${slug}.docx`));
    if (hasTemplate) {
        regeneratePreviewWithCpl(slug, cplData).catch(e =>
            console.error(`[CPL regen ${slug}]`, e.message)
        );
    }

    return res.json({ ok: true, regenerating: hasTemplate });
});

/* ─────────────────────────────────────────────────────
   GET /cpl/:slug  — ambil CPL tersimpan
───────────────────────────────────────────────────── */
router.get("/cpl/:slug", requireAuth, (req, res) => {
    const slug    = req.params.slug.replace(/[^a-zA-Z0-9_]/g, "");
    const cplPath = path.join(DIR, `${slug}_cpl.json`);

    if (!fs.existsSync(cplPath)) return res.json({ ok: true, cpl_data: null });

    try {
        const cpl_data = JSON.parse(fs.readFileSync(cplPath, 'utf8'));
        return res.json({ ok: true, cpl_data });
    } catch {
        return res.json({ ok: true, cpl_data: null });
    }
});

export default router;