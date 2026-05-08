// lib/prodi-templates.js
// Data CPL lengkap per program studi ISB

export const PRODI_LIST = [
  "Teknologi Informasi",
  "Sistem Informasi",
  "Manajemen",
  "Kewirausahaan",
  "Pendidikan Guru Sekolah Dasar",
  "Agroekoteknologi",
];

// Sikap umum SN-DIKTI (sama untuk semua prodi)
const SIKAP_UMUM = [
  { id: "Bertaqwa kepada Tuhan Yang Maha Esa dan mampu menunjukkan sikap religius.", en: "Believe in God and show religious attitudes." },
  { id: "Menjunjung tinggi nilai kemanusiaan dalam menjalankan tugas berdasarkan agama, moral dan etika.", en: "Uphold human values in performing duties based on religion, morals and ethics." },
  { id: "Berkontribusi dalam peningkatan mutu kehidupan bermasyarakat, berbangsa, bernegara, dan kemajuan peradaban berdasarkan Pancasila.", en: "Contribute to improving the quality of community, national, and state life based on Pancasila." },
  { id: "Berperan sebagai warga negara yang bangga dan cinta tanah air, memiliki nasionalisme serta rasa tanggung jawab pada negara dan bangsa.", en: "Act as a proud and patriotic citizen with nationalism and responsibility to the state." },
  { id: "Menghargai keanekaragaman budaya, pandangan, agama, dan kepercayaan, serta pendapat atau temuan orisinal orang lain.", en: "Appreciate diversity of culture, views, religion, and beliefs, as well as others' original opinions." },
  { id: "Bekerja sama dan memiliki kepekaan sosial serta kepedulian terhadap masyarakat dan lingkungan.", en: "Cooperate and have social sensitivity and concern for society and the environment." },
  { id: "Taat hukum dan disiplin dalam kehidupan bermasyarakat dan bernegara.", en: "Obey the law and be disciplined in social and national life." },
  { id: "Menginternalisasi nilai, norma, dan etika akademik.", en: "Internalize academic values, norms and ethics." },
  { id: "Menunjukkan sikap bertanggungjawab atas pekerjaan di bidang keahliannya secara mandiri.", en: "Demonstrate a responsible attitude towards work in the area of expertise independently." },
  { id: "Menginternalisasi semangat kemandirian, kejuangan, dan kewirausahaan.", en: "Internalize the spirit of independence, fighting spirit, and entrepreneurship." },
  { id: `Memiliki semangat Deum Amare et Amatum Facere, artinya: "mengasihi Tuhan dan menjadikan Dia dikasihi" yang terinternalisasi dalam sikap, nilai, dan perilaku.`, en: `Possess the spirit of Deum Amare et Amatum Facere, meaning: "love God and make Him loved" internalized in attitude, values, and behavior.` },
  { id: "Memiliki karakter profesional yang berbudaya Amare, profesional dalam berbagai bidang teknologi serta mampu bekerja sama dengan baik.", en: "Possess professional character with Amare culture, professional in various technology fields and able to cooperate well." },
  { id: "Memiliki wawasan kebangsaan, nasionalisme yang sehat dan inklusif, serta semangat bela negara demi terciptanya ketahanan nasional.", en: "Possess national insight, healthy and inclusive nationalism, and the spirit of defending the country." },
  { id: "Memiliki integritas, empati yang kuat, serta kepedulian untuk mengabdi Gereja dan bangsa dengan berpegang teguh pada nilai-nilai moral dan etika profesi.", en: "Possess integrity, strong empathy, and dedication to serve the Church and nation based on moral values and professional ethics." },
];

/* ═══════════════════════════════
   1. TEKNOLOGI INFORMASI
═══════════════════════════════ */
const TI = {
  nama: "Teknologi Informasi",
  nama_en: "Information Technology",
  gelar: "S.Komp.",
  gelar_en: "B.C.S.",
  jenjang: "Sarjana (S1) / Bachelor Degree",
  level_kkni: "6",
  akreditasi: "Terakreditasi BAIK SEKALI — SK BAN-PT No. 801/SK/BAN-PT/Ak/PT/X/2023",
  lama_studi: "8 Semester",
  konsentrasi: "Jaringan / Network",
  sikap: SIKAP_UMUM,
  pengetahuan: [
    { id: "Mampu melakukan analisis, mendesain secara professional, pengolahan basis data dengan cara menggunakan tools rekayasa perangkat lunak, jaringan komputer, komputer grafis, dan aplikasi multimedia.", en: "Able to professionally analyze, design, and process databases using software engineering tools, computer networks, computer graphics, and multimedia applications." },
    { id: "Mempunyai pengetahuan dalam penyusunan algoritma pemrograman yang efektif dan efisien serta dapat merancang, membangun, mengoperasikan dan merawat sistem komputer yang memiliki skala yang berbeda.", en: "Have knowledge in developing effective and efficient programming algorithms and able to design, build, operate and maintain computer systems of different scales." },
    { id: "Memiliki kemampuan untuk menjadi tenaga profesional untuk pengolahan jaringan komputer, komputer grafis, dan aplikasi multimedia yang inovatif dengan mengimplementasi teknologi terkini.", en: "Have the ability to become a professional in computer network processing, computer graphics, and innovative multimedia applications by implementing the latest technology." },
    { id: "Menguasai konsep dasar computing dan matematika.", en: "Mastering the basic concepts of computing and mathematics." },
    { id: "Menguasai prinsip teknologi informasi untuk memberikan alternatif-alternatif solusi yang dapat digunakan untuk memecahkan permasalahan.", en: "Mastering the principles of information technology to provide alternative solutions for problem-solving." },
    { id: "Menguasai best practice standar-standar dalam teknologi informasi serta penggunaanya.", en: "Mastering best practice standards in information technology and their application." },
    { id: "Menguasai proses analisis, perencanaan, pengelolaan, dan evaluasi yang terkait dengan sumber daya informasi.", en: "Mastering the processes of analysis, planning, management, and evaluation related to information resources." },
    { id: "Menguasai bahasa dan algoritma pemrograman yang berkaitan dengan program aplikasi untuk manipulasi model gambar, grafik, dan multimedia.", en: "Mastering programming languages and algorithms related to application programs for manipulating image models, graphics, and multimedia." },
    { id: "Menerapkan konsep dan mengembangkan mobile computing.", en: "Applying concepts and developing mobile computing." },
    { id: "Menguasai prinsip dasar sistem jaringan komputer dalam pengembangan sistem berbasis jaringan lokal (LAN) maupun jaringan internet.", en: "Mastering the basic principles of computer network systems in developing LAN and internet-based systems." },
    { id: "Mampu memilih pendekatan sistem cerdas yang sesuai, memilih representasi pengetahuan dan penalarannya.", en: "Able to choose an appropriate intelligent system approach, selecting knowledge representation and reasoning." },
  ],
  keterampilan_umum: [
    { id: "Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam konteks pengembangan atau implementasi ilmu pengetahuan dan teknologi yang sesuai dengan bidang keahliannya.", en: "Able to apply logical, critical, systematic, and innovative thinking in the context of developing or implementing science and technology in the field of expertise." },
    { id: "Mampu menunjukkan kinerja mandiri, bermutu, dan terukur.", en: "Able to demonstrate independent, quality and measurable performance." },
    { id: "Mampu mengkaji implikasi pengembangan atau implementasi ilmu pengetahuan teknologi yang memperhatikan dan menerapkan nilai humaniora sesuai dengan keahliannya.", en: "Able to study the implications of developing or implementing technology that considers and applies humanistic values." },
    { id: "Mampu menyusun deskripsi saintifik hasil kajiannya dalam bentuk skripsi atau laporan tugas akhir, dan mengunggahnya dalam laman perguruan tinggi.", en: "Able to compile a scientific description of study results in the form of a thesis or final project report and upload it to the university's website." },
    { id: "Mampu mengambil keputusan secara tepat dalam konteks penyelesaian masalah di bidang keahliannya, berdasarkan hasil analisis informasi dan data.", en: "Able to make appropriate decisions in the context of problem-solving in the field of expertise, based on the results of information and data analysis." },
    { id: "Mampu memelihara dan mengembangkan jaringan kerja dengan pembimbing, kolega, sejawat baik di dalam maupun di luar lembaganya.", en: "Able to maintain and develop working relationships with supervisors, colleagues, and peers both inside and outside the institution." },
    { id: "Mampu bertanggung jawab atas pencapaian hasil kerja kelompok dan melakukan supervisi dan evaluasi terhadap penyelesaian pekerjaan yang ditugaskan kepada pekerja yang berada di bawah tanggung jawabnya.", en: "Able to be responsible for the achievement of group work results and supervise and evaluate the completion of work assigned to workers under their responsibility." },
    { id: "Mampu melaksanakan proses evaluasi diri terhadap kelompok kerja yang berada di bawah tanggung jawabnya dan mampu mengelola pembelajaran secara mandiri.", en: "Able to carry out a self-evaluation process for work groups under their responsibility and able to manage learning independently." },
    { id: "Mampu mendokumentasi, menyimpan, mengamankan, dan menemukan kembali data untuk menjamin kesahihan dan mencegah plagiasi.", en: "Able to document, store, secure, and retrieve data to ensure validity and prevent plagiarism." },
    { id: "Mempunyai kemampuan dalam mendefinisikan kebutuhan pengguna atau pasar terhadap kinerja (menganalisis, mengevaluasi, mengembangkan solusi teknologi inovatif).", en: "Have the ability to define user or market needs for performance (analyzing, evaluating, developing innovative technology solutions)." },
    { id: "Memiliki kemampuan manajerial tim dan kerja sama (team work), manajemen diri, mampu berkomunikasi baik lisan maupun tulisan dengan efektif.", en: "Have team management and teamwork abilities, self-management, and able to communicate effectively both orally and in writing." },
    { id: "Mampu mengimplementasikan prinsip keberlanjutan (sustainability) dalam mengembangkan pengetahuan.", en: "Able to implement sustainability principles in developing knowledge." },
    { id: "Mampu mengimplementasikan teknologi informasi dan komunikasi dalam konteks pelaksanaan pekerjaannya.", en: "Able to implement information and communication technology in the context of work execution." },
    { id: "Mampu menerapkan kewirausahaan dan memahami kewirausahaan berbasis teknologi.", en: "Able to apply entrepreneurship and understand technology-based entrepreneurship." },
  ],
  keterampilan_khusus: [
    { id: "Mampu merancang dan mengembangkan algoritma untuk berbagai keperluan seperti Network Security, Data Compression, Multimedia Technologies, Mobile Computing, Intelligent Systems, Information Management, Algorithms and Complexity, Human-Computer Interaction, Graphics and Visual Computing.", en: "Able to design and develop algorithms for various purposes such as Network Security, Data Compression, Multimedia Technologies, Mobile Computing, Intelligent Systems, Information Management, Algorithms and Complexity, Human-Computer Interaction, Graphics and Visual Computing." },
    { id: "Mampu mengimplementasikan, mengelola, dan mengamankan informasi yang didistribusikan melalui jaringan komputer untuk menghadapi perkembangan teknologi informasi.", en: "Able to implement, manage, and secure information distributed through computer networks to face information technology developments." },
    { id: "Mampu menganalisis dan melakukan pengujian terhadap aplikasi berbasis komputer menggunakan teknik serta alat terkini.", en: "Able to analyze and test computer-based applications using the latest techniques and tools." },
    { id: "Mampu merancang, menginternalisasikan, dan mengelola platform atau komponen perangkat keras maupun perangkat lunak multi-layer.", en: "Able to design, internalize, and manage multi-layer hardware or software platforms or components." },
    { id: "Mampu merancang, membangun, mengelola aplikasi berbasis komputer menggunakan cloud services untuk memenuhi kebutuhan organisasi.", en: "Able to design, build, and manage computer-based applications using cloud services to meet organizational needs." },
    { id: "Mampu merancang, membangun, dan mengelola peralatan elektronik berbasis sensor yang terkoneksi dengan internet untuk solusi IoT.", en: "Able to design, build, and manage sensor-based electronic devices connected to the internet for IoT solutions." },
    { id: "Menerapkan konsep yang berkaitan dengan manajemen informasi, termasuk menyusun pemodelan data serta membangun aplikasi berbasis data.", en: "Applying concepts related to information management, including data modeling and building data-based applications." },
    { id: "Menerapkan konsep-konsep yang berkaitan dengan arsitektur dan organisasi komputer serta memanfaatkannya untuk menunjang pembuatan perangkat lunak.", en: "Applying concepts related to computer architecture and organization and utilizing them to support software development." },
    { id: "Merancang sistem keamanan dan pengelolaan proteksi aplikasi sistem.", en: "Designing security systems and managing system application protection." },
    { id: "Mampu menerapkan integritas profesional dan nilai-nilai etika profesi.", en: "Able to apply professional integrity and professional ethics values." },
    { id: "Mampu membangun aplikasi sederhana berbasis jaringan serta melakukan pengelolaan jaringan secara kontinu.", en: "Able to build simple network-based applications and continuously manage networks." },
  ],
};

/* ═══════════════════════════════
   2. SISTEM INFORMASI
═══════════════════════════════ */
const SI = {
  nama: "Sistem Informasi",
  nama_en: "Information Systems",
  gelar: "S.Kom.",
  gelar_en: "B.I.S.",
  jenjang: "Sarjana (S1) / Bachelor Degree",
  level_kkni: "6",
  akreditasi: "Terakreditasi BAIK — SK BAN-PT",
  lama_studi: "8 Semester",
  konsentrasi: "",
  sikap: SIKAP_UMUM,
  pengetahuan: [
    { id: "Menguasai konsep teoritis sistem informasi, rekayasa perangkat lunak, dan basis data untuk mendukung pengambilan keputusan organisasi.", en: "Mastering theoretical concepts of information systems, software engineering, and databases to support organizational decision-making." },
    { id: "Menguasai prinsip analisis bisnis dan pemodelan proses bisnis dalam konteks pengembangan sistem informasi.", en: "Mastering business analysis principles and business process modeling in the context of information systems development." },
    { id: "Memahami konsep manajemen proyek teknologi informasi dan tata kelola TI (IT Governance).", en: "Understanding the concepts of IT project management and IT governance." },
    { id: "Menguasai konsep keamanan informasi dan pengelolaan risiko sistem informasi.", en: "Mastering information security concepts and information system risk management." },
    { id: "Menguasai konsep e-business, e-commerce, dan transformasi digital organisasi.", en: "Mastering e-business, e-commerce, and organizational digital transformation concepts." },
    { id: "Memahami prinsip audit sistem informasi dan evaluasi kinerja sistem.", en: "Understanding information system audit principles and system performance evaluation." },
    { id: "Menguasai konsep kecerdasan bisnis (Business Intelligence) dan analitik data.", en: "Mastering Business Intelligence concepts and data analytics." },
  ],
  keterampilan_umum: [
    { id: "Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam pengembangan sistem informasi.", en: "Able to apply logical, critical, systematic, and innovative thinking in information systems development." },
    { id: "Mampu bekerja secara mandiri maupun tim dalam proyek pengembangan sistem informasi.", en: "Able to work independently and in teams in information systems development projects." },
    { id: "Mampu mendokumentasikan, menyimpan, dan menemukan kembali data sistem informasi.", en: "Able to document, store, and retrieve information systems data." },
    { id: "Mampu mengambil keputusan berdasarkan analisis data dan informasi yang akurat.", en: "Able to make decisions based on accurate data and information analysis." },
    { id: "Mampu berkomunikasi secara efektif dengan berbagai pemangku kepentingan terkait sistem informasi.", en: "Able to communicate effectively with various stakeholders related to information systems." },
    { id: "Mampu memelihara dan mengembangkan jaringan profesional di bidang sistem informasi.", en: "Able to maintain and develop professional networks in the information systems field." },
    { id: "Mampu mengelola pembelajaran mandiri dan mengembangkan kompetensi secara berkelanjutan.", en: "Able to manage independent learning and develop competencies on an ongoing basis." },
  ],
  keterampilan_khusus: [
    { id: "Mampu menganalisis kebutuhan bisnis dan merancang solusi sistem informasi yang tepat.", en: "Able to analyze business requirements and design appropriate information system solutions." },
    { id: "Mampu merancang dan mengimplementasikan basis data relasional dan non-relasional.", en: "Able to design and implement relational and non-relational databases." },
    { id: "Mampu mengembangkan aplikasi berbasis web dan mobile untuk mendukung proses bisnis.", en: "Able to develop web and mobile-based applications to support business processes." },
    { id: "Mampu melakukan audit sistem informasi dan mengevaluasi kinerja sistem.", en: "Able to conduct information system audits and evaluate system performance." },
    { id: "Mampu mengelola proyek teknologi informasi menggunakan metodologi yang sesuai.", en: "Able to manage information technology projects using appropriate methodologies." },
    { id: "Mampu membangun sistem Business Intelligence dan dashboard analitik.", en: "Able to build Business Intelligence systems and analytical dashboards." },
    { id: "Mampu menerapkan keamanan informasi dan manajemen risiko dalam pengelolaan sistem.", en: "Able to apply information security and risk management in system management." },
  ],
};

/* ═══════════════════════════════
   3. MANAJEMEN
═══════════════════════════════ */
const MJ = {
  nama: "Manajemen",
  nama_en: "Management",
  gelar: "S.M.",
  gelar_en: "B.M.",
  jenjang: "Sarjana (S1) / Bachelor Degree",
  level_kkni: "6",
  akreditasi: "Terakreditasi BAIK — SK BAN-PT",
  lama_studi: "8 Semester",
  konsentrasi: "",
  sikap: SIKAP_UMUM,
  pengetahuan: [
    { id: "Menguasai konsep teori manajemen, fungsi manajemen, dan penerapannya dalam organisasi bisnis.", en: "Mastering the theoretical concepts of management, management functions, and their application in business organizations." },
    { id: "Menguasai prinsip-prinsip ekonomi mikro dan makro yang relevan dengan pengambilan keputusan bisnis.", en: "Mastering micro and macro economic principles relevant to business decision-making." },
    { id: "Memahami konsep manajemen keuangan, akuntansi manajerial, dan analisis laporan keuangan.", en: "Understanding financial management concepts, managerial accounting, and financial statement analysis." },
    { id: "Menguasai konsep manajemen sumber daya manusia dan pengembangan organisasi.", en: "Mastering human resource management concepts and organizational development." },
    { id: "Memahami prinsip manajemen pemasaran dan perilaku konsumen.", en: "Understanding marketing management principles and consumer behavior." },
    { id: "Menguasai konsep manajemen operasional dan rantai pasok (supply chain).", en: "Mastering operational management and supply chain concepts." },
    { id: "Memahami konsep kewirausahaan dan inovasi bisnis dalam lingkungan global.", en: "Understanding entrepreneurship and business innovation concepts in a global environment." },
    { id: "Menguasai prinsip etika bisnis dan tanggung jawab sosial perusahaan.", en: "Mastering business ethics principles and corporate social responsibility." },
  ],
  keterampilan_umum: [
    { id: "Mampu menerapkan pemikiran analitis dan strategis dalam pengambilan keputusan manajerial.", en: "Able to apply analytical and strategic thinking in managerial decision-making." },
    { id: "Mampu bekerja secara efektif dalam tim lintas fungsi dan mengelola konflik.", en: "Able to work effectively in cross-functional teams and manage conflict." },
    { id: "Mampu berkomunikasi secara efektif baik lisan maupun tulisan dalam konteks bisnis.", en: "Able to communicate effectively both orally and in writing in a business context." },
    { id: "Mampu menyusun rencana bisnis dan proposal yang komprehensif.", en: "Able to develop comprehensive business plans and proposals." },
    { id: "Mampu mengambil keputusan berdasarkan analisis data kuantitatif dan kualitatif.", en: "Able to make decisions based on quantitative and qualitative data analysis." },
    { id: "Mampu memimpin tim dan menginspirasi anggota untuk mencapai tujuan organisasi.", en: "Able to lead teams and inspire members to achieve organizational goals." },
    { id: "Mampu mengelola proyek bisnis dari perencanaan hingga evaluasi.", en: "Able to manage business projects from planning to evaluation." },
  ],
  keterampilan_khusus: [
    { id: "Mampu menyusun dan menganalisis laporan keuangan untuk pengambilan keputusan investasi.", en: "Able to prepare and analyze financial reports for investment decision-making." },
    { id: "Mampu merancang strategi pemasaran yang efektif berbasis riset pasar.", en: "Able to design effective marketing strategies based on market research." },
    { id: "Mampu mengelola proses rekrutmen, seleksi, pelatihan, dan pengembangan SDM.", en: "Able to manage recruitment, selection, training, and human resource development processes." },
    { id: "Mampu merancang dan mengevaluasi sistem pengendalian manajemen.", en: "Able to design and evaluate management control systems." },
    { id: "Mampu mengembangkan dan mengelola usaha bisnis secara mandiri.", en: "Able to develop and manage a business independently." },
    { id: "Mampu menganalisis lingkungan bisnis eksternal dan internal menggunakan alat analisis strategis.", en: "Able to analyze the external and internal business environment using strategic analysis tools." },
    { id: "Mampu menerapkan konsep manajemen operasional untuk meningkatkan efisiensi dan efektivitas proses bisnis.", en: "Able to apply operational management concepts to improve efficiency and effectiveness of business processes." },
  ],
};

/* ═══════════════════════════════
   4. KEWIRAUSAHAAN
═══════════════════════════════ */
const KW = {
  nama: "Kewirausahaan",
  nama_en: "Entrepreneurship",
  gelar: "S.M.",
  gelar_en: "B.E.",
  jenjang: "Sarjana (S1) / Bachelor Degree",
  level_kkni: "6",
  akreditasi: "Terakreditasi BAIK — SK BAN-PT",
  lama_studi: "8 Semester",
  konsentrasi: "",
  sikap: SIKAP_UMUM,
  pengetahuan: [
    { id: "Menguasai konsep dan teori kewirausahaan serta ekosistem bisnis inovatif.", en: "Mastering entrepreneurship concepts, theories, and innovative business ecosystems." },
    { id: "Menguasai prinsip identifikasi peluang, validasi ide, dan pengembangan model bisnis.", en: "Mastering the principles of opportunity identification, idea validation, and business model development." },
    { id: "Memahami konsep manajemen keuangan kewirausahaan termasuk pengelolaan modal awal dan arus kas.", en: "Understanding entrepreneurial financial management concepts including seed capital management and cash flow." },
    { id: "Menguasai prinsip pemasaran digital dan strategi penetrasi pasar untuk usaha rintisan.", en: "Mastering digital marketing principles and market penetration strategies for startups." },
    { id: "Memahami hukum dan regulasi yang terkait dengan pendirian dan pengelolaan usaha.", en: "Understanding laws and regulations related to business establishment and management." },
    { id: "Menguasai konsep inovasi, desain thinking, dan lean startup methodology.", en: "Mastering innovation concepts, design thinking, and lean startup methodology." },
    { id: "Memahami konsep social entrepreneurship dan pemberdayaan masyarakat.", en: "Understanding social entrepreneurship and community empowerment concepts." },
  ],
  keterampilan_umum: [
    { id: "Mampu menerapkan kreativitas dan inovasi dalam pengembangan produk atau jasa baru.", en: "Able to apply creativity and innovation in developing new products or services." },
    { id: "Mampu melakukan riset pasar dan analisis kelayakan bisnis.", en: "Able to conduct market research and business feasibility analysis." },
    { id: "Mampu berkomunikasi persuasif kepada investor, mitra, dan pelanggan.", en: "Able to communicate persuasively to investors, partners, and customers." },
    { id: "Mampu memimpin tim wirausaha dan mengelola sumber daya secara efisien.", en: "Able to lead entrepreneurial teams and manage resources efficiently." },
    { id: "Mampu beradaptasi dengan perubahan dan ketidakpastian dalam lingkungan bisnis.", en: "Able to adapt to changes and uncertainty in the business environment." },
    { id: "Mampu mengambil keputusan berbasis data dalam kondisi keterbatasan sumber daya.", en: "Able to make data-based decisions under resource constraints." },
    { id: "Mampu mengelola risiko bisnis dan menyusun rencana mitigasi.", en: "Able to manage business risks and develop mitigation plans." },
  ],
  keterampilan_khusus: [
    { id: "Mampu menyusun business plan yang komprehensif dan bankable untuk usaha baru.", en: "Able to develop a comprehensive and bankable business plan for a new venture." },
    { id: "Mampu mengembangkan dan meluncurkan produk minimum viable product (MVP).", en: "Able to develop and launch a minimum viable product (MVP)." },
    { id: "Mampu mengelola keuangan usaha termasuk laporan laba rugi, neraca, dan arus kas.", en: "Able to manage business finances including income statements, balance sheets, and cash flow." },
    { id: "Mampu merancang dan mengeksekusi strategi pemasaran digital (SEO, media sosial, konten marketing).", en: "Able to design and execute digital marketing strategies (SEO, social media, content marketing)." },
    { id: "Mampu membangun jaringan bisnis dan mengelola hubungan dengan pemangku kepentingan.", en: "Able to build business networks and manage stakeholder relationships." },
    { id: "Mampu mengakses sumber pendanaan (investasi, hibah, modal ventura) untuk pengembangan usaha.", en: "Able to access funding sources (investments, grants, venture capital) for business development." },
    { id: "Mampu melakukan pivot bisnis berdasarkan umpan balik pasar dan data performa usaha.", en: "Able to pivot the business based on market feedback and business performance data." },
  ],
};

/* ═══════════════════════════════
   5. PENDIDIKAN GURU SEKOLAH DASAR
═══════════════════════════════ */
const PGSD = {
  nama: "Pendidikan Guru Sekolah Dasar",
  nama_en: "Elementary School Teacher Education",
  gelar: "S.Pd.",
  gelar_en: "B.Ed.",
  jenjang: "Sarjana (S1) / Bachelor Degree",
  level_kkni: "6",
  akreditasi: "Terakreditasi BAIK — SK BAN-PT",
  lama_studi: "8 Semester",
  konsentrasi: "",
  sikap: SIKAP_UMUM,
  pengetahuan: [
    { id: "Menguasai teori belajar dan perkembangan peserta didik usia sekolah dasar.", en: "Mastering learning theories and the development of elementary school-aged students." },
    { id: "Menguasai konsep dan kurikulum pendidikan dasar sesuai standar nasional pendidikan.", en: "Mastering the concepts and curriculum of basic education according to national education standards." },
    { id: "Memahami pedagogi dan didaktik pembelajaran di sekolah dasar untuk semua mata pelajaran.", en: "Understanding pedagogy and didactics of elementary school learning for all subjects." },
    { id: "Menguasai konsep penelitian pendidikan dan pengembangan pembelajaran berbasis bukti.", en: "Mastering educational research concepts and evidence-based learning development." },
    { id: "Memahami konsep pendidikan inklusif dan keberagaman peserta didik.", en: "Understanding inclusive education concepts and the diversity of students." },
    { id: "Menguasai prinsip manajemen kelas dan pengelolaan lingkungan belajar yang kondusif.", en: "Mastering classroom management principles and creating a conducive learning environment." },
    { id: "Memahami penggunaan teknologi pendidikan dan media pembelajaran inovatif.", en: "Understanding the use of educational technology and innovative learning media." },
    { id: "Menguasai konsep evaluasi dan asesmen pembelajaran di sekolah dasar.", en: "Mastering evaluation and assessment concepts in elementary school learning." },
  ],
  keterampilan_umum: [
    { id: "Mampu merancang, melaksanakan, dan mengevaluasi pembelajaran yang berpusat pada peserta didik.", en: "Able to design, implement, and evaluate student-centered learning." },
    { id: "Mampu bekerja sama dengan orang tua, sesama guru, dan pemangku kepentingan pendidikan.", en: "Able to collaborate with parents, fellow teachers, and educational stakeholders." },
    { id: "Mampu berkomunikasi secara efektif dengan peserta didik dan komunitas sekolah.", en: "Able to communicate effectively with students and the school community." },
    { id: "Mampu melakukan penelitian tindakan kelas untuk meningkatkan kualitas pembelajaran.", en: "Able to conduct classroom action research to improve learning quality." },
    { id: "Mampu mengembangkan diri secara profesional secara berkelanjutan.", en: "Able to develop professionally on an ongoing basis." },
    { id: "Mampu mengambil keputusan pedagogis berdasarkan analisis kebutuhan dan konteks belajar.", en: "Able to make pedagogical decisions based on needs analysis and learning context." },
    { id: "Mampu mendokumentasikan dan melaporkan proses serta hasil pembelajaran secara sistematis.", en: "Able to document and report learning processes and outcomes systematically." },
  ],
  keterampilan_khusus: [
    { id: "Mampu merancang perangkat pembelajaran (RPP, silabus, bahan ajar) sesuai kurikulum yang berlaku.", en: "Able to design learning tools (lesson plans, syllabi, teaching materials) according to the applicable curriculum." },
    { id: "Mampu mengimplementasikan berbagai model dan strategi pembelajaran inovatif di kelas.", en: "Able to implement various innovative learning models and strategies in the classroom." },
    { id: "Mampu mengembangkan dan menggunakan media pembelajaran yang kreatif dan kontekstual.", en: "Able to develop and use creative and contextual learning media." },
    { id: "Mampu melaksanakan asesmen formatif dan sumatif serta menginterpretasikan hasilnya.", en: "Able to conduct formative and summative assessment and interpret the results." },
    { id: "Mampu mengidentifikasi dan menangani kebutuhan khusus peserta didik di kelas.", en: "Able to identify and address the special needs of students in the classroom." },
    { id: "Mampu mengelola kelas dengan baik dalam kondisi beragam dan menantang.", en: "Able to manage the classroom well under diverse and challenging conditions." },
    { id: "Mampu mengintegrasikan nilai-nilai karakter dan budaya lokal dalam pembelajaran.", en: "Able to integrate character values and local culture in learning." },
    { id: "Mampu memanfaatkan teknologi informasi untuk mendukung proses pembelajaran.", en: "Able to utilize information technology to support the learning process." },
  ],
};

/* ═══════════════════════════════
   6. AGROEKOTEKNOLOGI
═══════════════════════════════ */
const AGR = {
  nama: "Agroekoteknologi",
  nama_en: "Agroecotechnology",
  gelar: "S.P.",
  gelar_en: "B.Agr.",
  jenjang: "Sarjana (S1) / Bachelor Degree",
  level_kkni: "6",
  akreditasi: "Terakreditasi BAIK — SK BAN-PT",
  lama_studi: "8 Semester",
  konsentrasi: "",
  sikap: SIKAP_UMUM,
  pengetahuan: [
    { id: "Menguasai konsep dasar ilmu pertanian, ekologi, dan agroekosistem secara komprehensif.", en: "Mastering the basic concepts of agricultural science, ecology, and agroecosystems comprehensively." },
    { id: "Memahami prinsip budidaya tanaman pangan, hortikultura, dan perkebunan.", en: "Understanding the principles of cultivating food crops, horticulture, and plantation crops." },
    { id: "Menguasai konsep ilmu tanah, kesuburan tanah, dan manajemen lahan pertanian.", en: "Mastering soil science concepts, soil fertility, and agricultural land management." },
    { id: "Memahami prinsip perlindungan tanaman, pengendalian hama dan penyakit secara terpadu.", en: "Understanding plant protection principles and integrated pest and disease management." },
    { id: "Menguasai konsep bioteknologi pertanian dan pemuliaan tanaman.", en: "Mastering agricultural biotechnology and plant breeding concepts." },
    { id: "Memahami prinsip pertanian berkelanjutan, agroforestry, dan konservasi lingkungan.", en: "Understanding sustainable agriculture, agroforestry, and environmental conservation principles." },
    { id: "Menguasai konsep agribisnis, ekonomi pertanian, dan manajemen usaha tani.", en: "Mastering agribusiness, agricultural economics, and farm business management concepts." },
    { id: "Memahami teknologi pasca panen dan pengolahan hasil pertanian.", en: "Understanding post-harvest technology and agricultural product processing." },
  ],
  keterampilan_umum: [
    { id: "Mampu menerapkan pengetahuan sains pertanian untuk memecahkan masalah agronomi di lapangan.", en: "Able to apply agricultural science knowledge to solve agronomic problems in the field." },
    { id: "Mampu bekerja sama dalam tim multidisiplin dalam konteks pertanian dan lingkungan.", en: "Able to collaborate in multidisciplinary teams in the context of agriculture and environment." },
    { id: "Mampu mendokumentasikan dan mengomunikasikan hasil penelitian dan pengamatan pertanian.", en: "Able to document and communicate agricultural research and observation results." },
    { id: "Mampu mengambil keputusan berbasis data lapangan dan analisis ilmiah.", en: "Able to make decisions based on field data and scientific analysis." },
    { id: "Mampu mengidentifikasi dan merespons isu lingkungan terkait praktik pertanian.", en: "Able to identify and respond to environmental issues related to agricultural practices." },
    { id: "Mampu mengelola kegiatan pertanian secara bertanggung jawab dan berkelanjutan.", en: "Able to manage agricultural activities responsibly and sustainably." },
    { id: "Mampu mengembangkan diri secara profesional di bidang pertanian dan agroteknologi.", en: "Able to develop professionally in the fields of agriculture and agrotechnology." },
  ],
  keterampilan_khusus: [
    { id: "Mampu merancang dan melaksanakan program budidaya tanaman yang efisien dan berkelanjutan.", en: "Able to design and implement efficient and sustainable crop cultivation programs." },
    { id: "Mampu melakukan analisis kesuburan tanah dan menyusun rekomendasi pemupukan.", en: "Able to conduct soil fertility analysis and develop fertilization recommendations." },
    { id: "Mampu mengidentifikasi, mendiagnosis, dan mengendalikan hama dan penyakit tanaman secara terpadu.", en: "Able to identify, diagnose, and control plant pests and diseases in an integrated manner." },
    { id: "Mampu merancang sistem irigasi sederhana dan manajemen air untuk pertanian.", en: "Able to design simple irrigation systems and water management for agriculture." },
    { id: "Mampu menerapkan teknologi bioteknologi dalam pemuliaan dan produksi tanaman.", en: "Able to apply biotechnology in plant breeding and production." },
    { id: "Mampu menyusun analisis usaha tani dan rencana agribisnis yang layak.", en: "Able to compile farm business analysis and viable agribusiness plans." },
    { id: "Mampu merancang sistem pertanian terpadu berbasis kearifan lokal dan ramah lingkungan.", en: "Able to design integrated farming systems based on local wisdom and environmentally friendly practices." },
    { id: "Mampu mengelola pasca panen dan peningkatan nilai tambah produk pertanian.", en: "Able to manage post-harvest and add value to agricultural products." },
  ],
};

/* ─────────────────────────────────────────
   EXPORT
───────────────────────────────────────── */
const TEMPLATES = { TI, SI, MJ, KW, PGSD, AGR };

const PRODI_KEY_MAP = {
  "Teknologi Informasi": "TI",
  "Sistem Informasi": "SI",
  "Manajemen": "MJ",
  "Kewirausahaan": "KW",
  "Pendidikan Guru Sekolah Dasar": "PGSD",
  "Agroekoteknologi": "AGR",
};

export function getProdiTemplate(namaProdi) {
  const key = PRODI_KEY_MAP[namaProdi];
  return key ? TEMPLATES[key] : null;
}

export function getAllTemplates() {
  return TEMPLATES;
}