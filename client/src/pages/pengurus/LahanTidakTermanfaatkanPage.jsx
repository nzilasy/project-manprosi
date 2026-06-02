import { useEffect, useMemo, useState } from 'react';
import { komoditasService } from '../../services/komoditasService';
import { lahanService } from '../../services/lahanService';
import './LahanTidakTermanfaatkanPage.css';

function isCoordinateText(value) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

function getReadableLocation(...values) {
  return values.find((v) => v && !isCoordinateText(v)) || 'Lokasi belum diisi';
}

function getLocationText(item) {
  const lokasi = item.lokasi || item.Lokasi || {};
  return getReadableLocation(
    item.nama_tempat,
    item.lokasi_lahan,
    lokasi.nama_lokasi,
    lokasi.nama_desa,
    lokasi.desa_kelurahan,
    lokasi.alamat,
    lokasi.kecamatan,
    lokasi.kabupaten,
    lokasi.kabupaten_kota,
  );
}

function getCommodityName(item) {
  return (
    item?.komoditas?.nama_komoditas ||
    item?.Komoditas?.nama_komoditas ||
    'Belum ditentukan'
  );
}

function getOwnerName(item) {
  return item?.user?.name || item?.User?.name || 'Tidak diketahui';
}

function getOwnerEmail(item) {
  return item?.user?.email || item?.User?.email || '-';
}

function getOwnerPhone(item) {
  return item?.user?.phone || item?.User?.phone || '-';
}

function getAreaInHa(item) {
  const luas = Number(item?.luas || 0);
  const satuan = String(item?.satuan_luas || 'ha').toLowerCase();
  return satuan === 'm2' || satuan === 'm²' ? luas / 10000 : luas;
}

function formatNumber(value, opts = {}) {
  return new Intl.NumberFormat('id-ID', opts).format(Number(value) || 0);
}

function formatArea(value) {
  return formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
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

function getTimeSince(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Hari ini';
  if (days === 1) return '1 hari lalu';
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} minggu lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  const years = Math.floor(days / 365);
  return `${years} tahun lalu`;
}

function LTTIcon({ name }) {
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
    land: (
      <svg {...common}>
        <path d="M3 6l5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" />
        <path d="M8 4v13" />
        <path d="M16 7v13" />
      </svg>
    ),
    area: (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 3v18" />
      </svg>
    ),
    crop: (
      <svg {...common}>
        <path d="M7 20h10" />
        <path d="M12 20v-8" />
        <path d="M12 12C12 8 8 4 4 4c0 4 4 8 8 8Z" />
        <path d="M12 12c0-4 4-8 8-8-4 0-8 4-8 8Z" />
      </svg>
    ),
    user: (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    pin: (
      <svg {...common}>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    close: (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    ),
    mail: (
      <svg {...common}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 4-10 8L2 4" />
      </svg>
    ),
    phone: (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.07 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11L8.09 9.31a16 16 0 0 0 6.6 6.6l1.14-1.14a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 22 16.92Z" />
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
    info: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function DetailField({ icon, label, value }) {
  return (
    <div className="ltt-detail-field">
      <span className="ltt-detail-field-icon">
        <LTTIcon name={icon} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value || '-'}</strong>
      </div>
    </div>
  );
}

export default function LahanTidakTermanfaatkanPage() {
  const [lahanList, setLahanList] = useState([]);
  const [allCommodities, setAllCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCommodity, setFilterCommodity] = useState('semua');
  const [filterLocation, setFilterLocation] = useState('semua');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [lahanRes, komoditasRes] = await Promise.allSettled([
          lahanService.getInactive(),
          komoditasService.getAll(),
        ]);

        if (!active) return;

        if (lahanRes.status === 'fulfilled') {
          const lahanData = lahanRes.value?.data?.data;
          setLahanList(Array.isArray(lahanData) ? lahanData : []);
        } else {
          setError('Gagal mengambil data lahan nonaktif.');
        }

        if (komoditasRes.status === 'fulfilled') {
          const komData = komoditasRes.value?.data?.data || komoditasRes.value?.data;
          setAllCommodities(Array.isArray(komData) ? komData : []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const enrichedList = useMemo(() => {
    return lahanList.map((item) => ({
      ...item,
      locationText: getLocationText(item),
      commodityName: getCommodityName(item),
      ownerName: getOwnerName(item),
      ownerEmail: getOwnerEmail(item),
      ownerPhone: getOwnerPhone(item),
      areaHa: getAreaInHa(item),
      areaLabel: `${formatArea(getAreaInHa(item))} ha`,
      inactiveSince: getTimeSince(item.updated_at),
      lastPlanting: formatDate(item.tanggal_tanam_terakhir),
    }));
  }, [lahanList]);

  const commodityOptions = useMemo(() => {
    const apiNames = allCommodities.map((c) => c.nama_komoditas).filter(Boolean);
    const dataNames = enrichedList.map((i) => i.commodityName);
    return [...new Set([...apiNames, ...dataNames])].sort();
  }, [allCommodities, enrichedList]);

  const locationOptions = useMemo(() => {
    return [...new Set(enrichedList.map((i) => i.locationText).filter(Boolean))].sort();
  }, [enrichedList]);

  const filtered = useMemo(() => {
    return enrichedList.filter((item) => {
      const matchSearch =
        !search ||
        item.nama_lahan?.toLowerCase().includes(search.toLowerCase()) ||
        item.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
        item.locationText?.toLowerCase().includes(search.toLowerCase());
      const matchCommodity =
        filterCommodity === 'semua' || item.commodityName === filterCommodity;
      const matchLocation =
        filterLocation === 'semua' || item.locationText === filterLocation;
      return matchSearch && matchCommodity && matchLocation;
    });
  }, [enrichedList, search, filterCommodity, filterLocation]);

  const summary = useMemo(() => {
    const totalLuas = enrichedList.reduce((s, i) => s + i.areaHa, 0);
    const commodities = new Set(enrichedList.map((i) => i.commodityName));
    const owners = new Set(enrichedList.map((i) => i.ownerName));
    return {
      total: enrichedList.length,
      totalLuas: formatArea(totalLuas),
      commodities: commodities.size,
      owners: owners.size,
    };
  }, [enrichedList]);

  const selectedItem = useMemo(
    () => enrichedList.find((i) => i.id_lahan === selectedId) || null,
    [enrichedList, selectedId],
  );

  const summaryCards = [
    { icon: 'land', label: 'Total Lahan Nonaktif', value: summary.total, note: 'lahan', tone: 'red' },
    { icon: 'area', label: 'Total Luas', value: `${summary.totalLuas} ha`, note: 'area terdampak', tone: 'orange' },
    { icon: 'crop', label: 'Komoditas Terdampak', value: summary.commodities, note: 'jenis', tone: 'blue' },
    { icon: 'user', label: 'Petani Terdampak', value: summary.owners, note: 'petani', tone: 'teal' },
  ];

  if (loading) {
    return (
      <div className="ltt-page">
        <div className="ltt-skeleton ltt-skeleton-header" />
        <div className="ltt-summary-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="ltt-skeleton ltt-skeleton-card" key={i} />
          ))}
        </div>
        <div className="ltt-skeleton ltt-skeleton-table" />
      </div>
    );
  }

  return (
    <div className="ltt-page">
      {/* Header */}
      <header className="ltt-header">
        <h1>Lahan Tidak Termanfaatkan</h1>
        <p>
          Daftar lahan petani yang berstatus nonaktif dan belum dimanfaatkan secara produktif.
        </p>
      </header>

      {error && <div className="ltt-alert is-error">{error}</div>}

      {/* Summary Cards */}
      <section className="ltt-summary-grid">
        {summaryCards.map((card) => (
          <article className={`ltt-summary-card ${card.tone}`} key={card.label}>
            <div className={`ltt-summary-icon ${card.tone}`}>
              <LTTIcon name={card.icon} />
            </div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </div>
          </article>
        ))}
      </section>

      {/* Filters */}
      <section className="ltt-filter-bar">
        <div className="ltt-search-wrap">
          <LTTIcon name="search" />
          <input
            type="text"
            placeholder="Cari nama lahan, pemilik, atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterCommodity}
          onChange={(e) => setFilterCommodity(e.target.value)}
        >
          <option value="semua">Semua Komoditas</option>
          {commodityOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="semua">Semua Lokasi</option>
          {locationOptions.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </section>

      {/* Table */}
      <section className="ltt-table-card">
        <div className="ltt-table-meta">
          <span>Menampilkan {filtered.length} dari {enrichedList.length} lahan nonaktif</span>
        </div>

        {filtered.length === 0 ? (
          <div className="ltt-empty">
            <LTTIcon name="land" />
            <h3>Tidak ada lahan nonaktif</h3>
            <p>Semua lahan petani saat ini berstatus aktif.</p>
          </div>
        ) : (
          <div className="ltt-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama Lahan</th>
                  <th>Pemilik</th>
                  <th>Komoditas Terakhir</th>
                  <th>Luas</th>
                  <th>Lokasi</th>
                  <th>Nonaktif Sejak</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id_lahan}
                    className="ltt-row"
                    onClick={() => setSelectedId(item.id_lahan)}
                  >
                    <td>
                      <strong>{item.nama_lahan || '-'}</strong>
                    </td>
                    <td>{item.ownerName}</td>
                    <td>
                      <span className="ltt-commodity-badge">
                        {item.commodityName}
                      </span>
                    </td>
                    <td>{item.areaLabel}</td>
                    <td>
                      <span className="ltt-location-text">
                        <LTTIcon name="pin" />
                        {item.locationText}
                      </span>
                    </td>
                    <td>
                      <span className="ltt-time-badge">
                        <LTTIcon name="clock" />
                        {item.inactiveSince}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ltt-detail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(item.id_lahan);
                        }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="ltt-modal-backdrop"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="ltt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="ltt-modal-close"
              onClick={() => setSelectedId(null)}
              type="button"
              aria-label="Tutup"
            >
              <LTTIcon name="close" />
            </button>

            <div className="ltt-modal-header">
              <span className="ltt-status-badge">Nonaktif</span>
              <h2>{selectedItem.nama_lahan || 'Lahan'}</h2>
              <p>{selectedItem.commodityName} • {selectedItem.areaLabel}</p>
            </div>

            <div className="ltt-modal-body">
              <h3>Informasi Lahan</h3>
              <div className="ltt-detail-grid">
                <DetailField icon="land" label="Nama Lahan" value={selectedItem.nama_lahan} />
                <DetailField icon="area" label="Luas Lahan" value={`${selectedItem.luas || '-'} ${selectedItem.satuan_luas || 'ha'}`} />
                <DetailField icon="crop" label="Komoditas Terakhir" value={selectedItem.commodityName} />
                <DetailField icon="pin" label="Lokasi" value={selectedItem.locationText} />
                <DetailField icon="calendar" label="Tanam Terakhir" value={selectedItem.lastPlanting} />
                <DetailField icon="clock" label="Nonaktif Sejak" value={`${formatDate(selectedItem.updated_at)} (${selectedItem.inactiveSince})`} />
              </div>

              <h3>Informasi Pemilik</h3>
              <div className="ltt-detail-grid">
                <DetailField icon="user" label="Nama Petani" value={selectedItem.ownerName} />
                <DetailField icon="mail" label="Email" value={selectedItem.ownerEmail} />
                <DetailField icon="phone" label="Telepon" value={selectedItem.ownerPhone} />
              </div>

              {(selectedItem.catatan || selectedItem.deskripsi) && (
                <>
                  <h3>Catatan</h3>
                  <div className="ltt-detail-notes">
                    <LTTIcon name="info" />
                    <p>{selectedItem.catatan || selectedItem.deskripsi}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
