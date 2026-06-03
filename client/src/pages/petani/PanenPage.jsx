import { useEffect, useMemo, useRef, useState } from 'react';
import { lahanService } from '../../services/lahanService';
import { komoditasService } from '../../services/komoditasService';
import { panenService } from '../../services/panenService';
import jagungImage from '../../assets/jagung.jpeg';
import kopiImage from '../../assets/kopi.jpeg';
import padiImage from '../../assets/padi.jpeg';
import peternakanImage from '../../assets/peternakan.jpeg';
import sayuranImage from '../../assets/sayuran.jpeg';
import './PanenPage.css';

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

const FARM_HARVEST_UNITS = ['ton', 'kg', 'kwintal'];
const LIVESTOCK_HARVEST_UNITS = ['ekor', 'kg', 'liter', 'butir'];
const LIVESTOCK_TYPES = [
  'Sapi',
  'Kambing',
  'Domba',
  'Ayam',
  'Bebek',
  'Ikan/Lele',
  'Lainnya',
];

function createDefaultForm() {
  const today = new Date();

  return {
    id_lahan: '',
    id_komoditas: '',
    jenis_ternak: '',
    tanggal_mulai_periode: '',
    tanggal_selesai_periode: '',
    luas_panen: '',
    satuan_luas_panen: 'ha',
    jumlah: '',
    satuan: 'ton',
    kadar_air: '',
    kualitas: '',
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

function isCoordinateText(value) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

function getReadableValue(...values) {
  return values.find((v) => v && !isCoordinateText(v));
}

function getLocationText(item) {
  return (
    getReadableValue(
      item?.nama_tempat,
      item?.lokasi_lahan,
      item?.lokasi?.nama_lokasi,
      item?.lokasi?.nama_desa,
      item?.lokasi?.alamat,
      item?.lokasi?.kecamatan,
      item?.lokasi?.kabupaten,
      item?.lokasi?.kabupaten_kota,
    ) || 'Lokasi belum diisi'
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

function isLivestockCommodity(name) {
  const normalizedName = String(name || '').toLowerCase();

  return [
    'peternakan',
    'ternak',
    'sapi',
    'kambing',
    'domba',
    'ayam',
  ].some((keyword) => normalizedName.includes(keyword));
}

function isVegetableCommodity(name) {
  const normalizedName = String(name || '').toLowerCase();
  return ['sayur', 'sayuran', 'hortikultura'].some((keyword) =>
    normalizedName.includes(keyword),
  );
}

function isGrainCommodity(name) {
  const normalizedName = String(name || '').toLowerCase();
  return ['padi', 'gabah', 'beras', 'jagung', 'kedelai', 'kacang', 'kopi', 'kakao', 'gandum'].some((keyword) =>
    normalizedName.includes(keyword),
  );
}

function getHarvestUnitOptions(commodityName) {
  return isLivestockCommodity(commodityName)
    ? LIVESTOCK_HARVEST_UNITS
    : FARM_HARVEST_UNITS;
}

function normalizeHarvestUnit(commodityName, currentUnit) {
  const options = getHarvestUnitOptions(commodityName);
  return options.includes(currentUnit) ? currentUnit : options[0];
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
  const [lahan, setLahan] = useState([]);
  const [komoditas, setKomoditas] = useState([]);
  const [panen, setPanen] = useState([]);
  const [form, setForm] = useState(createDefaultForm);
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

        const nextLahan = (lahanResponse.data.data || []).filter(
          (item) => item.status !== 'nonaktif'
        );
        const nextKomoditas = komoditasResponse.data.data || [];

        setLahan(nextLahan);
        setKomoditas(nextKomoditas);
        setPanen(panenResponse.data.data || []);

        if (nextLahan.length > 0) {
          const firstLahan = nextLahan[0];
          const firstKomoditas = nextKomoditas.find(
            (item) => String(item.id_komoditas) === String(firstLahan.id_komoditas),
          );
          const firstCommodityName =
            firstKomoditas?.nama_komoditas || getCommodityName(firstLahan);

          setForm((current) => ({
            ...current,
            id_lahan: current.id_lahan || String(firstLahan.id_lahan),
            id_komoditas:
              current.id_komoditas ||
              (firstLahan.id_komoditas ? String(firstLahan.id_komoditas) : ''),
            luas_panen: current.luas_panen || String(firstLahan.luas || ''),
            satuan_luas_panen:
              current.satuan_luas_panen || firstLahan.satuan_luas || 'ha',
            satuan: normalizeHarvestUnit(firstCommodityName, current.satuan),
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
  const isLivestockSelected = isLivestockCommodity(selectedCommodityName);
  const isVegetableSelected = isVegetableCommodity(selectedCommodityName);
  const isGrainSelected = isGrainCommodity(selectedCommodityName);
  const harvestLabel = isLivestockSelected ? 'Hasil Produksi' : 'Hasil Panen';
  const productivityLabel = isLivestockSelected
    ? 'Produktivitas Produksi'
    : 'Produktivitas';
  const harvestUnitOptions = getHarvestUnitOptions(selectedCommodityName);

  const productivity = useMemo(() => {
    return calculateProductivity(form.jumlah, form.luas_panen);
  }, [form.jumlah, form.luas_panen]);

  const estimasiBeratBersih = useMemo(() => {
    if (!isGrainSelected || !form.jumlah || !form.kadar_air) return null;

    const wAwal = Number(form.jumlah);
    const kAwal = Number(form.kadar_air);
    const targetKadarAir = 14; // Standar kering giling/simpan 14%

    if (wAwal <= 0 || kAwal >= 100) return null;

    // Jika sudah kering (<= 14%), berat bersih = berat awal (tidak menyusut lagi)
    if (kAwal <= targetKadarAir) return wAwal;

    // Rumus penyusutan berat berdasarkan kadar air: W2 = W1 * (100 - K1) / (100 - K2)
    const wAkhir = (wAwal * (100 - kAwal)) / (100 - targetKadarAir);
    return wAkhir;
  }, [isGrainSelected, form.jumlah, form.kadar_air]);

  const selectedHistory = useMemo(() => {
    if (!form.id_lahan) return panen;

    return panen.filter((item) => {
      const idLahan = item.id_lahan || item.lahan?.id_lahan;
      return String(idLahan) === String(form.id_lahan);
    });
  }, [form.id_lahan, panen]);

  const periodLabel = [
    form.tanggal_mulai_periode ? formatShortDate(form.tanggal_mulai_periode) : null,
    form.tanggal_selesai_periode ? formatShortDate(form.tanggal_selesai_periode) : null
  ].filter(Boolean).join(' - ');

  const seasonYear =
    form.tanggal_selesai_periode?.slice(0, 4) ||
    form.tanggal_mulai_periode?.slice(0, 4) ||
    new Date().getFullYear();

  const handleChange = (field, value) => {
    setForm((current) => {
      const updates = { [field]: value };

      if (field === 'id_komoditas') {
        const nextName =
          komoditas.find(
            (item) => String(item.id_komoditas) === String(value),
          )?.nama_komoditas || getCommodityName(selectedLahan);

        updates.satuan = normalizeHarvestUnit(nextName, current.satuan);

        const wasLivestock = isLivestockCommodity(
          komoditas.find(
            (item) => String(item.id_komoditas) === String(current.id_komoditas),
          )?.nama_komoditas || '',
        );
        const nowLivestock = isLivestockCommodity(nextName);

        if (wasLivestock !== nowLivestock) {
          updates.kualitas = '';
          updates.jenis_ternak = nowLivestock ? '' : '';
        }
      }

      return { ...current, ...updates };
    });
  };

  const handleLahanChange = (value) => {
    const nextLahan = lahan.find((item) => String(item.id_lahan) === value);
    const nextKomoditasId = nextLahan?.id_komoditas
      ? String(nextLahan.id_komoditas)
      : '';
    const nextCommodityName =
      komoditas.find((item) => String(item.id_komoditas) === nextKomoditasId)
        ?.nama_komoditas || getCommodityName(nextLahan);

    setForm((current) => ({
      ...current,
      id_lahan: value,
      id_komoditas: nextKomoditasId || current.id_komoditas,
      luas_panen:
        nextLahan?.luas !== undefined && nextLahan?.luas !== null
          ? String(nextLahan.luas)
          : current.luas_panen,
      satuan_luas_panen: nextLahan?.satuan_luas || current.satuan_luas_panen,
      satuan: normalizeHarvestUnit(nextCommodityName, current.satuan),
    }));
  };

  const resetForm = () => {
    const nextForm = createDefaultForm();
    const firstLahan = selectedLahan || lahan[0];
    const firstKomoditasId = firstLahan?.id_komoditas
      ? String(firstLahan.id_komoditas)
      : '';
    const firstCommodityName =
      komoditas.find((item) => String(item.id_komoditas) === firstKomoditasId)
        ?.nama_komoditas || getCommodityName(firstLahan);

    setForm({
      ...nextForm,
      id_lahan: firstLahan ? String(firstLahan.id_lahan) : '',
      id_komoditas: firstKomoditasId,
      luas_panen: firstLahan?.luas ? String(firstLahan.luas) : '',
      satuan_luas_panen: firstLahan?.satuan_luas || 'ha',
      satuan: normalizeHarvestUnit(firstCommodityName, nextForm.satuan),
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

    const todayStr = toInputDate(new Date());
    if (
      form.tanggal_mulai_periode < todayStr ||
      (!isLivestockSelected && form.tanggal_selesai_periode < todayStr)
    ) {
      setError('Tanggal panen/produksi tidak boleh di masa lalu.');
      return;
    }

    if (isGrainSelected && !form.kadar_air) {
      setError('Kadar air wajib diisi untuk komoditas biji-bijian (padi, jagung, kedelai, dsb).');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        id_lahan: Number(form.id_lahan),
        id_komoditas: form.id_komoditas ? Number(form.id_komoditas) : null,
        jenis_ternak: form.jenis_ternak || null,
        tanggal_mulai_periode: form.tanggal_mulai_periode,
        tanggal_selesai_periode: isLivestockSelected
          ? form.tanggal_mulai_periode
          : form.tanggal_selesai_periode,
        tanggal_panen: isLivestockSelected
          ? form.tanggal_mulai_periode
          : form.tanggal_selesai_periode,
        luas_panen: form.luas_panen,
        satuan_luas_panen: form.satuan_luas_panen,
        jumlah: form.jumlah,
        satuan: form.satuan,
        produktivitas: productivity ? productivity.toFixed(2) : null,
        kadar_air: form.kadar_air,
        kualitas: form.kualitas,
        harga_jual: form.harga_jual,
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
                <span>Komoditas</span>
                <select
                  value={form.id_komoditas}
                  disabled
                >
                  <option value="">Belum ditentukan</option>
                  {komoditas.map((item) => (
                    <option key={item.id_komoditas} value={item.id_komoditas}>
                      {item.nama_komoditas}
                    </option>
                  ))}
                </select>
              </label>

              {isLivestockSelected && (
                <label>
                  <span>Jenis Ternak <b>*</b></span>
                  <select
                    value={form.jenis_ternak}
                    onChange={(event) =>
                      handleChange('jenis_ternak', event.target.value)
                    }
                    required
                  >
                    <option value="">Pilih jenis ternak</option>
                    {LIVESTOCK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                <span>{isLivestockSelected ? 'Tanggal Produksi' : 'Periode Panen'} <b>*</b></span>
                <div className={`panen-period-input ${isLivestockSelected ? 'is-single-date' : ''}`}>
                  <input
                    type="date"
                    value={form.tanggal_mulai_periode}
                    onChange={(event) => {
                      handleChange('tanggal_mulai_periode', event.target.value);
                      // Jika end date kosong atau sebelum start date, update end date juga
                      if (!form.tanggal_selesai_periode || event.target.value > form.tanggal_selesai_periode) {
                        handleChange('tanggal_selesai_periode', event.target.value);
                      }
                    }}
                    required
                  />
                  {!isLivestockSelected && (
                    <>
                      <span>-</span>
                      <input
                        type="date"
                        min={form.tanggal_mulai_periode}
                        value={form.tanggal_selesai_periode}
                        onChange={(event) =>
                          handleChange('tanggal_selesai_periode', event.target.value)
                        }
                        required
                      />
                    </>
                  )}
                  <PanenIcon name="calendar" />
                </div>
              </label>

              {!isLivestockSelected && (
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
              )}

              <label>
                <span>{harvestLabel} <b>*</b></span>
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
                    {harvestUnitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              {!isLivestockSelected && (
                <label>
                  <span>{productivityLabel}</span>
                  <input
                    type="text"
                    value={`${formatNumber(productivity)} ${form.satuan}/ha`}
                    readOnly
                  />
                </label>
              )}

              {!isLivestockSelected && !isVegetableSelected && (
                <label>
                  <span>
                    Kadar Air (%) {isGrainSelected && <b>*</b>}
                    {isGrainSelected && (
                      <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '2px', fontWeight: 'normal' }}>
                        * Rekomendasi gabah/biji: 14-20%
                      </small>
                    )}
                  </span>
                  <div className="panen-addon-input compact-addon">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.kadar_air}
                      onChange={(event) =>
                        handleChange('kadar_air', event.target.value)
                      }
                      required={isGrainSelected}
                    />
                    <span>%</span>
                  </div>
                </label>
              )}

              <label>
                <span>{isLivestockSelected ? 'Kondisi' : 'Kualitas'} <b>*</b></span>
                <select
                  value={form.kualitas}
                  onChange={(event) => handleChange('kualitas', event.target.value)}
                  required
                >
                  {isLivestockSelected ? (
                    <>
                      <option value="" disabled>Pilih Kondisi</option>
                      <option value="Sehat">Sehat</option>
                      <option value="Cukup Sehat">Cukup Sehat</option>
                      <option value="Afkir / Kurang Baik">Afkir / Kurang Baik</option>
                    </>
                  ) : (
                    <>
                      <option value="" disabled>Pilih Kualitas</option>
                      <option value="Premium">Premium</option>
                      <option value="Baik">Baik</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Perlu Sortir">Perlu Sortir</option>
                    </>
                  )}
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
                  <span>Rp/{form.satuan || 'unit'}</span>
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
              {isLivestockSelected ? 'Ringkasan Produksi' : 'Ringkasan Panen'}{' '}
              <span>{periodLabel}</span>
            </h2>

            <div className="panen-metric-grid">
              {!isLivestockSelected && (
                <MetricCard
                  icon="area"
                  label="Luas Panen"
                  value={`${form.luas_panen || '0'} ${form.satuan_luas_panen}`}
                />
              )}
              <MetricCard
                icon="harvest"
                label={harvestLabel}
                value={`${form.jumlah || '0'} ${form.satuan}`}
              />
              {!isLivestockSelected && (
                <MetricCard
                  icon="chart"
                  label={productivityLabel}
                  value={`${formatNumber(productivity)} ${form.satuan}/ha`}
                />
              )}
              {!isLivestockSelected && !isVegetableSelected && (
                <MetricCard
                  icon="water"
                  label="Rata-rata Kadar Air"
                  value={`${form.kadar_air || '0'}%`}
                />
              )}
              {isGrainSelected && estimasiBeratBersih !== null && (
                <MetricCard
                  icon="harvest"
                  label="Estimasi Berat Bersih (Kering)"
                  value={`${formatNumber(estimasiBeratBersih)} ${form.satuan}`}
                />
              )}
            </div>
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
              const historyHarvestLabel = isLivestockCommodity(historyKomoditas)
                ? 'Hasil Produksi'
                : 'Hasil Panen';
              const historyProductivityLabel = isLivestockCommodity(historyKomoditas)
                ? 'Produktivitas Produksi'
                : 'Produktivitas';
              const itemProductivity =
                item.produktivitas ||
                calculateProductivity(item.jumlah, item.luas_panen);

              const historyIsGrain = isGrainCommodity(historyKomoditas);
              let itemEstimasiBersih = null;
              if (historyIsGrain && item.jumlah && item.kadar_air) {
                const wAwal = Number(item.jumlah);
                const kAwal = Number(item.kadar_air);
                if (wAwal > 0 && kAwal < 100) {
                  itemEstimasiBersih =
                    kAwal <= 14 ? wAwal : (wAwal * (100 - kAwal)) / 86; // 100 - 14 = 86
                }
              }

              return (
                <article className="panen-history-item" key={item.id_panen}>
                  <div>
                    <strong>
                      {historyLahan?.nama_lahan || 'Lahan'} - {historyKomoditas}
                      {item.jenis_ternak ? ` (${item.jenis_ternak})` : ''}
                    </strong>
                    <p>
                      {formatShortDate(item.tanggal_mulai_periode)} -{' '}
                      {formatShortDate(
                        item.tanggal_selesai_periode || item.tanggal_panen,
                      )}
                    </p>
                  </div>
                  <dl className="panen-history-metrics">
                    <div>
                      <dt>Luas Panen</dt>
                      <dd>
                        {formatNumber(item.luas_panen)}{' '}
                        {item.satuan_luas_panen || 'ha'}
                      </dd>
                    </div>

                    <div>
                      <dt>{historyHarvestLabel}</dt>
                      <dd>
                        {formatNumber(item.jumlah)} {item.satuan || 'ton'}
                      </dd>
                    </div>

                    <div>
                      <dt>{historyProductivityLabel}</dt>
                      <dd>
                        {formatNumber(itemProductivity)} {item.satuan || 'ton'}/ha
                      </dd>
                    </div>

                    {itemEstimasiBersih !== null && (
                      <div>
                        <dt>Estimasi Bersih</dt>
                        <dd>
                          {formatNumber(itemEstimasiBersih)} {item.satuan || 'ton'}
                        </dd>
                      </div>
                    )}

                    {Number(item.harga_jual) > 0 && (
                      <div>
                        <dt>Pendapatan</dt>
                        <dd>
                          Rp {formatNumber(Number(item.harga_jual) * Number(item.jumlah), 0)}
                        </dd>
                      </div>
                    )}
                  </dl>
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
