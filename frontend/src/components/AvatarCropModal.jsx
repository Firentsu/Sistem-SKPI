"use client";

import { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2, Scissors } from "lucide-react";
import styles from "./AvatarCropModal.module.css";

// Canvas size (px) and crop circle radius
const CANVAS = 300;
const RADIUS = 132;

// Pure helper: clamp image position so it always covers the crop circle
function clampToCircle(x, y, s, img) {
  if (!img) return { x, y };
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  const cx = CANVAS / 2;
  const cy = CANVAS / 2;
  return {
    x: Math.min(cx - RADIUS, Math.max(cx + RADIUS - w, x)),
    y: Math.min(cy - RADIUS, Math.max(cy + RADIUS - h, y)),
  };
}

// Draw the preview canvas: image + dark overlay with circular hole + border
function drawCanvas(canvas, img, posX, posY, s) {
  if (!canvas || !img) return;
  const ctx = canvas.getContext("2d");
  const cx = CANVAS / 2;
  const cy = CANVAS / 2;
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;

  ctx.clearRect(0, 0, CANVAS, CANVAS);

  // 1. Draw image
  ctx.drawImage(img, posX, posY, w, h);

  // 2. Dark overlay outside circle (nonzero rule: rect CW + arc CCW = hole)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, CANVAS, CANVAS);
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2, true);
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fill();
  ctx.restore();

  // 3. Circle border
  ctx.strokeStyle = "rgba(253,230,138,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Rule-of-thirds grid (subtle, inside circle only)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 3; i++) {
    const f = i / 3;
    const lx = cx - RADIUS + 2 * RADIUS * f;
    const ly = cy - RADIUS + 2 * RADIUS * f;
    ctx.beginPath(); ctx.moveTo(lx, cy - RADIUS); ctx.lineTo(lx, cy + RADIUS); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - RADIUS, ly); ctx.lineTo(cx + RADIUS, ly); ctx.stroke();
  }
  ctx.restore();
}

// Export: renders the cropped circle to a 400×400 JPEG blob
async function exportCrop(img, posX, posY, s) {
  const OUT = 400;
  const out = document.createElement("canvas");
  out.width = OUT;
  out.height = OUT;
  const ctx = out.getContext("2d");
  ctx.beginPath();
  ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
  ctx.clip();
  const factor = OUT / (2 * RADIUS);
  ctx.drawImage(
    img,
    (posX - CANVAS / 2) * factor + OUT / 2,
    (posY - CANVAS / 2) * factor + OUT / 2,
    img.naturalWidth * s * factor,
    img.naturalHeight * s * factor,
  );
  return new Promise((res) => out.toBlob(res, "image/jpeg", 0.93));
}

/* ─────────────────────────────────────────────
   AvatarCropModal
   Props:
     file    – File object (the selected image)
     onClose – () => void
     onSave  – (blob: Blob) => void
─────────────────────────────────────────────── */
export default function AvatarCropModal({ file, onClose, onSave }) {
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const dragRef    = useRef(null);       // { startX, startY, posX, posY }
  const posRef     = useRef({ x: 0, y: 0 });
  const scaleRef   = useRef(1);
  const minScaleRef = useRef(1);
  const rafRef     = useRef(null);

  const [loaded,   setLoaded]   = useState(false);
  const [scale,    setScale]    = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(4);
  const [pos,      setPos]      = useState({ x: 0, y: 0 });
  const [saving,   setSaving]   = useState(false);

  /* ── Load image ── */
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      const minS = Math.max((2 * RADIUS) / img.naturalWidth, (2 * RADIUS) / img.naturalHeight);
      const maxS = minS * 4;
      const initPos = {
        x: CANVAS / 2 - (img.naturalWidth  * minS) / 2,
        y: CANVAS / 2 - (img.naturalHeight * minS) / 2,
      };
      minScaleRef.current = minS;
      scaleRef.current    = minS;
      posRef.current      = initPos;
      setMinScale(minS);
      setMaxScale(maxS);
      setScale(minS);
      setPos(initPos);
      setLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* ── Redraw canvas on pos/scale change ── */
  useEffect(() => {
    if (!loaded) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      drawCanvas(canvasRef.current, imgRef.current, pos.x, pos.y, scale);
    });
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loaded, scale, pos]);

  /* ── Global mouse events (drag continues outside canvas) ── */
  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      const newPos = clampToCircle(
        dragRef.current.posX + dx,
        dragRef.current.posY + dy,
        scaleRef.current,
        imgRef.current,
      );
      posRef.current = newPos;
      setPos({ ...newPos });
    }
    function onUp() { dragRef.current = null; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  /* ── Canvas touch events (passive: false to prevent page scroll) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onTStart(e) {
      const t = e.touches[0];
      dragRef.current = { startX: t.clientX, startY: t.clientY, posX: posRef.current.x, posY: posRef.current.y };
    }
    function onTMove(e) {
      if (!dragRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;
      const newPos = clampToCircle(
        dragRef.current.posX + dx,
        dragRef.current.posY + dy,
        scaleRef.current,
        imgRef.current,
      );
      posRef.current = newPos;
      setPos({ ...newPos });
    }
    function onTEnd() { dragRef.current = null; }
    canvas.addEventListener("touchstart", onTStart, { passive: true });
    canvas.addEventListener("touchmove",  onTMove,  { passive: false });
    canvas.addEventListener("touchend",   onTEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTStart);
      canvas.removeEventListener("touchmove",  onTMove);
      canvas.removeEventListener("touchend",   onTEnd);
    };
  }, []);

  /* ── ESC key ── */
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  /* ── Zoom: anchor crop center to same image point ── */
  function applyZoom(newS) {
    const s = Math.max(minScale, Math.min(maxScale, newS));
    const img = imgRef.current;
    if (!img) return;
    const cx = CANVAS / 2;
    const cy = CANVAS / 2;
    // Keep the image point that's currently at canvas center
    const imgCx = (cx - posRef.current.x) / scaleRef.current;
    const imgCy = (cy - posRef.current.y) / scaleRef.current;
    const newPos = clampToCircle(cx - imgCx * s, cy - imgCy * s, s, img);
    scaleRef.current = s;
    posRef.current   = newPos;
    setScale(s);
    setPos({ ...newPos });
  }

  /* ── Reset to initial fit ── */
  function handleReset() {
    const img = imgRef.current;
    if (!img) return;
    const s = minScaleRef.current;
    const initPos = {
      x: CANVAS / 2 - (img.naturalWidth  * s) / 2,
      y: CANVAS / 2 - (img.naturalHeight * s) / 2,
    };
    scaleRef.current = s;
    posRef.current   = initPos;
    setScale(s);
    setPos({ ...initPos });
  }

  /* ── Save (export crop) ── */
  async function handleSave() {
    if (!imgRef.current || !loaded) return;
    setSaving(true);
    try {
      const blob = await exportCrop(imgRef.current, pos.x, pos.y, scale);
      onSave(blob);
    } catch (err) {
      console.error("AvatarCropModal export error", err);
    } finally {
      setSaving(false);
    }
  }

  const zoomPercent = loaded
    ? Math.round(((scale - minScale) / (maxScale - minScale)) * 100)
    : 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><Scissors size={14} /></div>
            <span className={styles.headerTitle}>Atur Foto Profil</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            <X size={14} />
          </button>
        </div>

        {/* Canvas preview */}
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={CANVAS}
            height={CANVAS}
            className={styles.canvas}
            onMouseDown={(e) => {
              e.preventDefault();
              dragRef.current = {
                startX: e.clientX, startY: e.clientY,
                posX: posRef.current.x, posY: posRef.current.y,
              };
            }}
          />
          {!loaded && (
            <div className={styles.loading}>
              <Loader2 size={24} className={styles.spin} />
            </div>
          )}
        </div>

        {/* Hint */}
        <p className={styles.hint}>Seret foto untuk mengatur posisi</p>

        {/* Zoom controls */}
        <div className={styles.zoomRow}>
          <button
            className={styles.zoomBtn}
            onClick={() => applyZoom(scale / 1.18)}
            disabled={!loaded || scale <= minScale}
            aria-label="Perkecil"
          >
            <ZoomOut size={15} />
          </button>

          <div className={styles.sliderWrap}>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={100}
              step={1}
              value={zoomPercent}
              disabled={!loaded}
              onChange={(e) => {
                const pct = parseInt(e.target.value, 10) / 100;
                applyZoom(minScale + pct * (maxScale - minScale));
              }}
            />
          </div>

          <button
            className={styles.zoomBtn}
            onClick={() => applyZoom(scale * 1.18)}
            disabled={!loaded || scale >= maxScale}
            aria-label="Perbesar"
          >
            <ZoomIn size={15} />
          </button>

          <button
            className={styles.zoomBtn}
            onClick={handleReset}
            disabled={!loaded}
            title="Reset ukuran"
            aria-label="Reset"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Batal
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !loaded}
          >
            {saving
              ? <><Loader2 size={13} className={styles.spin} /> Memproses…</>
              : <><Check size={14} /> Terapkan</>}
          </button>
        </div>

      </div>
    </div>
  );
}
