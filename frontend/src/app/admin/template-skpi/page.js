"use client";
import { useState, useEffect, useRef } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, X, CheckCircle2, AlertCircle,
  GripVertical, Save, RefreshCw, Search, FileText, Printer,
  ChevronUp, ChevronDown, Settings, BookOpen, ToggleLeft, ToggleRight,
} from "lucide-react";
import styles from "./page.module.css";
import { TEMPLATE_SECTIONS } from "../../../lib/template-sections";

/* ─── SAMPLE DATA — sesuai struktur PDF SKPI ISB ─── */
const SAMPLE_MHS = {
  nama:          "ANGGA DOMEOS MANGGARA",
  nim:           "2100204001",
  tempat_lahir:  "Bengkayang",
  tgl_lahir:     "06 Mei 2003",
  tgl_masuk:     "24 September 2021",
  tgl_lulus:     "29 Agustus 2025",
  nomor_ijazah:  "11200359201202510004",
  gelar:         "Sarjana Komputer (S.Kom.)",
  gelar_eng:     "Bachelor of Computer, major in Information Technology",
  prodi:         "Teknologi Informasi",
  konsentrasi:   "Konsentrasi: Jaringan",
  kelas:         "Kelas Reguler",
  nomor_skpi:    "SKPI/TI/004/II/2025",
  icp_total:     195,
  icp_predikasi: "Silver",
  icp_detail: [
    { no: 1, kategori: "Fisik",          poin: 0   },
    { no: 2, kategori: "Iman",           poin: 39  },
    { no: 3, kategori: "Intelektualitas",poin: 47  },
    { no: 4, kategori: "Kepribadian",    poin: 25  },
    { no: 5, kategori: "Keterampilan",   poin: 68  },
    { no: 6, kategori: "Moral",          poin: 16  },
  ],
  kegiatan: [
    { no: 1, kategori: "Prestasi dan Penghargaan",            list: ["Juara 2 Lomba Membuat Aplikasi CU Pancur Kasih"] },
    { no: 2, kategori: "Peningkatan Ketrampilan Profesional", list: ["Belajar Dasar Express.js Program Kelas Online CODEPOLITAN","Belajar JQuery Dasar Program Kelas Online CodePolitan","UniMet Expo Pendidikan Tinggi 2025 \u201cYour Bridges to the Brighter Futures\u201d"] },
    { no: 3, kategori: "Pengalaman Berorganisasi dan Kepemimpinan", list: ["Mentor Akademik Tahun 2022-2023"] },
    { no: 4, kategori: "Pengembangan Intelektual",            list: ["Roadshow 1000 Startup Digital Goes to Institut Shanti Bhuana"] },
    { no: 5, kategori: "Praktik Kerja",                       list: ["PT Profesional Telekomunikasi Indonesia (Jakarta)"] },
    { no: 6, kategori: "Pembinaan Spiritual",                 list: ["Retret Integritas dan Amare Mahasiswa Th.2020/2021","Retret Integritas dan Amare Mahasiswa \"Insan Allah Berintegritas\"","Retret Integritas dan Amare Mahasiswa \"We Are One Body\"","Retret Integritas dan Amare Mahasiswa \"Sukacita di dalam Mengasihi\""] },
    { no: 7, kategori: "Pembangunan Karakter dan Kepribadian",list: ["Telah lulus matakuliah Penciri Institusi yang bermuatan pembangunan karakter dan kepribadian: Kepribadian Amarean 1, 2, 3, 4 · Integritas Kepemimpinan 1, 2 · Nilai-nilai Integritas Insani 1, 2"] },
    { no: 8, kategori: "Kursus-kursus",                       list: ["Kursus Bahasa Inggris"] },
    { no: 9, kategori: "Skripsi",                             list: ["Implementasi Kriptografi AES-128 dan TOTP Untuk Meningkatkan Autentikasi Single Sign On (Studi Kasus : SSO Aplikasi Paroki St. Pius Bengkayang)"] },
  ],
  sikap: [
    "Bertaqwa kepada Tuhan Yang Maha Esa dan mampu menunjukkan sikap religius",
    "Menjunjung tinggi nilai kemanusiaan dalam menjalankan tugas berdasarkan agama, moral dan etika",
    "Berkontribusi dalam peningkatan mutu kehidupan bermasyarakat, berbangsa, bernegara, dan kemajuan peradaban berdasarkan Pancasila.",
    "Berperan sebagai warga negara yang bangga dan cinta tanah air, memiliki nasionalisme serta rasa tanggung jawab pada negara dan bangsa.",
    "Menghargai keanekaragaman budaya, pandangan, agama, dan kepercayaan, serta pendapat atau temuan orisinal orang lain.",
    "Bekerja sama dan memiliki kepekaan sosial serta kepedulian terhadap masyarakat dan lingkungan.",
    "Taat hukum dan disiplin dalam kehidupan bermasyarakat dan bernegara",
    "Menginternalisasi nilai, norma, dan etika akademik.",
    "Menunjukkan sikap bertanggungjawab atas pekerjaan di bidang keahliannya secara mandiri.",
    "Menginternalisasi semangat kemandirian, kejuangan, dan kewirausahaan",
    "Memiliki semangat Deum Amare et Amatum Facere, artinya: 'mengasihi Tuhan dan menjadikan Dia dikasihi' yang terinternalisasi dalam segala perilaku keimanan dan aktivitas sehari-hari.",
    "Memiliki karakter profesional yang berbudaya Amare, profesional dalam berbagai bidang teknologi serta mampu bekerja sama secara efektif dalam tim dengan landasan budaya Amore",
    "Memiliki wawasan kebangsaan, nasionalisme yang sehat dan inklusif, serta semangat bela negara demi terciptanya ketahanan nasional yang tangguh",
    "Memiliki integritas, empati yang kuat, serta kepedulian untuk mengabdi Gereja dan bangsa dengan berpegang teguh pada prinsip-prinsip moral kebaikan, tetapi tetap dalam keseimbangan dan keharmonisan",
  ],
  pengetahuan: [
    "Mampu melakukan analisis, mendesain secara professional. pengolahan basis data dengan cara menggunakan tools rekayasa perangkat lunak, jaringan komputer, komputer grafis, dan aplikasi multimedia.",
    "Mempunyai pengetahuan dalam penyusunan algoritma pemrograman yang efektif dan efisien serta dapat merancang, membangun dan mengelola teknologi informasi secara tepat dan akurat untuk pendukung pengambilan keputusan.",
    "Memiliki kemampuan untuk menjadi tenaga profesional untuk pengolahan jaringan komputer, komputer grafis, dan aplikasi multimedia serta memiliki kemampuan menulis laporan penelitian dengan baik serta mengelola proyek Sistem Informasi.",
    "Menguasai konsep dasar computing dan matematika.",
    "Menguasai prinsip teknologi informasi untuk memberikan alternatif-alternatif memecahkan permasalahan di organisasi dan masyarakat.",
    "Menguasai best practice standar-standar dalam teknologi informasi serta penggunaanya.",
    "Menguasai proses analisis, perencanaan, pengelolaan, dan evaluasi yang terkait dengan sumber daya informasi",
    "Menguasai bahasa dan algoritma pemrograman yang berkaitan dengan program aplikasi untuk manipulasi model gambar, grafis, dan citra.",
    "Menerapkan konsep dan mengembangkan mobile computing.",
    "Menguasai prinsip dasar sistem jaringan komputer dalam pengembangan sistem berbasis jaringan lokal (LAN) maupun jaringan luas (WAN).",
    "Mampu memilih pendekatan sistem cerdas yang sesuai, memilih representasi pengetahuan dan penalarannya",
  ],
  keterampilan_umum: [
    "Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam konteks pengembangan atau implementasi ilmu pengetahuan dan teknologi yang sesuai dengan bidang keahliannya.",
    "Mampu menunjukkan kinerja mandiri, bermutu, dan terukur.",
    "Mampu mengkaji implikasi pengembangan atau implementasi ilmu pengetahuan teknologi yang memperhatikan dan menerapkan nilai humaniora sesuai dengan keahliannya.",
    "Mampu menyusun deskripsi saintifik hasil kajiannya dalam bentuk skripsi atau laporan tugas akhir, dan mengunggahnya dalam laman perguruan tinggi.",
    "Mampu mengambil keputusan secara tepat dalam konteks penyelesaian masalah di bidang keahliannya, berdasarkan hasil analisis informasi dan data.",
    "Mampu memelihara dan mengembangkan jaringan kerja dengan pembimbing, kolega, sejawat baik di dalam maupun di luar lembaganya.",
    "Mampu bertanggung jawab atas pencapaian hasil kerja kelompok dan melakukan supervisi dan evaluasi ditugaskan kepada pekerja yang berada di bawah tanggung jawabnya.",
    "Mampu melaksanakan proses evaluasi diri terhadap kelompok kerja yang berada di bawah tanggung jawabnya dan mampu mengelola pembelajaran secara mandiri.",
    "Mampu mendokumentasi, menyimpan, mengamankan, dan menemukan kembali data untuk menjamin kesahihan dan mencegah plagiasi.",
    "Mempunyai kemampuan dalam mendefinisikan kebutuhan pengguna atau pasar terhadap kinerja (menganalisis, mengevaluasi dan mengembangkan) algoritma/metode berbasis komputer.",
    "Memiliki kemampuan (pengelolaan) manajerial tim dan kerja sama (team work), manajemen diri, mampu berkomunikasi baik lisan maupun tertulis dengan baik dan mampu melakukan presentasi.",
    "Mampu mengimplementasikan prinsip keberlanjutan (sustainability) dalam mengembangkan pengetahuan.",
    "Mampu mengimplementasikan teknologi informasi dan komunikasi dalam konteks pelaksanaan pekerjaannya.",
    "Mampu menerapkan kewirausahaan dan memahami kewirausahaan berbasis teknologi.",
  ],
  keterampilan_khusus: [
    "Mampu merancang dan mengembangkan algoritma untuk berbagai keperluan seperti Network Security, Data Compression Multimedia Technologies, Mobile Computing Intelligent Systems, Information Management, Algorithms and Complexity, Human-Computer Interaction, Graphics and Visual Computing.",
    "Mampu mengimplementasikan, mengelola, dan mengamankan informasi yang didistribusikan melalui jaringan komputer untuk menjamin kerahasiaan, integritas, dan ketersediaan informasi.",
    "Mampu menganalisis dan melakukan pengujian terhadap aplikasi berbasis komputer menggunakan teknik serta alat terkini sehingga menghasilkan aplikasi yang aman.",
    "Mampu merancang, menginternalisasikan, dan mengelola platform atau komponen perangkat keras maupun perangkat lunak menggunakan pemrograman integratif untuk mendukung aplikasi berbasis komputer.",
    "Mampu merancang, membangun, mengelola aplikasi berbasis komputer menggunakan cloud services untuk memenuhi kebutuhan organisasi.",
    "Mampu merancang, membangun, dan mengelola peralatan elektronik berbasis sensor yang terkoneksi dengan internet untuk mempercepat, dan mempermudah penyampaian informasi.",
    "Menerapkan konsep yang berkaitan dengan manajemen informasi, termasuk menyusun pemodelan data serta membangun aplikasi perangkat lunak untuk pengorganisasian data dan penjaminan keamanan akses data.",
    "Menerapkan konsep-konsep yang berkaitan dengan arsitektur dan organisasi komputer serta memanfaatkannya untuk menunjang aplikasi komputer.",
    "Merancang sistem keamanan dan pengelolaan proteksi aplikasi sistem.",
    "Mampu menerapkan integritas profesional dan nilai-nilai etika profesi.",
    "Mampu membangun aplikasi sederhana berbasis jaringan serta melakukan pengelolaan jaringan secara kontinu.",
  ],
};

/* ─── KOMPONEN PREVIEW DOKUMEN SKPI ─── */
function SkpiDocument({ mhs, sections }) {
  const activeKeys = new Set(sections.filter(s => s.enabled).map(s => s.key));
  const tgl = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const icpTotal = mhs.icp_detail.reduce((s, r) => s + r.poin, 0);
  const icpMax   = Math.max(...mhs.icp_detail.map(r => r.poin), 1);

  /* warna ICP per kategori */
  const ICP_COLORS = { Fisik: "#ef4444", Iman: "#f59e0b", Intelektualitas: "#3b82f6", Kepribadian: "#8b5cf6", Keterampilan: "#10b981", Moral: "#f97316" };

  return (
    <div className={styles.doc}>
      {/* ── KOP ── */}
      <div className={styles.docKop}>
        <div className={styles.docKopLogo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/Logo_isb.png" alt="ISB" className={styles.docLogo} onError={e => { e.currentTarget.style.display="none"; }} />
        </div>
        <div className={styles.docKopText}>
          <div className={styles.docKopPT}>INSTITUT SHANTI BHUANA</div>
          <div className={styles.docKopEN}><em>INSTITUTE of SHANTI BHUANA</em></div>
        </div>
      </div>
      <div className={styles.docHr} />

      {/* ── JUDUL ── */}
      <div className={styles.docJudul}>
        <div className={styles.docJudulID}>SURAT KETERANGAN PENDAMPING IJAZAH (SKPI)</div>
        <div className={styles.docJudulEN}><em>CERTIFICATE of SUPPLEMENT</em></div>
        <div className={styles.docNomor}>Nomor: {mhs.nomor_skpi}</div>
        <div className={styles.docJudulSub}>
          Surat Keterangan Pendamping Ijazah ini menyatakan kemampuan kerja, penguasaan pengetahuan dan integritas pemegangnya.
        </div>
        <div className={styles.docJudulSubEN}>
          <em>This Certificate of Supplement is to provide a description of the nature, level, context and status of the studies that were pursued and successfully completed by the individual named on the original qualification to which this supplement is appended</em>
        </div>
      </div>

      {/* ══ SEKSI 1: IDENTITAS DIRI ══ */}
      {(activeKeys.has("identitas") || activeKeys.has("semua")) && (
        <div className={styles.docSection}>
          <div className={styles.docSectionHeader}>
            <span>1.</span>
            <div>
              <div>INFORMASI TENTANG IDENTITAS DIRI PEMEGANG SKPI</div>
              <div className={styles.docSectionEn}><em>Information Identifying the Holder of this Certificate of Supplement</em></div>
            </div>
          </div>
          <table className={styles.docTable}>
            <tbody>
              {[
                ["1.1a", "Nama sesuai Ijazah", "Name as in High School Certificate", mhs.nama],
                ["1.1b", "Nama sesuai KTP",    "Name as in Identification Card",     mhs.nama],
                ["1.1c", "Nama sesuai Akta Kelahiran","Name as in Birth Certificate", mhs.nama],
                ["1.2",  "Tempat dan Tanggal Lahir","Place and Date of Birth",       `${mhs.tempat_lahir}, ${mhs.tgl_lahir}`],
                ["1.3",  "Nomor Induk Mahasiswa","Student's Registration Number",    mhs.nim],
                ["1.4",  "Tanggal Masuk",       "Date of Enrollment",               mhs.tgl_masuk],
                ["1.5",  "Tanggal Lulus",        "Date of Completion",               mhs.tgl_lulus],
                ["1.6",  "Nomor Seri Ijazah",    "Serial Number",                    mhs.nomor_ijazah],
                ["1.7",  "Gelar",                "Degree",                           `${mhs.gelar}\n${mhs.gelar_eng}`],
              ].map(([no, id, en, val]) => (
                <tr key={no}>
                  <td className={styles.docTdNo}>{no}</td>
                  <td className={styles.docTdLabel}>{id}<br /><em className={styles.docEm}>{en}</em></td>
                  <td className={styles.docTdVal}>{val.split("\n").map((v, i) => <div key={i}>{v}</div>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ SEKSI 2: IDENTITAS PENYELENGGARA ══ */}
      {(activeKeys.has("institusi") || activeKeys.has("semua")) && (
        <div className={styles.docSection}>
          <div className={styles.docSectionHeader}>
            <span>2.</span>
            <div>
              <div>INFORMASI TENTANG IDENTITAS PENYELENGGARA PROGRAM</div>
              <div className={styles.docSectionEn}><em>Information Identifying the Awarding Institution</em></div>
            </div>
          </div>
          <table className={styles.docTable}>
            <tbody>
              <tr>
                <td className={styles.docTdNo}>2.1</td>
                <td className={styles.docTdLabel}>SK Pendirian Perguruan Tinggi<br /><em className={styles.docEm}>Awarding Institution's License</em></td>
                <td className={styles.docTdVal}>SK Menteri Pendidikan dan Kebudayaan Republik Indonesia No. 725/M/2020. <em>Licensed by the Ministry of Education and Culture Republic of Indonesia</em></td>
              </tr>
              <tr>
                <td className={styles.docTdNo}>2.2</td>
                <td className={styles.docTdLabel}>Akreditasi<br /><em className={styles.docEm}>Accreditation</em></td>
                <td className={styles.docTdVal}>
                  Institusi: Terakreditasi BAIK SEKALI, SK BAN-PT No. 801/SK/BAN-PT/Ak/PT/X/2023<br />
                  <em>Very good accreditation by the National Accreditation Institution of Higher Education</em><br /><br />
                  Prodi Teknologi Informasi: Terakreditasi BAIK SEKALI, SK LAM-INFOKOM No. 026/SK/LAM-INFOKOM/Ak.B/S/XII/2022<br />
                  <em>Very good accreditation by the LAM-INFOKOM Independent Accreditation Institution of Informatics and Computer.</em>
                </td>
              </tr>
              {[
                ["2.3",  "Nama Perguruan Tinggi",  "Awarding Institution",        "Institut Shanti Bhuana / Institute of Shanti Bhuana"],
                ["2.4",  "Program Studi",           "Study Program",              `${mhs.prodi} — ${mhs.kelas}\n${mhs.konsentrasi}`],
                ["2.5",  "Jenjang Pendidikan",      "Level of Education",         "Sarjana (S1) / Bachelor Degree"],
                ["2.6",  "Jenis Pendidikan",        "Type of Education",          "Institut / Institute"],
                ["2.7",  "Jenjang Kualifikasi sesuai KKNI","Level of Qualification in the National Qualification","Framework Level 6"],
                ["2.8",  "Bahasa Pengantar Kuliah", "Language of Instruction",   "Bahasa Indonesia / Indonesian"],
                ["2.9",  "Sistem Penilaian",        "Grading System",            "Skala: 1-4; A = 4, A- = 3,5, B = 3, B- = 2,5 C = 2, D = 1, E = 0"],
                ["2.10", "Lama Studi Reguler",      "Regular Length of Study",   "8 Semester / 8 Semesters"],
                ["2.11", "Persyaratan Penerimaan",  "Entry Requirement",         "Lulus Pendidikan Menengah Atas/Sederajat / Graduate from High School or similar level of education"],
                ["2.12", "Jenis dan Jenjang Pendidikan Lanjutan","Access to Further Study","Akademik, Magister (S2), Doktoral (S3) / Academic, Master Degree, Doctoral Degree"],
              ].map(([no, id, en, val]) => (
                <tr key={no}>
                  <td className={styles.docTdNo}>{no}</td>
                  <td className={styles.docTdLabel}>{id}<br /><em className={styles.docEm}>{en}</em></td>
                  <td className={styles.docTdVal}>{val.split("\n").map((v, i) => <div key={i}>{v}</div>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ SEKSI 3: KUALIFIKASI & CAPAIAN ══ */}
      {(activeKeys.has("capaian_sikap") || activeKeys.has("capaian_pengetahuan") || activeKeys.has("keterampilan_umum") || activeKeys.has("keterampilan_khusus") || activeKeys.has("semua")) && (
        <div className={styles.docSection}>
          <div className={styles.docSectionHeader}>
            <span>3.</span>
            <div>
              <div>INFORMASI TENTANG KUALIFIKASI DAN HASIL YANG DICAPAI</div>
              <div className={styles.docSectionEn}><em>Information Identifying the Qualification and Outcomes Obtained</em></div>
            </div>
          </div>

          {/* A. Capaian Pembelajaran */}
          <div className={styles.docSubHeader}>A&nbsp;&nbsp;Capaian Pembelajaran / <em>Learning Outcomes</em></div>

          {/* Sikap */}
          {(activeKeys.has("capaian_sikap") || activeKeys.has("semua")) && (
            <>
              <div className={styles.docCplHeader}>Sikap / <em>Proposition of Attitude</em></div>
              <table className={styles.docTable}>
                <tbody>
                  {mhs.sikap.map((item, i) => (
                    <tr key={i}>
                      <td className={styles.docTdNo}>{i + 1}</td>
                      <td className={styles.docTdVal}>{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Pengetahuan */}
          {(activeKeys.has("capaian_pengetahuan") || activeKeys.has("semua")) && (
            <>
              <div className={styles.docCplHeader}>Pengetahuan / <em>Knowledge</em></div>
              <table className={styles.docTable}>
                <tbody>
                  {mhs.pengetahuan.map((item, i) => (
                    <tr key={i}>
                      <td className={styles.docTdNo}>{i + 1}</td>
                      <td className={styles.docTdVal}>{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Keterampilan Umum */}
          {(activeKeys.has("keterampilan_umum") || activeKeys.has("semua")) && (
            <>
              <div className={styles.docCplHeader}>Keterampilan Umum / <em>General Competence</em></div>
              <table className={styles.docTable}>
                <tbody>
                  {mhs.keterampilan_umum.map((item, i) => (
                    <tr key={i}>
                      <td className={styles.docTdNo}>{i + 1}</td>
                      <td className={styles.docTdVal}>{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Keterampilan Khusus */}
          {(activeKeys.has("keterampilan_khusus") || activeKeys.has("semua")) && (
            <>
              <div className={styles.docCplHeader}>Keterampilan Khusus / <em>Spesific Competences/Skills</em></div>
              <table className={styles.docTable}>
                <tbody>
                  {mhs.keterampilan_khusus.map((item, i) => (
                    <tr key={i}>
                      <td className={styles.docTdNo}>{i + 1}</td>
                      <td className={styles.docTdVal}>{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ══ SEKSI 4: AKTIVITAS & PRESTASI ══ */}
      {(activeKeys.has("aktivitas_prestasi") || activeKeys.has("semua")) && (
        <div className={styles.docSection}>
          <div className={styles.docSectionHeader}>
            <span>4.</span>
            <div>
              <div>AKTIVITAS, PRESTASI, DAN PENGHARGAAN</div>
              <div className={styles.docSectionEn}><em>Activities, Achievements, and Rewards</em></div>
            </div>
          </div>
          <table className={styles.docTable}>
            <tbody>
              {mhs.kegiatan.map(kg => (
                <tr key={kg.no}>
                  <td className={styles.docTdNo}>{kg.no}</td>
                  <td className={styles.docTdLabel}>{kg.kategori}</td>
                  <td className={styles.docTdVal}>
                    {kg.list.map((item, i) => (
                      <div key={i} style={{ marginBottom: "2px" }}>{i + 1}. {item}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ICP */}
          {(activeKeys.has("poin_integritas") || activeKeys.has("semua")) && (
            <>
              <div className={styles.docIcpHeader}>
                <span>2.</span>
                <div>
                  POIN INTEGRITAS<br />
                  <em>Integrity Credit Points (ICP)</em>
                </div>
              </div>
              {/* Kriteria */}
              <table className={styles.docTable} style={{ marginBottom: "12px" }}>
                <tbody>
                  <tr>
                    <td className={styles.docTdNo}>1</td>
                    <td className={styles.docTdLabel}>Kriteria ICP<br /><em className={styles.docEm}>Criteria of the ICP</em></td>
                    <td className={styles.docTdVal}>
                      <ul style={{ margin: "0 0 0 16px", padding: 0, lineHeight: "1.9" }}>
                        <li><strong>Gold achievement</strong>: &gt;200 points</li>
                        <li><strong>Silver achievement</strong>: 150–200 points</li>
                        <li><strong>Bronze achievement</strong>: 100–149 points</li>
                        <li>Syarat kelulusan: <em>Bronze achievement / Graduation requirement: Bronze achievement</em></li>
                        <li>Mahasiswa yang mencapai silver/gold achievement berhak mendapat predikat <em>cum laude</em></li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.docTdNo}>2</td>
                    <td className={styles.docTdLabel}>Kategori ICP<br /><em className={styles.docEm}>Categories of the ICP</em></td>
                    <td className={styles.docTdVal}>
                      <ol type="a" style={{ margin: "0 0 0 16px", padding: 0, lineHeight: "1.9" }}>
                        <li>Intelektualitas (inisiatif, cerdas, aktif, prestasi) / <em>Intellectuality (Initiative, Smart, active, achievement)</em></li>
                        <li>Keterampilan (cekatan, mampu, cakap, telaten, juara kompetisi) / <em>Skills (skillful, capable, competent, persevering, winning in competitions)</em></li>
                        <li>Moral (disiplin, sopan santun, berani, semangat, jujur) / <em>Moral (discipline, polite, brave, enthusiast, honest)</em></li>
                        <li>Iman (takwa, takut akan Tuhan, melayani Tuhan, penyangkalan diri) / <em>Faith (pious, God fearing, serving the Lord, abnegation)</em></li>
                        <li>Kepribadian (rajin, menolong, peka, kepribadian) / <em>Personality (diligent, helpful, sensitive, have personality)</em></li>
                        <li>Fisik (juara kompetisi olah raga) / <em>Physic (winnings sport competitions)</em></li>
                      </ol>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Hasil ICP */}
              <div className={styles.docIcpResult}>
                Hasil Pencapaian ICP / <em>ICP Performance:</em> <strong>{icpTotal}</strong>
                &nbsp;—&nbsp;
                <span style={{ color: icpTotal >= 200 ? "#ca8a04" : icpTotal >= 150 ? "#2563eb" : "#16a34a" }}>
                  {icpTotal >= 200 ? "🥇 Gold Achievement" : icpTotal >= 150 ? "🥈 Silver Achievement" : "🥉 Bronze Achievement"}
                </span>
              </div>
              <table className={styles.docIcpTable}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Kategori</th>
                    <th>Pencapaian ICP (Poin)</th>
                    <th style={{ width: "160px" }}>Grafik</th>
                  </tr>
                </thead>
                <tbody>
                  {mhs.icp_detail.map(r => (
                    <tr key={r.no}>
                      <td style={{ textAlign: "center" }}>{r.no}</td>
                      <td>{r.kategori}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: ICP_COLORS[r.kategori] || "#555" }}>{r.poin}</td>
                      <td>
                        <div style={{ background: "#f5f5f5", borderRadius: "4px", height: "12px", overflow: "hidden" }}>
                          <div style={{
                            width:      `${(r.poin / icpMax) * 100}%`,
                            background: ICP_COLORS[r.kategori] || "#888",
                            height:     "100%",
                            minWidth:   r.poin > 0 ? "4px" : "0",
                            borderRadius: "4px",
                          }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: "#f8f4f0" }}>
                    <td colSpan={2} style={{ textAlign: "right", paddingRight: "12px" }}>Total</td>
                    <td style={{ textAlign: "center", fontSize: "15px" }}>{icpTotal}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ══ SEKSI KKNI ══ */}
      {(activeKeys.has("kkni") || activeKeys.has("semua")) && (
        <div className={styles.docSection}>
          <div className={styles.docSectionHeader}>
            <span>3.</span>
            <div>
              <div>INFORMASI TENTANG SISTEM PENDIDIKAN TINGGI DAN KERANGKA KUALIFIKASI NASIONAL INDONESIA (KKNI)</div>
              <div className={styles.docSectionEn}><em>Information on the Indonesian Higher Education System and the Indonesian National Qualification Framework</em></div>
            </div>
          </div>
          <div className={styles.docKkniText}>
            <p>Kerangka Kualifikasi Nasional Indonesia (KKNI) adalah kerangka penjenjangan kualifikasi dan kompetensi tenaga kerja Indonesia yang menyandingkan, menyetarakan, dan mengintegrasikan sektor pendidikan dengan sektor pelatihan dan pengalaman kerja dalam suatu skema pengakuan kemampuan kerja yang disesuaikan dengan struktur di berbagai sektor pekerjaan. KKNI merupakan perwujudan mutu dan jati diri Bangsa Indonesia terkait dengan sistem pendidikan nasional, sistem pelatihan kerja nasional serta sistem penilaian kesetaraan capaian pembelajaran (<em>learning outcomes</em>) nasional.</p>
            <p style={{ marginTop: "8px", fontStyle: "italic" }}>The Indonesian National Qualification Framework is a framework denoting levels of Indonesian workforce qualifications and competence, that compares, equalizes, and integrates the education and training sectors and work experience in a scheme recognizing work competence based on the structures of various work sectors.</p>
          </div>
        </div>
      )}

      {/* ══ SEKSI PENGESAHAN ══ */}
      {(activeKeys.has("pengesahan") || activeKeys.has("semua")) && (
        <div className={styles.docSection}>
          <div className={styles.docSectionHeader}>
            <span>4.</span>
            <div>
              <div>PENGESAHAN SKPI</div>
              <div className={styles.docSectionEn}><em>SKPI Legalization</em></div>
            </div>
          </div>
          <div className={styles.docTtd}>
            <p>Bengkayang, {tgl}<br /><em>Bengkayang, {tgl}</em></p>
            <div className={styles.docTtdSpace} />
            <p style={{ textAlign: "center", lineHeight: "1.6" }}>
              <strong>Dr. Helena Anggraeni (Reni) Tondro Sugianto, S.T., M.T.</strong><br />
              Wakil Rektor I Institut Shanti Bhuana<br />
              <em>Vice Rector of Academic Affairs</em><br />
              <em>Institute of Shanti Bhuana</em><br />
              <small style={{ color: "#888" }}>NIDN. 1126107101</small>
            </p>
          </div>
          <div className={styles.docCatatan}>
            <strong>Catatan Resmi</strong>
            <ul>
              <li>SKPI dikeluarkan oleh institusi pendidikan tinggi yang berwenang mengeluarkan ijazah sesuai dengan peraturan perundang-undangan yang berlaku</li>
              <li>SKPI hanya diterbitkan setelah mahasiswa dinyatakan lulus dari suatu program studi secara resmi oleh Perguruan Tinggi.</li>
              <li>SKPI diterbitkan dalam Bahasa Indonesia dan Bahasa Inggris.</li>
              <li>SKPI yang asli diterbitkan menggunakan kertas khusus (barcode/security paper) berlogo Perguruan Tinggi, yang diterbitkan secara khusus oleh Perguruan Tinggi.</li>
              <li>Penerima SKPI dicantumkan dalam situs resmi Perguruan Tinggi.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MODAL PREVIEW FULL SCREEN ─── */
function PreviewModal({ sections, onClose }) {
  const printRef = useRef(null);
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>SKPI — ${SAMPLE_MHS.nama}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Times New Roman',serif;font-size:10pt;color:#000;background:#fff;padding:15mm 20mm}
        table{width:100%;border-collapse:collapse;margin-bottom:8px}
        td,th{border:1px solid #aaa;padding:4px 7px;vertical-align:top;font-size:9.5pt;line-height:1.4}
        th{background:#d0d0d0;font-weight:bold;text-align:center}
        .kop{display:flex;align-items:center;gap:14px;margin-bottom:8px}
        .kop img{height:55px}
        .kop-text .pt{font-size:14pt;font-weight:bold}
        .kop-text .en{font-size:11pt;font-style:italic}
        hr{border:2px solid #555;margin:6px 0}
        .judul{text-align:center;margin:10px 0 14px}
        .judul .id{font-size:13pt;font-weight:bold}
        .judul .en{font-style:italic;font-size:11pt}
        .judul .nomor{font-weight:bold;font-size:11pt}
        .sec-hdr{display:flex;gap:8px;background:#555;color:#fff;padding:5px 8px;font-weight:bold;font-size:9.5pt;margin:10px 0 0}
        .sec-hdr em{font-size:9pt;font-weight:normal}
        .sub-hdr{background:#aaa;padding:3px 8px;font-size:9pt;font-weight:600;margin:4px 0 0}
        .cpl-hdr{padding:3px 0 1px;font-weight:700;font-size:9pt;text-decoration:underline}
        .td-no{width:42px;text-align:center;font-weight:700}
        .td-lbl{width:36%;font-size:9pt}
        em{font-style:italic}
        .icp-result{margin:6px 0;font-weight:600;background:#f0f0f0;padding:4px 8px}
        .ttd{text-align:center;margin:20px auto 0;max-width:260px;line-height:1.6}
        .ttd-space{height:60px}
        .catatan{margin-top:12px;border-top:1px solid #aaa;padding-top:8px;font-size:8.5pt}
        .catatan ul{margin-left:16px}
        .catatan li{margin-bottom:2px}
        @page{size:A4;margin:15mm}
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={styles.previewOverlay}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewTitle}>
          <FileText size={16} />
          <span>Preview SKPI — {SAMPLE_MHS.nama} ({SAMPLE_MHS.nim})</span>
        </div>
        <div className={styles.previewActions}>
          <button className={styles.btnPrint} onClick={handlePrint}>
            <Printer size={15} /> Cetak / PDF
          </button>
          <button className={styles.btnClose} onClick={onClose}><X size={18} /></button>
        </div>
      </div>
      <div className={styles.previewScroll}>
        <div ref={printRef} className={styles.previewPaper}>
          <SkpiDocument mhs={SAMPLE_MHS} sections={sections} />
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL TAMBAH / EDIT SECTION ─── */
function SectionModal({ isOpen, onClose, onSave, section }) {
  const [form, setForm] = useState(section || { key: "", titleID: "", titleEN: "", enabled: true });
  useEffect(() => { setForm(section || { key: "", titleID: "", titleEN: "", enabled: true }); }, [section, isOpen]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = e => {
    e.preventDefault();
    if (!form.key || !form.titleID || !form.titleEN) return alert("Semua field wajib diisi!");
    onSave(form);
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{section ? "Edit Section" : "Tambah Section"}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Key (identifier unik)</label>
              <input className={styles.formInput} value={form.key} onChange={e => set("key", e.target.value)} placeholder="contoh: identitas" />
              <small className={styles.formHint}>Digunakan sebagai referensi di kode — tidak tampil di SKPI</small>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Judul (Indonesia)</label>
              <input className={styles.formInput} value={form.titleID} onChange={e => set("titleID", e.target.value)} placeholder="Informasi Identitas Diri" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Judul (English)</label>
              <input className={styles.formInput} value={form.titleEN} onChange={e => set("titleEN", e.target.value)} placeholder="Personal Information" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Aktif", "Nonaktif"].map(s => (
                  <button type="button" key={s}
                    className={`${styles.statusToggle} ${(form.enabled ? "Aktif" : "Nonaktif") === s ? styles.statusActive : ""}`}
                    onClick={() => set("enabled", s === "Aktif")}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnPrimary}><Save size={14} /> {section ? "Update" : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── TOAST ─── */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
      <div className={styles.toastIcon}>{toast.type === "success" ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>}</div>
      <span className={styles.toastMessage}>{toast.msg}</span>
      <button className={styles.toastClose} onClick={onClose}><X size={13}/></button>
    </div>
  );
}

/* ════════════════════════════════════
   HALAMAN UTAMA
════════════════════════════════════ */
export default function TemplateSkpiPage() {
  const [sections, setSections]     = useState(TEMPLATE_SECTIONS);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editSec, setEditSec]       = useState(null);
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState("");
  const [preview, setPreview]       = useState(false);

  useEffect(() => { document.title = "Template SKPI | Admin SKPI"; }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const sorted = [...sections]
    .filter(s => s.titleID.toLowerCase().includes(search.toLowerCase()) || s.key.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  const handleSave = data => {
    if (editSec) {
      setSections(prev => prev.map(s => s.id === editSec.id ? { ...s, ...data } : s));
      showToast(`Section "${data.titleID}" berhasil diupdate`);
    } else {
      const newId  = Math.max(...sections.map(s => s.id), 0) + 1;
      const maxOrd = Math.max(...sections.map(s => s.order), 0);
      setSections(prev => [...prev, { id: newId, order: maxOrd + 1, ...data }]);
      showToast(`Section "${data.titleID}" ditambahkan`);
    }
  };

  const toggleStatus = id => {
    const sec = sections.find(s => s.id === id);
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    showToast(`"${sec.titleID}" ${sec.enabled ? "dinonaktifkan" : "diaktifkan"}`);
  };

  const handleDelete = id => {
    const sec = sections.find(s => s.id === id);
    if (!confirm(`Hapus section "${sec.titleID}"?`)) return;
    setSections(prev => prev.filter(s => s.id !== id));
    showToast(`"${sec.titleID}" dihapus`, "error");
  };

  const move = (id, dir) => {
    const idx  = sorted.findIndex(s => s.id === id);
    const swap = dir === "up" ? sorted[idx - 1] : sorted[idx + 1];
    if (!swap) return;
    setSections(prev => prev.map(s => {
      if (s.id === id)      return { ...s, order: swap.order };
      if (s.id === swap.id) return { ...s, order: sections.find(x => x.id === id).order };
      return s;
    }));
  };

  const activeCount = sections.filter(s => s.enabled).length;

  return (
    <div className={styles.container}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Template SKPI</h1>
          <p className={styles.subtitle}>Kelola section dokumen SKPI — urutan, status aktif/nonaktif, dan bilingual</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPreview} onClick={() => setPreview(true)}>
            <Eye size={15} /> Preview Dokumen
          </button>
          <button className={styles.btnPrimary} onClick={() => { setEditSec(null); setModalOpen(true); }}>
            <Plus size={15} /> Tambah Section
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { icon: <GripVertical size={18}/>, val: sections.length, lbl: "Total Section" },
          { icon: <Eye size={18}/>,          val: activeCount,     lbl: "Aktif di SKPI" },
          { icon: <EyeOff size={18}/>,       val: sections.length - activeCount, lbl: "Nonaktif" },
        ].map((s, i) => (
          <div className={styles.statCard} key={i}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{s.val}</div>
              <div className={styles.statLabel}>{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className={styles.infoBanner}>
        <BookOpen size={15} />
        <span>Section yang <strong>aktif</strong> akan tampil di dokumen SKPI. Klik <strong>Preview Dokumen</strong> untuk melihat hasilnya persis seperti PDF asli.</span>
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <Search size={14} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Cari section..." value={search}
          onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch("")} className={styles.clearSearch}><X size={13}/></button>}
      </div>

      {/* Tabel Section */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 70 }}>Urutan</th>
              <th style={{ width: 130 }}>Key</th>
              <th>Judul Indonesia</th>
              <th>Judul English</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 120 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <Settings size={36} />
                    <p>Tidak ada section yang cocok</p>
                    <button onClick={() => setSearch("")} className={styles.btnSecondary}>Hapus Filter</button>
                  </div>
                </td>
              </tr>
            ) : sorted.map((sec, idx) => (
              <tr key={sec.id} className={!sec.enabled ? styles.inactiveRow : ""}>
                <td className={styles.center}>
                  <div className={styles.orderGroup}>
                    <button className={styles.orderBtn} onClick={() => move(sec.id, "up")}  disabled={idx === 0}><ChevronUp size={13}/></button>
                    <span className={styles.orderNum}>{idx + 1}</span>
                    <button className={styles.orderBtn} onClick={() => move(sec.id, "down")} disabled={idx === sorted.length - 1}><ChevronDown size={13}/></button>
                  </div>
                </td>
                <td><code className={styles.code}>{sec.key}</code></td>
                <td className={styles.tdTitle}>{sec.titleID}</td>
                <td className={styles.tdEn}><em>{sec.titleEN}</em></td>
                <td>
                  <button
                    className={`${styles.statusBtn} ${sec.enabled ? styles.statusOn : styles.statusOff}`}
                    onClick={() => toggleStatus(sec.id)}
                  >
                    {sec.enabled ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
                    {sec.enabled ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button className={styles.actionBtn} onClick={() => { setEditSec(sec); setModalOpen(true); }} title="Edit"><Edit2 size={13}/></button>
                    <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handleDelete(sec.id)} title="Hapus"><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footerNote}>
        <strong>Catatan:</strong> Urutan section menentukan urutan tampilan di dokumen SKPI. Section yang dinonaktifkan tidak muncul saat SKPI di-generate.
      </div>

      {/* Modals */}
      <SectionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} section={editSec} />
      {preview && <PreviewModal sections={sections} onClose={() => setPreview(false)} />}
    </div>
  );
}