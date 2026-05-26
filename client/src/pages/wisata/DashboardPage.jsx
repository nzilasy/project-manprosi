import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { kunjunganWisataService } from '../../services/kunjunganWisataService';
import { wisataService } from '../../services/wisataService';
import './DashboardPage.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80';

const INITIAL_FORM = {
  id_wisata: '',
  tanggal_kunjungan: new Date().toISOString().slice(0, 10),
  jumlah_pengunjung: '',
  asal_pengunjung: '',
  catatan: '',
};

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function formatPercent(value) {
  const number = Number(value) || 0;
  return `${number > 0 ? '+' : ''}${number}%`;
}

function getPercentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function getWisataImage(item) {
  return item?.image || item?.photos?.[0] || item?.foto?.[0] || FALLBACK_IMAGE;
}

function DashboardIcon({ name, size = 20 }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    width: size,
    height: size,
    'aria-hidden': 'true',
  };

  const icons = {
    users: (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    ticket: (
      <svg {...props}>
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    pin: (
      <svg {...props}>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    star: (
      <svg {...props} fill="currentColor" stroke="none">
        <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3Z" />
      </svg>
    ),
    plus: (
      <svg {...props}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function WisataDashboard() {
  const { user } = useAuth();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [summary, setSummary] = useState(null);
  const [wisataList, setWisataList] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Pengelola Wisata';

  const chartData = summary?.chart || [];
  const popularWisata = summary?.wisata_populer || [];

  const currentMonthVisitors = useMemo(() => {
    const monthIndex = new Date().getMonth();
    return chartData[monthIndex]?.pengunjung || 0;
  }, [chartData]);

  const previousMonthVisitors = useMemo(() => {
    const monthIndex = new Date().getMonth();
    return monthIndex > 0 ? chartData[monthIndex - 1]?.pengunjung || 0 : 0;
  }, [chartData]);

  const monthChange = getPercentChange(currentMonthVisitors, previousMonthVisitors);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResponse, wisataResponse] = await Promise.all([
        kunjunganWisataService.getSummary({ tahun: year }),
        wisataService.getAll(),
      ]);

      const nextSummary = summaryResponse.data?.data || null;
      const nextWisata = Array.isArray(wisataResponse.data?.data)
        ? wisataResponse.data.data
        : [];

      setSummary(nextSummary);
      setWisataList(nextWisata);

      if (!form.id_wisata && nextWisata[0]?.id_wisata) {
        setForm((current) => ({
          ...current,
          id_wisata: String(nextWisata[0].id_wisata),
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal memuat dashboard kunjungan wisata.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await kunjunganWisataService.create({
        id_wisata: Number(form.id_wisata),
        tanggal_kunjungan: form.tanggal_kunjungan,
        jumlah_pengunjung: Number(form.jumlah_pengunjung),
        asal_pengunjung: form.asal_pengunjung,
        catatan: form.catatan,
      });

      setMessage('Data kunjungan wisata berhasil disimpan.');
      setForm((current) => ({
        ...INITIAL_FORM,
        id_wisata: current.id_wisata,
      }));
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal menyimpan data kunjungan wisata.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wisata-dashboard">
      <header className="wisata-dashboard-header">
        <h1>Selamat datang, {userName}!</h1>
        <p>Kelola data kunjungan dan kembangkan potensi wisata desa.</p>
      </header>

      {message && <div className="wisata-dashboard-message success">{message}</div>}
      {error && <div className="wisata-dashboard-message error">{error}</div>}

      <section className="wisata-stat-grid">
        <StatCard
          icon="users"
          tone="green"
          label="Total Pengunjung"
          value={formatNumber(summary?.total_pengunjung)}
          note={`${formatPercent(monthChange)} dari bulan lalu`}
        />
        <StatCard
          icon="ticket"
          tone="yellow"
          label="Pengunjung Hari Ini"
          value={formatNumber(summary?.pengunjung_hari_ini)}
          note="berdasarkan laporan hari ini"
        />
        <StatCard
          icon="pin"
          tone="blue"
          label="Wisata Aktif"
          value={formatNumber(summary?.wisata_aktif)}
          note="lokasi wisata"
        />
        <StatCard
          icon="star"
          tone="purple"
          label="Rata-rata Kunjungan"
          value={formatNumber(summary?.rata_rata_kunjungan)}
          note="orang per laporan"
        />
      </section>

      <section className="wisata-dashboard-main">
        <div className="wisata-dashboard-content">
          <article className="wisata-chart-card">
            <div className="wisata-card-header">
              <h2>Riwayat Kunjungan Wisata</h2>
              <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
                {YEAR_OPTIONS.map((item) => (
                  <option value={item} key={item}>
                    Tahun {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="wisata-chart-area">
              {loading ? (
                <div className="wisata-loading-state">Memuat data kunjungan...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e7edf2" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#71839a', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#71839a', fontSize: 11 }} width={38} />
                    <Tooltip
                      formatter={(value) => [`${formatNumber(value)} orang`, 'Pengunjung']}
                      labelStyle={{ color: '#172033', fontWeight: 800 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pengunjung"
                      stroke="#617f73"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 5, fill: '#617f73', strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: '#315f4d' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="wisata-popular-card">
            <div className="wisata-card-header">
              <h2>Wisata Terpopuler</h2>
              <label>
                Urutkan
                <select defaultValue="terbaru">
                  <option value="terbaru">Terbaru</option>
                  <option value="pengunjung">Pengunjung</option>
                </select>
              </label>
            </div>

            <div className="wisata-popular-grid">
              {popularWisata.slice(0, 3).map((item) => (
                <article className="wisata-popular-item" key={item.id_wisata || item.id}>
                  <img src={getWisataImage(item)} alt="" />
                  <div>
                    <span>{item.category || item.jenis_wisata || 'Alam'}</span>
                    <h3>{item.name || item.nama_wisata}</h3>
                    <p>{item.location || 'Lokasi belum diisi'}</p>
                    <strong>{formatNumber(item.total_pengunjung)} pengunjung</strong>
                  </div>
                </article>
              ))}

              <button type="button" className="wisata-view-all-card">
                <DashboardIcon name="plus" size={32} />
                <span>Lihat Semua</span>
              </button>
            </div>
          </article>
        </div>

        <aside className="wisata-report-card">
          <h2>Input Jumlah Pengunjung</h2>
          <p>Catat jumlah pengunjung pada wisata</p>

          <form onSubmit={handleSubmit}>
            <label>
              Pilih Wisata <strong>*</strong>
              <select
                value={form.id_wisata}
                onChange={(event) => handleChange('id_wisata', event.target.value)}
                required
              >
                <option value="">Pilih lokasi wisata</option>
                {wisataList.map((item) => (
                  <option value={item.id_wisata || item.id} key={item.id_wisata || item.id}>
                    {item.nama_wisata || item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tanggal Kunjungan <strong>*</strong>
              <input
                type="date"
                value={form.tanggal_kunjungan}
                onChange={(event) => handleChange('tanggal_kunjungan', event.target.value)}
                required
              />
            </label>

            <label>
              Jumlah Pengunjung <strong>*</strong>
              <div className="wisata-input-with-unit">
                <input
                  type="number"
                  min="0"
                  value={form.jumlah_pengunjung}
                  onChange={(event) => handleChange('jumlah_pengunjung', event.target.value)}
                  placeholder="Masukkan jumlah pengunjung"
                  required
                />
                <span>Orang</span>
              </div>
            </label>

            <label>
              Asal Pengunjung (Opsional)
              <input
                type="text"
                value={form.asal_pengunjung}
                onChange={(event) => handleChange('asal_pengunjung', event.target.value)}
                placeholder="Contoh: Bandung, Jakarta, Cimahi"
              />
            </label>

            <label>
              Catatan (Opsional)
              <textarea
                value={form.catatan}
                onChange={(event) => handleChange('catatan', event.target.value)}
                placeholder="Tambahkan catatan tentang hari ini..."
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

function StatCard({ icon, tone, label, value, note }) {
  return (
    <article className="wisata-stat-card">
      <span className={`wisata-stat-icon ${tone}`}>
        <DashboardIcon name={icon} size={24} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
