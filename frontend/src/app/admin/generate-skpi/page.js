"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  X, Download, Eye, FileText, Loader2, Zap, Users, Award, TrendingUp,
  RefreshCw, GraduationCap, Activity, ChevronDown, Shield, Printer,
  Star, Medal, Trophy, CheckSquare, Clock, Send,
} from "lucide-react";
import styles from "./page.module.css";
import {
  getMahasiswaList, getProdiList, getIcpSummary,
  generateSkpi, publishSkpi, getSkpiList, getMahasiswaDetail,
} from "@/lib/api";

/* ══════════════════════════════════════════
   KONSTANTA
══════════════════════════════════════════ */
const PER_PAGE = 10;

const ICP_TIERS = [
  { min: 200,  label: "Gold Achievement",   color: "#ca8a04", bg: "#fef9c3", border: "#fde047", icon: Trophy },
  { min: 150,  label: "Silver Achievement", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", icon: Medal  },
  { min: 100,  label: "Bronze Achievement", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", icon: Award  },
  { min: 0,    label: "Belum Memenuhi",     color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", icon: AlertCircle },
];

const STATUS_SKPI_CFG = {
  belum:       { label: "Belum",     color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
  diajukan:    { label: "Proses",    color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  direvisi:    { label: "Revisi",    color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  diterbitkan: { label: "Diterbitkan",color:"#16a34a", bg: "#dcfce7", border: "#86efac" },
};

function getIcpTier(poin) {
  return ICP_TIERS.find(t => poin >= t.min) || ICP_TIERS[ICP_TIERS.length - 1];
}

const ICP_CAT_COLORS = {
  Fisik: "#ef4444", Iman: "#f59e0b", Intelektualitas: "#3b82f6",
  Kepribadian: "#8b5cf6", Keterampilan: "#10b981", Moral: "#f97316",
};

/* ── PRODI COLOR (dari halaman mahasiswa) ── */
const PRODI_CFG = {
  "Teknologi Informasi":          { color: "#5b21b6", bg: "#ede9fe", border: "#c4b5fd", gradient: "linear-gradient(135deg,#7c3aed,#5b21b6)", label: "TI"   },
  "Sistem Informasi":             { color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", gradient: "linear-gradient(135deg,#2563eb,#1d4ed8)", label: "SI"   },
  "Manajemen":                    { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", gradient: "linear-gradient(135deg,#0284c7,#0369a1)", label: "MJ"   },
  "Kewirausahaan":                { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", gradient: "linear-gradient(135deg,#059669,#065f46)", label: "KW"   },
  "Pendidikan Guru Sekolah Dasar":{ color: "#854d0e", bg: "#fef9c3", border: "#fde047", gradient: "linear-gradient(135deg,#ca8a04,#854d0e)", label: "PGSD" },
  "Agroekoteknologi":             { color: "#166534", bg: "#dcfce7", border: "#86efac", gradient: "linear-gradient(135deg,#16a34a,#166534)", label: "AGR"  },
};
function getProdiCfg(nama) {
  return PRODI_CFG[nama] || { color: "#765439", bg: "#fdf4ec", border: "#e4d4c4", gradient: "linear-gradient(135deg,#765439,#4a2f1a)", label: "?" };
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

function Toasts({ toasts, remove }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${t.type === "success" ? styles.toastOk : styles.toastErr}`}>
          {t.type === "success" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)}><X size={12}/></button>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   ICP MINI CHART (Bar horizontal)
══════════════════════════════════════════ */
function IcpMiniChart({ detail }) {
  if (!detail?.length) return <span style={{ color: "#aaa", fontSize: "12px" }}>—</span>;
  const max = Math.max(...detail.map(d => d.total_poin ?? 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "120px" }}>
      {detail.map(d => {
        const pct = Math.round(((d.total_poin ?? 0) / max) * 100);
        const c   = ICP_CAT_COLORS[d.nama_indo] || "#888";
        return (
          <div key={d.id_icp} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ flex: 1, background: "#f5f5f5", borderRadius: "3px", height: "6px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, background: c, height: "100%", minWidth: (d.total_poin > 0) ? "3px" : "0", borderRadius: "3px" }}/>
            </div>
            <span style={{ fontSize: "9px", color: c, fontWeight: 700, width: "22px", textAlign: "right" }}>
              {d.total_poin ?? 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   DATA CAPAIAN PEMBELAJARAN (dari template Word TI)
══════════════════════════════════════════ */
const CPL_SIKAP = [
  ["Bertaqwa kepada Tuhan Yang Maha Esa dan mampu menunjukkan sikap religius","Believe in God and show religious attitudes"],
  ["Menjunjung tinggi nilai kemanusiaan dalam menjalankan tugas berdasarkan agama, moral dan etika","Believe in the importance of human values in completing assigned tasks based on religious, moral and ethic"],
  ["Berkontribusi dalam peningkatan mutu kehidupan bermasyarakat, berbangsa, bernegara, dan kemajuan peradaban berdasarkan Pancasila.","Contribute to improving the quality of life in society, nation and state, and the progress of civilization based on Pancasila."],
  ["Berperan sebagai warga negara yang bangga dan cinta tanah air, memiliki nasionalisme serta rasa tanggung jawab pada negara dan bangsa.","Acting as a citizen who is proud and loves the country, has nationalism and a sense of responsibility to the state and nation."],
  ["Menghargai keanekaragaman budaya, pandangan, agama, dan kepercayaan, serta pendapat atau temuan orisinal orang lain.","Respect the diversity of cultures, views, religions and beliefs, as well as the original opinions or findings of others"],
  ["Bekerja sama dan memiliki kepekaan sosial serta kepedulian terhadap masyarakat dan lingkungan.","Work together and have social sensitivity and concern for society and the environment."],
  ["Taat hukum dan disiplin dalam kehidupan bermasyarakat dan bernegara.","Obey the law and be disciplined in social and state life."],
  ["Menginternalisasi nilai, norma, dan etika akademik.","Internalize academic values, norms and ethics."],
  ["Menunjukkan sikap bertanggungjawab atas pekerjaan di bidang keahliannya secara mandiri.","Demonstrate a responsible attitude towards work in their field of expertise independently."],
  ["Menginternalisasi semangat kemandirian, kejuangan, dan kewirausahaan","Internalize the spirit of independence, fight, and entrepreneurship"],
  ["Memiliki semangat Deum Amare et Amatum Facere, artinya: 'mengasihi Tuhan dan menjadikan Dia dikasihi' yang terinternalisasi dalam segala perilaku keimanan dan aktivitas sehari-hari.","Have the spirit of Deum Amare et Amatum Facere, meaning: 'to love God and make Him loved' which is internalized in all religious behaviour and daily activities."],
  ["Memiliki karakter profesional yang berbudaya Amare, profesional dalam berbagai bidang teknologi serta mampu bekerja sama secara efektif dalam tim dengan landasan budaya Amare","Having the character of a professional with Amarean culture, professional in various fields of technology, and able to work effectively in a team based on the Amarean culture."],
  ["Memiliki wawasan kebangsaan, nasionalisme yang sehat dan inklusif, serta semangat bela negara demi terciptanya ketahanan nasional yang tangguh","Has a sense of nationality, healthy and inclusive nationalism, and the spirit of national defense in order to create a strong national defense"],
  ["Memiliki integritas, empati yang kuat, serta kepedulian untuk mengabdi Gereja dan bangsa dengan berpegang teguh pada prinsip-prinsip moral kebaikan, tetapi tetap dalam keseimbangan dan keharmonisan","Has the integrity, strong empathy, and concern to serve the Church and nation and has a strong hold on the principles of moral goodness, and yet still in balance and harmony"],
];

const CPL_PENGETAHUAN = [
  ["Mampu melakukan analisis, mendesain secara professional, pengolahan basis data dengan cara menggunakan tools rekayasa perangkat lunak, jaringan komputer, komputer grafis, dan aplikasi multimedia.","Able to carry out analysis, design professionally, process databases using software engineering tools, computer networks, computer graphics, and multimedia applications."],
  ["Mempunyai pengetahuan dalam penyusunan algoritma pemrograman yang efektif dan efisien serta dapat merancang, membangun dan mengelola teknologi informasi secara tepat dan akurat untuk pendukung pengambilan keputusan.","Have knowledge in preparing effective and efficient programming algorithms and can design, build and manage information technology appropriately and accurately to support decision making."],
  ["Memiliki kemampuan untuk menjadi tenaga profesional untuk pengolahan jaringan komputer, komputer grafis, dan aplikasi multimedia serta memiliki kemampuan menulis laporan penelitian dengan baik serta mengelola proyek Sistem Informasi, mempresentasikan karya tersebut.","Have the ability to become a professional worker for processing computer networks, computer graphics and multimedia applications and have the ability to write good research reports and manage Information Systems projects and to present the work."],
  ["Menguasai konsep dasar computing dan matematika.","Mastering the basic concepts of computing and mathematics."],
  ["Menguasai prinsip teknologi informasi untuk memberikan alternatif-alternatif solusi yang dapat digunakan untuk memecahkan permasalahan di organisasi dan masyarakat.","Mastering the principles of information technology to provide alternative solutions that can be used to solve problems in organizations and society."],
  ["Menguasai best practice standar-standar dalam teknologi informasi serta penggunaanya.","Mastering best practice standards in information technology and its use."],
  ["Menguasai proses analisis, perencanaan, pengelolaan, dan evaluasi yang terkait dengan sumber daya informasi","Mastering the analysis, planning, management and evaluation processes related to information resources."],
  ["Menguasai bahasa dan algoritma pemrograman yang berkaitan dengan program aplikasi untuk manipulasi model gambar, grafis, dan citra.","Mastering programming languages and algorithms related to application programs for manipulating image, graphic and image models."],
  ["Menerapkan konsep dan mengembangkan mobile computing.","Applying concepts and developing mobile computing."],
  ["Menguasai prinsip dasar sistem jaringan komputer dalam pengembangan sistem berbasis jaringan lokal (LAN) maupun jaringan luas (WAN).","Mastering the basic principles of computer network systems in developing systems based on local networks (LAN) and wide networks (WAN)."],
  ["Mampu memilih pendekatan sistem cerdas yang sesuai, memilih representasi pengetahuan dan penalarannya.","Able to choose an appropriate intelligent system approach, choosing knowledge representation and reasoning."],
];

const CPL_UMUM = [
  ["Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam konteks pengembangan atau implementasi ilmu pengetahuan dan teknologi yang sesuai dengan bidang keahliannya.","Able to apply logical, critical, systematic and innovative thinking in the context of developing or implementing science and technology in accordance with their field of expertise."],
  ["Mampu menunjukkan kinerja mandiri, bermutu, dan terukur.","Able to demonstrate independent, quality and measurable performance."],
  ["Mampu mengkaji implikasi pengembangan atau implementasi ilmu pengetahuan teknologi yang memperhatikan dan menerapkan nilai humaniora sesuai dengan keahliannya berdasarkan kaidah, tata cara dan etika ilmiah dalam rangka menghasilkan solusi, gagasan, desain atau kritik seni.","Able to study the implications of developing or implementing technological science that pays attention to and applies humanities values according to their expertise based on scientific rules, procedures and ethics in order to produce solutions, ideas, designs or art criticism."],
  ["Mampu menyusun dekripsi saintifik hasil kajiannya dalam bentuk skripsi atau laporan tugas akhir, dan mengunggahnya dalam laman perguruan tinggi.","Able to compile scientific descriptions of the results of their studies in the form of a thesis or final assignment report, and upload them on the university website."],
  ["Mampu mengambil keputusan secara tepat dalam konteks penyelesaian masalah di bidang keahliannya, berdasarkan hasil analisis informasi dan data.","Able to make appropriate decisions in the context of solving problems in their field of expertise, based on the results of information and data analysis."],
  ["Mampu memelihara dan mengembangkan jaringan kerja dengan pembimbing, kolega, sejawat baik di dalam maupun di luar lembaganya.","Able to maintain and develop working networks with supervisors, colleagues both inside and outside the institution."],
  ["Mampu bertanggung jawab atas pencapaian hasil kerja kelompok dan melakukan supervisi dan evaluasi terhadap penyelesaian pekerjaan yang ditugaskan kepada pekerja yang berada dibawah tanggung jawabnya.","Able to be responsible for the achievement of group work results and supervise and evaluate the completion of work assigned to workers under his/her responsibility."],
  ["Mampu melaksanakan proses evaluasi diri terhadap kelompok kerja yang berada di bawah tanggung jawabnya dan mampu mengelola pembelajaran secara mandiri.","Able to carry out a self-evaluation process for work groups under their responsibility and able to manage learning independently."],
  ["Mampu mendokumentasi, menyimpan, mengamankan, dan menemukan kembali data untuk menjamin kesahihan dan mencegah plagiasi.","Able to document, store, secure and retrieve data to ensure validity and prevent plagiarism."],
  ["Mempunyai kemampuan dalam mendefinisikan kebutuhan pengguna atau pasar terhadap kinerja (menganalisis, mengevaluasi dan mengembangkan) algoritma/metode berbasis komputer.","Have the ability to define user or market needs for the performance (analyze, evaluate and develop) of computer-based algorithms/methods."],
  ["Memiliki kemampuan (pengelolaan) manajerial tim dan kerja sama (team work), manajemen diri, mampu berkomunikasi baik lisan maupun tertulis dengan baik dan mampu melakukan presentasi.","Have team managerial (management) skills and teamwork, self-management, able to communicate both verbally and in writing well and able to make presentations."],
  ["Mampu mengimplementasikan prinsip keberlanjutan (sustainability) dalam mengembangkan pengetahuan.","Able to implement the principles of sustainability in developing knowledge."],
  ["Mampu mengimplementasikan teknologi informasi dan komunikasi dalam konteks pelaksanaan pekerjaannya.","Able to implement information and communication technology in the context of carrying out their work."],
  ["Mampu menerapkan kewirausahaan dan memahami kewirausahaan berbasis teknologi.","Able to apply entrepreneurship and understand technology-based entrepreneurship."],
];

const CPL_KHUSUS = [
  ["Mampu merancang dan mengembangkan algoritma untuk berbagai keperluan seperti Network Security, Data Compression Multimedia Technologies, Mobile Computing Intelligent Systems, Information Management, Algorithms and Complexity, Human-Computer Interaction, Graphics and Visual Computing.","Able to design and develop algorithms for various purposes such as Network Security, Data Compression Multimedia Technologies, Mobile Computing Intelligent Systems, Information Management, Algorithms and Complexity, Human-Computer Interaction, Graphics and Visual Computing."],
  ["Mampu mengimplementasikan, mengelola, dan mengamankan informasi yang didistribusikan melalui jaringan komputer untuk menjamin kerahasiaan, integritas, dan ketersediaan informasi.","Able to implement, manage and secure information distributed via computer networks to ensure confidentiality, integrity and availability of information."],
  ["Mampu menganalisis dan melakukan pengujian terhadap aplikasi berbasis komputer menggunakan teknik serta alat terkini sehingga menghasilkan aplikasi yang aman.","Able to analyze and test computer-based applications using the latest techniques and tools to produce safe applications."],
  ["Mampu merancang, menginternalisasikan, dan mengelola platform atau komponen perangkat keras maupun perangkat lunak menggunakan pemrogaman integratif untuk mendukung aplikasi berbasis komputer.","Able to design, internalize and manage hardware or software platforms or components using integrative programming to support computer-based applications."],
  ["Mampu merancang, membangun, mengelola aplikasi berbasis komputer menggunakan cloud services untuk memenuhi kebutuhan organisasi.","Able to design, build, manage computer-based applications using cloud services to meet organizational needs."],
  ["Mampu merancang, membangun, dan mengelola peralatan elektronik berbasis sensor yang terkoneksi dengan internet untuk mempercepat, dan mempermudah penyampaian informasi.","Able to design, build and manage sensor-based electronic equipment connected to the internet to speed up and simplify the delivery of information."],
  ["Menerapkan konsep yang berkaitan dengan manajemen informasi, termasuk menyusun pemodelan data serta membangun aplikasi perangkat lunak untuk pengorganisasian data dan penjaminan keamanan akses data.","Apply concepts related to information management, including compiling data modeling and building software applications for organizing data and ensuring data access security."],
  ["Menerapkan konsep-konsep yang berkaitan dengan arsitektur dan organisasi komputer serta memanfaatkannya untuk menunjang aplikasi komputer.","Apply concepts related to computer architecture and organization and utilize them to support computer applications."],
  ["Merancang sistem keamanan dan pengelolaan proteksi aplikasi sistem.","Designing security systems and managing system application protection."],
  ["Mampu menerapkan integritas profesional dan nilai-nilai etika profesi.","Able to apply professional integrity and professional ethical ethical values."],
  ["Mampu membangun aplikasi sederhana berbasis jaringan serta melakukan pengelolaan jaringan secara kontinu.","Able to build simple network-based applications and carry out continuous network management."],
];

/* Kategori aktivitas sesuai template Word */
const AKTIVITAS_KATEGORI = [
  { no: 1, id: "Prestasi dan Penghargaan",                   en: "Achievement and Rewards" },
  { no: 2, id: "Peningkatan Ketrampilan Profesional",         en: "Professional Skills Improvement" },
  { no: 3, id: "Pengalaman Berorganisasi dan Kepemimpinan",   en: "Organization and Leadership" },
  { no: 4, id: "Pengembangan Intelektual",                    en: "Intellectual Development" },
  { no: 5, id: "Praktik Kerja",                               en: "Professional Work Training" },
  { no: 6, id: "Pembinaan Spiritual",                         en: "Spiritual Formation" },
  { no: 7, id: "Pembangunan Karakter dan Kepribadian",        en: "Character Building" },
  { no: 8, id: "Kursus-kursus",                               en: "Courses" },
  { no: 9, id: "Skripsi",                                     en: "Undergraduate Thesis" },
];

/* ══════════════════════════════════════════
   HELPER KOMPONEN DOKUMEN
══════════════════════════════════════════ */
const S = {
  cell:   { border: "1px solid #000", padding: "3px 6px", verticalAlign: "top", lineHeight: "1.4" },
  noCell: { border: "1px solid #000", padding: "3px 6px", width: "32px", textAlign: "center", fontWeight: "bold", background: "#f0f0f0", verticalAlign: "middle" },
  hdr:    { background: "#595959", color: "#fff", padding: "4px 8px", fontWeight: "bold", fontSize: "10pt", margin: "8px 0 0", display: "flex", gap: "8px" },
  subHdr: { background: "#808080", color: "#fff", padding: "3px 8px", fontSize: "9pt", fontWeight: "700" },
  cplHdr: { padding: "3px 8px", fontSize: "9pt", fontWeight: "700", textDecoration: "underline", background: "#d9d9d9" },
};

function DocRow({ no, id, en, val, colSpan }) {
  return (
    <tr>
      <td style={{ ...S.noCell, fontSize: "9pt" }}>{no}</td>
      <td style={{ ...S.cell, width: "34%", fontSize: "9pt" }}>
        <span style={{ fontWeight: "bold" }}>{id}</span><br/>
        <em style={{ color: "#444", fontSize: "8.5pt" }}>{en}</em>
      </td>
      <td style={{ ...S.cell, fontSize: "9pt" }} colSpan={colSpan}>
        {(val || "").split("\n").map((v, i) => <div key={i}>{v}</div>)}
      </td>
    </tr>
  );
}

function CplTable({ rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Times New Roman',serif" }}>
      <tbody>
        {rows.map(([id, en], i) => (
          <tr key={i}>
            <td style={{ ...S.noCell, fontSize: "9pt", width: "28px" }}>{i + 1}</td>
            <td style={{ ...S.cell, width: "48%", fontSize: "9pt" }}>{id}</td>
            <td style={{ ...S.cell, width: "4%", fontSize: "9pt" }}></td>
            <td style={{ ...S.cell, fontSize: "9pt" }}><em>{en}</em></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ══════════════════════════════════════════
   PREVIEW MODAL — 100% sesuai template Word
══════════════════════════════════════════ */
function PreviewModal({ mhs, onClose, onGenerate, onPublish, generating, publishing, existingSkpi }) {
  const printRef = useRef(null);
  const tier = getIcpTier(mhs?.total_poin ?? 0);
  const TierIcon = tier.icon;
  const [kegiatan, setKegiatan] = useState([]);

  const tglIndo = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };
  const tglEng = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const tglLulusIndo = tglIndo(mhs?.tgl_lulus);
  const tglLulusEng  = tglEng(mhs?.tgl_lulus);
  const tglSekarang  = tglIndo(new Date().toISOString());
  const tglSekarangEng = tglEng(new Date().toISOString());

  const nomorSkpi = existingSkpi?.nomor_skpi ||
    `SKPI/${(mhs?.prodi || "").replace(/\s+/g, "").substring(0, 2).toUpperCase()}/${String(mhs?.id_mahasiswa || "").padStart(3, "0")}/${new Date().toLocaleDateString("id-ID", { month: "2-digit", year: "numeric" }).replace("/", "/")}`;

  const icp = mhs?.detail_icp || [];
  const icpTotal = mhs?.total_poin ?? 0;

  /* Ambil kegiatan detail dari backend */
  useEffect(() => {
    if (!mhs?.id_mahasiswa) return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API_BASE}/api/aktivitas?mahasiswa_id=${mhs.id_mahasiswa}&status=disetujui&page=1`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.rows) setKegiatan(d.rows); })
      .catch(() => {});
  }, [mhs?.id_mahasiswa]);

  /* Kelompokkan kegiatan per kategori */
  const kegByKat = (namaKat) => {
    return kegiatan.filter(k =>
      (k.kategoriaktivitas?.nama_kategori || "").toLowerCase().includes(namaKat.toLowerCase()) ||
      (k.kelompokaktivitas?.nama_kelompok || "").toLowerCase().includes(namaKat.toLowerCase())
    );
  };

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_BASE}/api/skpi/download/${mhs.id_mahasiswa}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Gagal download: " + (err.error || res.status));
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const safeName = (mhs.nama || "").replace(/[^a-zA-Z0-9]/g, "_");
      a.href     = url;
      a.download = `SKPI_${mhs.nim}_${safeName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Gagal download: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => handleDownload();

  if (!mhs) return null;

  /* Konten dokumen — ref ini yang diprint */
  const docContent = (
    <div ref={printRef} style={{ fontFamily: "'Times New Roman', serif", color: "#000", fontSize: "10pt", lineHeight: "1.4" }}>

      {/* ── KOP ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "4px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/Logo_isb.png" alt="ISB" style={{ height: "60px" }} onError={e => e.currentTarget.style.display = "none"} />
        <div>
          <div style={{ fontSize: "14pt", fontWeight: "bold" }}>INSTITUT SHANTI BHUANA</div>
          <div style={{ fontStyle: "italic", fontSize: "11pt" }}>INSTITUTE of SHANTI BHUANA</div>
        </div>
      </div>
      <hr style={{ border: "none", borderTop: "2.5px solid #000", margin: "4px 0 6px" }} />

      {/* ── Judul ── */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "13pt", fontWeight: "bold" }}>SURAT KETERANGAN PENDAMPING IJAZAH (SKPI)</div>
        <div style={{ fontStyle: "italic", fontSize: "11pt" }}><em>CERTIFICATE of SUPPLEMENT</em></div>
        <div style={{ fontWeight: "bold", fontSize: "11pt", margin: "3px 0" }}>Nomor: {nomorSkpi}</div>
        <div style={{ fontSize: "9pt", marginTop: "6px" }}>Surat Keterangan Pendamping Ijazah ini menyatakan kemampuan kerja, penguasaan pengetahuan dan integritas pemegangnya.</div>
        <div style={{ fontSize: "8.5pt", fontStyle: "italic", color: "#333", marginTop: "3px" }}>
          <em>This Certificate of Supplement is to provide a description of the nature, level, context and status of the studies that were pursued and successfully completed by the individual named on the original qualification to which this supplement is appended</em>
        </div>
      </div>

      {/* ── SEKSI 1 — Identitas Pemegang ── */}
      <div style={S.hdr}>
        <span>1.</span>
        <div>
          <div>INFORMASI TENTANG IDENTITAS DIRI PEMEGANG SKPI</div>
          <div style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "8.5pt" }}>Information Identifying the Holder of this Certificate of Supplement</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <DocRow no="1.1a" id="Nama sesuai Ijazah" en="Name as in High School Certificate" val={mhs.nama || "-"} />
          <DocRow no="1.1b" id="Nama sesuai KTP" en="Name as in Identification Card" val={mhs.nama || "-"} />
          <DocRow no="1.1c" id="Nama sesuai Akta Kelahiran" en="Name as in Birth Certificate" val={mhs.nama || "-"} />
          <DocRow no="1.2" id="Tempat dan Tanggal Lahir" en="Place and Date of Birth" val={mhs.tempat_lahir ? `${mhs.tempat_lahir}, ${tglIndo(mhs.tgl_lahir)}` : "-"} />
          <DocRow no="1.3" id="Nomor Induk Mahasiswa" en="Student's Registration Number" val={mhs.nim || "-"} />
          <DocRow no="1.4" id="Tanggal Masuk" en="Date of Enrollment" val={tglIndo(mhs.tgl_masuk)} />
          <DocRow no="1.5" id="Tanggal Lulus" en="Date of Completion" val={`${tglLulusIndo}\n${tglLulusEng}`} />
          <DocRow no="1.6" id="Nomor Seri Ijazah" en="Serial Number" val={mhs.nomor_ijazah || "-"} />
          <DocRow no="1.7" id="Gelar" en="Degree" val={mhs.gelar ? `${mhs.gelar}\n${mhs.gelar_eng || ""}` : "Sarjana Komputer (S.Komp.)\nBachelor of Computer, major in Information Technology"} />
        </tbody>
      </table>

      {/* ── SEKSI 2 — Identitas Penyelenggara ── */}
      <div style={S.hdr}>
        <span>2.</span>
        <div>
          <div>INFORMASI TENTANG IDENTITAS PENYELENGGARA PROGRAM</div>
          <div style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "8.5pt" }}>Information Identifying the Awarding Institution</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <DocRow no="2.1" id="SK Pendirian Perguruan Tinggi" en="Awarding Institution's License"
            val={"SK Menteri Pendidikan dan Kebudayaan Republik Indonesia No. 725/M/2020.\nLicensed by the Ministry of Education and Culture Republic of Indonesia"} />
          <DocRow no="2.2" id="Akreditasi" en="Accreditation"
            val={`Institusi: Terakreditasi BAIK SEKALI, SK BAN PT No. 801/SK/BAN-PT/Ak/PT/X/2023\nVery good accreditation by the National Accreditation Institution of Higher Education\nProdi ${mhs.prodi || "Teknologi Informasi"}: Terakreditasi BAIK SEKALI, SK LAM INFOKOM: No. 026/SK/LAM-INFOKOM/Ak.B/S/XII/2022\nVery good accreditation by the LAM-INFOKOM Independent Accreditation Institution of Informatics and Computer.`} />
          <DocRow no="2.3" id="Nama Perguruan Tinggi" en="Awarding Institution" val={"Institut Shanti Bhuana\nInstitute of Shanti Bhuana"} />
          <tr>
            <td style={{ ...S.noCell, fontSize: "9pt" }}>2.4</td>
            <td style={{ ...S.cell, width: "34%", fontSize: "9pt" }}><strong>Program Studi</strong><br/><em style={{ fontSize: "8.5pt", color: "#444" }}>Study Program</em></td>
            <td style={{ ...S.cell, fontSize: "9pt" }}>{mhs.prodi || "Teknologi Informasi"}<br/><em>Information Technology</em></td>
            <td style={{ ...S.cell, fontSize: "9pt" }}>Kelas Reguler<br/><em>Reguler Class</em></td>
          </tr>
          <DocRow no="2.5" id="Jenjang Pendidikan" en="Level of Education" val={"Sarjana (S1)\nBachelor Degree"} />
          <DocRow no="2.6" id="Jenis Pendidikan" en="Type of Education" val={"Institut\nInstitute"} />
          <DocRow no="2.7" id="Jenjang Kualifikasi sesuai KKNI" en="Level of Qualification in the National Qualification" val="Framework Level 6" />
          <DocRow no="2.8" id="Bahasa Pengantar Kuliah" en="Language of Instruction" val={"Bahasa Indonesia\nIndonesian"} />
          <DocRow no="2.9" id="Sistem Penilaian" en="Grading System" val={"Skala: 1-4; A = 4, A- = 3,5, B = 3, B- = 2,5 C = 2, D = 1, E = 0\nScale: 1-4; A = 4, A- = 3,5, B = 3, B- = 2,5 C = 2, D = 1, E = 0"} />
          <DocRow no="2.10" id="Lama Studi Reguler" en="Regular Length of Study" val={"8 Semester\n8 Semesters"} />
          <DocRow no="2.11" id="Persyaratan Penerimaan" en="Entry Requirement" val={"Lulus Pendidikan Menengah Atas/Sederajat\nGraduate from High School or similar level of education"} />
          <DocRow no="2.12" id="Jenis dan Jenjang Pendidikan Lanjutan" en="Access to Further Study" val={"Akademik, Magister (S2), Doktoral (S3)\nAcademic, Master Degree, Doctoral Degree"} />
        </tbody>
      </table>

      {/* ── SEKSI 3 — Capaian Pembelajaran ── */}
      <div style={S.hdr}>
        <span>3.</span>
        <div>
          <div>INFORMASI TENTANG KUALIFIKASI DAN HASIL YANG DICAPAI</div>
          <div style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "8.5pt" }}>Information Identifying the Qualification and Outcomes Obtained</div>
        </div>
      </div>
      <div style={S.subHdr}>A &nbsp; Capaian Pembelajaran / <em>Learning Outcomes</em></div>

      <div style={S.cplHdr}><strong>Sikap</strong> / <em>Proposition of Attitude</em></div>
      <CplTable rows={CPL_SIKAP} />

      <div style={{ ...S.cplHdr, marginTop: "4px" }}><strong>Pengetahuan</strong> / <em>Knowledge</em></div>
      <CplTable rows={CPL_PENGETAHUAN} />

      <div style={{ ...S.cplHdr, marginTop: "4px" }}><strong>Keterampilan Umum</strong> / <em>General Competence</em></div>
      <CplTable rows={CPL_UMUM} />

      <div style={{ ...S.cplHdr, marginTop: "4px" }}><strong>Keterampilan Khusus</strong> / <em>Spesific Competences/Skills</em></div>
      <CplTable rows={CPL_KHUSUS} />

      {/* ── AKTIVITAS ── */}
      <div style={S.hdr}>
        <div>
          <div>AKTIVITAS, PRESTASI, DAN PENGHARGAAN</div>
          <div style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "8.5pt" }}>Activities, Achievements, and Rewards</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {AKTIVITAS_KATEGORI.map((kat) => {
            const items = kegByKat(kat.id);
            return (
              <tr key={kat.no}>
                <td style={{ ...S.noCell, fontSize: "9pt", width: "28px" }}>{kat.no}</td>
                <td style={{ ...S.cell, width: "34%", fontSize: "9pt" }}>
                  <strong>{kat.id}</strong><br/>
                  <em style={{ fontSize: "8.5pt", color: "#444" }}>{kat.en}</em>
                </td>
                <td style={{ ...S.cell, fontSize: "9pt" }}></td>
                <td style={{ ...S.cell, fontSize: "9pt" }}>
                  {items.length > 0
                    ? items.map((k, i) => <div key={k.id_kegiatan}>{i + 1}. {k.nama_kegiatan || k.deskripsi || "-"}</div>)
                    : <span style={{ color: "#aaa" }}></span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── POIN ICP ── */}
      <div style={S.hdr}>
        <div>
          <div>POIN INTEGRITAS / <em>Integrity Credit Points (ICP)</em></div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ ...S.noCell, fontSize: "9pt", width: "28px" }}>1</td>
            <td style={{ ...S.cell, width: "34%", fontSize: "9pt" }}>
              <strong>Kriteria ICP</strong><br/><em style={{ fontSize: "8.5pt", color: "#444" }}>Criteria of the ICP</em>
            </td>
            <td style={{ ...S.cell, fontSize: "9pt" }}></td>
            <td style={{ ...S.cell, fontSize: "9pt" }}>
              <div><strong><em>Gold achievement: &gt;200 points</em></strong></div>
              <div><strong><em>Silver achievement: 150-200 points</em></strong></div>
              <div><strong><em>Bronze achievement: 100-149 points</em></strong></div>
              <div>Syarat kelulusan: <em>Bronze achievement</em></div>
              <div><em>Graduation requirement: Bronze achievement</em></div>
              <div>Mahasiswa yang mencapai <em>silver/gold achievement</em> berhak mendapat predikat <em>cum laude</em></div>
              <div><em>Students achieve silver/gold achievement are entitled with predicate of cum laude</em></div>
              <div>Mahasiswa dengan <em>gold achievement</em> berhak mendapat predikat <em>magna/summa cum laude</em></div>
              <div><em>Students with gold achievement are entitled with predicate of magna/summa cum laude</em></div>
              <div>IPK (Indeks Prestasi Kumulatif) tetap diperhatikan</div>
              <div><em>Grade Point Average (GPA) is considered</em></div>
            </td>
          </tr>
          <tr>
            <td style={{ ...S.noCell, fontSize: "9pt" }}>2</td>
            <td style={{ ...S.cell, width: "34%", fontSize: "9pt" }}>
              <strong>Kategori ICP</strong><br/><em style={{ fontSize: "8.5pt", color: "#444" }}>Categories of the ICP</em>
            </td>
            <td style={{ ...S.cell, fontSize: "9pt" }}></td>
            <td style={{ ...S.cell, fontSize: "9pt" }}>
              <div>Intelektualitas (inisiatif, cerdas, aktif, prestasi) / <em>Intellectuality (Initiative, Smart, active, achievement)</em></div>
              <div>Keterampilan (cekatan, mampu, cakap, telaten, juara kompetisi) / <em>Skills (skillful, capable, competent, persevering, winning in competitions)</em></div>
              <div>Moral (disiplin, sopan santun, berani, semangat, jujur) / <em>Moral (discipline, polite, brave, enthusiast, honest)</em></div>
              <div>Iman (takwa, takut akan Tuhan, melayani Tuhan, penyangkalan diri) / <em>Faith (pious, God fearing, serving the Lord, abnegation)</em></div>
              <div>Kepribadian (rajin, menolong, peka, kepribadian) / <em>Personality (diligent, helpful, sensitive, have personality)</em></div>
              <div>Fisik (juara kompetisi olah raga) / <em>Physic (winnings sport competitions)</em></div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Tabel hasil ICP */}
      <div style={{ padding: "3px 6px", fontSize: "9pt", fontWeight: "bold", border: "1px solid #000", borderTop: "none" }}>
        Hasil Pencapaian ICP / <em>ICP Performance:</em>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...S.cell, background: "#d9d9d9", textAlign: "center", width: "40px", fontWeight: "bold", fontSize: "9pt" }}>No.</th>
            <th style={{ ...S.cell, background: "#d9d9d9", fontWeight: "bold", fontSize: "9pt" }}>Kategori</th>
            <th style={{ ...S.cell, background: "#d9d9d9", textAlign: "center", fontWeight: "bold", fontSize: "9pt" }}>Pencapaian ICP (Poin)</th>
          </tr>
        </thead>
        <tbody>
          {["Fisik","Iman","Intelektualitas","Kepribadian","Keterampilan","Moral"].map((kat, i) => {
            const found = icp.find(d => (d.nama_indo || "").toLowerCase() === kat.toLowerCase());
            return (
              <tr key={kat}>
                <td style={{ ...S.cell, textAlign: "center", fontSize: "9pt" }}>{i + 1}.</td>
                <td style={{ ...S.cell, fontSize: "9pt" }}>{kat}</td>
                <td style={{ ...S.cell, textAlign: "center", fontSize: "9pt" }}>{found?.total_poin ?? ""}</td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={2} style={{ ...S.cell, textAlign: "right", fontWeight: "bold", fontSize: "9pt" }}>Total</td>
            <td style={{ ...S.cell, textAlign: "center", fontWeight: "bold", fontSize: "9pt" }}>{icpTotal}</td>
          </tr>
        </tbody>
      </table>

      {/* ── KKNI ── */}
      <div style={S.hdr}>
        <div>
          <div>INFORMASI TENTANG SISTEM PENDIDIKAN TINGGI DAN KERANGKA KUALIFIKASI NASIONAL INDONESIA (KKNI)</div>
          <div style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "8.5pt" }}>Information on the Indonesian Higher Education System and the Indonesian National Qualification Framework</div>
        </div>
      </div>
      <div style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "8.5pt", lineHeight: "1.5" }}>
        <p style={{ marginBottom: "4px" }}>Kerangka Kualifikasi Nasional Indonesia (KKNI) adalah kerangka penjenjangan kualifikasi dan kompetensi tenaga kerja Indonesia yang menyandingkan, menyetarakan, dan mengintegrasikan sektor pendidikan dengan sektor pelatihan dan pengalaman kerja dalam suatu skema pengakuan kemampuan kerja yang disesuaikan dengan struktur di berbagai sektor pekerjaan. KKNI merupakan perwujudan mutu dan jati diri Bangsa Indonesia terkait dengan sistem pendidikan nasional, sistem pelatihan kerja nasional serta sistem penilaian kesetaraan capaian pembelajaran (<em>learning outcomes</em>) nasional, yang dimiliki Indonesia untuk menghasilkan sumber daya manusia yang bermutu dan produktif.</p>
        <p style={{ fontStyle: "italic", color: "#333", fontSize: "8pt" }}>The Indonesian National Qualification Framework is a framework denoting levels of Indonesian workforce qualifications and competence, that compares, equalizes, and integrates the education and training sectors and work experience in a scheme recognizing work competence based on the structures of various work sectors. The Framework is the manifestation of the quality and identity of the Indonesian people in relations to the national education system, national workforce training system and national learning outcomes equality evaluation system that Indonesia has in order to produce qualified and productive human resources.</p>
      </div>

      {/* ── PENGESAHAN ── */}
      <div style={S.hdr}>
        <div>
          <div>PENGESAHAN SKPI</div>
          <div style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "8.5pt" }}>SKPI Legalization</div>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: "16px 0 8px", lineHeight: "1.7", fontSize: "10pt" }}>
        <div>Bengkayang, {tglLulusIndo}</div>
        <div style={{ fontStyle: "italic" }}>Bengkayang, {tglLulusEng}</div>
        <div style={{ height: "60px" }} />
        <div style={{ fontWeight: "bold" }}>Dr. Helena Anggraeni (Reni) Tjondro Sugianto, S.T., M.T.</div>
        <div>Wakil Rektor 1 Institut Shanti Bhuana</div>
        <div style={{ fontStyle: "italic" }}>Vice Rector of Academic Affairs</div>
        <div style={{ fontStyle: "italic" }}>Institute of Shanti Bhuana</div>
      </div>

      {/* Catatan Resmi */}
      <div style={{ borderTop: "1px solid #000", padding: "6px 8px", fontSize: "8.5pt", marginTop: "6px" }}>
        <strong>Catatan Resmi</strong>
        <ul style={{ marginLeft: "16px", marginTop: "4px", lineHeight: "1.6" }}>
          <li>SKPI dikeluarkan oleh institusi pendidikan tinggi yang berwenang mengeluarkan ijazah sesuai dengan peraturan perundang-undangan yang berlaku.</li>
          <li>SKPI hanya diterbitkan setelah mahasiswa dinyatakan lulus dari suatu program studi secara resmi oleh Perguruan Tinggi.</li>
          <li>SKPI diterbitkan dalam Bahasa Indonesia dan Bahasa Inggris.</li>
          <li>SKPI yang asli diterbitkan menggunakan kertas khusus (barcode/security paper) berlogo Perguruan Tinggi, yang diterbitkan secara khusus oleh Perguruan Tinggi.</li>
          <li>Penerima SKPI dicantumkan dalam situs resmi Perguruan Tinggi.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className={styles.previewOverlay}>
      {/* Toolbar */}
      <div className={styles.previewBar}>
        <div className={styles.previewBarLeft}>
          <FileText size={16}/>
          <span>Preview SKPI — <strong>{mhs.nama}</strong> ({mhs.nim})</span>
          <span className={styles.previewTier} style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
            <TierIcon size={11}/> {tier.label}
          </span>
        </div>
        <div className={styles.previewBarRight}>
          <button className={styles.btnPrint} onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 size={14} className={styles.spin}/> : <Printer size={14}/>}
            {downloading ? "Memproses..." : "Cetak / Download .docx"}
          </button>
          {!existingSkpi && (
            <button className={`${styles.btnGenerate} ${generating ? styles.btnLoading : ""}`}
              onClick={onGenerate} disabled={generating || mhs.total_poin < 100}>
              {generating ? <Loader2 size={14} className={styles.spin}/> : <Zap size={14}/>}
              {generating ? "Generating..." : "Generate SKPI"}
            </button>
          )}
          {existingSkpi && existingSkpi.status === "draft" && (
            <button className={`${styles.btnPublish} ${publishing ? styles.btnLoading : ""}`}
              onClick={onPublish} disabled={publishing}>
              {publishing ? <Loader2 size={14} className={styles.spin}/> : <Send size={14}/>}
              {publishing ? "Menerbitkan..." : "Terbitkan Resmi"}
            </button>
          )}
          {existingSkpi?.status === "resmi" && (
            <span className={styles.btnResmi}><CheckSquare size={14}/> Sudah Diterbitkan</span>
          )}
          <button className={styles.previewClose} onClick={onClose}><X size={18}/></button>
        </div>
      </div>

      {/* Kertas */}
      <div className={styles.previewScroll}>
        <div className={styles.paper}>
          {docContent}
        </div>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════
   HALAMAN UTAMA
══════════════════════════════════════════ */
export default function GenerateSkpiPage() {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [filterProdi, setFilterProdi]   = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterIcp, setFilterIcp]       = useState("Semua");
  const [prodiList, setProdiList] = useState([]);
  const [skpiMap, setSkpiMap]   = useState({}); // id_mahasiswa → skpi data
  const [preview, setPreview]   = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { toasts, add: toast, remove } = useToast();

  /* ── Load prodi list ── */
  useEffect(() => {
    getProdiList().then(list => { if (list) setProdiList(list); });
    document.title = "Generate SKPI | Admin";
  }, []);

  /* ── Load data gabungan mahasiswa + ICP ── */
  const loadData = useCallback(async (q = search, prodi = filterProdi, pg = page) => {
    setLoading(true);
    try {
      const [mhsRes, icpRes] = await Promise.all([
        getMahasiswaList({ q, prodi, page: pg }),
        getIcpSummary({ page: pg }),
      ]);

      if (mhsRes) {
        // Gabungkan data mahasiswa dengan ICP summary
        const icpById = {};
        (icpRes?.rows || []).forEach(r => {
          icpById[r.id_mahasiswa] = r;
        });

        const merged = (mhsRes.rows || []).map(m => {
          const icp = icpById[m.id_mahasiswa];
          return {
            id_mahasiswa:  m.id_mahasiswa,
            nim:           m.nim,
            nama:          m.nama,
            prodi:         m.programstudi?.nama_prodi || "-",
            angkatan:      m.angkatan || "-",
            status_skpi:   m.status_skpi || "belum",
            jumlah_kegiatan: m._count?.kegiatanmahasiswa ?? 0,
            total_poin:    icp?.total_poin ?? 0,
            detail_icp:    icp?.detail_icp ?? [],
            // Fields ekstra untuk SKPI doc
            tempat_lahir:  m.tempat_lahir,
            tgl_lahir:     m.tgl_lahir,
            tgl_masuk:     m.tanggal_masuk,
            tgl_lulus:     m.tanggal_lulus,
            nomor_ijazah:  m.nomor_ijazah,
            gelar:         m.gelar,
            gelar_eng:     m.gelar_eng,
          };
        });

        // Filter ICP lokal
        const filtered = merged.filter(m => {
          if (filterIcp === "Semua") return true;
          if (filterIcp === "Gold")   return m.total_poin >= 200;
          if (filterIcp === "Silver") return m.total_poin >= 150 && m.total_poin < 200;
          if (filterIcp === "Bronze") return m.total_poin >= 100 && m.total_poin < 150;
          if (filterIcp === "Kurang") return m.total_poin < 100;
          if (filterIcp === "Siap")   return m.total_poin >= 100;
          return true;
        }).filter(m => {
          if (filterStatus === "Semua") return true;
          return m.status_skpi === filterStatus;
        });

        setRows(filtered);
        setTotal(mhsRes.total ?? 0);
        setTotalPages(Math.ceil((mhsRes.total ?? 0) / PER_PAGE) || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterProdi, page, filterIcp, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Load existing SKPI untuk mahasiswa yang ditampilkan ── */
  useEffect(() => {
    if (rows.length === 0) return;
    getSkpiList({ page: 1 }).then(res => {
      if (!res) return;
      const map = {};
      (res.rows || []).forEach(s => { map[s.id_mahasiswa] = s; });
      setSkpiMap(map);
    });
  }, [rows]);

  const searchTimer = useRef(null);
  const handleSearch = val => {
    setSearch(val); setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadData(val, filterProdi, 1), 400);
  };

  /* ── Generate SKPI ── */
  const handleGenerate = async () => {
    if (!preview) return;
    if (preview.total_poin < 100) {
      toast("ICP mahasiswa belum memenuhi syarat minimum Bronze (100 poin)", "error");
      return;
    }
    setGenerating(true);
    const res = await generateSkpi(preview.id_mahasiswa);
    setGenerating(false);
    if (res.ok) {
      toast(`SKPI untuk ${preview.nama} berhasil digenerate!`);
      setSkpiMap(prev => ({ ...prev, [preview.id_mahasiswa]: res.data }));
      setRows(prev => prev.map(r =>
        r.id_mahasiswa === preview.id_mahasiswa
          ? { ...r, status_skpi: "diajukan" }
          : r
      ));
      setPreview(prev => ({ ...prev, status_skpi: "diajukan" }));
    } else {
      toast(res.data?.error || "Gagal generate SKPI", "error");
    }
  };

  /* ── Publish SKPI ── */
  const handlePublish = async () => {
    const skpi = skpiMap[preview?.id_mahasiswa];
    if (!skpi) return;
    setPublishing(true);
    const res = await publishSkpi(skpi.id_skpi, "resmi");
    setPublishing(false);
    if (res.ok) {
      toast(`SKPI ${preview.nama} berhasil diterbitkan resmi!`);
      setSkpiMap(prev => ({ ...prev, [preview.id_mahasiswa]: { ...skpi, status: "resmi" } }));
      setRows(prev => prev.map(r =>
        r.id_mahasiswa === preview.id_mahasiswa
          ? { ...r, status_skpi: "diterbitkan" }
          : r
      ));
    } else {
      toast(res.data?.error || "Gagal menerbitkan SKPI", "error");
    }
  };

  /* ── Stats ── */
  const stats = {
    total:       total,
    siap:        rows.filter(r => r.total_poin >= 100).length,
    diterbitkan: rows.filter(r => r.status_skpi === "diterbitkan").length,
    rataIcp:     rows.length ? Math.round(rows.reduce((s, r) => s + r.total_poin, 0) / rows.length) : 0,
  };

  const safePage = Math.min(page, totalPages);

  return (
    <div className={styles.container}>
      <Toasts toasts={toasts} remove={remove}/>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Generate &amp; Penerbitan SKPI</h1>
          <p className={styles.subtitle}>Generate, preview, dan terbitkan SKPI mahasiswa berdasarkan data ICP &amp; kegiatan</p>
        </div>
        <button className={styles.btnRefresh} onClick={() => loadData()} disabled={loading} title="Refresh data">
          <RefreshCw size={14} className={loading ? styles.spin : ""}/>
        </button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {[
          { icon: Users,    label: "Total Mahasiswa", val: total,           color: "#765439", bg: "#fdf4ec" },
          { icon: Award,    label: "Siap Generate",   val: stats.siap,      color: "#16a34a", bg: "#dcfce7" },
          { icon: CheckSquare,label:"Diterbitkan",    val: stats.diterbitkan,color:"#2563eb", bg: "#dbeafe" },
          { icon: TrendingUp,label:"Rata-rata ICP",   val: stats.rataIcp,   color: "#7c3aed", bg: "#ede9fe" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div className={styles.statCard} key={s.label}>
              <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}><Icon size={20}/></div>
              <div className={styles.statInfo}>
                <div className={styles.statValue} style={{ color: s.color }}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner ICP */}
      <div className={styles.icpBanner}>
        <Shield size={14}/>
        <span>Syarat generate SKPI: minimal <strong>Bronze Achievement (100 ICP)</strong> &nbsp;|&nbsp;
          🥉 Bronze: 100–149 &nbsp;·&nbsp; 🥈 Silver: 150–199 &nbsp;·&nbsp; 🥇 Gold: ≥200 poin</span>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIco}/>
          <input className={styles.searchInp}
            placeholder="Cari NIM atau nama mahasiswa..."
            value={search} onChange={e => handleSearch(e.target.value)}/>
          {search && <button className={styles.searchClr} onClick={() => handleSearch("")}><X size={13}/></button>}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={13}/>
          {/* Prodi */}
          <select className={styles.filterSelect} value={filterProdi}
            onChange={e => { setFilterProdi(e.target.value); setPage(1); loadData(search, e.target.value, 1); }}>
            <option value="Semua">Semua Prodi</option>
            {prodiList.map(p => <option key={p.id_prodi} value={p.nama_prodi}>{p.nama_prodi}</option>)}
          </select>
          {/* Status SKPI */}
          <select className={styles.filterSelect} value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="Semua">Semua Status</option>
            <option value="belum">Belum Generate</option>
            <option value="diajukan">Sudah Generate</option>
            <option value="diterbitkan">Diterbitkan</option>
          </select>
          {/* ICP Tier */}
          <select className={styles.filterSelect} value={filterIcp}
            onChange={e => { setFilterIcp(e.target.value); setPage(1); }}>
            <option value="Semua">Semua ICP</option>
            <option value="Siap">Siap (≥100)</option>
            <option value="Gold">🥇 Gold (≥200)</option>
            <option value="Silver">🥈 Silver (150–199)</option>
            <option value="Bronze">🥉 Bronze (100–149)</option>
            <option value="Kurang">❌ Belum Memenuhi</option>
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width:52 }}>No.</th>
              <th>Mahasiswa</th>
              <th>Program Studi</th>
              <th style={{ textAlign:"center" }}>Kegiatan</th>
              <th style={{ textAlign:"center" }}>ICP</th>
              <th>Rincian ICP</th>
              <th style={{ textAlign:"center" }}>Status SKPI</th>
              <th style={{ textAlign:"center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.emptyTd}>
                <div className={styles.emptyState}><Loader2 size={30} className={styles.spin}/><p>Memuat data...</p></div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyTd}>
                <div className={styles.emptyState}>
                  <FileText size={42}/><p>Tidak ada data mahasiswa</p>
                  <span>Coba ubah filter</span>
                </div>
              </td></tr>
            ) : rows.map((row, idx) => {
              const tier      = getIcpTier(row.total_poin);
              const TierIcon  = tier.icon;
              const prodiCfg  = getProdiCfg(row.prodi);
              const skpiData  = skpiMap[row.id_mahasiswa];
              const statusCfg = STATUS_SKPI_CFG[row.status_skpi] || STATUS_SKPI_CFG.belum;
              const canGenerate = row.total_poin >= 100 && !skpiData;

              return (
                <tr key={row.id_mahasiswa} className={row.total_poin < 100 ? styles.rowDim : ""}>
                  <td className={styles.tdNo}>{(safePage-1)*PER_PAGE+idx+1}</td>
                  <td>
                    <div className={styles.mhsCell}>
                      {/* Avatar with prodi color */}
                      <div className={styles.avatar} style={{ background: prodiCfg.gradient }}>
                        {row.nama.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.mhsName}>{row.nama}</div>
                        <code className={styles.mhsNim}>{row.nim}</code>
                        <div className={styles.mhsAngkatan}>{row.angkatan}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.prodiBadge}
                      style={{ background: prodiCfg.bg, color: prodiCfg.color, borderColor: prodiCfg.border }}>
                      <span className={styles.prodiDot} style={{ background: prodiCfg.gradient }}>
                        {prodiCfg.label.slice(0,2)}
                      </span>
                      {row.prodi}
                    </span>
                  </td>
                  <td style={{ textAlign:"center" }}>
                    <span className={`${styles.kegiatanBadge} ${row.jumlah_kegiatan > 0 ? styles.kegiatanHas : styles.kegiatanNone}`}>
                      <Activity size={11}/>{row.jumlah_kegiatan}
                    </span>
                  </td>
                  <td style={{ textAlign:"center" }}>
                    <div className={styles.icpCell}>
                      <span className={styles.icpScore} style={{ color: tier.color }}>
                        {row.total_poin}
                      </span>
                      <span className={styles.icpTier}
                        style={{ background: tier.bg, color: tier.color, borderColor: tier.border }}>
                        <TierIcon size={10}/> {tier.label.split(" ")[0]}
                      </span>
                    </div>
                  </td>
                  <td><IcpMiniChart detail={row.detail_icp}/></td>
                  <td style={{ textAlign:"center" }}>
                    <span className={styles.skpiStatus}
                      style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                      {statusCfg.label}
                      {skpiData?.status === "resmi" && <CheckCircle2 size={10} style={{ marginLeft:"3px" }}/>}
                    </span>
                  </td>
                  <td style={{ textAlign:"center" }}>
                    <div className={styles.actionGroup}>
                      <button className={styles.btnPreview}
                        onClick={() => setPreview(row)}
                        title="Preview & Generate SKPI">
                        <Eye size={13}/> Preview
                      </button>
                      {canGenerate && (
                        <button className={styles.btnGen}
                          onClick={async () => {
                            setPreview(row);
                            // Auto-trigger generate jika langsung dari tabel
                          }}
                          title="Generate SKPI">
                          <Zap size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>{total===0?0:(safePage-1)*PER_PAGE+1}–{Math.min(safePage*PER_PAGE,total)} dari {total}</span>
          <div className={styles.paginBtns}>
            <button className={styles.pBtn} onClick={()=>{setPage(1);loadData(search,filterProdi,1);}} disabled={safePage===1}>«</button>
            <button className={styles.pBtn} onClick={()=>{const p=Math.max(1,safePage-1);setPage(p);loadData(search,filterProdi,p);}} disabled={safePage===1}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1)
              .filter(p=>p===1||p===totalPages||Math.abs(p-safePage)<=1)
              .reduce((acc,p,i,arr)=>{if(i>0&&arr[i-1]!==p-1)acc.push("…");acc.push(p);return acc;},[])
              .map((p,i)=>p==="…"?<span key={`d${i}`} className={styles.pDots}>…</span>
                :<button key={p} className={`${styles.pBtn} ${safePage===p?styles.pBtnOn:""}`}
                  onClick={()=>{setPage(p);loadData(search,filterProdi,p);}}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={()=>{const p=Math.min(totalPages,safePage+1);setPage(p);loadData(search,filterProdi,p);}} disabled={safePage===totalPages}><ChevronRight size={13}/></button>
            <button className={styles.pBtn} onClick={()=>{setPage(totalPages);loadData(search,filterProdi,totalPages);}} disabled={safePage===totalPages}>»</button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          mhs={preview}
          onClose={() => setPreview(null)}
          onGenerate={handleGenerate}
          onPublish={handlePublish}
          generating={generating}
          publishing={publishing}
          existingSkpi={skpiMap[preview.id_mahasiswa] || null}
        />
      )}
    </div>
  );
}