import { useEffect, useMemo, useRef, useState } from 'react';
import { kendalaWisataService } from '../../services/kendalaWisataService';
import { wisataService } from '../../services/wisataService';
import {
  formatFormValidationMessage,
  getEmptyFieldIssues,
  scrollToPageTop,
} from '../../utils/formValidation';
import './KendalaPage.css';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';

const CATEGORIES = [
  'Akses dan Jalan',
  'Fasilitas Rusak',
  'Kebersihan',
  'Keamanan',
  'Cuaca atau Bencana',
  'Layanan Pengunjung',
  'Lainnya',
];

const SEVERITY_OPTIONS = [
  { value: 'rendah', label: 'Rendah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'tinggi', label: 'Tinggi' },
];

const STATUS_LABELS = {
  belum_diproses: 'Belum Diproses',
  diproses: 'Sedang Diproses',
  selesai: 'Selesai',
};

const INITIAL_FORM = {
  id_wisata: '',
  kategori: '',
  tingkat_keparahan: 'sedang',
  tanggal: new Date().toISOString().slice(0, 10),
  judul: '',
  lokasi_kendala: '',
  deskripsi: '',
};

function getPayloadArray(response) {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();

  if (status === 'selesai' || status.includes('selesai')) return 'selesai';
  if (status === 'belum_diproses' || status.includes('belum') || status.includes('baru')) {
    return 'belum_diproses';
  }
  if (status === 'diproses' || status.includes('proses')) return 'diproses';
  return 'belum_diproses';
}

function getWisataName(item) {
  return item?.nama_wisata || item?.name || 'Lokasi wisata';
}

function getWisataLocation(item) {
  return item?.location || item?.alamat || item?.lokasi?.nama_lokasi || 'Lokasi belum diisi';
}

function getWisataImage(item) {
  if (item?.image) return item.image;
  if (Array.isArray(item?.photos) && item.photos[0]) return item.photos[0];
  if (Array.isArray(item?.foto) && item.foto[0]) return item.foto[0];
  return FALLBACK_IMAGE;
}

function getApiErrorMessage(error, fallback) {
  if (!error.response) {
    return 'Gagal terhubung ke server. Pastikan backend berjalan di localhost:5000.';
  }

  return error.response.data?.message || error.response.data?.error || fallback;
}

function KendalaIcon({ name, size = 20 }) {
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
    alert: (
      <svg {...props}>
        <path d="m10.3 4.2-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.8l-8-14a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
    check: (
      <svg {...props}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
    clock: (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    pin: (
      <svg {...props}>
        <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    ),
    upload: (
      <svg {...props}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    ),
    file: (
      <svg {...props}>
        <path d="M6 3.5h9l3 3V20.5H6z" />
        <path d="M15 3.5v4h4" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </svg>
    ),
  };

  return icons[name] || icons.alert;
}

export default function WisataKendalaPage() {
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef([]);

  const [wisataList, setWisataList] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedWisata = useMemo(
    () => wisataList.find((item) => String(item.id_wisata || item.id) === String(form.id_wisata)),
    [form.id_wisata, wisataList],
  );

  const summary = useMemo(() => {
    return reports.reduce(
      (total, item) => {
        const status = normalizeStatus(item.status);

        return {
          ...total,
          total: total.total + 1,
          [status]: total[status] + 1,
        };
      },
      {
        total: 0,
        belum_diproses: 0,
        diproses: 0,
        selesai: 0,
      },
    );
  }, [reports]);

  const latestReports = useMemo(() => reports.slice(0, 5), [reports]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [wisataResponse, kendalaResponse] = await Promise.all([
        wisataService.getAll(),
        kendalaWisataService.getAll({ limit: 50 }),
      ]);

      const nextWisata = getPayloadArray(wisataResponse);
      const nextReports = getPayloadArray(kendalaResponse);

      setWisataList(nextWisata);
      setReports(nextReports);

      if (!form.id_wisata && nextWisata[0]) {
        setForm((current) => ({
          ...current,
          id_wisata: String(nextWisata[0].id_wisata || nextWisata[0].id),
          lokasi_kendala: current.lokasi_kendala || getWisataLocation(nextWisata[0]),
        }));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat laporan kendala wisata.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleWisataChange = (value) => {
    const nextWisata = wisataList.find((item) => String(item.id_wisata || item.id) === value);

    setForm((current) => ({
      ...current,
      id_wisata: value,
      lokasi_kendala: nextWisata ? getWisataLocation(nextWisata) : current.lokasi_kendala,
    }));
  };

  const clearPhotos = () => {
    photoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    objectUrlsRef.current = objectUrlsRef.current.filter(
      (url) => !photoPreviews.some((item) => item.url === url),
    );
    setPhotoPreviews([]);
  };

  const resetForm = () => {
    const firstWisata = selectedWisata || wisataList[0];

    clearPhotos();
    setMessage('');
    setError('');
    setForm({
      ...INITIAL_FORM,
      id_wisata: firstWisata ? String(firstWisata.id_wisata || firstWisata.id) : '',
      lokasi_kendala: firstWisata ? getWisataLocation(firstWisata) : '',
    });
  };

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = Math.max(0, 4 - photoPreviews.length);
    const nextPhotos = files.slice(0, remainingSlots).map((file) => {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);

      return {
        name: file.name,
        url,
      };
    });

    setPhotoPreviews((current) => [...current, ...nextPhotos]);
    event.target.value = '';
  };

  const removePhoto = (url) => {
    URL.revokeObjectURL(url);
    objectUrlsRef.current = objectUrlsRef.current.filter((item) => item !== url);
    setPhotoPreviews((current) => current.filter((item) => item.url !== url));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const issues = getEmptyFieldIssues([
      { key: 'id_wisata', label: 'Lokasi Wisata', value: form.id_wisata },
      { key: 'kategori', label: 'Kategori Kendala', value: form.kategori },
      { key: 'tingkat_keparahan', label: 'Tingkat Keparahan', value: form.tingkat_keparahan },
      { key: 'tanggal', label: 'Tanggal Kejadian', value: form.tanggal },
      { key: 'judul', label: 'Judul Kendala', value: form.judul },
      { key: 'deskripsi', label: 'Deskripsi Kendala', value: form.deskripsi },
    ]);

    if (issues.length > 0) {
      setError(formatFormValidationMessage(issues));
      scrollToPageTop();
      return;
    }

    setSaving(true);

    try {
      const { data } = await kendalaWisataService.create({
        id_wisata: Number(form.id_wisata),
        kategori: form.kategori,
        tingkat_keparahan: form.tingkat_keparahan,
        tanggal: form.tanggal,
        judul: form.judul,
        lokasi_kendala: form.lokasi_kendala,
        deskripsi: form.deskripsi,
        lampiran: photoPreviews.map((item) => item.name),
      });

      setReports((current) => [data.data, ...current]);
      setMessage(data.message || 'Laporan kendala wisata berhasil disimpan.');
      resetForm();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan laporan kendala wisata.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wisata-kendala-page">
      <header className="wisata-kendala-header">
        <div>
          <span>LAPORAN WISATA</span>
          <h1>Lapor Kendala</h1>
          <p>Catat kendala operasional wisata agar tindak lanjutnya lebih jelas.</p>
        </div>
      </header>

      {message && <div className="wisata-kendala-message success">{message}</div>}

      <section className="wisata-kendala-stat-grid">
        <StatCard icon="file" label="Total Laporan" value={summary.total} />
        <StatCard icon="clock" label="Belum Diproses" value={summary.belum_diproses} tone="warning" />
        <StatCard icon="alert" label="Sedang Diproses" value={summary.diproses} tone="process" />
        <StatCard icon="check" label="Selesai" value={summary.selesai} tone="success" />
      </section>

      <section className="wisata-kendala-layout">
        <article className="wisata-kendala-form-card">
          <div className="wisata-kendala-card-title">
            <h2>Form Laporan Kendala</h2>
            <p>Isi detail kendala dan pilih lokasi wisata terkait.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="wisata-kendala-message error" role="alert">
                {error}
              </div>
            )}
            <div className="wisata-kendala-form-grid">
              <label>
                Pilih Lokasi Wisata <strong>*</strong>
                <select
                  value={form.id_wisata}
                  onChange={(event) => handleWisataChange(event.target.value)}
                  disabled={loading || wisataList.length === 0}
                >
                  <option value="">Pilih lokasi wisata</option>
                  {wisataList.map((item) => {
                    const id = item.id_wisata || item.id;

                    return (
                      <option value={id} key={id}>
                        {getWisataName(item)}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label>
                Kategori Kendala <strong>*</strong>
                <select
                  value={form.kategori}
                  onChange={(event) => handleChange('kategori', event.target.value)}
                >
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tingkat Keparahan <strong>*</strong>
                <select
                  value={form.tingkat_keparahan}
                  onChange={(event) => handleChange('tingkat_keparahan', event.target.value)}
                >
                  {SEVERITY_OPTIONS.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tanggal Kejadian <strong>*</strong>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(event) => handleChange('tanggal', event.target.value)}
                />
              </label>
            </div>

            <label>
              Judul Kendala <strong>*</strong>
              <input
                type="text"
                value={form.judul}
                onChange={(event) => handleChange('judul', event.target.value)}
                placeholder="Contoh: Akses jalan menuju lokasi rusak"
              />
            </label>

            <label>
              Lokasi Spesifik
              <div className="wisata-kendala-icon-input">
                <KendalaIcon name="pin" />
                <input
                  type="text"
                  value={form.lokasi_kendala}
                  onChange={(event) => handleChange('lokasi_kendala', event.target.value)}
                  placeholder="Contoh: Area parkir, gerbang masuk, loket"
                />
              </div>
            </label>

            <label>
              Deskripsi Kendala <strong>*</strong>
              <textarea
                value={form.deskripsi}
                onChange={(event) => handleChange('deskripsi', event.target.value)}
                placeholder="Jelaskan kondisi, dampak, dan kebutuhan tindak lanjut..."
                maxLength={1000}
              />
              <small>{form.deskripsi.length}/1000</small>
            </label>

            <div className="wisata-kendala-photo-field">
              <span>Lampiran Foto (Opsional)</span>
              <div className="wisata-kendala-photo-list">
                {photoPreviews.map((item) => (
                  <div className="wisata-kendala-photo-preview" key={item.url}>
                    <img src={item.url} alt="" />
                    <button type="button" onClick={() => removePhoto(item.url)}>
                      x
                    </button>
                  </div>
                ))}

                {photoPreviews.length < 4 && (
                  <button
                    type="button"
                    className="wisata-kendala-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <KendalaIcon name="upload" />
                    Tambah Foto
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handlePhotoChange}
              />
            </div>

            <div className="wisata-kendala-actions">
              <button type="button" onClick={resetForm}>
                Reset
              </button>
              <button type="submit" disabled={saving || wisataList.length === 0}>
                {saving ? 'Menyimpan...' : 'Simpan Laporan'}
              </button>
            </div>
          </form>
        </article>

        <aside className="wisata-kendala-side">
          <article className="wisata-kendala-wisata-card">
            <h2>Lokasi Terkait</h2>
            {selectedWisata ? (
              <>
                <img src={getWisataImage(selectedWisata)} alt="" />
                <div>
                  <strong>{getWisataName(selectedWisata)}</strong>
                  <span>{selectedWisata.jenis_wisata || selectedWisata.category || 'Alam'}</span>
                  <p>{getWisataLocation(selectedWisata)}</p>
                </div>
              </>
            ) : (
              <p className="wisata-kendala-empty">Belum ada lokasi wisata untuk dipilih.</p>
            )}
          </article>

          <article className="wisata-kendala-history-card">
            <div className="wisata-kendala-history-head">
              <h2>Riwayat Kendala</h2>
              <span>{reports.length} laporan</span>
            </div>

            <div className="wisata-kendala-history-list">
              {loading ? (
                <p className="wisata-kendala-empty">Memuat laporan...</p>
              ) : latestReports.length ? (
                latestReports.map((item) => (
                  <article className="wisata-kendala-report-item" key={item.id_kendala_wisata || item.id}>
                    <div>
                      <strong>{item.judul}</strong>
                      <span>{item.wisata?.nama_wisata || item.wisata?.name || 'Lokasi wisata'}</span>
                      <small>{formatDate(item.tanggal)} - {item.kategori}</small>
                    </div>
                    <em className={`status-${normalizeStatus(item.status)}`}>
                      {STATUS_LABELS[normalizeStatus(item.status)]}
                    </em>
                  </article>
                ))
              ) : (
                <p className="wisata-kendala-empty">Belum ada laporan kendala.</p>
              )}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, tone = 'default' }) {
  return (
    <article className={`wisata-kendala-stat-card ${tone}`}>
      <span>
        <KendalaIcon name={icon} />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}
