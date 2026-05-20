import { useEffect, useMemo, useRef, useState } from 'react';
import { lahanService } from '../../services/lahanService';
import { komoditasService } from '../../services/komoditasService';
import { panenService } from '../../services/panenService';
import jagungImage from '../../assets/jagung.jpeg';
import kopiImage from '../../assets/kopi.jpeg';
import padiImage from '../../assets/padi.jpeg';
import sayuranImage from '../../assets/sayuran.jpeg';
import './PanenPage.css';

const commodityImages = [
  { keyword: 'jagung', src: jagungImage, className: 'is-jagung' },
  { keyword: 'kopi', src: kopiImage, className: 'is-kopi' },
  { keyword: 'padi', src: padiImage, className: 'is-padi' },
  { keyword: 'sayur', src: sayuranImage, className: 'is-sayuran' },
];

function createDefaultForm() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 10);

  return {
    id_lahan: '',
    id_komoditas: '',
    tanggal_mulai_periode: toInputDate(start),
    tanggal_selesai_periode: toInputDate(today),
    luas_panen: '',
    satuan_luas_panen: 'ha',
    jumlah: '',
    satuan: 'ton',
    kadar_air: '',
    kualitas: 'Premium',
    harga_jual: '',
    keterangan: '',
  };
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
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

function PanenIcon({ name, size = 18 }) {
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
    calendar: (
      <svg {...commonProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18" />
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

export default function PanenPage() {
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef([]);

  const [lahan, setLahan] = useState([]);
  const [komoditas, setKomoditas] = useState([]);
  const [panen, setPanen] = useState([]);
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
        const [lahanResponse, komoditasResponse, panenResponse] =
          await Promise.all([
            lahanService.getAll(),
            komoditasService.getAll(),
            panenService.getAll({ limit: 30 }),
          ]);

        if (!active) return;

        const nextLahan = lahanResponse.data.data || [];
        const nextKomoditas = komoditasResponse.data.data || [];

        setLahan(nextLahan);
        setKomoditas(nextKomoditas);
        setPanen(panenResponse.data.data || []);

        if (nextLahan.length > 0) {
          const firstLahan = nextLahan[0];

          setForm((current) => ({
            ...current,
            id_lahan: current.id_lahan || String(firstLahan.id_lahan),
            id_komoditas:
              current.id_komoditas ||
              (firstLahan.id_komoditas ? String(firstLahan.id_komoditas) : ''),
            luas_panen: current.luas_panen || String(firstLahan.luas || ''),
            satuan_luas_panen:
              current.satuan_luas_panen || firstLahan.satuan_luas || 'ha',
          }));
        }
      } catch (err) {
        if (!active) return;

        setError(
          getApiErrorMessage(
            err,
            'Gagal memuat data lahan dan riwayat panen.',
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
      (item) => String(item.id_komoditas) === String(form.id_komoditas),
    );
  }, [form.id_komoditas, komoditas]);

  const selectedCommodityName =
    selectedKomoditas?.nama_komoditas || getCommodityName(selectedLahan);
  const selectedCommodityImage = getCommodityImage(selectedCommodityName);

  const productivity = useMemo(() => {
    return calculateProductivity(form.jumlah, form.luas_panen);
  }, [form.jumlah, form.luas_panen]);

  const selectedHistory = useMemo(() => {
    if (!form.id_lahan) return panen;

    return panen.filter((item) => {
      const idLahan = item.id_lahan || item.lahan?.id_lahan;
      return String(idLahan) === String(form.id_lahan);
    });
  }, [form.id_lahan, panen]);

  const periodLabel = `${formatShortDate(
    form.tanggal_mulai_periode,
  )} - ${formatShortDate(form.tanggal_selesai_periode)}`;

  const seasonYear =
    form.tanggal_selesai_periode?.slice(0, 4) ||
    form.tanggal_mulai_periode?.slice(0, 4) ||
    new Date().getFullYear();

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
      id_komoditas: nextLahan?.id_komoditas
        ? String(nextLahan.id_komoditas)
        : current.id_komoditas,
      luas_panen:
        nextLahan?.luas !== undefined && nextLahan?.luas !== null
          ? String(nextLahan.luas)
          : current.luas_panen,
      satuan_luas_panen: nextLahan?.satuan_luas || current.satuan_luas_panen,
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
      id_komoditas: firstLahan?.id_komoditas
        ? String(firstLahan.id_komoditas)
        : '',
      luas_panen: firstLahan?.luas ? String(firstLahan.luas) : '',
      satuan_luas_panen: firstLahan?.satuan_luas || 'ha',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.id_lahan) {
      setError('Pilih lahan terlebih dahulu sebelum menyimpan data panen.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        id_lahan: Number(form.id_lahan),
        id_komoditas: form.id_komoditas ? Number(form.id_komoditas) : null,
        tanggal_mulai_periode: form.tanggal_mulai_periode,
        tanggal_selesai_periode: form.tanggal_selesai_periode,
        tanggal_panen: form.tanggal_selesai_periode,
        luas_panen: form.luas_panen,
        satuan_luas_panen: form.satuan_luas_panen,
        jumlah: form.jumlah,
        satuan: form.satuan,
        produktivitas: productivity ? productivity.toFixed(2) : null,
        kadar_air: form.kadar_air,
        kualitas: form.kualitas,
        harga_jual: form.harga_jual,
        foto_panen: photoPreviews.map((item) => item.name),
        keterangan: form.keterangan,
      };

      const { data } = await panenService.create(payload);

      setPanen((current) => [data.data, ...current]);
      setMessage(data.message || 'Data panen berhasil disimpan.');
      resetForm();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data panen.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panen-page-shell">
      <header className="panen-page-header">
        <div>
          <h1>Hasil Panen</h1>
          <p>Laporkan hasil panen Anda per periode panen.</p>
        </div>
      </header>

      {message && <div className="panen-message is-success">{message}</div>}
      {error && <div className="panen-message is-error">{error}</div>}

      <section className="panen-layout-grid">
        <article className="panen-form-card">
          <h2>Form Input Hasil Panen</h2>

          <form onSubmit={handleSubmit}>
            <div className="panen-form-grid">
              <label>
                <span>Pilih Lahan <b>*</b></span>
                <select
                  value={form.id_lahan}
                  onChange={(event) => handleLahanChange(event.target.value)}
                  disabled={loading || lahan.length === 0}
                  required
                >
                  {lahan.length === 0 ? (
                    <option value="">Belum ada lahan</option>
                  ) : (
                    lahan.map((item) => (
                      <option key={item.id_lahan} value={item.id_lahan}>
                        {item.nama_lahan}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                <span>Komoditas <b>*</b></span>
                <select
                  value={form.id_komoditas}
                  onChange={(event) =>
                    handleChange('id_komoditas', event.target.value)
                  }
                  required
                >
                  <option value="">Pilih komoditas</option>
                  {komoditas.map((item) => (
                    <option key={item.id_komoditas} value={item.id_komoditas}>
                      {item.nama_komoditas}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Periode Panen <b>*</b></span>
                <div className="panen-period-input">
                  <input
                    type="date"
                    value={form.tanggal_mulai_periode}
                    onChange={(event) =>
                      handleChange('tanggal_mulai_periode', event.target.value)
                    }
                    required
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={form.tanggal_selesai_periode}
                    onChange={(event) =>
                      handleChange('tanggal_selesai_periode', event.target.value)
                    }
                    required
                  />
                  <PanenIcon name="calendar" />
                </div>
              </label>

              <label>
                <span>Luas Panen <b>*</b></span>
                <div className="panen-addon-input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.luas_panen}
                    onChange={(event) =>
                      handleChange('luas_panen', event.target.value)
                    }
                    required
                  />
                  <select
                    value={form.satuan_luas_panen}
                    onChange={(event) =>
                      handleChange('satuan_luas_panen', event.target.value)
                    }
                  >
                    <option value="ha">ha</option>
                    <option value="m2">m2</option>
                  </select>
                </div>
              </label>

              <label>
                <span>Hasil Panen <b>*</b></span>
                <div className="panen-addon-input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.jumlah}
                    onChange={(event) => handleChange('jumlah', event.target.value)}
                    required
                  />
                  <select
                    value={form.satuan}
                    onChange={(event) => handleChange('satuan', event.target.value)}
                  >
                    <option value="ton">ton</option>
                    <option value="kg">kg</option>
                    <option value="kwintal">kwintal</option>
                  </select>
                </div>
              </label>

              <label>
                <span>Produktivitas</span>
                <input
                  type="text"
                  value={`${formatNumber(productivity)} ${form.satuan}/ha`}
                  readOnly
                />
              </label>

              <label>
                <span>Kadar Air (%)</span>
                <div className="panen-addon-input compact-addon">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.kadar_air}
                    onChange={(event) =>
                      handleChange('kadar_air', event.target.value)
                    }
                  />
                  <span>%</span>
                </div>
              </label>

              <label>
                <span>Kualitas</span>
                <select
                  value={form.kualitas}
                  onChange={(event) => handleChange('kualitas', event.target.value)}
                >
                  <option value="Premium">Premium</option>
                  <option value="Baik">Baik</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Perlu Sortir">Perlu Sortir</option>
                </select>
              </label>

              <label>
                <span>Harga Jual (Opsional)</span>
                <div className="panen-addon-input price-addon">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={form.harga_jual}
                    onChange={(event) =>
                      handleChange('harga_jual', event.target.value)
                    }
                  />
                  <span>Rp/kg</span>
                </div>
              </label>
            </div>

            <label className="panen-wide-field">
              <span>Catatan (Opsional)</span>
              <textarea
                rows="3"
                value={form.keterangan}
                onChange={(event) => handleChange('keterangan', event.target.value)}
                placeholder="Tambahkan catatan mengenai hasil panen ini..."
              />
            </label>

            <div className="panen-photo-field">
              <span>Lampiran Foto (Opsional)</span>

              <div className="panen-photo-list">
                {photoPreviews.map((item) => (
                  <div className="panen-photo-preview" key={item.url}>
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
                    className="panen-photo-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PanenIcon name="upload" size={24} />
                    <span>Tambah Foto</span>
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

            <div className="panen-form-actions">
              <button type="button" className="secondary" onClick={resetForm}>
                Batal
              </button>
              <button type="submit" disabled={saving || lahan.length === 0}>
                {saving ? 'Menyimpan...' : 'Simpan Data Panen'}
              </button>
            </div>
          </form>
        </article>

        <aside className="panen-side-column">
          <article className="panen-summary-card">
            <h2>Ringkasan Lahan</h2>

            {selectedLahan ? (
              <>
                <div className="panen-land-summary">
                  <div className="panen-land-image">
                    {selectedCommodityImage ? (
                      <img
                        src={selectedCommodityImage.src}
                        alt=""
                        className={selectedCommodityImage.className}
                      />
                    ) : (
                      <PanenIcon name="harvest" size={30} />
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
                          ? 'panen-status is-active'
                          : 'panen-status'
                      }
                    >
                      {selectedLahan.status || 'aktif'}
                    </span>
                  </div>
                </div>

                <dl className="panen-detail-list">
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
              <p className="panen-empty-text">
                Buat data lahan terlebih dahulu di menu Kelola Lahan.
              </p>
            )}
          </article>

          <article className="panen-summary-card">
            <h2>
              Ringkasan Panen <span>{periodLabel}</span>
            </h2>

            <div className="panen-metric-grid">
              <MetricCard
                icon="area"
                label="Luas Panen"
                value={`${form.luas_panen || '0'} ${form.satuan_luas_panen}`}
              />
              <MetricCard
                icon="harvest"
                label="Hasil Panen"
                value={`${form.jumlah || '0'} ${form.satuan}`}
              />
              <MetricCard
                icon="chart"
                label="Produktivitas"
                value={`${formatNumber(productivity)} ${form.satuan}/ha`}
              />
              <MetricCard
                icon="water"
                label="Rata-rata Kadar Air"
                value={`${form.kadar_air || '0'}%`}
              />
            </div>
          </article>

          <article className="panen-tip-card">
            <h2>Tips Petani</h2>
            <p>
              Pastikan kadar air gabah saat panen berkisar antara 14-20% untuk
              mendapatkan kualitas terbaik.
            </p>
            <button type="button">Lihat Tips Lainnya</button>
          </article>
        </aside>
      </section>

      <section className="panen-history-card">
        <div className="panen-history-header">
          <div>
            <h2>Riwayat Panen Per Periode</h2>
            <p>{selectedLahan ? selectedLahan.nama_lahan : 'Semua lahan'}</p>
          </div>
          <span>{selectedHistory.length} data</span>
        </div>

        {selectedHistory.length === 0 ? (
          <div className="panen-empty-state">
            Belum ada riwayat panen untuk lahan ini.
          </div>
        ) : (
          <div className="panen-history-list">
            {selectedHistory.map((item) => {
              const historyLahan = item.lahan || item.Lahan || selectedLahan;
              const historyKomoditas =
                item.komoditas?.nama_komoditas ||
                item.Komoditas?.nama_komoditas ||
                getCommodityName(historyLahan);
              const itemProductivity =
                item.produktivitas ||
                calculateProductivity(item.jumlah, item.luas_panen);

              return (
                <article className="panen-history-item" key={item.id_panen}>
                  <div>
                    <strong>
                      {historyLahan?.nama_lahan || 'Lahan'} - {historyKomoditas}
                    </strong>
                    <p>
                      {formatShortDate(item.tanggal_mulai_periode)} -{' '}
                      {formatShortDate(
                        item.tanggal_selesai_periode || item.tanggal_panen,
                      )}
                    </p>
                  </div>
                  <span>
                    {formatNumber(item.luas_panen)}{' '}
                    {item.satuan_luas_panen || 'ha'}
                  </span>
                  <span>
                    {formatNumber(item.jumlah)} {item.satuan || 'ton'}
                  </span>
                  <span>
                    {formatNumber(itemProductivity)} {item.satuan || 'ton'}/ha
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="panen-metric-card">
      <span>
        <PanenIcon name={icon} size={20} />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
