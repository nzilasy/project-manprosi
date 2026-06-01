import { useEffect, useMemo, useRef, useState } from 'react';
import { lahanService } from '../../services/lahanService';
import { komoditasService } from '../../services/komoditasService';
import { panenService } from '../../services/panenService';
import { laporanService } from '../../services/laporanService';
import jagungImage from '../../assets/jagung.jpeg';
import kopiImage from '../../assets/kopi.jpeg';
import padiImage from '../../assets/padi.jpeg';
import peternakanImage from '../../assets/peternakan.jpeg';
import sayuranImage from '../../assets/sayuran.jpeg';
import './KendalaPage.css';

const commodityImages = [
  { keyword: 'jagung', src: jagungImage, className: 'is-jagung' },
  { keyword: 'kopi', src: kopiImage, className: 'is-kopi' },
  { keyword: 'padi', src: padiImage, className: 'is-padi' },
  { keyword: 'sayur', src: sayuranImage, className: 'is-sayuran' },
  { keyword: 'peternakan', src: peternakanImage, className: 'is-peternakan' },
  { keyword: 'ternak', src: peternakanImage, className: 'is-peternakan' },
  { keyword: 'sapi', src: peternakanImage, className: 'is-peternakan' },
  { keyword: 'kambing', src: peternakanImage, className: 'is-peternakan' },
  { keyword: 'domba', src: peternakanImage, className: 'is-peternakan' },
  { keyword: 'ayam', src: peternakanImage, className: 'is-peternakan' },
];

const categories = [
  'Hama dan Penyakit',
  'Irigasi',
  'Cuaca Ekstrem',
  'Pupuk dan Nutrisi',
  'Kerusakan Lahan',
  'Lainnya',
];

function createDefaultForm() {
  return {
    id_lahan: '',
    kategori: '',
    tingkat_keparahan: 'tinggi',
    deskripsi: '',
    tanggal: new Date().toISOString().slice(0, 10),
    lokasi_kendala: '',
  };
}

function formatNumber(value, fractionDigits = 2) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isNaN(number) ? 0 : number);
}

function formatShortDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getLocationText(item) {
  return (
    item?.lokasi_lahan ||
    item?.lokasi?.nama_lokasi ||
    item?.lokasi?.nama_desa ||
    item?.lokasi?.alamat ||
    item?.lokasi?.kecamatan ||
    item?.lokasi?.kabupaten ||
    item?.lokasi?.kabupaten_kota ||
    'Lokasi belum diisi'
  );
}

function getCommodityName(item) {
  return (
    item?.komoditas?.nama_komoditas ||
    item?.Komoditas?.nama_komoditas ||
    'Belum dipilih'
  );
}

function getCommodityImage(name) {
  const normalizedName = String(name || '').toLowerCase();

  return commodityImages.find((item) => normalizedName.includes(item.keyword));
}

function calculateProductivity(jumlah, luas) {
  const harvest = Number(jumlah || 0);
  const area = Number(luas || 0);

  if (!harvest || !area) {
    return 0;
  }

  return harvest / area;
}

function getApiErrorMessage(error, fallback) {
  if (!error.response) {
    return 'Gagal terhubung ke server. Pastikan backend berjalan di localhost:5000.';
  }

  return error.response.data?.error || error.response.data?.message || fallback;
}

function KendalaIcon({ name, size = 18 }) {
  const commonProps = {
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
      <svg {...commonProps}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="m10.3 4.2-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.8l-8-14a2 2 0 0 0-3.4 0Z" />
      </svg>
    ),
    calendar: (
      <svg {...commonProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18" />
      </svg>
    ),
    location: (
      <svg {...commonProps}>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    upload: (
      <svg {...commonProps}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M4 20h16" />
      </svg>
    ),
    area: (
      <svg {...commonProps}>
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8v8H8z" />
      </svg>
    ),
    harvest: (
      <svg {...commonProps}>
        <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z" />
        <path d="M5 19c4-5 8-8 14-14" />
      </svg>
    ),
    chart: (
      <svg {...commonProps}>
        <rect x="4" y="10" width="4" height="10" rx="1" />
        <rect x="10" y="5" width="4" height="15" rx="1" />
        <rect x="16" y="13" width="4" height="7" rx="1" />
      </svg>
    ),
    water: (
      <svg {...commonProps}>
        <path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function KendalaPage() {
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef([]);

  const [lahan, setLahan] = useState([]);
  const [komoditas, setKomoditas] = useState([]);
  const [panen, setPanen] = useState([]);
  const [laporan, setLaporan] = useState([]);
  const [form, setForm] = useState(createDefaultForm);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [lahanResponse, komoditasResponse, panenResponse, laporanResponse] =
          await Promise.all([
            lahanService.getAll(),
            komoditasService.getAll(),
            panenService.getAll({ limit: 30 }),
            laporanService.getAll({ limit: 20 }),
          ]);

        if (!active) return;

        const nextLahan = lahanResponse.data.data || [];

        setLahan(nextLahan);
        setKomoditas(komoditasResponse.data.data || []);
        setPanen(panenResponse.data.data || []);
        setLaporan(laporanResponse.data.data || []);

        if (nextLahan.length > 0) {
          const firstLahan = nextLahan[0];

          setForm((current) => ({
            ...current,
            id_lahan: current.id_lahan || String(firstLahan.id_lahan),
            lokasi_kendala:
              current.lokasi_kendala || getLocationText(firstLahan),
          }));
        }
      } catch (err) {
        if (!active) return;

        setError(
          getApiErrorMessage(
            err,
            'Gagal memuat data lahan, panen, dan laporan kendala.',
          ),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const selectedLahan = useMemo(() => {
    return lahan.find((item) => String(item.id_lahan) === String(form.id_lahan));
  }, [form.id_lahan, lahan]);

  const selectedKomoditas = useMemo(() => {
    return komoditas.find(
      (item) => String(item.id_komoditas) === String(selectedLahan?.id_komoditas),
    );
  }, [selectedLahan?.id_komoditas, komoditas]);

  const selectedCommodityName =
    selectedKomoditas?.nama_komoditas || getCommodityName(selectedLahan);
  const selectedCommodityImage = getCommodityImage(selectedCommodityName);

  const latestPanen = useMemo(() => {
    return panen.find((item) => {
      const idLahan = item.id_lahan || item.lahan?.id_lahan;
      return String(idLahan) === String(form.id_lahan);
    });
  }, [form.id_lahan, panen]);

  const productivity =
    latestPanen?.produktivitas ||
    calculateProductivity(latestPanen?.jumlah, latestPanen?.luas_panen);
  const periodLabel = latestPanen
    ? `${formatShortDate(latestPanen.tanggal_mulai_periode)} - ${formatShortDate(
        latestPanen.tanggal_selesai_periode || latestPanen.tanggal_panen,
      )}`
    : 'Periode ini';
  const seasonYear =
    latestPanen?.tanggal_panen?.slice(0, 4) ||
    form.tanggal?.slice(0, 4) ||
    new Date().getFullYear();

  const selectedReports = useMemo(() => {
    return laporan.filter((item) => {
      const idLahan = item.reportable_id || item.lahan?.id_lahan;
      return String(idLahan) === String(form.id_lahan);
    });
  }, [form.id_lahan, laporan]);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLahanChange = (value) => {
    const nextLahan = lahan.find((item) => String(item.id_lahan) === value);

    setForm((current) => ({
      ...current,
      id_lahan: value,
      lokasi_kendala: nextLahan ? getLocationText(nextLahan) : current.lokasi_kendala,
    }));
  };

  const clearPhotos = () => {
    photoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    objectUrlsRef.current = objectUrlsRef.current.filter(
      (url) => !photoPreviews.some((item) => item.url === url),
    );
    setPhotoPreviews([]);
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

  const resetForm = () => {
    const nextForm = createDefaultForm();
    const firstLahan = selectedLahan || lahan[0];

    clearPhotos();

    setForm({
      ...nextForm,
      id_lahan: firstLahan ? String(firstLahan.id_lahan) : '',
      lokasi_kendala: firstLahan ? getLocationText(firstLahan) : '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.id_lahan) {
      setError('Pilih lahan terlebih dahulu sebelum menyimpan laporan.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        id_lahan: Number(form.id_lahan),
        kategori: form.kategori,
        tingkat_keparahan: form.tingkat_keparahan,
        judul: form.deskripsi.slice(0, 140),
        deskripsi: form.deskripsi,
        tanggal: form.tanggal,
        lokasi_kendala: form.lokasi_kendala,
        lampiran: photoPreviews.map((item) => item.name),
      };

      const { data } = await laporanService.create(payload);

      setLaporan((current) => [data.data, ...current]);
      setMessage(data.message || 'Laporan kendala berhasil disimpan.');
      resetForm();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan laporan kendala.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kendala-page-shell">
      <header className="kendala-page-header">
        <div>
          <h1>Lapor Kendala / Permasalahan</h1>
          <p>
            Laporkan kendala atau permasalahan yang Anda hadapi terkait lahan
            pertanian.
          </p>
        </div>
      </header>

      {message && <div className="kendala-message is-success">{message}</div>}
      {error && <div className="kendala-message is-error">{error}</div>}

      <section className="kendala-layout-grid">
        <article className="kendala-form-card">
          <h2>Form Pelaporan Kendala</h2>

          <form onSubmit={handleSubmit}>
            <div className="kendala-form-grid">
              <label>
                <span>
                  Pilih Lahan <b>*</b>
                </span>
                <select
                  value={form.id_lahan}
                  onChange={(event) => handleLahanChange(event.target.value)}
                  disabled={loading || lahan.length === 0}
                  required
                >
                  {lahan.length === 0 ? (
                    <option value="">Belum ada data lahan</option>
                  ) : (
                    lahan.map((item) => (
                      <option key={item.id_lahan} value={item.id_lahan}>
                        {item.nama_lahan} - {getCommodityName(item)}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                <span>
                  Kategori Kendala <b>*</b>
                </span>
                <select
                  value={form.kategori}
                  onChange={(event) => handleChange('kategori', event.target.value)}
                  required
                >
                  <option value="">Pilih kategori kendala</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="kendala-wide-field">
              <span>
                Judul Kendala <b>*</b>
              </span>
              <div className="kendala-textarea-wrap">
                <textarea
                  rows="5"
                  maxLength={1000}
                  value={form.deskripsi}
                  onChange={(event) => handleChange('deskripsi', event.target.value)}
                  placeholder="Jelaskan kendala atau permasalahan yang Anda alami secara detail..."
                  required
                />
                <small>{form.deskripsi.length}/1000</small>
              </div>
            </label>

            <div className="kendala-form-grid">
              <label>
                <span>
                  Tingkat Keparahan <b>*</b>
                </span>
                <div className="kendala-icon-input">
                  <KendalaIcon name="alert" />
                  <select
                    value={form.tingkat_keparahan}
                    onChange={(event) =>
                      handleChange('tingkat_keparahan', event.target.value)
                    }
                    required
                  >
                    <option value="tinggi">Tinggi</option>
                    <option value="sedang">Sedang</option>
                    <option value="rendah">Rendah</option>
                  </select>
                </div>
              </label>

              <label>
                <span>
                  Tanggal Kejadian <b>*</b>
                </span>
                <div className="kendala-icon-input">
                  <KendalaIcon name="calendar" />
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(event) => handleChange('tanggal', event.target.value)}
                    required
                  />
                </div>
              </label>
            </div>

            <label className="kendala-wide-field">
              <span>Lokasi Kendala</span>
              <div className="kendala-icon-input">
                <KendalaIcon name="location" />
                <input
                  type="text"
                  value={form.lokasi_kendala}
                  onChange={(event) =>
                    handleChange('lokasi_kendala', event.target.value)
                  }
                  placeholder="Cihareang, Kec. Cimahi, Kab. Kuningan, Jawa Barat"
                />
              </div>
            </label>

            <div className="kendala-photo-field">
              <span>Lampiran Foto (Opsional)</span>

              <div className="kendala-photo-list">
                {photoPreviews.map((item) => (
                  <div className="kendala-photo-preview" key={item.url}>
                    <img src={item.url} alt="" />
                    <button
                      type="button"
                      onClick={() => removePhoto(item.url)}
                      aria-label="Hapus foto"
                    >
                      x
                    </button>
                  </div>
                ))}

                {photoPreviews.length < 4 && (
                  <button
                    type="button"
                    className="kendala-photo-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <KendalaIcon name="upload" size={26} />
                    Tambah Foto
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                hidden
              />
            </div>

            <div className="kendala-form-actions">
              <button type="button" className="secondary" onClick={resetForm}>
                Batal
              </button>
              <button type="submit" disabled={saving || lahan.length === 0}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </article>

        <aside className="kendala-side-column">
          <article className="kendala-summary-card">
            <h2>Ringkasan Lahan</h2>

            {selectedLahan ? (
              <>
                <div className="kendala-land-summary">
                  <div className="kendala-land-image">
                    {selectedCommodityImage ? (
                      <img
                        src={selectedCommodityImage.src}
                        alt=""
                        className={selectedCommodityImage.className}
                      />
                    ) : (
                      <KendalaIcon name="harvest" size={30} />
                    )}
                  </div>

                  <div>
                    <h3>
                      {selectedLahan.nama_lahan} - {selectedCommodityName}
                    </h3>
                    <p>{getLocationText(selectedLahan)}</p>
                    <span
                      className={
                        selectedLahan.status === 'aktif'
                          ? 'kendala-status is-active'
                          : 'kendala-status'
                      }
                    >
                      {selectedLahan.status || 'aktif'}
                    </span>
                  </div>
                </div>

                <dl className="kendala-detail-list">
                  <div>
                    <dt>Luas Lahan</dt>
                    <dd>
                      {selectedLahan.luas || '-'}{' '}
                      {selectedLahan.satuan_luas || 'ha'}
                    </dd>
                  </div>
                  <div>
                    <dt>Komoditas Utama</dt>
                    <dd>{selectedCommodityName}</dd>
                  </div>
                  <div>
                    <dt>Musim/Tahun</dt>
                    <dd>MT I - {seasonYear}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="kendala-empty-text">
                Buat data lahan terlebih dahulu di menu Kelola Lahan.
              </p>
            )}
          </article>

          <article className="kendala-summary-card">
            <h2>
              Ringkasan Panen <span>{periodLabel}</span>
            </h2>

            <div className="kendala-metric-grid">
              <MetricCard
                icon="area"
                label="Luas Panen"
                value={`${latestPanen?.luas_panen || selectedLahan?.luas || '0'} ${
                  latestPanen?.satuan_luas_panen || selectedLahan?.satuan_luas || 'ha'
                }`}
              />
              <MetricCard
                icon="harvest"
                label="Hasil Panen"
                value={`${latestPanen?.jumlah || '0'} ${latestPanen?.satuan || 'ton'}`}
              />
              <MetricCard
                icon="chart"
                label="Produktivitas"
                value={`${formatNumber(productivity)} ${latestPanen?.satuan || 'ton'}/ha`}
              />
              <MetricCard
                icon="water"
                label="Rata-rata Kadar Air"
                value={`${latestPanen?.kadar_air || '0'}%`}
              />
            </div>
          </article>

          <article className="kendala-summary-card">
            <h2>Riwayat Kendala</h2>
            <div className="kendala-report-list">
              {selectedReports.length === 0 ? (
                <p className="kendala-empty-text">
                  Belum ada laporan kendala untuk lahan ini.
                </p>
              ) : (
                selectedReports.slice(0, 3).map((item) => (
                  <div className="kendala-report-item" key={item.id_laporan}>
                    <strong>{item.kategori || 'Kendala'}</strong>
                    <span>{formatShortDate(item.tanggal)}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="kendala-metric-card">
      <span>
        <KendalaIcon name={icon} size={17} />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
