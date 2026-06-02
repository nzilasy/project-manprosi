import { useEffect, useMemo, useState } from 'react';
import { kendalaWisataService } from '../../services/kendalaWisataService';
import { lahanService } from '../../services/lahanService';
import { laporanService } from '../../services/laporanService';
import './LaporanPotensiPage.css';

const CURRENT_YEAR = new Date().getFullYear();
const PAGE_SIZE = 10;
const LOCAL_STATUS_STORAGE_KEY = 'pengurus_laporan_potensi_status_overrides';

const REPORT_STATUS_OPTIONS = [
  { value: 'belum_diproses', label: 'Belum di Progress' },
  { value: 'diproses', label: 'Sedang di Progress' },
  { value: 'selesai', label: 'Sudah di Progress' },
];

const INDONESIAN_PROVINCES = [
  'aceh',
  'sumatera utara',
  'sumatera barat',
  'riau',
  'kepulauan riau',
  'jambi',
  'sumatera selatan',
  'bengkulu',
  'lampung',
  'kepulauan bangka belitung',
  'banten',
  'dki jakarta',
  'jawa barat',
  'jawa tengah',
  'di yogyakarta',
  'jawa timur',
  'bali',
  'nusa tenggara barat',
  'nusa tenggara timur',
  'kalimantan barat',
  'kalimantan tengah',
  'kalimantan selatan',
  'kalimantan timur',
  'kalimantan utara',
  'sulawesi utara',
  'sulawesi tengah',
  'sulawesi selatan',
  'sulawesi tenggara',
  'gorontalo',
  'sulawesi barat',
  'maluku',
  'maluku utara',
  'papua',
  'papua barat',
  'papua barat daya',
  'papua tengah',
  'papua pegunungan',
  'papua selatan',
];

const CATEGORY_CONFIG = {
  pertanian: {
    label: 'Pertanian',
    color: '#009b63',
    bg: '#e9fbf2',
    summaryLabel: 'Pertanian',
    unit: 'Komoditas',
  },
  peternakan: {
    label: 'Peternakan',
    color: '#ef4b13',
    bg: '#fff4ea',
    summaryLabel: 'Peternakan',
    unit: 'Jenis ternak',
  },
  pariwisata: {
    label: 'Pariwisata',
    color: '#a238ff',
    bg: '#f7edff',
    summaryLabel: 'Pariwisata',
    unit: 'Destinasi',
  },
  lahan_kosong: {
    label: 'Lahan Kosong',
    color: '#1764ff',
    bg: '#edf5ff',
    summaryLabel: 'Lahan Kosong',
    unit: 'Ha',
  },
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
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('id-ID', options).format(Number(value) || 0);
}

function formatAreaLabel(item) {
  const luas = Number(item?.luas);
  const satuan = item?.satuan_luas || 'ha';

  if (!Number.isNaN(luas) && luas > 0) {
    return `${formatNumber(luas, { maximumFractionDigits: 2 })} ${satuan}`;
  }

  const areaHa = Number(item?.area_ha);

  if (!Number.isNaN(areaHa) && areaHa > 0) {
    return `${formatNumber(areaHa, { maximumFractionDigits: 2 })} ha`;
  }

  return '-';
}

function getCoordinate(item, key) {
  if (Array.isArray(item?.position)) {
    const index = key === 'latitude' ? 0 : 1;
    const positionValue = Number(item.position[index]);

    if (Number.isFinite(positionValue)) return positionValue;
  }

  const value = item?.[key] ?? item?.lokasi?.[key] ?? item?.Lokasi?.[key];
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function getCoordinateLabel(item) {
  const latitude = getCoordinate(item, 'latitude');
  const longitude = getCoordinate(item, 'longitude');

  if (latitude === null || longitude === null) return '-';

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function readStoredStatuses() {
  if (typeof localStorage === 'undefined') return {};

  try {
    const storedValue = localStorage.getItem(LOCAL_STATUS_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : {};

    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeStoredStatus(rowId, status) {
  if (typeof localStorage === 'undefined') return;

  const currentStatuses = readStoredStatuses();

  localStorage.setItem(
    LOCAL_STATUS_STORAGE_KEY,
    JSON.stringify({
      ...currentStatuses,
      [rowId]: normalizeReportStatus(status),
    }),
  );
}

function applyStoredStatuses(rows, storedStatuses) {
  return rows.map((row) => {
    const storedStatus = storedStatuses[row.id];

    if (!storedStatus) return row;

    const statusValue = normalizeReportStatus(storedStatus);

    return {
      ...row,
      status: getStatusLabel(statusValue),
      statusValue,
    };
  });
}

function normalizeReportStatus(value) {
  const status = String(value || '').toLowerCase();

  if (
    status === 'belum_diproses' ||
    status.includes('belum') ||
    status.includes('baru') ||
    status.includes('menunggu')
  ) {
    return 'belum_diproses';
  }

  if (status === 'diproses' || status.includes('proses')) {
    return 'diproses';
  }

  if (status === 'selesai' || status.includes('selesai') || status.includes('verifikasi')) {
    return 'selesai';
  }

  return 'belum_diproses';
}

function getStatusLabel(status) {
  return (
    REPORT_STATUS_OPTIONS.find((item) => item.value === status)?.label ||
    'Belum di Progress'
  );
}

function getSourceLabel(row) {
  if (row.sourceLabel) return row.sourceLabel;

  if (row.source === 'laporan') return 'Laporan Petani';
  if (row.source === 'lahan') return 'Data Lahan';
  if (row.source === 'kendala_wisata') return 'Laporan Kendala Wisata';

  return 'Data Contoh';
}

function isCoordinateText(value) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

function getReadableLocation(...values) {
  return values.find((value) => value && !isCoordinateText(value));
}

function cleanLocationText(value, hiddenParts = []) {
  const hiddenKeys = new Set(
    hiddenParts
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean),
  );
  const seen = new Set();
  const parts = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();

      if (hiddenKeys.has(key) || seen.has(key)) return false;

      seen.add(key);
      return true;
    });

  if (!parts.length) return '';

  const provinceParts = parts.filter((part) =>
    INDONESIAN_PROVINCES.includes(part.toLowerCase())
  );
  const firstProvince = provinceParts[0]?.toLowerCase();

  return parts
    .filter((part) => {
      const key = part.toLowerCase();

      return !INDONESIAN_PROVINCES.includes(key) || !firstProvince || key === firstProvince;
    })
    .join(', ');
}

function getYear(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime()) ? CURRENT_YEAR : date.getFullYear();
}

function getLahanLocation(lahan) {
  const lokasi = lahan?.lokasi || lahan?.Lokasi || {};

  return (
    getReadableLocation(
      lahan?.location,
      lahan?.lokasi_lahan,
      lahan?.nama_tempat,
      lahan?.place_name,
      lokasi.nama_lokasi,
      lokasi.nama_desa,
      lokasi.desa_kelurahan,
      lokasi.alamat,
      lokasi.kecamatan,
      lokasi.kabupaten,
      lokasi.kabupaten_kota,
      lahan?.nama_lahan,
      lahan?.name,
    ) ||
    'Lokasi belum diisi'
  );
}

function getWisataLocation(wisata) {
  const lokasi = wisata?.lokasi || wisata?.Lokasi || {};
  const rawLocation = getReadableLocation(
    wisata?.location,
    wisata?.address,
    wisata?.alamat,
    wisata?.nama_tempat,
    wisata?.place_name,
    lokasi.nama_lokasi,
    lokasi.alamat,
    lokasi.desa_kelurahan,
    lokasi.kecamatan,
    lokasi.kabupaten_kota,
    wisata?.nama_wisata,
    wisata?.name,
  );

  return (
    cleanLocationText(rawLocation, [
      wisata?.nama_wisata,
      wisata?.name,
    ]) ||
    'Lokasi belum diisi'
  );
}

function getDisplayLocation(row) {
  return (
    cleanLocationText(row?.location, [
      row?.title,
      String(row?.title || '').replace(/^Laporan Pengunjung\s+/i, ''),
      String(row?.title || '').replace(/^Kendala\s+/i, ''),
    ]) ||
    row?.location ||
    'Lokasi belum diisi'
  );
}

function getReporterName(item, fallback = 'Pengurus Desa') {
  return (
    item?.user?.name ||
    item?.User?.name ||
    item?.user?.nama_user ||
    item?.User?.nama_user ||
    item?.user?.username ||
    item?.User?.username ||
    item?.pelapor ||
    fallback
  );
}

function normalizeCommodity(value) {
  return String(value || '').toLowerCase();
}

function getLahanType(lahan) {
  const commodity =
    lahan?.komoditas?.nama_komoditas ||
    lahan?.Komoditas?.nama_komoditas ||
    lahan?.commodity?.[0] ||
    '';
  const normalized = normalizeCommodity(commodity);

  if (
    lahan?.source_type === 'peternakan' ||
    normalized.includes('ternak') ||
    normalized.includes('sapi') ||
    normalized.includes('kambing') ||
    normalized.includes('ayam')
  ) {
    return 'peternakan';
  }

  if (
    normalized.includes('kosong') ||
    normalized.includes('belum') ||
    String(lahan?.status || '').toLowerCase().includes('non')
  ) {
    return 'lahan_kosong';
  }

  return 'pertanian';
}

function getAreaHa(lahan) {
  const areaHa = Number(lahan?.area_ha);

  if (!Number.isNaN(areaHa) && areaHa > 0) return areaHa;

  const luas = Number(lahan?.luas || 0);
  const unit = String(lahan?.satuan_luas || 'ha').toLowerCase();

  if (unit === 'm2' || unit === 'm²') return luas / 10000;
  return luas;
}

function isUnusedLandReport(item) {
  const status = String(item?.status || '').toLowerCase();
  const catatan = String(item?.catatan || item?.deskripsi || '').toLowerCase();
  const commodity =
    item?.komoditas?.nama_komoditas ||
    item?.Komoditas?.nama_komoditas ||
    item?.commodity?.[0] ||
    '';
  const normalizedCommodity = normalizeCommodity(commodity);

  return (
    catatan.includes('lahan tidak termanfaatkan') ||
    normalizedCommodity.includes('kosong') ||
    status.includes('non') ||
    status.includes('tidak')
  );
}

function mapLaporanRows(laporan) {
  return laporan.map((item) => {
    const lahan = item.lahan || item.Lahan || {};
    const type = getLahanType(lahan);
    const statusValue = normalizeReportStatus(item.status);
    const commodity =
      lahan?.komoditas?.nama_komoditas ||
      lahan?.Komoditas?.nama_komoditas ||
      lahan?.commodity?.[0] ||
      CATEGORY_CONFIG[type].label;

    return {
      id: `laporan-${item.id_laporan || item.id}`,
      source: 'laporan',
      sourceLabel: 'Laporan Potensi',
      sourceId: item.id_laporan || item.id,
      date: item.tanggal || item.created_at,
      type,
      title: item.judul || item.kategori || 'Laporan Potensi Desa',
      location: getLahanLocation(lahan),
      reporter: getReporterName(item, type === 'peternakan' ? 'Peternak' : 'Petani'),
      reporterRole: type === 'peternakan' ? 'Peternak' : 'Petani',
      status: getStatusLabel(statusValue),
      statusValue,
      areaHa: getAreaHa(lahan),
      areaLabel: formatAreaLabel(lahan),
      commodity,
      coordinates: getCoordinateLabel(lahan),
      description:
        item.deskripsi ||
        item.keterangan ||
        item.kategori ||
        lahan?.deskripsi ||
        lahan?.catatan ||
        '-',
      canUpdateStatus: Boolean(item.id_laporan || item.id),
    };
  });
}

function mapLahanRows(lahan) {
  return lahan.map((item) => {
    const type = getLahanType(item);
    const commodity =
      item?.komoditas?.nama_komoditas ||
      item?.Komoditas?.nama_komoditas ||
      item?.commodity?.[0] ||
      CATEGORY_CONFIG[type].label;
    const statusValue = normalizeReportStatus(
      item.status_laporan || item.status_proses || item.status_pelaporan,
    );
    const sourceLabel =
      type === 'lahan_kosong'
        ? 'Laporan Lahan Tidak Termanfaatkan'
        : 'Data Lahan Peta Komoditas';
    const reporterRole = type === 'peternakan' ? 'Peternak' : 'Petani';

    return {
      id: `lahan-${item.id_lahan || item.id || item.id_peternakan || item.name}`,
      source: 'lahan',
      sourceLabel,
      date: item.created_at || item.updated_at || `${CURRENT_YEAR}-01-01`,
      type,
      title:
        type === 'lahan_kosong'
          ? `Usulan Pemanfaatan ${item.nama_lahan || item.name || 'Lahan Kosong'}`
          : `Data Potensi ${item.nama_lahan || item.name || commodity}`,
      location: getLahanLocation(item),
      reporter: getReporterName(item, reporterRole),
      reporterRole,
      statusValue,
      status: getStatusLabel(statusValue),
      areaHa: getAreaHa(item),
      areaLabel: formatAreaLabel(item),
      commodity,
      coordinates: getCoordinateLabel(item),
      description: item.deskripsi || item.catatan || '-',
      canUpdateStatus: true,
    };
  });
}

function mapKendalaWisataRows(kendala) {
  return kendala.map((item) => {
    const wisata = item.wisata || item.Wisata || {};
    const statusValue = normalizeReportStatus(item.status);
    const reporter = getReporterName(item, 'Pengelola Wisata');

    return {
      id: `kendala-wisata-${item.id_kendala_wisata || item.id}`,
      source: 'kendala_wisata',
      sourceLabel: 'Laporan Kendala Wisata',
      sourceId: item.id_kendala_wisata || item.id,
      date: item.tanggal || item.created_at || `${CURRENT_YEAR}-01-01`,
      type: 'pariwisata',
      title: item.judul || `Kendala ${wisata.nama_wisata || wisata.name || 'Wisata'}`,
      location: item.lokasi_kendala || getWisataLocation(wisata),
      reporter,
      reporterRole: 'Pengelola Wisata',
      statusValue,
      status: getStatusLabel(statusValue),
      areaLabel: '-',
      commodity: item.kategori || wisata.jenis_wisata || wisata.category || 'Pariwisata',
      coordinates: getCoordinateLabel(wisata),
      severityLabel: item.tingkat_keparahan || '-',
      description: item.deskripsi || '-',
      canUpdateStatus: Boolean(item.id_kendala_wisata || item.id),
/*  */    };
  });
}

function sortRowsByDate(rows) {
  return [...rows].sort((a, b) => {
    const timeA = new Date(a.date || 0).getTime();
    const timeB = new Date(b.date || 0).getTime();

    return timeB - timeA;
  });
}

function statusClassName(status) {
  const normalized = normalizeReportStatus(status);

  if (normalized === 'selesai') return 'is-complete';
  if (normalized === 'diproses') return 'is-process';
  return 'is-waiting';
}

function ReportIcon({ name }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const icons = {
    filter: (
      <svg {...props}>
        <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
      </svg>
    ),
    more: (
      <svg {...props}>
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
    left: (
      <svg {...props}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    ),
    right: (
      <svg {...props}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function DetailField({ label, value, wide = false }) {
  return (
    <div className={wide ? 'laporan-potensi-detail-field is-wide' : 'laporan-potensi-detail-field'}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function mapInactiveLahanRows(lahanList) {
  return lahanList.map((item) => {
    const commodity =
      item?.komoditas?.nama_komoditas ||
      item?.Komoditas?.nama_komoditas ||
      'Belum ditentukan';
    const ownerName =
      item?.user?.name || item?.User?.name || 'Petani';
    const statusValue = normalizeReportStatus(
      item.status_laporan || item.status_proses || 'belum_diproses',
    );

    return {
      id: `lahan-kosong-${item.id_lahan || item.id}`,
      source: 'lahan',
      sourceLabel: 'Lahan Tidak Termanfaatkan',
      sourceId: item.id_lahan || item.id,
      date: item.updated_at || item.created_at || `${CURRENT_YEAR}-01-01`,
      type: 'lahan_kosong',
      title: item.nama_lahan || 'Lahan Nonaktif',
      location: getLahanLocation(item),
      reporter: ownerName,
      reporterRole: 'Petani',
      statusValue,
      status: getStatusLabel(statusValue),
      areaHa: getAreaHa(item),
      areaLabel: formatAreaLabel(item),
      commodity,
      coordinates: getCoordinateLabel(item),
      description: item.deskripsi || item.catatan || '-',
      canUpdateStatus: true,
    };
  });
}

export default function LaporanPotensiPage() {
  const [rawRows, setRawRows] = useState([]);
  const [filters, setFilters] = useState({
    year: String(CURRENT_YEAR),
    location: 'semua',
    type: 'semua',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState('');
  const [selectedRowId, setSelectedRowId] = useState('');

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      setLoading(true);
      setError('');

      try {
        const [
          laporanResponse,
          kendalaWisataResponse,
          inactiveLahanResponse,
        ] = await Promise.allSettled([
          laporanService.getAll({ limit: 100 }),
          kendalaWisataService.getAll({ limit: 100 }),
          lahanService.getInactive(),
        ]);

        if (!active) return;

        const laporanRows =
          laporanResponse.status === 'fulfilled'
            ? mapLaporanRows(getPayloadArray(laporanResponse.value))
            : [];
        const wisataIssueRows =
          kendalaWisataResponse.status === 'fulfilled'
            ? mapKendalaWisataRows(getPayloadArray(kendalaWisataResponse.value))
            : [];
        const inactiveLahanRows =
          inactiveLahanResponse.status === 'fulfilled'
            ? mapInactiveLahanRows(getPayloadArray(inactiveLahanResponse.value))
            : [];

        const storedStatuses = readStoredStatuses();
        const combinedRows = sortRowsByDate([
          ...laporanRows,
          ...wisataIssueRows,
          ...inactiveLahanRows,
        ]);

        setRawRows(applyStoredStatuses(combinedRows, storedStatuses));

        if (
          laporanResponse.status === 'rejected' &&
          kendalaWisataResponse.status === 'rejected' &&
          inactiveLahanResponse.status === 'rejected'
        ) {
          setError('Data laporan belum tersedia dari server.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  const locationOptions = useMemo(() => {
    return Array.from(new Set(rawRows.map((row) => getDisplayLocation(row)).filter(Boolean)));
  }, [rawRows]);

  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      const matchesYear =
        filters.year === 'semua' ||
        getYear(row.date) === Number(filters.year);
      const matchesLocation =
        filters.location === 'semua' ||
        getDisplayLocation(row) === filters.location;
      const matchesType =
        filters.type === 'semua' || row.type === filters.type;

      return matchesYear && matchesLocation && matchesType;
    });
  }, [filters, rawRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = filteredRows.length ? (safePage - 1) * PAGE_SIZE : 0;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filteredRows.length);
  const visibleRows = filteredRows.slice(pageStart, pageEnd);
  const selectedRow = useMemo(
    () => rawRows.find((row) => row.id === selectedRowId) || null,
    [rawRows, selectedRowId],
  );

  const summary = useMemo(() => {
    const countByType = filteredRows.reduce(
      (total, row) => ({
        ...total,
        [row.type]: (total[row.type] || 0) + 1,
      }),
      {},
    );
    const emptyArea = filteredRows
      .filter((row) => row.type === 'lahan_kosong')
      .reduce((total, row) => total + (Number(row.areaHa) || 0), 0);

    return {
      pertanian: countByType.pertanian || 0,
      peternakan: countByType.peternakan || 0,
      pariwisata: countByType.pariwisata || 0,
      lahan_kosong: emptyArea || countByType.lahan_kosong || 0,
    };
  }, [filteredRows]);

  const handleResetFilter = () => {
    setFilters({ year: String(CURRENT_YEAR), location: 'semua', type: 'semua' });
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const handleStatusChange = async (row, nextStatus) => {
    setUpdatingStatusId(row.id);
    setMessage('');
    setError('');

    try {
      let normalizedStatus = normalizeReportStatus(nextStatus);

      if (row.source === 'laporan' && row.sourceId) {
        const { data } = await laporanService.updateStatus(row.sourceId, nextStatus);
        normalizedStatus = normalizeReportStatus(data?.data?.status || nextStatus);
      } else if (row.source === 'kendala_wisata' && row.sourceId) {
        const { data } = await kendalaWisataService.updateStatus(row.sourceId, nextStatus);
        normalizedStatus = normalizeReportStatus(data?.data?.status || nextStatus);
      } else {
        writeStoredStatus(row.id, normalizedStatus);
      }

      setRawRows((currentRows) =>
        currentRows.map((item) =>
          item.id === row.id
            ? {
                ...item,
                status: getStatusLabel(normalizedStatus),
                statusValue: normalizedStatus,
              }
            : item,
        ),
      );
      setMessage(
        row.source === 'laporan' || row.source === 'kendala_wisata'
          ? 'Status laporan berhasil diperbarui.'
          : 'Status laporan berhasil diperbarui di tampilan ini.',
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui status laporan.');
    } finally {
      setUpdatingStatusId('');
    }
  };

  return (
    <div className="laporan-potensi-page">
      <header className="laporan-potensi-header">
        <h1>Laporan Potensi</h1>
        <p>
          Rekap data potensi desa dari laporan petani, peternak, pengelola wisata,
          dan laporan lahan kosong.
        </p>
      </header>

      {message && <div className="laporan-potensi-message is-success">{message}</div>}
      {error && <div className="laporan-potensi-message is-error">{error}</div>}

      <section className="laporan-potensi-filter-grid">
        <label>
          <span>Tahun</span>
          <select
            value={filters.year}
            onChange={(event) => {
              setFilters((current) => ({ ...current, year: event.target.value }));
              setPage(1);
            }}
          >
            <option value="semua">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
        </label>

        <label>
          <span>Lokasi</span>
          <select
            value={filters.location}
            onChange={(event) => {
              setFilters((current) => ({
                ...current,
                location: event.target.value,
              }));
              setPage(1);
            }}
          >
            <option value="semua">Semua Lokasi</option>
            {locationOptions.map((location) => (
              <option value={location} key={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Jenis Potensi</span>
          <select
            value={filters.type}
            onChange={(event) => {
              setFilters((current) => ({ ...current, type: event.target.value }));
              setPage(1);
            }}
          >
            <option value="semua">Semua</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option value={key} key={key}>
                {config.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handleResetFilter}>
          <ReportIcon name="filter" />
          Reset
        </button>
      </section>

      <section className="laporan-potensi-summary-grid">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const value =
            key === 'lahan_kosong'
              ? `${formatNumber(summary[key], {
                  maximumFractionDigits: 1,
                })} Ha`
              : formatNumber(summary[key]);
          const note =
            key === 'lahan_kosong'
              ? `dari ${Math.max(1, filteredRows.filter((row) => row.type === key).length)} lokasi`
              : `dari ${Math.max(1, locationOptions.length)} lokasi`;

          return (
            <article
              className={`laporan-potensi-summary-card${filters.type === key ? ' is-active' : ''}`}
              key={key}
              onClick={() => {
                const nextType = filters.type === key ? 'semua' : key;
                setFilters((current) => ({ ...current, type: nextType }));
                setPage(1);
              }}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
            >
              <span style={{ backgroundColor: config.bg }} />
              <div>
                <p>{config.summaryLabel}</p>
                <strong>{value}</strong>
                <small>
                  {key === 'lahan_kosong' ? note : `${config.unit} ${note}`}
                </small>
              </div>
            </article>
          );
        })}
      </section>

      <section className="laporan-potensi-table-card">
        <div className="laporan-potensi-table-meta">
          <span>
            Menampilkan {filteredRows.length ? pageStart + 1 : 0} - {pageEnd} dari{' '}
            {filteredRows.length} data
          </span>

          <div className="laporan-potensi-pagination">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => handlePageChange(safePage - 1)}
              aria-label="Halaman sebelumnya"
            >
              <ReportIcon name="left" />
            </button>
            <strong>{safePage}</strong>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => handlePageChange(safePage + 1)}
              aria-label="Halaman berikutnya"
            >
              <ReportIcon name="right" />
            </button>
          </div>
        </div>

        <div className="laporan-potensi-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis Potensi</th>
                <th>Judul Laporan</th>
                <th>Lokasi</th>
                <th>Pelapor</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? (
                visibleRows.map((row) => {
                  const config = CATEGORY_CONFIG[row.type] || CATEGORY_CONFIG.pertanian;

                  return (
                    <tr
                      key={row.id}
                      className="laporan-potensi-clickable-row"
                      onClick={() => setSelectedRowId(row.id)}
                    >
                      <td>{formatDate(row.date)}</td>
                      <td>
                        <span
                          className="laporan-potensi-type"
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td>{row.title}</td>
                      <td>{getDisplayLocation(row)}</td>
                      <td>
                        {row.reporter}
                        <small>({row.reporterRole})</small>
                      </td>
                      <td>
                        <select
                          className={`laporan-potensi-status-select ${statusClassName(
                            row.statusValue,
                          )}`}
                          value={row.statusValue}
                          onClick={(event) => event.stopPropagation()}
                          onMouseDown={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            handleStatusChange(row, event.target.value)
                          }
                          disabled={updatingStatusId === row.id}
                        >
                          {REPORT_STATUS_OPTIONS.map((option) => (
                            <option value={option.value} key={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="laporan-potensi-more"
                          aria-label={`Lihat detail ${row.title}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRowId(row.id);
                          }}
                        >
                          <ReportIcon name="more" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">
                    {loading ? 'Memuat laporan potensi...' : 'Tidak ada laporan yang sesuai filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRow && (
        <div
          className="laporan-potensi-detail-backdrop"
          role="presentation"
          onClick={() => setSelectedRowId('')}
        >
          <section
            className="laporan-potensi-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="laporan-potensi-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="laporan-potensi-detail-close"
              onClick={() => setSelectedRowId('')}
              aria-label="Tutup detail"
            >
              x
            </button>

            <div className="laporan-potensi-detail-heading">
              <span
                style={{
                  backgroundColor:
                    CATEGORY_CONFIG[selectedRow.type]?.bg || CATEGORY_CONFIG.pertanian.bg,
                  color:
                    CATEGORY_CONFIG[selectedRow.type]?.color ||
                    CATEGORY_CONFIG.pertanian.color,
                }}
              >
                {CATEGORY_CONFIG[selectedRow.type]?.label || 'Potensi'}
              </span>
              <h2 id="laporan-potensi-detail-title">{selectedRow.title}</h2>
              <p>{selectedRow.description || '-'}</p>
            </div>

            <div className="laporan-potensi-detail-grid">
              <DetailField label="Sumber Data" value={getSourceLabel(selectedRow)} />
              <DetailField label="Tanggal" value={formatDate(selectedRow.date)} />
              <DetailField label="Status" value={getStatusLabel(selectedRow.statusValue)} />
              <DetailField
                label="Pelapor"
                value={`${selectedRow.reporter || '-'} (${selectedRow.reporterRole || '-'})`}
              />
              <DetailField label="Lokasi" value={getDisplayLocation(selectedRow)} />
              <DetailField
                label="Komoditas / Kategori"
                value={selectedRow.commodity || selectedRow.category || '-'}
              />
              <DetailField label="Luas" value={selectedRow.areaLabel || '-'} />
              <DetailField label="Koordinat" value={selectedRow.coordinates || '-'} />
              {selectedRow.severityLabel && (
                <DetailField label="Tingkat Keparahan" value={selectedRow.severityLabel} />
              )}
              {selectedRow.facilities && (
                <DetailField label="Fasilitas" value={selectedRow.facilities} wide />
              )}
              <DetailField label="Keterangan" value={selectedRow.description || '-'} wide />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
