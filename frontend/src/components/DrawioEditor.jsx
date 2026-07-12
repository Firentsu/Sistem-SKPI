"use client";

/**
 * DrawioEditor — pembungkus embed.diagrams.net memakai protokol JSON resmi.
 *
 * Kenapa dibuat: implementasi lama membaca `event.data.action` dan tidak
 * pernah membalas handshake `init`, sehingga draw.io menampilkan spinner
 * selamanya ("stuck buffering"). Protokol yang benar:
 *   - draw.io → parent : string JSON `{ "event": "init" | "save" | "autosave" | "exit" | "load" }`
 *   - parent → draw.io : string JSON `{ "action": "load", "xml": "...", "autosave": 1 }`
 *
 * Komponen ini juga:
 *   - menampilkan overlay loading yang KITA kontrol (bukan spinner draw.io),
 *   - punya timeout fallback → kalau editor tak pernah init, tampilkan pesan
 *     error + tombol "buka di tab baru" (tidak akan buffering tanpa akhir),
 *   - punya mode fullscreen agar nyaman di layar kecil (responsif).
 */

import {
  useEffect, useRef, useState, useCallback,
  forwardRef, useImperativeHandle,
} from "react";
import {
  Maximize2, Minimize2, RefreshCw, ExternalLink, AlertCircle, Loader2,
} from "lucide-react";
import styles from "./DrawioEditor.module.css";

const EMPTY_XML =
  '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';

const EDITOR_SRC =
  "https://embed.diagrams.net/?embed=1&proto=json&ui=min&spin=0&noExitBtn=1&saveAndExit=0&modified=unsavedChanges";
const VIEWER_SRC =
  "https://embed.diagrams.net/?embed=1&proto=json&ui=min&spin=0&chrome=0&nav=1&layers=0";

const READY_TIMEOUT_MS = 20000; // batas maksimum menunggu editor siap

const DrawioEditor = forwardRef(function DrawioEditor({
  value = "",
  onChange,
  onSaved,
  readOnly = false,
  height = 560,
}, ref) {
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);
  // Simpan value & callback terbaru di ref supaya listener message tidak perlu
  // di-subscribe ulang tiap ketikan (mencegah re-attach berulang).
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSavedRef = useRef(onSaved);
  const statusRef = useRef("loading"); // agar imperative handle baca status terkini
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onSavedRef.current = onSaved; }, [onSaved]);

  const [status, setStatusState] = useState("loading"); // loading | ready | error
  const setStatus = useCallback((s) => {
    setStatusState((prev) => {
      const next = typeof s === "function" ? s(prev) : s;
      statusRef.current = next;
      return next;
    });
  }, []);
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // remount iframe untuk "muat ulang"

  const post = useCallback((msg) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
  }, []);

  // API imperatif: muat XML dari luar (mis. hasil import URL).
  useImperativeHandle(ref, () => ({
    load(xml) {
      valueRef.current = xml || "";
      if (statusRef.current === "ready") {
        post({ action: "load", xml: valueRef.current || EMPTY_XML, autosave: readOnly ? 0 : 1 });
      }
      // Jika belum siap, XML akan dimuat otomatis saat handshake "init".
    },
  }), [post, readOnly]);

  // Handshake & event dari draw.io.
  // Status awal sudah "loading" (dan reload() juga mereset ke "loading"
  // sebelum menaikkan reloadKey), jadi tak perlu setState di sini.
  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
    }, READY_TIMEOUT_MS);

    const onMessage = (evt) => {
      // Hanya proses pesan dari iframe draw.io ini (abaikan ekstensi/HMR/dll).
      if (evt.source !== iframeRef.current?.contentWindow) return;
      if (typeof evt.data !== "string" || !evt.data) return;

      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }
      if (!msg || !msg.event) return;

      switch (msg.event) {
        case "init":
          clearTimeout(timeoutRef.current);
          setStatus("ready");
          post({
            action: "load",
            xml: valueRef.current || EMPTY_XML,
            autosave: readOnly ? 0 : 1,
          });
          break;
        case "load":
          setStatus("ready");
          break;
        case "autosave":
          if (msg.xml != null) onChangeRef.current?.(msg.xml);
          break;
        case "save":
          if (msg.xml != null) onChangeRef.current?.(msg.xml);
          onSavedRef.current?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      clearTimeout(timeoutRef.current);
      window.removeEventListener("message", onMessage);
    };
  }, [post, readOnly, reloadKey, setStatus]);

  // Kunci scroll body saat fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  const reload = () => {
    setStatus("loading");
    setReloadKey((k) => k + 1);
  };

  const src = readOnly ? VIEWER_SRC : EDITOR_SRC;

  return (
    <div
      className={`${styles.wrap} ${fullscreen ? styles.fullscreen : ""}`}
      style={fullscreen ? undefined : { height }}
    >
      {/* Toolbar mini */}
      <div className={styles.bar}>
        <span className={styles.status} data-state={status}>
          {status === "loading" && (<><Loader2 size={13} className={styles.spin} /> Menyiapkan editor…</>)}
          {status === "ready" && (<>● {readOnly ? "Penampil siap" : "Editor siap"}</>)}
          {status === "error" && (<><AlertCircle size={13} /> Gagal memuat</>)}
        </span>

        <div className={styles.barActions}>
          <button type="button" className={styles.barBtn} onClick={reload} title="Muat ulang">
            <RefreshCw size={14} />
            <span className={styles.barBtnLabel}>Muat ulang</span>
          </button>
          <button
            type="button"
            className={styles.barBtn}
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "Keluar layar penuh" : "Layar penuh"}
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className={styles.barBtnLabel}>{fullscreen ? "Kecilkan" : "Layar penuh"}</span>
          </button>
          <a
            className={styles.barBtn}
            href="https://app.diagrams.net/"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka draw.io di tab baru"
          >
            <ExternalLink size={14} />
            <span className={styles.barBtnLabel}>Tab baru</span>
          </a>
        </div>
      </div>

      {/* Area kanvas */}
      <div className={styles.canvas}>
        {status === "error" ? (
          <div className={styles.errorBox}>
            <AlertCircle size={26} />
            <p>Editor draw.io tidak dapat dimuat.</p>
            <span>Periksa koneksi internet, lalu klik “Muat ulang”. Atau kerjakan diagram di tab baru.</span>
            <div className={styles.errorActions}>
              <button type="button" className={styles.errorBtnPrimary} onClick={reload}>
                <RefreshCw size={15} /> Muat ulang
              </button>
              <a className={styles.errorBtnGhost} href="https://app.diagrams.net/" target="_blank" rel="noopener noreferrer">
                <ExternalLink size={15} /> Buka di tab baru
              </a>
            </div>
          </div>
        ) : (
          <>
            {status === "loading" && (
              <div className={styles.overlay}>
                <Loader2 size={30} className={styles.spin} />
                <p>Memuat editor diagram…</p>
              </div>
            )}
            <iframe
              key={reloadKey}
              ref={iframeRef}
              src={src}
              className={styles.iframe}
              title="Editor Diagram draw.io"
              allow="clipboard-read; clipboard-write; fullscreen"
            />
          </>
        )}
      </div>
    </div>
  );
});

export default DrawioEditor;
