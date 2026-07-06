/**
 * libreConvert.js — Konversi DOCX → PDF via LibreOffice (dipakai bersama oleh
 * preview admin & unduh SKPI mahasiswa).
 *
 * Fitur ketahanan: profil warm bersama, timeout dengan tree-kill, retry + sapu
 * bersih soffice, dan ANTRIAN (serialisasi) agar hanya satu proses soffice jalan
 * pada satu waktu.
 */
import { spawn } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";

/**
 * Path executable LibreOffice. Di Windows dipakai soffice.com (varian console)
 * yang menunggu konversi selesai & mengembalikan exit code dengan benar.
 */
function getLoExe() {
  if (process.platform === "win32") {
    for (const p of [
      "C:\\Program Files\\LibreOffice\\program\\soffice.com",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com",
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ]) { if (fs.existsSync(p)) return p; }
    return "soffice";
  }
  return "libreoffice";
}

/**
 * Jalankan soffice via spawn dengan timeout yang MEMBUNUH SELURUH pohon proses
 * (taskkill /T) agar soffice.bin yang menggantung tak meracuni konversi berikut.
 */
function spawnSoffice(loExe, argv, timeoutMs) {
  return new Promise((resolve) => {
    let stdout = "", stderr = "", timedOut = false, settled = false;
    const child = spawn(loExe, argv, { windowsHide: true });

    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32" && child.pid) {
        try { spawn("taskkill", ["/F", "/T", "/PID", String(child.pid)], { windowsHide: true }); } catch {}
      } else {
        try { child.kill("SIGKILL"); } catch {}
      }
    }, timeoutMs);

    const finish = (result) => { if (settled) return; settled = true; clearTimeout(timer); resolve(result); };

    child.stdout?.on("data", d => { stdout += d; });
    child.stderr?.on("data", d => { stderr += d; });
    child.on("error", (err) => finish({ error: err, stdout, stderr, timedOut, code: null }));
    child.on("close", (code) => finish({
      error:    (code === 0 || timedOut) ? null : new Error(`soffice keluar dengan kode ${code}`),
      stdout, stderr, timedOut, code,
    }));
  });
}

/** Sapu bersih semua proses soffice sebagai pemulihan (Word tidak disentuh). */
function killAllSoffice() {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      try { spawn("pkill", ["-9", "-f", "soffice"], { windowsHide: true }).on("close", resolve).on("error", resolve); }
      catch { resolve(); }
      return;
    }
    try {
      spawn("taskkill", ["/F", "/IM", "soffice.bin", "/IM", "soffice.exe"], { windowsHide: true })
        .on("close", () => resolve())
        .on("error", () => resolve());
    } catch { resolve(); }
  });
}

// Profil LibreOffice BERSAMA (warm) yang dipakai ulang lintas konversi — hemat
// I/O init. Aman karena konversi diserialkan (satu proses pada satu waktu).
const LO_PROFILE_DIR = path.join(os.tmpdir(), "skpi_lo_profile");

async function runLibreOffice(loExe, docxPath, pdfPath, attempt = 1) {
  const outDir  = path.dirname(pdfPath);
  const tmpPdf  = path.join(outDir, path.basename(docxPath, ".docx") + ".pdf");
  const profileUrl = "file:///" + LO_PROFILE_DIR.replace(/\\/g, "/");

  const argv = [
    `-env:UserInstallation=${profileUrl}`,
    "--headless", "--norestore", "--nologo", "--nodefault", "--nofirststartwizard", "--nolockcheck",
    "--convert-to", "pdf", "--outdir", outDir, docxPath,
  ];

  // Buang lock BASI di profil warm (aman krn diserialkan — lock apa pun pasti sisa).
  try { fs.rmSync(path.join(LO_PROFILE_DIR, ".lock"), { force: true }); } catch {}

  const r = await spawnSoffice(loExe, argv, 60000);

  if (!fs.existsSync(tmpPdf)) {
    await new Promise(res => setTimeout(res, 400));
  }
  if (tmpPdf !== pdfPath && fs.existsSync(tmpPdf)) fs.renameSync(tmpPdf, pdfPath);

  // Sukses jika PDF ada, apa pun exit code-nya.
  if (fs.existsSync(pdfPath)) return;

  // Gagal (termasuk timeout/hang). Sapu bersih soffice + buang profil, coba sekali lagi.
  if (attempt < 2) {
    await killAllSoffice();
    try { fs.rmSync(LO_PROFILE_DIR, { recursive: true, force: true }); } catch {}
    await new Promise(res => setTimeout(res, 1500));
    return runLibreOffice(loExe, docxPath, pdfPath, attempt + 1);
  }

  await killAllSoffice();
  const detail = String(r.stderr || r.error?.message || "LibreOffice tidak menghasilkan PDF.").trim();
  throw Object.assign(
    new Error(r.timedOut
      ? "Konversi PDF timeout — LibreOffice tidak merespons walau sudah dicoba ulang. Tutup semua jendela LibreOffice di server lalu coba lagi."
      : `Konversi PDF gagal: ${detail}`),
    { code: "PDF_CONVERT_FAILED" },
  );
}

// Antrian: satu konversi pada satu waktu (cegah dua soffice berebut init).
let _loQueue = Promise.resolve();

/** Konversi DOCX → PDF (diserialkan). Melempar error dgn code PDF_CONVERT_FAILED bila gagal. */
export function convertDocxToPdf(docxPath, pdfPath) {
  const task = () => runLibreOffice(getLoExe(), docxPath, pdfPath);
  const p = _loQueue.then(task, task);
  _loQueue = p.catch(() => {});
  return p;
}