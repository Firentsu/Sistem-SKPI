/**
 * skpi-pdf.js — Generate PDF SKPI menggunakan jsPDF via CDN
 * Load jsPDF langsung dari CDN agar tidak ada masalah bundler/polyfill
 */

/* ── WARNA dari Word asli ── */
const C = {
    secHdr: [250, 191, 143],
    catHdr: [214, 227, 188],
    catLabel: [238, 236, 225],
    subLabel: [221, 217, 195],
    numCell: [219, 229, 241],
    idCell: [242, 242, 242],
    enCell: [253, 233, 217],
    icpRes: [242, 219, 219],
    white: [255, 255, 255],
    border: [170, 170, 170],
    frame: [192, 80, 77],
    black: [0, 0, 0],
    gray: [85, 85, 85],
};

const PW = 210, PH = 297, ML = 18, MR = 18, MT = 16, MB = 14;
const CW = PW - ML - MR;

/* Load jsPDF dari CDN (browser only) */
async function getJsPDF() {
    if (typeof window === "undefined") throw new Error("PDF hanya bisa digenerate di browser");
    if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;

    await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("Gagal load jsPDF dari CDN"));
        document.head.appendChild(s);
    });

    return window.jspdf?.jsPDF || window.jsPDF;
}

/* ─── HELPERS ─── */
function setFill(doc, rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc, rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

function drawFrame(doc) {
    const THICK = 4, SIZE = 4;
    setFill(doc, C.frame);
    for (let x = 0; x < PW; x += SIZE) {
        doc.triangle(x, 0, x + SIZE, 0, x + SIZE / 2, THICK, "F");
    }
    for (let x = 0; x < PW; x += SIZE) {
        doc.triangle(x, PH, x + SIZE, PH, x + SIZE / 2, PH - THICK, "F");
    }
    for (let y = 0; y < PH; y += SIZE) {
        doc.triangle(0, y, 0, y + SIZE, THICK, y + SIZE / 2, "F");
    }
    for (let y = 0; y < PH; y += SIZE) {
        doc.triangle(PW, y, PW, y + SIZE, PW - THICK, y + SIZE / 2, "F");
    }
}

function addPage(doc) {
    doc.addPage("a4");
    drawFrame(doc);
}

function checkPage(doc, y, needed = 15) {
    if (y + needed > PH - MB) { addPage(doc); return MT; }
    return y;
}

function lh(fs) { return fs * 0.352778 * 1.35; }

/* Tulis teks dalam kotak, return y bawah */
function box(doc, x, y, w, h, text, opts = {}) {
    const { fill = C.white, color = C.black, fs = 8.5, bold = false,
        italic = false, align = "left", pad = 1.5 } = opts;
    setFill(doc, fill); setDraw(doc, C.border);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h, "FD");
    if (!text && text !== 0) return y + h;
    doc.setFontSize(fs);
    doc.setFont("times", bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal");
    setColor(doc, color);
    const lines = doc.splitTextToSize(String(text), w - pad * 2);
    const lineH = lh(fs);
    let ty = y + pad + lineH * 0.75;
    lines.forEach(line => {
        let tx = x + pad;
        if (align === "center") tx = x + w / 2;
        if (align === "right") tx = x + w - pad;
        doc.text(line, tx, ty, { align });
        ty += lineH;
    });
    return y + h;
}

/* Hitung tinggi teks */
function textH(doc, text, w, fs = 8.5, pad = 1.5, min = 6) {
    doc.setFontSize(fs);
    const lines = doc.splitTextToSize(String(text || " "), w - pad * 2);
    return Math.max(min, lines.length * lh(fs) + pad * 2);
}

/* ─── KOMPONEN BARIS ─── */
function secHdr(doc, y, no, id, en) {
    const hID = textH(doc, id, CW - 12, 9.5, 2, 5);
    const hEN = textH(doc, en, CW - 12, 8, 2, 4);
    const h = hID + hEN + 1;
    setFill(doc, C.secHdr); setDraw(doc, C.border);
    doc.setLineWidth(0.2); doc.rect(ML, y, CW, h, "FD");
    // nomor
    doc.setFontSize(9.5); doc.setFont("times", "bold"); setColor(doc, C.black);
    doc.text(`${no}.`, ML + 2, y + 5.5);
    // ID
    const linesID = doc.splitTextToSize(id, CW - 14);
    let ty = y + 2 + lh(9.5) * 0.8;
    linesID.forEach(l => { doc.text(l, ML + 9, ty); ty += lh(9.5); });
    // EN
    doc.setFontSize(8); doc.setFont("times", "italic"); setColor(doc, C.gray);
    const linesEN = doc.splitTextToSize(en, CW - 14);
    linesEN.forEach(l => { doc.text(l, ML + 9, ty); ty += lh(8); });
    setColor(doc, C.black);
    return y + h;
}

function identRow(doc, y, no, id, en, val) {
    const WN = 12, WL = CW * 0.36, WV = CW - WN - WL;
    const hL = textH(doc, id, WL, 8.5) + textH(doc, en, WL, 7.5);
    const hV = textH(doc, val, WV, 8.5);
    const h = Math.max(hL, hV, 7);
    box(doc, ML, y, WN, h, no, { fill: C.white, bold: true, align: "center" });
    // label box
    setFill(doc, C.white); setDraw(doc, C.border); doc.setLineWidth(0.2);
    doc.rect(ML + WN, y, WL, h, "FD");
    doc.setFontSize(8.5); doc.setFont("times", "normal"); setColor(doc, C.black);
    let ty = y + 1.5 + lh(8.5) * 0.75;
    doc.splitTextToSize(id, WL - 3).forEach(l => { doc.text(l, ML + WN + 1.5, ty); ty += lh(8.5); });
    doc.setFontSize(7.5); doc.setFont("times", "italic"); setColor(doc, C.gray);
    doc.splitTextToSize(en, WL - 3).forEach(l => { doc.text(l, ML + WN + 1.5, ty); ty += lh(7.5); });
    setColor(doc, C.black);
    box(doc, ML + WN + WL, y, WV, h, val || "", { fill: C.white, fs: 8.5 });
    return y + h;
}

function catHdr(doc, y, id, en) {
    const h = textH(doc, id, CW, 9, 2, 6);
    setFill(doc, C.catHdr); setDraw(doc, C.border); doc.setLineWidth(0.2);
    doc.rect(ML, y, CW, h, "FD");
    doc.setFontSize(9); doc.setFont("times", "bold"); setColor(doc, C.black);
    const cy = y + h / 2 + 1.5;
    doc.text(id + "  ", ML + 2, cy);
    const wID = doc.getTextWidth(id + "  ");
    doc.setFont("times", "italic"); setColor(doc, C.gray);
    doc.text(en, ML + 2 + wID, cy);
    setColor(doc, C.black);
    return y + h;
}

function cplRow(doc, y, no, id, en) {
    const WN = 10, WI = (CW - WN) / 2, WE = CW - WN - WI;
    const h = Math.max(textH(doc, id, WI, 8.5), textH(doc, en, WE, 8.5), 5);
    box(doc, ML, y, WN, h, no, { fill: C.numCell, bold: true, align: "center" });
    box(doc, ML + WN, y, WI, h, id, { fill: C.idCell, fs: 8.5 });
    box(doc, ML + WN + WI, y, WE, h, en, { fill: C.enCell, fs: 8.5, italic: true });
    return y + h;
}

function aktRow(doc, y, no, id, en, val) {
    const WN = 10, WL = CW * 0.36, WV = CW - WN - WL;
    const hL = textH(doc, id, WL, 8.5) + textH(doc, en, WL, 7.5);
    const hV = textH(doc, val || "", WV, 8.5, 1.5, 5);
    const h = Math.max(hL, hV, 6);
    box(doc, ML, y, WN, h, no, { fill: C.white, bold: true, align: "center" });
    setFill(doc, C.white); setDraw(doc, C.border); doc.setLineWidth(0.2);
    doc.rect(ML + WN, y, WL, h, "FD");
    let ty = y + 1.5 + lh(8.5) * 0.75;
    doc.setFontSize(8.5); doc.setFont("times", "bold"); setColor(doc, C.black);
    doc.splitTextToSize(id, WL - 3).forEach(l => { doc.text(l, ML + WN + 1.5, ty); ty += lh(8.5); });
    doc.setFontSize(7.5); doc.setFont("times", "italic"); setColor(doc, C.gray);
    doc.splitTextToSize(en, WL - 3).forEach(l => { doc.text(l, ML + WN + 1.5, ty); ty += lh(7.5); });
    setColor(doc, C.black);
    box(doc, ML + WN + WL, y, WV, h, val || "", { fill: C.white, fs: 8.5 });
    return y + h;
}

async function fetchBase64(src) {
    const res = await fetch(src);
    const buf = await res.arrayBuffer();
    let bin = "";
    new Uint8Array(buf).forEach(b => bin += String.fromCharCode(b));
    return "data:image/png;base64," + btoa(bin);
}

/* ══════════════════════════════════════
   EXPORT UTAMA
══════════════════════════════════════ */
export async function generateSkpiPdf(tpl, mhs = null) {
    const jsPDF = await getJsPDF();
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const blank = "__________________________";
    const nama = mhs?.nama || blank;
    const nim = mhs?.nim || blank;
    const ttl = mhs?.tempat_lahir
        ? `${mhs.tempat_lahir}, ${mhs.tgl_lahir ? new Date(mhs.tgl_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}`
        : blank;
    const tglMasuk = mhs?.tgl_masuk ? new Date(mhs.tgl_masuk).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : blank;
    const tglLulus = mhs?.tgl_lulus ? new Date(mhs.tgl_lulus).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : blank;
    const noIjazah = mhs?.nomor_ijazah || blank;
    const nomorSkpi = mhs?.nomor_skpi || `SKPI/${tpl.kode_prodi || "XX"}/_____/____/20__`;
    const tglNow = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const icpDetail = mhs?.detail_icp || [];
    const icpTotal = mhs?.total_poin != null ? String(mhs.total_poin) : blank;
    const ICP_CATS = ["Fisik", "Iman", "Intelektualitas", "Kepribadian", "Keterampilan", "Moral"];

    /* ── H1: KOP + Identitas + Seksi2 awal ── */
    drawFrame(doc);
    let y = MT;

    // Logo
    try {
        const logo = await fetchBase64("/img/Logo_isb.png");
        const lw = 22;
        doc.addImage(logo, "PNG", PW / 2 - lw / 2, y, lw, lw);
        y += lw + 3;
    } catch { y += 5; }

    doc.setFontSize(13); doc.setFont("times", "bold"); setColor(doc, C.black);
    doc.text("INSTITUT SHANTI BHUANA", PW / 2, y, { align: "center" }); y += 5.5;
    doc.setFontSize(10); doc.setFont("times", "italic");
    doc.text("INSTITUTE of SHANTI BHUANA", PW / 2, y, { align: "center" }); y += 4;
    doc.setDrawColor(50, 50, 50); doc.setLineWidth(0.7);
    doc.line(ML, y, PW - MR, y); y += 5;

    doc.setFontSize(12); doc.setFont("times", "bold"); setColor(doc, C.black);
    doc.text("SURAT KETERANGAN PENDAMPING IJAZAH (SKPI)", PW / 2, y, { align: "center" }); y += 5;
    doc.setFontSize(10); doc.setFont("times", "italic");
    doc.text("CERTIFICATE of SUPPLEMENT", PW / 2, y, { align: "center" }); y += 4.5;
    doc.setFont("times", "bold"); setColor(doc, C.black);
    doc.text(`Nomor: ${nomorSkpi}`, PW / 2, y, { align: "center" }); y += 5;

    doc.setFontSize(8); doc.setFont("times", "normal");
    const sub1 = "Surat Keterangan Pendamping Ijazah ini menyatakan kemampuan kerja, penguasaan pengetahuan dan integritas pemegangnya.";
    doc.splitTextToSize(sub1, CW).forEach(l => { doc.text(l, PW / 2, y, { align: "center" }); y += 3.8; });
    y += 1;
    doc.setFont("times", "italic"); setColor(doc, C.gray);
    const sub2 = "This Certificate of Supplement is to provide a description of the nature, level, context and status of the studies that were pursued and successfully completed by the individual named on the original qualification to which this supplement is appended";
    doc.splitTextToSize(sub2, CW).forEach(l => { doc.text(l, PW / 2, y, { align: "center" }); y += 3.5; });
    setColor(doc, C.black); y += 2;

    y = secHdr(doc, y, "1", "INFORMASI TENTANG IDENTITAS DIRI PEMEGANG SKPI", "Information Identifying the Holder of this Certificate of Supplement");
    y = identRow(doc, y, "1.1a", "Nama sesuai Ijazah", "Name as in High School Certificate", nama);
    y = identRow(doc, y, "1.1b", "Nama sesuai KTP", "Name as in Identification Card", nama);
    y = identRow(doc, y, "1.1c", "Nama sesuai Akta Kelahiran", "Name as in Birth Certificate", nama);
    y = identRow(doc, y, "1.2", "Tempat dan Tanggal Lahir", "Place and Date of Birth", ttl);
    y = identRow(doc, y, "1.3", "Nomor Induk Mahasiswa", "Student's Registration Number", nim);
    y = identRow(doc, y, "1.4", "Tanggal Masuk", "Date of Enrollment", tglMasuk);
    y = identRow(doc, y, "1.5", "Tanggal Lulus:", "Date of Completion", tglLulus);
    y = identRow(doc, y, "1.6", "Nomor Seri Ijazah", "Serial Number", noIjazah);
    y = identRow(doc, y, "1.7", "Gelar", "Degree", `${tpl.gelar || ""}\n${tpl.gelar_en || ""}`);
    y = secHdr(doc, y, "2", "INFORMASI TENTANG IDENTITAS PENYELENGGARA PROGRAM", "Information Identifying the Awarding Institution");
    y = identRow(doc, y, "2.1", "SK Pendirian Perguruan Tinggi", "Awarding Institution's License",
        tpl.sk_pendirian || "SK Menteri Pendidikan dan Kebudayaan Republik Indonesia No. 725/M/2020. Licensed by the Ministry of Education and Culture Republic of Indonesia");

    /* ── H2: Institusi lanjutan + CPL Sikap ── */
    addPage(doc); y = MT;
    y = identRow(doc, y, "2.2", "Akreditasi", "Accreditation", tpl.akreditasi || "Institusi: Terakreditasi BAIK SEKALI");
    y = identRow(doc, y, "2.3", "Nama Perguruan Tinggi", "Awarding Institution", "Institut Shanti Bhuana\nInstitute of Shanti Bhuana");
    y = identRow(doc, y, "2.4", "Program Studi", "Study Program",
        `${tpl.nama_prodi || ""}\n${tpl.nama_en || ""}\nKelas Reguler / Reguler Class${tpl.konsentrasi ? "\nKonsentrasi: " + tpl.konsentrasi + " / Concentration: " + (tpl.konsentrasi_en || "") : ""}`);
    y = identRow(doc, y, "2.5", "Jenjang Pendidikan", "Level of Education", "Sarjana (S1)\nBachelor Degree");
    y = identRow(doc, y, "2.6", "Jenis Pendidikan", "Type of Education", "Institut\nInstitute");
    y = identRow(doc, y, "2.7", "Jenjang Kualifikasi sesuai KKNI", "Level of Qualification in the National Qualification Framework", "Framework\nLevel 6");
    y = identRow(doc, y, "2.8", "Bahasa Pengantar Kuliah", "Language of Instruction", "Bahasa Indonesia\nIndonesian");
    y = identRow(doc, y, "2.9", "Sistem Penilaian", "Grading System", "Skala: 1-4; A = 4, A- = 3,5, B = 3, B- = 2,5 C = 2, D = 1, E = 0\nScale:1-4; A = 4, A- = 3,5, B = 3, B- = 2,5 C = 2, D = 1, E = 0");
    y = identRow(doc, y, "2.10", "Lama Studi Reguler", "Regular Length of Study", "8 Semester\n8 Semesters");
    y = identRow(doc, y, "2.11", "Persyaratan Penerimaan", "Entry Requirement", "Lulus Pendidikan Menengah Atas/Sederajat\nGraduate from High School or similar level of education");
    y = identRow(doc, y, "2.12", "Jenis dan Jenjang Pendidikan Lanjutan", "Access to Further Study", "Akademik, Magister (S2), Doktoral (S3)\nAcademic, Master Degree, Doctoral Degree");
    y = secHdr(doc, y, "3", "INFORMASI TENTANG KUALIFIKASI DAN HASIL YANG DICAPAI", "Information Identifying the Qualification and Outcomes Obtained");
    // A / Capaian Pembelajaran
    const WA = 12, hA = 7;
    box(doc, ML, y, WA, hA, "A", { fill: C.subLabel, bold: true, align: "center" });
    setFill(doc, C.catLabel); setDraw(doc, C.border); doc.setLineWidth(0.2);
    doc.rect(ML + WA, y, CW - WA, hA, "FD");
    doc.setFontSize(9); doc.setFont("times", "bold"); setColor(doc, C.black);
    const cy = y + hA / 2 + 1.5;
    doc.text("Capaian Pembelajaran  ", ML + WA + 2, cy);
    const wCP = doc.getTextWidth("Capaian Pembelajaran  ");
    doc.setFont("times", "italic"); setColor(doc, C.gray);
    doc.text("Learning Outcomes", ML + WA + 2 + wCP, cy);
    setColor(doc, C.black); y += hA;
    y = catHdr(doc, y, "Sikap", "Proposition of Attitude");
    for (const [i, s] of (tpl.sikap || []).entries()) { y = checkPage(doc, y, 10); y = cplRow(doc, y, i + 1, s.text, s.en); }

    /* ── H3: Pengetahuan + KU ── */
    addPage(doc); y = MT;
    y = catHdr(doc, y, "Pengetahuan", "Knowledge");
    for (const [i, s] of (tpl.pengetahuan || []).entries()) { y = checkPage(doc, y, 10); y = cplRow(doc, y, i + 1, s.text, s.en); }
    y = checkPage(doc, y, 14); y = catHdr(doc, y, "Keterampilan Umum", "General Competence");
    for (const [i, s] of (tpl.keterampilan_umum || []).entries()) { y = checkPage(doc, y, 10); y = cplRow(doc, y, i + 1, s.text, s.en); }

    /* ── H4: KK + Aktivitas ── */
    addPage(doc); y = MT;
    y = catHdr(doc, y, "Keterampilan Khusus", "Spesific Competences/Skills");
    for (const [i, s] of (tpl.keterampilan_khusus || []).entries()) { y = checkPage(doc, y, 10); y = cplRow(doc, y, i + 1, s.text, s.en); }
    y = checkPage(doc, y, 14);
    y = secHdr(doc, y, "4", "AKTIVITAS, PRESTASI, DAN PENGHARGAAN", "Activities, Achievements, and Rewards");
    y = aktRow(doc, y, "1", "Prestasi dan Penghargaan", "Achievement and Rewards", mhs?.aktivitas?.prestasi || "1.");
    y = aktRow(doc, y, "2", "Peningkatan Ketrampilan Profesional", "Professional Skills Improvement", mhs?.aktivitas?.keterampilan || "1.");
    y = aktRow(doc, y, "3", "Pengalaman Berorganisasi dan Kepemimpinan", "Organization and Leadership", mhs?.aktivitas?.organisasi || "1.\n2.");
    y = aktRow(doc, y, "4", "Pengembangan Intelektual", "Intellectual Development", mhs?.aktivitas?.intelektual || "1.");
    y = aktRow(doc, y, "5", "Praktik Kerja", "Professional Work Training", mhs?.aktivitas?.praktik || "");
    y = checkPage(doc, y, 32);
    y = aktRow(doc, y, "6", "Pembinaan Spiritual", "Spiritual Formation", mhs?.aktivitas?.spiritual || "1. Retret Integritas dan Amare Mahasiswa Th.2020/2021\n2. Retret Integritas dan Amare Mahasiswa \u201cInsan Allah Berintegritas\u201d\n3. Retret Integritas dan Amare Mahasiswa \u201cWe Are One Body\u201d\n4. Retret Integritas dan Amare Mahasiswa \u201cSukacita di dalam Mengasihi\u201d");
    y = checkPage(doc, y, 40);
    y = aktRow(doc, y, "7", "Pembangunan Karakter dan Kepribadian", "Character Building", mhs?.aktivitas?.karakter || "Telah lulus matakuliah Penciri Institusi yang bermuatan pembangunan karakter dan kepribadian:\n- Kepribadian Amarean 1\n- Kepribadian Amarean 2\n- Kepribadian Amarean 3\n- Kepribadian Amarean 4\n- Integritas Kepemimpinan 1\n- Integritas Kepemimpinan 2\n- Nilai-nilai Integritas Insani 2\n- Nilai-nilai Integritas Insani 1");
    y = aktRow(doc, y, "8", "Kursus - kursus", "Courses", mhs?.aktivitas?.kursus || "1. Kursus Bahasa Inggris");
    y = aktRow(doc, y, "9", "Skripsi", "Undergraduate Thesis", mhs?.judul_skripsi || "");

    /* ── H5: ICP + KKNI + Pengesahan ── */
    addPage(doc); y = MT;
    y = secHdr(doc, y, "5", "POIN INTEGRITAS", "Integrity Credit Points (ICP)");
    y = aktRow(doc, y, "1", "Kriteria ICP", "Criteria of the ICP",
        "Gold achievement: >200 points\nSilver achievement: 150-200 points\nBronze achievement: 100-149 points\nSyarat kelulusan: Bronze achievement / Graduation requirement: Bronze achievement\nMahasiswa yang mencapai silver/gold achievement berhak mendapat predikat cum laude\nMahasiswa dengan gold achievement berhak mendapat predikat magna/summa cum laude\nIPK (Indeks Prestasi Kumulatif) tetap diperhatikan / Grade Point Average (GPA) is considered");
    y = aktRow(doc, y, "2", "Kategori ICP", "Categories of the ICP",
        "a) Intelektualitas (inisiatif, cerdas, aktif, prestasi) / Intellectuality (Initiative, Smart, active, achievement)\nb) Keterampilan (cekatan, mampu, cakap, telaten, juara kompetisi) / Skills (skillful, capable, competent, persevering, winning in competitions)\nc) Moral (disiplin, sopan santun, berani, semangat, jujur) / Moral (discipline, polite, brave, enthusiast, honest)\nd) Iman (takwa, takut akan Tuhan, melayani Tuhan, penyangkalan diri) / Faith (pious, God fearing, serving the Lord, abnegation)\ne) Kepribadian (rajin, menolong, peka, kepribadian) / Personality (diligent, helpful, sensitive, have personality)\nf) Fisik (juara kompetisi olah raga) / Physic (winnings sport competitions)");

    // Hasil ICP
    y += 2;
    setFill(doc, C.icpRes); setDraw(doc, C.border); doc.setLineWidth(0.2);
    doc.rect(ML, y, CW, 7, "FD");
    doc.setFontSize(8.5); doc.setFont("times", "bold"); setColor(doc, C.black);
    doc.text("Hasil Pencapaian ICP/ ", ML + 2, y + 4.5);
    const wH = doc.getTextWidth("Hasil Pencapaian ICP/ ");
    doc.setFont("times", "italic"); doc.text("ICP Performance:  ", ML + 2 + wH, y + 4.5);
    const wP = doc.getTextWidth("ICP Performance:  ");
    doc.setFont("times", "bold"); doc.text(icpTotal, ML + 2 + wH + wP, y + 4.5);
    y += 9;

    // Tabel ICP
    const WN = 15, WK = CW - WN - 50, WP = 50;
    box(doc, ML, y, WN, 7, "No.", { fill: C.secHdr, bold: true, align: "center" });
    box(doc, ML + WN, y, WK, 7, "Kategori", { fill: C.secHdr, bold: true });
    box(doc, ML + WN + WK, y, WP, 7, "Pencapaian ICP (Poin)", { fill: C.secHdr, bold: true, align: "center" });
    y += 7;
    ICP_CATS.forEach((k, i) => {
        const d = icpDetail.find(x => x.nama_indo === k);
        const poin = d ? String(d.total_poin ?? 0) : "";
        box(doc, ML, y, WN, 6, `${i + 1}.`, { align: "center" });
        box(doc, ML + WN, y, WK, 6, k);
        box(doc, ML + WN + WK, y, WP, 6, poin, { bold: true, align: "center" });
        y += 6;
    });
    box(doc, ML, y, WN + WK, 7, "Total", { fill: C.idCell, bold: true, align: "right" });
    box(doc, ML + WN + WK, y, WP, 7, icpTotal, { fill: C.idCell, bold: true, align: "center" });
    y += 9;

    // KKNI
    y = secHdr(doc, y, "6", "INFORMASI TENTANG SISTEM PENDIDIKAN TINGGI DAN KERANGKA KUALIFIKASI NASIONAL INDONESIA (KKNI)", "Information on the Indonesian Higher Education System and the Indonesian National Qualification Framework");
    y += 3;
    const kkniID = "Kerangka Kualifikasi Nasional Indonesia (KKNI) adalah kerangka penjenjangan kualifikasi dan kompetensi tenaga kerja Indonesia yang menyandingkan, menyetarakan, dan mengintegrasikan sektor pendidikan dengan sektor pelatihan dan pengalaman kerja dalam suatu skema pengakuan kemampuan kerja yang disesuaikan dengan struktur di berbagai sektor pekerjaan. KKNI merupakan perwujudan mutu dan jati diri Bangsa Indonesia terkait dengan sistem pendidikan nasional, sistem pelatihan kerja nasional serta sistem penilaian kesetaraan capaian pembelajaran (learning outcomes) nasional, yang dimiliki Indonesia untuk menghasilkan sumber daya manusia yang bermutu dan produktif.";
    doc.setFontSize(8); doc.setFont("times", "normal"); setColor(doc, C.black);
    doc.splitTextToSize(kkniID, CW).forEach(l => { doc.text(l, ML, y); y += 3.8; }); y += 2;
    doc.setFont("times", "italic"); setColor(doc, C.gray);
    const kkniEN = "The Indonesian National Qualification Framework is a framework denoting levels of Indonesian workforce qualifications and competence, that compares, equalizes, and integrates the education and training sectors and work experience in a scheme recognizing work competence based on the structures of various work sectors. The Framework is the manifestation of the quality and identity of the Indonesian people in relations to the national education system, national workforce training system and national learning outcomes equality evaluation system that Indonesia has in order to produce qualified and productive human resources.";
    doc.splitTextToSize(kkniEN, CW).forEach(l => { doc.text(l, ML, y); y += 3.5; });
    setColor(doc, C.black); y += 4;

    // Pengesahan
    y = secHdr(doc, y, "7", "PENGESAHAN SKPI", "SKPI Legalization");
    y += 12;
    doc.setFontSize(9); doc.setFont("times", "normal"); setColor(doc, C.black);
    doc.text(`Bengkayang, ${tglNow}`, PW / 2, y, { align: "center" }); y += 4.5;
    doc.setFont("times", "italic");
    doc.text(`Bengkayang, ${tglNow}`, PW / 2, y, { align: "center" }); y += 26;
    doc.setFont("times", "bold"); setColor(doc, C.black);
    const ttd = "Dr. Helena Anggraeni (Reni) Tjondro Sugianto, S.T., M.T.";
    doc.text(ttd, PW / 2, y, { align: "center" });
    const tw = doc.getTextWidth(ttd);
    doc.setLineWidth(0.3); doc.setDrawColor(0, 0, 0);
    doc.line(PW / 2 - tw / 2, y + 0.5, PW / 2 + tw / 2, y + 0.5); y += 5;
    doc.setFont("times", "normal");
    doc.text("Wakil Rektor 1 Institut Shanti Bhuana", PW / 2, y, { align: "center" }); y += 4.5;
    doc.setFont("times", "italic");
    doc.text("Vice Rector of Academic Affairs", PW / 2, y, { align: "center" }); y += 4.5;
    doc.text("Institute of Shanti Bhuana", PW / 2, y, { align: "center" }); y += 8;
    doc.setLineWidth(0.3); setDraw(doc, C.border);
    doc.line(ML, y, PW - MR, y); y += 4;
    doc.setFontSize(8.5); doc.setFont("times", "bold"); setColor(doc, C.black);
    doc.text("Catatan Resmi", ML, y); y += 4.5;
    doc.setFontSize(8); doc.setFont("times", "normal");
    [
        "SKPI dikeluarkan oleh institusi pendidikan tinggi yang berwenang mengeluarkan ijazah sesuai dengan peraturan perundang-undangan yang berlaku.",
        "SKPI hanya diterbitkan setelah mahasiswa dinyatakan lulus dari suatu program studi secara resmi oleh Perguruan Tinggi.",
        "SKPI diterbitkan dalam Bahasa Indonesia dan Bahasa Inggris.",
        "SKPI yang asli diterbitkan mengunakan kertas khusus (barcode/security paper) berlogo Perguruan Tinggi, yang diterbitkan secara khusus oleh Perguruan Tinggi.",
        "Penerima SKPI dicantumkan dalam situs resmi Perguruan Tinggi.",
    ].forEach(c => {
        doc.splitTextToSize(`\u2022 ${c}`, CW - 4).forEach(l => { doc.text(l, ML + 2, y); y += 3.8; });
    });

    return doc.output("blob");
}