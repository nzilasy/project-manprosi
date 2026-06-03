import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { lahanService } from '../../services/lahanService';
import { panenService } from '../../services/panenService';
import { laporanService } from '../../services/laporanService';
import './DashboardPage.css';

/* ─── SVG Icon Components ─── */

function DashIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const icons = {
    seedling: (
      <svg {...common}>
        <path d="M7 20h10" />
        <path d="M12 20v-8" />
        <path d="M12 12C12 8 8 4 4 4c0 4 4 8 8 8Z" />
        <path d="M12 12c0-4 4-8 8-8-4 0-8 4-8 8Z" />
      </svg>
    ),
    harvest: (
      <svg {...common}>
        <path d="M3 7v4a1 1 0 0 0 1 1h3" />
        <path d="M7 7v4a1 1 0 0 0 1 1h3" />
        <path d="M11 7v4a1 1 0 0 0 1 1h3" />
        <path d="M15 7v4a1 1 0 0 0 1 1h3" />
        <path d="M19 7v4a1 1 0 0 0 1 1" />
        <path d="M1 21h22" />
        <path d="M5 21v-5" />
        <path d="M9 21v-5" />
        <path d="M13 21v-5" />
        <path d="M17 21v-5" />
      </svg>
    ),
    area: (
      <svg {...common}>
        <path d="M3 6l5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" />
        <path d="M8 4v13" />
        <path d="M16 7v13" />
      </svg>
    ),
    alert: (
      <svg {...common}>
        <path d="M12 3 2 21h20L12 3Z" />
        <path d="M12 9v5" />
        <path d="M12 18h.01" />
      </svg>
    ),
    sparkles: (
      <svg {...common}>
        <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
        <path d="M19 4v4" />
        <path d="M21 6h-4" />
      </svg>
    ),
    grid: (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    alertTriangle: (
      <svg {...common}>
        <path d="M12 3.5 21 19H3L12 3.5Z" />
        <path d="M12 8.5v5" />
        <path d="M12 17h.01" />
      </svg>
    ),
    bot: (
      <svg {...common}>
        <rect x="5" y="8" width="14" height="10" rx="3" />
        <path d="M12 4v4" />
        <path d="M9 13h.01" />
        <path d="M15 13h.01" />
        <path d="M9 18v2" />
        <path d="M15 18v2" />
      </svg>
    ),
    map: (
      <svg {...common}>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    chevronRight: (
      <svg {...common} strokeWidth={2.5}>
        <path d="M9 6l6 6-6 6" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
    lightbulb: (
      <svg {...common}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

/* ─── Helpers ─── */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function getFormattedDate() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function formatArea(value) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

function getAreaInHa(item) {
  const luas = Number(item?.luas || item?.area_ha || 0);
  const satuan = String(item?.satuan_luas || 'ha').toLowerCase();
  if (satuan === 'm2' || satuan === 'm²') return luas / 10000;
  return luas;
}

const FARMING_TIPS = [
  'Lakukan pengecekan pH tanah secara berkala untuk memastikan kesesuaian dengan jenis tanaman yang ditanam.',
  'Gunakan mulsa organik untuk menjaga kelembapan tanah dan menekan pertumbuhan gulma di lahan Anda.',
  'Rotasi tanaman setiap musim tanam dapat membantu menjaga kesuburan tanah secara alami.',
  'Siram tanaman di pagi atau sore hari untuk mengurangi penguapan dan memaksimalkan penyerapan air.',
  'Catat setiap aktivitas pertanian Anda untuk memudahkan analisis produktivitas di kemudian hari.',
  'Pastikan drainase lahan berfungsi baik sebelum memasuki musim hujan untuk mencegah genangan.',
  'Pupuk organik seperti kompos dapat meningkatkan struktur tanah dan kandungan nutrisi secara berkelanjutan.',
];

/* ─── Main Component ─── */

export default function PetaniDashboard() {
  const { user } = useAuth();

  const [lahanData, setLahanData] = useState([]);
  const [panenData, setPanenData] = useState([]);
  const [laporanData, setLaporanData] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Petani';

  const greeting = getGreeting();
  const formattedDate = getFormattedDate();

  /* ── Fetch dashboard data ── */
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [lahanRes, panenRes, laporanRes] = await Promise.allSettled([
          lahanService.getAll(),
          panenService.getAll({ limit: 5 }),
          laporanService.getAll({ limit: 5 }),
        ]);

        if (!active) return;

        if (lahanRes.status === 'fulfilled') {
          const raw = lahanRes.value?.data?.data;
          setLahanData(Array.isArray(raw) ? raw : []);
        }

        if (panenRes.status === 'fulfilled') {
          const raw = panenRes.value?.data?.data;
          setPanenData(Array.isArray(raw) ? raw : []);
        }

        if (laporanRes.status === 'fulfilled') {
          const raw = laporanRes.value?.data?.data;
          setLaporanData(Array.isArray(raw) ? raw : []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, []);

  /* ── Derived summary values ── */
  const summary = useMemo(() => {
    const lahanCount = lahanData.length;
    const totalLuas = lahanData.reduce((acc, item) => acc + getAreaInHa(item), 0);
    const activeLahan = lahanData.filter(
      (item) => (item.status || 'aktif').toLowerCase() === 'aktif',
    ).length;

    let totalCrops = 0;
    let totalLivestock = 0;
    
    panenData.forEach((item) => {
      const amount = Number(item.jumlah || item.hasil_panen || 0);
      const satuan = String(item.satuan || '').toLowerCase();
      
      if (['ekor', 'liter', 'butir'].includes(satuan)) {
        totalLivestock += amount;
      } else {
        if (satuan === 'kg') totalCrops += amount / 1000;
        else if (satuan === 'kwintal') totalCrops += amount / 10;
        else totalCrops += amount; 
      }
    });

    let panenValue = '—';
    let panenNote = 'Belum ada data';
    let panenLabel = 'Total Keseluruhan Panen';

    if (totalCrops > 0 && totalLivestock > 0) {
      panenValue = `${formatArea(totalCrops)} ton`;
      panenNote = `+ ${formatArea(totalLivestock)} unit ternak`;
      panenLabel = 'Total Panen & Ternak';
    } else if (totalLivestock > 0) {
      panenValue = `${formatArea(totalLivestock)}`;
      panenNote = 'Ekor / Liter / Butir';
      panenLabel = 'Total Produksi Ternak';
    } else if (totalCrops > 0) {
      panenValue = `${formatArea(totalCrops)} ton`;
      panenNote = 'Seluruh lahan';
    }

    const kendalaCount = laporanData.filter((item) => {
      const status = String(item.status || '').toLowerCase();
      return !status.includes('selesai');
    }).length;

    const kendalaLabel = kendalaCount > 0
      ? laporanData.find((item) => !String(item.status || '').toLowerCase().includes('selesai'))
          ?.kategori || 'Perlu ditindak'
      : 'Tidak ada';

    return {
      lahanCount: lahanCount || 0,
      lahanNote: lahanCount > 0
        ? activeLahan === lahanCount ? 'Semua aktif' : `${activeLahan} aktif`
        : 'Belum ada data',
      panenLabel,
      panenValue,
      panenNote,
      totalLuas: totalLuas > 0 ? `${formatArea(totalLuas)} ha` : '—',
      luasNote: lahanCount > 0 ? `${lahanCount} lahan terdaftar` : '',
      kendalaCount,
      kendalaLabel,
    };
  }, [lahanData, panenData, laporanData]);

  const summaryCards = [
    {
      label: 'Lahan Terdaftar',
      value: summary.lahanCount,
      note: summary.lahanNote,
      icon: 'seedling',
      tone: 'green',
    },
    {
      label: summary.panenLabel,
      value: summary.panenValue,
      note: summary.panenNote,
      icon: 'harvest',
      tone: 'orange',
    },
    {
      label: 'Total Luas Lahan',
      value: summary.totalLuas,
      note: summary.luasNote,
      icon: 'area',
      tone: 'blue',
    },
    {
      label: 'Kendala Aktif',
      value: summary.kendalaCount,
      note: summary.kendalaLabel,
      icon: 'alert',
      tone: 'red',
    },
  ];

  /* ── Build recent activity from real data ── */
  const recentActivities = useMemo(() => {
    const activities = [];

    panenData.forEach((item) => {
      const lahan = item.lahan || item.Lahan || {};
      activities.push({
        type: 'Panen',
        title: `Panen ${lahan.nama_lahan || item.komoditas || 'tanaman'} dicatat`,
        meta: `${formatArea(item.jumlah || item.hasil_panen || 0)} ton • ${
          item.tanggal_selesai_periode || item.tanggal_panen || item.created_at
            ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(
                new Date(`${String(item.tanggal_selesai_periode || item.tanggal_panen || item.created_at).slice(0, 10)}T00:00:00`),
              )
            : '-'
        }`,
        tone: 'green',
        to: '/petani/panen',
        date: item.tanggal_selesai_periode || item.tanggal_panen || item.created_at || '',
      });
    });

    laporanData.forEach((item) => {
      const lahan = item.lahan || item.Lahan || {};
      activities.push({
        type: 'Kendala',
        title: item.judul || item.kategori || 'Kendala dilaporkan',
        meta: `${lahan.nama_lahan || item.lokasi_kendala || 'Lahan'} • ${
          String(item.status || 'Baru')
        }`,
        tone: 'red',
        to: '/petani/kendala',
        date: item.tanggal || item.created_at || '',
      });
    });

    lahanData.forEach((item) => {
      const komoditas = item?.komoditas?.nama_komoditas || item?.Komoditas?.nama_komoditas || '';
      const isNew = !item.updated_at || item.created_at === item.updated_at;
      activities.push({
        type: 'Lahan',
        title: `${item.nama_lahan || 'Lahan'} ${isNew ? 'ditambahkan' : 'diperbarui'}`,
        meta: `${komoditas || 'Tanaman'}${item.luas ? ` • ${formatArea(getAreaInHa(item))} ha` : ''}`,
        tone: 'blue',
        to: '/petani/lahan',
        date: item.updated_at || item.created_at || '',
      });
    });

    // Sort by date descending and take top 5
    activities.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return activities.slice(0, 5);
  }, [panenData, laporanData, lahanData]);

  /* ── Fallback activities if no data ── */
  const displayActivities = recentActivities.length > 0
    ? recentActivities
    : [
        {
          type: 'Panen',
          title: 'Panen jagung dicatat',
          meta: '4,2 ton • 20 Mei 2026',
          tone: 'green',
          to: '/petani/panen',
        },
        {
          type: 'Kendala',
          title: 'Hama wereng dilaporkan',
          meta: 'Lahan Padi Ciherang • Perlu dipantau',
          tone: 'red',
          to: '/petani/kendala',
        },
        {
          type: 'Lahan',
          title: 'Lahan D-4 diperbarui',
          meta: 'Jagung • 1,2 ha',
          tone: 'blue',
          to: '/petani/lahan',
        },
        {
          type: 'Lokasi',
          title: 'Titik lahan berhasil disimpan',
          meta: 'Koordinat dan batas lahan sudah tersedia',
          tone: 'orange',
          to: '/petani/lahan',
        },
      ];

  const farmerActions = [
    {
      icon: 'grid',
      title: 'Kelola Lahan',
      text: 'Tambah, edit, dan lihat detail lahan Anda',
      tone: 'green',
      to: '/petani/lahan',
    },
    {
      icon: 'alertTriangle',
      title: 'Lapor Kendala',
      text: 'Catat masalah hama, irigasi, atau kondisi lahan',
      tone: 'orange',
      to: '/petani/kendala',
    },
    {
      icon: 'bot',
      title: 'Tanya AI',
      text: 'Tanyakan saran seputar pertanian',
      tone: 'blue',
      to: '/petani/rekomendasi',
    },
    {
      icon: 'map',
      title: 'Lihat Peta',
      text: 'Cek sebaran komoditas dan lahan Anda',
      tone: 'teal',
      to: '/petani/komoditas',
    },
  ];

  /* ── Rotating tip ── */
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * FARMING_TIPS.length),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FARMING_TIPS.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="petani-dashboard">
        <div className="petani-skeleton petani-skeleton-hero" />
        <div className="petani-summary-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="petani-skeleton petani-skeleton-card" key={i} />
          ))}
        </div>
        <div className="petani-dashboard-grid">
          <div className="petani-skeleton petani-skeleton-panel" />
          <div className="petani-skeleton petani-skeleton-panel" />
        </div>
      </div>
    );
  }

  return (
    <div className="petani-dashboard">
      {/* ── Hero ── */}
      <section className="petani-dashboard-hero">
        <div className="petani-hero-content">
          <h1>{greeting}, {userName}! 👋</h1>
          <p>Berikut ringkasan lahan dan aktivitas pertanian milik Anda</p>
          <time>
            <DashIcon name="calendar" />
            {formattedDate}
          </time>
        </div>
        <div className="petani-hero-decoration" aria-hidden="true" />
      </section>

      {/* ── Summary Cards ── */}
      <section className="petani-summary-grid">
        {summaryCards.map((card) => (
          <article className="petani-summary-card" key={card.label}>
            <div className={`petani-summary-icon ${card.tone}`}>
              <DashIcon name={card.icon} />
            </div>

            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>

              {card.note && (
                <span className={`petani-summary-note ${card.tone}`}>
                  {card.note}
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* ── Main Grid ── */}
      <section className="petani-dashboard-grid">
        {/* Activity Timeline */}
        <article className="petani-activity-card">
          <div className="petani-card-heading">
            <div>
              <h2>Aktivitas Terbaru</h2>
              <p>Ringkasan perubahan dari fitur lahan, panen, dan kendala</p>
            </div>
          </div>

          <div className="petani-activity-list">
            {displayActivities.map((activity) => (
              <Link
                className="petani-activity-item"
                key={`${activity.type}-${activity.title}`}
                to={activity.to}
              >
                <span className={`petani-activity-dot ${activity.tone}`} />

                <span className="petani-activity-copy">
                  <strong>{activity.title}</strong>
                  <small>{activity.meta}</small>
                  <span className={`petani-activity-badge ${activity.tone}`}>
                    {activity.type}
                  </span>
                </span>

                <span className="petani-activity-arrow">›</span>
              </Link>
            ))}
          </div>
        </article>

        {/* Quick Actions */}
        <article className="petani-ai-card">
          <div className="petani-ai-header">
            <div className="petani-ai-main-icon">
              <DashIcon name="sparkles" />
            </div>
            <div>
              <h2>Bantuan Petani</h2>
              <p>Akses cepat ke fitur utama</p>
            </div>
          </div>

          <div className="petani-ai-list">
            {farmerActions.map((item) => (
              <Link className="petani-ai-item" key={item.title} to={item.to}>
                <div className={`petani-ai-icon ${item.tone}`}>
                  <DashIcon name={item.icon} />
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>

                <span className="petani-ai-arrow">›</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      {/* ── Tips Widget ── */}
      <section 
        className="petani-tips-card" 
        onClick={() => setTipIndex((prev) => (prev + 1) % FARMING_TIPS.length)}
        style={{ cursor: 'pointer' }}
        title="Klik untuk melihat tips selanjutnya"
      >
        <div className="petani-tips-header">
          <DashIcon name="lightbulb" />
          <h3>Tips Pertanian Hari Ini</h3>
        </div>
        <p className="petani-tips-text">{FARMING_TIPS[tipIndex]}</p>
      </section>
    </div>
  );
}
