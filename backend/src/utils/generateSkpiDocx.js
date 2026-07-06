/**
 * generateSkpiDocx.js
 * Generate SKPI dari template Word (.docx) per-prodi secara DINAMIS.
 *
 * - Auto-discover semua anchor & cell width dari XML template
 * - Support nested table (TI) dan non-nested (Manajemen, KW, PGSD)
 * - Notifikasi jelas jika template prodi belum diupload
 * - Validasi XML balance sebelum return
 */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";
import { generateIcpChartPng } from "./generateIcpChart.js";

const TEMPLATES_DIR = path.resolve("public/uploads/templates");

/* ── Format tanggal ── */
const fmtID = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
const fmtEN = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
        .replace(/^(\d+)/, (m) => m + "th") : "-";

const toSlug = (s) =>
  (s || "").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

function getAktivitas(kegiatan, kata) {
  const items = kegiatan.filter(k =>
    (k.jenisaktivitas?.nama_indo || k.kategoriaktivitas?.nama_indo || k.kelompokaktivitas?.nama_indo || "")
      .toLowerCase().includes(kata.toLowerCase())
  );
  return items.length
    ? items.map(k => k.nama_kegiatan || k.deskripsi || "").join("\n")
    : "";
}

/* ─────────────────────────────────────────────────────────
   XML HELPERS
───────────────────────────────────────────────────────── */
function escXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function makeRun(text, italic = false) {
  const i = italic ? "<w:i/>" : "";
  return (
    `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
    `${i}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`
  );
}
function makePara(runXml) {
  return (
    `<w:p><w:pPr><w:contextualSpacing/>` +
    `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
    `<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr>${runXml}</w:p>`
  );
}
function makeCenterPara(runXml) {
  return (
    `<w:p><w:pPr><w:jc w:val="center"/><w:contextualSpacing/>` +
    `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
    `<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr>${runXml}</w:p>`
  );
}

/* ─────────────────────────────────────────────────────────
   NESTED-AWARE TAG FINDERS
───────────────────────────────────────────────────────── */
function findMatchingClose(xml, afterPos, openTag, closeTag) {
  let depth = 0, pos = afterPos;
  while (pos < xml.length) {
    const nextOpen  = xml.indexOf(openTag, pos);
    const nextClose = xml.indexOf(closeTag, pos);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      if (depth === 0) return nextClose;
      depth--;
      pos = nextClose + closeTag.length;
    }
  }
  return -1;
}

function findMatchingTcClose(xml, afterPos) {
  /* Nested-aware: skip <w:tc> that's actually <w:tcPr> */
  let depth = 0, pos = afterPos;
  while (pos < xml.length) {
    let nextOpen = -1, search = pos;
    while (search < xml.length) {
      const cand = xml.indexOf("<w:tc", search);
      if (cand === -1) { nextOpen = -1; break; }
      const ch = xml[cand + 5];
      if (ch === ">" || ch === " " || ch === "\n" || ch === "\r") { nextOpen = cand; break; }
      search = cand + 1;
    }
    const nextClose = xml.indexOf("</w:tc>", pos);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) { depth++; pos = nextOpen + 5; }
    else { if (depth === 0) return nextClose; depth--; pos = nextClose + 7; }
  }
  return -1;
}

/** Find REAL <w:p> start (not <w:pPr>) by searching backwards */
function findParaStart(xml, beforePos) {
  let pos = beforePos;
  while (pos > 0) {
    const cand = xml.lastIndexOf("<w:p", pos - 1);
    if (cand === -1) return -1;
    const ch = xml[cand + 4];
    if (ch === " " || ch === ">") return cand;
    pos = cand;
  }
  return -1;
}

/* ─────────────────────────────────────────────────────────
   DYNAMIC ACTIVITY CELL DISCOVERY
   Auto-detect anchor text + cell width dari XML template.
   Handle nested tables (TI) dan non-nested lainnya.
───────────────────────────────────────────────────────── */
const ACTIVITY_ANCHORS = [
  ["akt_prestasi",    ["Achievement and Rewards",          "Prestasi dan Penghargaan"]],
  ["akt_keterampilan",["Professional Skills Improvement",  "Peningkatan Ketrampilan", "Peningkatan Keterampilan"]],
  ["akt_organisasi",  ["Organization and Leadership",      "Pengalaman Berorganisasi"]],
  ["akt_intelektual", ["Intellectual Development",         "Pengembangan Intelektual"]],
  ["akt_praktik",     ["Professional Work Training",       "Praktik Kerja"]],
  ["akt_spiritual",   ["Spiritual Formation",              "Pembinaan Spiritual"]],
  ["akt_karakter",    ["Character Building",               "Pembangunan Karakter"]],
  ["akt_kursus",      ["Courses",                          "Kursus - kursus", "Kursus-kursus", "Kursus"]],
  ["akt_skripsi",     ["Undergraduate Thesis",             "Skripsi"]],
];

function discoverActivityCells(xml) {
  const result = {};

  for (const [ph, anchors] of ACTIVITY_ANCHORS) {
    for (const anchor of anchors) {
      const idx = xml.indexOf(anchor);
      if (idx === -1) continue;

      // End of label cell
      const labelTcEnd = xml.indexOf("</w:tc>", idx);
      if (labelTcEnd === -1) continue;

      // Skip nested <w:tbl> blocks between label end and content cell
      let searchFrom = labelTcEnd + 7;
      let safetyLimit = 20;
      while (safetyLimit-- > 0) {
        const nextTbl = xml.indexOf("<w:tbl", searchFrom);
        const nextTc  = (() => {
          let s = searchFrom;
          while (s < xml.length) {
            const c = xml.indexOf("<w:tc", s);
            if (c === -1) return -1;
            const ch = xml[c + 5];
            if (ch === ">" || ch === " ") return c;
            s = c + 1;
          }
          return -1;
        })();
        if (nextTbl === -1 || (nextTc !== -1 && nextTc < nextTbl)) break;
        const tblEnd = findMatchingClose(xml, nextTbl + 6, "<w:tbl", "</w:tbl>");
        if (tblEnd === -1) break;
        searchFrom = tblEnd + 8;
      }

      // Find first cell with width > 1000 from searchFrom
      const area = xml.substring(searchFrom, searchFrom + 2000);
      const widthMatch = [...area.matchAll(/w:w="(\d+)"/g)]
        .find(m => parseInt(m[1]) > 1000);
      if (!widthMatch) continue;

      result[ph] = { anchor, width: widthMatch[1] };
      break;
    }
  }
  return result;
}

/* ─────────────────────────────────────────────────────────
   CELL CONTENT REPLACER (nested-safe)
───────────────────────────────────────────────────────── */
function replaceCellContent(xml, anchor, cellWidth, placeholder) {
  const idx = xml.indexOf(anchor);
  if (idx === -1) return xml;

  const widthStr = `w:w="${cellWidth}"`;
  const pos = xml.indexOf(widthStr, idx);
  if (pos === -1) return xml;

  const tcpEnd = xml.indexOf("</w:tcPr>", pos);
  if (tcpEnd === -1) return xml;
  const contentStart = tcpEnd + "</w:tcPr>".length;

  const cellEnd = findMatchingTcClose(xml, contentStart);
  if (cellEnd === -1) return xml;

  return xml.substring(0, contentStart) + makePara(makeRun(placeholder)) + xml.substring(cellEnd);
}

function injectOrReplace(xml, anchor, cellWidth, placeholder) {
  const idx = xml.indexOf(anchor);
  if (idx === -1) return xml;

  const pos = xml.indexOf(`w:w="${cellWidth}"`, idx);
  if (pos === -1) return xml;

  const cellEnd = findMatchingTcClose(xml, pos);
  if (cellEnd === -1) return xml;

  const cellSlice = xml.substring(pos, cellEnd);
  const EMPTY_P   = "</w:pPr></w:p>";
  const pIdx      = cellSlice.indexOf(EMPTY_P);

  if (pIdx !== -1) {
    const newSlice =
      cellSlice.substring(0, pIdx) +
      `</w:pPr>${makeRun(placeholder)}</w:p>` +
      cellSlice.substring(pIdx + EMPTY_P.length);
    return xml.substring(0, pos) + newSlice + xml.substring(cellEnd);
  }
  return replaceCellContent(xml, anchor, cellWidth, placeholder);
}

/* ─────────────────────────────────────────────────────────
   ICP DISCOVER + INJECT (supports any width)
───────────────────────────────────────────────────────── */
function injectIcpCells(xml) {
  const idxHasil = xml.indexOf("Hasil Pencapaian ICP");
  if (idxHasil === -1) return xml;

  let before = xml.substring(0, idxHasil);
  let sec    = xml.substring(idxHasil);

  // Find ICP cell width dynamically
  const icpFisikIdx = sec.indexOf("<w:t>Fisik</w:t>");
  let icpWidth = "2410"; // default
  if (icpFisikIdx !== -1) {
    const rest   = sec.substring(icpFisikIdx);
    const endTc  = rest.indexOf("</w:tc>");
    const after  = rest.substring(endTc);
    const wMatch = after.match(/w:w="(\d+)"/);
    if (wMatch) icpWidth = wMatch[1];
  }

  const EMPTY_P = "</w:pPr></w:p>";

  for (const [cat, ph] of [
    ["Fisik", "icp_fisik"], ["Iman", "icp_iman"],
    ["Intelektualitas", "icp_intelektualitas"], ["Kepribadian", "icp_kepribadian"],
    ["Keterampilan", "icp_keterampilan"], ["Moral", "icp_moral"],
  ]) {
    const cIdx = sec.indexOf(`<w:t>${cat}</w:t>`);
    if (cIdx === -1) continue;
    const ww = sec.indexOf(`w:w="${icpWidth}"`, cIdx);
    if (ww === -1) continue;
    const ce = findMatchingTcClose(sec, ww);
    if (ce === -1) continue;
    const slice = sec.substring(ww, ce);
    const pi    = slice.indexOf(EMPTY_P);
    if (pi !== -1) {
      sec = sec.substring(0, ww) +
        slice.substring(0, pi) + `</w:pPr>${makeRun(`{${ph}}`)}</w:p>` + slice.substring(pi + EMPTY_P.length) +
        sec.substring(ce);
    }
  }

  // Total
  const tidx = sec.lastIndexOf("<w:t>Total</w:t>");
  if (tidx !== -1) {
    const ww = sec.indexOf(`w:w="${icpWidth}"`, tidx);
    if (ww !== -1) {
      const ce    = findMatchingTcClose(sec, ww);
      const slice = ce !== -1 ? sec.substring(ww, ce) : "";
      const pi    = slice.indexOf(EMPTY_P);
      if (pi !== -1 && ce !== -1) {
        sec = sec.substring(0, ww) +
          slice.substring(0, pi) + `</w:pPr>${makeRun("{icp_total}")}</w:p>` + slice.substring(pi + EMPTY_P.length) +
          sec.substring(ce);
      }
    }
  }

  return before + sec;
}

/* ─────────────────────────────────────────────────────────
   MAIN PREPROCESSOR
───────────────────────────────────────────────────────── */
function preprocessTemplate(xml) {

  /* 1. Nomor SKPI */
  xml = xml.replace(/SKPI\/[A-Z]{1,6}\/[^<\s"']+/g, "{nomor_skpi}");

  /* 2. Section 1 identitas — discover cell width dari "High School Certificate" atau "Nama sesuai Ijazah" */
  const idCellWidth = (() => {
    for (const anchor of ["High School Certificate", "Name as in High School"]) {
      const idx = xml.indexOf(anchor);
      if (idx === -1) continue;
      const pos = xml.indexOf(`</w:tc>`, idx);
      const after = xml.substring(pos, pos + 500);
      // Skip separator (< 500 width), find content cell
      const matches = [...after.matchAll(/w:w="(\d+)"/g)];
      const w = matches.find(m => parseInt(m[1]) > 1000);
      if (w) return w[1];
    }
    return "4881"; // default
  })();

  // Identitas anchors: try EN first, then ID
  const ID_ANCHORS = [
    ["High School Certificate",  "Nama sesuai Ijazah",   "{nama}"],
    ["Identification Card",       "Nama sesuai KTP",      "{nama}"],
    ["Birth Certificate",         "Nama sesuai Akta",     "{nama}"],
    ["Date of Birth",             "Tempat dan Tanggal",   "{tempat_tgl_lahir}"],
    ["Registration",              "Nomor Induk Mahasiswa","{nim}"],
    ["Enro",                      "Tanggal Masuk",        "{tgl_masuk}"],
    ["Serial Number",             "Nomor Seri Ijazah",    "{nomor_ijazah}"],
  ];
  for (const [enAnchor, idAnchor, ph] of ID_ANCHORS) {
    const anchor = xml.includes(enAnchor) ? enAnchor : idAnchor;
    xml = injectOrReplace(xml, anchor, idCellWidth, ph);
  }

  /* 3. Tanggal lulus — replace cell yang ada "30 Agustus 202" */
  const idxTgl = xml.indexOf("30 Agustus 202");
  if (idxTgl !== -1) {
    // Cari awal <w:tc> dari cell ini
    let cellStart = xml.lastIndexOf("<w:tc>", idxTgl);
    // Jika tidak ada <w:tc> polos, cari mundur dengan atribut
    if (cellStart === -1 || cellStart < idxTgl - 5000) {
      // Cari <w:tc (dengan spasi/atribut)
      let s = idxTgl;
      while (s > 0) {
        const c = xml.lastIndexOf("<w:tc", s - 1);
        if (c === -1) break;
        const ch = xml[c + 5];
        if (ch === ">" || ch === " ") { cellStart = c; break; }
        s = c;
      }
    }
    const cellEnd = findMatchingTcClose(xml, cellStart + 5);
    if (cellStart !== -1 && cellEnd !== -1) {
      const a = xml.indexOf("<w:tcPr>", cellStart);
      const b = a !== -1 ? xml.indexOf("</w:tcPr>", a) + 9 : cellStart + 5;
      const tcPr = a !== -1 ? xml.substring(a, b) : "";
      const newCell =
        `<w:tc>${tcPr}` +
        makePara(makeRun("{tgl_lulus_id}")) +
        makePara(makeRun("{tgl_lulus_en}", true)) +
        `</w:tc>`;
      xml = xml.substring(0, cellStart) + newCell + xml.substring(cellEnd + 7);
    }
  }

  /* 4. ICP cells */
  xml = injectIcpCells(xml);

  /* 5. Activities — dynamic discovery */
  const actCells = discoverActivityCells(xml);
  for (const [ph, { anchor, width }] of Object.entries(actCells)) {
    xml = replaceCellContent(xml, anchor, width, `{${ph}}`);
  }

  /* 6. Pengesahan tanggal — pakai findParaStart yang benar */
  const idxBkk = xml.indexOf("Bengkayang, 30 Agustus 202");
  if (idxBkk !== -1) {
    const pStart = findParaStart(xml, idxBkk);
    const pEnd   = xml.indexOf("</w:p>", idxBkk) + 6;
    if (pStart !== -1 && pEnd > 5) {
      xml = xml.substring(0, pStart) + makeCenterPara(makeRun("Bengkayang, {tgl_pengesahan_id}")) + xml.substring(pEnd);
    }
  }

  // EN date: cari "August 202" setelah PENGESAHAN SKPI
  const idxPengesahan = xml.indexOf("PENGESAHAN SKPI");
  const idxAug = idxPengesahan !== -1 ? xml.indexOf("August 202", idxPengesahan) : -1;
  if (idxAug !== -1) {
    const pStart = findParaStart(xml, idxAug);
    const pEnd   = xml.indexOf("</w:p>", idxAug) + 6;
    if (pStart !== -1 && pEnd > 5) {
      xml = xml.substring(0, pStart) + makeCenterPara(makeRun("Bengkayang, {tgl_pengesahan_en}", true)) + xml.substring(pEnd);
    }
  }

  return xml;
}

/* ─────────────────────────────────────────────────────────
   TEMPLATE RESOLVER — dengan notifikasi jelas
───────────────────────────────────────────────────────── */
export function getAvailableTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith(".docx"))
    .map(f => f.replace(".docx", "").replace(/_/g, " "));
}

export function hasTemplate(prodi) {
  const slug = toSlug(prodi);
  return fs.existsSync(path.join(TEMPLATES_DIR, `${slug}.docx`));
}

function resolveTemplatePath(prodi) {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    throw Object.assign(
      new Error(`Folder template tidak ditemukan. Pastikan folder 'public/uploads/templates/' ada di server.`),
      { code: "NO_TEMPLATE_DIR" }
    );
  }

  const slug = toSlug(prodi);
  const prodiPath = path.join(TEMPLATES_DIR, `${slug}.docx`);
  if (fs.existsSync(prodiPath)) return prodiPath;

  // Prodi ini tidak punya template
  const available = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith(".docx"))
    .map(f => f.replace(".docx", "").replace(/_/g, " "));

  const listStr = available.length > 0
    ? `Template tersedia: ${available.join(", ")}.`
    : "Belum ada template yang diupload.";

  throw Object.assign(
    new Error(
      `Template SKPI untuk Program Studi "${prodi}" belum tersedia. ` +
      `${listStr} Silakan upload template untuk prodi ini di halaman Template SKPI.`
    ),
    { code: "NO_TEMPLATE", prodi, available }
  );
}

/* ═════════════════════════════════════════════════════════
   SISIP PIE CHART ICP
═════════════════════════════════════════════════════════ */
const CHART_RID   = "rId9001";                 // id relasi unik (aman dari tabrakan)
const CHART_MEDIA = "media/icp_chart.png";
// Ukuran tampil ~5 inci lebar, rasio 900:540 (EMU: 1 inci = 914400).
const CHART_CX = 4572000, CHART_CY = 2743200;

/** Sisipkan PNG pie chart ICP ke zip docx, di bawah tabel ICP. */
function insertIcpChart(zip, chartData) {
  // 1) Tulis PNG ke media
  zip.file(`word/${CHART_MEDIA}`, generateIcpChartPng(chartData));

  // 2) Tambah relationship gambar (jika belum ada)
  let rels = zip.file("word/_rels/document.xml.rels").asText();
  if (!rels.includes(CHART_RID)) {
    rels = rels.replace(
      "</Relationships>",
      `<Relationship Id="${CHART_RID}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${CHART_MEDIA}"/></Relationships>`,
    );
    zip.file("word/_rels/document.xml.rels", rels);
  }

  // 3) Sisipkan paragraf gambar tepat setelah </w:tbl> tabel ICP
  let xml = zip.file("word/document.xml").asText();
  const idxHasil = xml.indexOf("Hasil Pencapaian ICP");
  if (idxHasil === -1) return;
  const idxTotal = xml.indexOf("Total", idxHasil);
  const tblEnd   = xml.indexOf("</w:tbl>", idxTotal === -1 ? idxHasil : idxTotal);
  if (tblEnd === -1) return;
  const insertAt = tblEnd + "</w:tbl>".length;

  const drawing =
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="160" w:after="160"/></w:pPr>` +
    `<w:r><w:drawing ` +
    `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
    `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${CHART_CX}" cy="${CHART_CY}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="9001" name="GrafikICP"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic><pic:nvPicPr><pic:cNvPr id="9001" name="GrafikICP"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${CHART_RID}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${CHART_CX}" cy="${CHART_CY}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

  zip.file("word/document.xml", xml.slice(0, insertAt) + drawing + xml.slice(insertAt));
}

/* ═════════════════════════════════════════════════════════
   MAIN EXPORT
═════════════════════════════════════════════════════════ */
export async function generateSkpiDocx({ mhs, icp = [], kegiatan = [] }) {
  const templatePath = resolveTemplatePath(mhs.prodi);
  const rawContent   = fs.readFileSync(templatePath, "binary");
  const zip          = new PizZip(rawContent);

  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("File template tidak valid (word/document.xml tidak ditemukan).");

  const processedXml = preprocessTemplate(docFile.asText());

  // Validate XML balance.
  // Kecualikan tag self-closing (mis. paragraf kosong `<w:p .../>` yang ditulis
  // Word) — tag ini valid & seimbang sendiri, tapi tidak punya `</w:p>`. Kalau
  // ikut dihitung sebagai "buka", akan memicu imbalance palsu (mis. 870/869).
  const openP  = (processedXml.match(/<w:p\b(?![^>]*\/>)/g)  || []).length;
  const closeP = (processedXml.match(/<\/w:p>/g)            || []).length;
  const openTc = (processedXml.match(/<w:tc\b(?![^>]*\/>)/g) || []).length;
  const closeTc= (processedXml.match(/<\/w:tc>/g)           || []).length;
  if (openP !== closeP || openTc !== closeTc) {
    throw new Error(
      `Preprocessing XML gagal (struktur tidak balance: ` +
      `<w:p> ${openP}/${closeP}, <w:tc> ${openTc}/${closeTc}). ` +
      `Coba upload ulang template.`
    );
  }

  zip.file("word/document.xml", processedXml);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  const icpMap = {};
  icp.forEach(d => { icpMap[(d.nama_indo || "").toLowerCase()] = d.total_poin ?? 0; });
  const icpTotal = icp.reduce((s, d) => s + (d.total_poin || 0), 0);

  const PRODI_CODES_MAP = {
    "Teknologi Informasi":           "TI",
    "Sistem Informasi":              "SI",
    "Manajemen":                     "MNJ",
    "Kewirausahaan":                 "KWU",
    "Pendidikan Guru Sekolah Dasar": "PGSD",
    "Agroekoteknologi":              "AGRO",
  };
  const ROMAN_MONTHS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
  const prodiCode = PRODI_CODES_MAP[mhs.prodi] || toSlug(mhs.prodi).substring(0, 2).toUpperCase();
  const _now = new Date();
  const nomor = mhs.nomor_skpi ||
    `SKPI/${prodiCode}/${String(mhs.id_mahasiswa || "").padStart(3, "0")}/${ROMAN_MONTHS[_now.getMonth()]}/${_now.getFullYear()}`;

  doc.render({
    nomor_skpi:          nomor,
    nama:                mhs.nama           || "-",
    tempat_tgl_lahir:    mhs.tempat_lahir ? `${mhs.tempat_lahir}, ${fmtID(mhs.tgl_lahir)}` : "-",
    nim:                 mhs.nim            || "-",
    tgl_masuk:           fmtID(mhs.tgl_masuk),
    tgl_lulus_id:        fmtID(mhs.tgl_lulus),
    tgl_lulus_en:        fmtEN(mhs.tgl_lulus),
    nomor_ijazah:        mhs.nomor_ijazah   || "-",
    icp_fisik:           String(icpMap["fisik"]           ?? ""),
    icp_iman:            String(icpMap["iman"]            ?? ""),
    icp_intelektualitas: String(icpMap["intelektualitas"] ?? ""),
    icp_kepribadian:     String(icpMap["kepribadian"]     ?? ""),
    icp_keterampilan:    String(icpMap["keterampilan"]    ?? ""),
    icp_moral:           String(icpMap["moral"]           ?? ""),
    icp_total:           String(icpTotal   || ""),
    akt_prestasi:        getAktivitas(kegiatan, "prestasi"),
    akt_keterampilan:    getAktivitas(kegiatan, "keterampilan"),
    akt_organisasi:      getAktivitas(kegiatan, "organisasi"),
    akt_intelektual:     getAktivitas(kegiatan, "intelektual"),
    akt_praktik:         getAktivitas(kegiatan, "praktik"),
    akt_spiritual:       getAktivitas(kegiatan, "spiritual"),
    akt_karakter:        getAktivitas(kegiatan, "karakter"),
    akt_kursus:          getAktivitas(kegiatan, "kursus"),
    akt_skripsi:         getAktivitas(kegiatan, "skripsi"),
    tgl_pengesahan_id:   fmtID(mhs.tgl_lulus),
    tgl_pengesahan_en:   fmtEN(mhs.tgl_lulus),
  });

  const outZip = doc.getZip();

  // ── Sisipkan pie chart Pencapaian ICP di bawah tabel ICP (opsional) ──
  try {
    const chartData = [
      { label: "Fisik",           value: Number(icpMap["fisik"]           ?? 0) },
      { label: "Iman",            value: Number(icpMap["iman"]            ?? 0) },
      { label: "Intelektualitas", value: Number(icpMap["intelektualitas"] ?? 0) },
      { label: "Kepribadian",     value: Number(icpMap["kepribadian"]     ?? 0) },
      { label: "Keterampilan",    value: Number(icpMap["keterampilan"]    ?? 0) },
      { label: "Moral",           value: Number(icpMap["moral"]           ?? 0) },
    ];
    if (chartData.some(d => d.value !== 0)) insertIcpChart(outZip, chartData);
  } catch (e) {
    // Chart opsional — jangan gagalkan pembuatan dokumen bila chart bermasalah.
    console.error("Gagal menyisipkan grafik ICP:", e.message);
  }

  return outZip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}