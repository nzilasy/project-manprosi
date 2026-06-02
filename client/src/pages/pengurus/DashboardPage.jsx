import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { useAuth } from '../../context/AuthContext';
import { lahanService } from '../../services/lahanService';
import { laporanService } from '../../services/laporanService';
import './DashboardPage.css';

const DEFAULT_CENTER = [-6.9175, 107.6191];
const DEFAULT_MAP_ZOOM = 13;
const MAX_MAP_ZOOM = 20;
const MAX_NATIVE_TILE_ZOOM = 18;
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';

const COMMODITY_CONFIG = [
  {
    key: 'padi',
    label: 'Padi',
    color: '#2f9e73',
    keywords: ['padi', 'beras'],
  },
  {
    key: 'kopi',
    label: 'Kopi',
    color: '#a4632f',
    keywords: ['kopi'],
  },
  {
    key: 'jagung',
    label: 'Jagung',
    color: '#e7b416',
    keywords: ['jagung'],
  },
  {
    key: 'sayuran',
    label: 'Sayuran',
    color: '#a855f7',
    keywords: ['sayur', 'sayuran', 'cabai', 'tomat', 'kangkung'],
  },
  {
    key: 'peternakan',
    label: 'Peternakan',
    color: '#0f766e',
    keywords: ['peternakan', 'ternak', 'sapi', 'kambing', 'domba', 'ayam'],
  },
];

const FALLBACK_REPORTS = [
  {
    id: 'LP-2024-018',
    lokasi: 'Blok C-Lereng Utara',
    jenis: 'Lahan tidak termanfaatkan',
    luas: '2,35 ha',
    tanggal: '25 Mei 2026',
    status: 'Selesai',
  },
  {
    id: 'LP-2024-029',
    lokasi: 'Blok C-Lereng Utara',
    jenis: 'Lahan tidak termanfaatkan',
    luas: '2,35 ha',
    tanggal: '22 Mei 2026',
    status: 'Sedang Diproses',
  },
  {
    id: 'LP-2024-030',
    lokasi: 'Blok C-Lereng Utara',
    jenis: 'Lahan tidak termanfaatkan',
    luas: '2,35 ha',
    tanggal: '25 Mei 2026',
    status: 'Menunggu Verif',
  },
  {
    id: 'LP-2024-011',
    lokasi: 'Blok C-Lereng Utara',
    jenis: 'Lahan tidak termanfaatkan',
    luas: '2,35 ha',
    tanggal: '25 Mei 2026',
    status: 'Selesai',
  },
  {
    id: 'LP-2024-300',
    lokasi: 'Blok C-Lereng Utara',
    jenis: 'Lahan tidak termanfaatkan',
    luas: '2,35 ha',
    tanggal: '25 Mei 2026',
    status: 'Menunggu Verif',
  },
  {
    id: 'LP-2024-022',
    lokasi: 'Blok C-Lereng Utara',
    jenis: 'Lahan tidak termanfaatkan',
    luas: '2,35 ha',
    tanggal: '25 Mei 2026',
    status: 'Sedang Diproses',
  },
];

function DashboardIcon({ name }) {
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
    tree: (
      <svg {...props}>
        <path d="M12 22v-8" />
        <path d="M8 14c-3.5 0-5-2-5-4.5S5.5 5 8 5c.8-2 2.2-3 4-3s3.2 1 4 3c2.5 0 5 2 5 4.5S19.5 14 16 14H8Z" />
      </svg>
    ),
    report: (
      <svg {...props}>
        <path d="M6 20V8" />
        <path d="M12 20V4" />
        <path d="M18 20v-9" />
        <path d="M4 20h16" />
      </svg>
    ),
    pin: (
      <svg {...props}>
        <path d="M12 21s7-5.2 7-12A7 7 0 0 0 5 9c0 6.8 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    warning: (
      <svg {...props}>
        <path d="M12 3.5 21 19H3L12 3.5Z" />
        <path d="M12 8.5v5" />
        <path d="M12 17h.01" />
      </svg>
    ),
    sparkles: (
      <svg {...props}>
        <path d="M12 3.5 13.7 9l5.3 2-5.3 2L12 18.5 10.3 13 5 11l5.3-2L12 3.5Z" />
        <path d="M19 4v4" />
        <path d="M21 6h-4" />
      </svg>
    ),
    history: (
      <svg {...props}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v6h6" />
      </svg>
    ),
    map: (
      <svg {...props}>
        <path d="m3.5 6 5-2 7 2 5-2v14l-5 2-7-2-5 2V6Z" />
        <path d="M8.5 4v14" />
        <path d="M15.5 6v14" />
      </svg>
    ),
  };

  return icons[name] || icons.map;
}

function MapTiles() {
  return (
    <>
      <TileLayer
        attribution={ESRI_ATTRIBUTION}
        maxNativeZoom={MAX_NATIVE_TILE_ZOOM}
        maxZoom={MAX_MAP_ZOOM}
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution="Labels &copy; OpenStreetMap contributors &copy; CARTO"
        maxNativeZoom={MAX_NATIVE_TILE_ZOOM}
        maxZoom={MAX_MAP_ZOOM}
        subdomains={['a', 'b', 'c', 'd']}
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
      />
    </>
  );
}

function getKomoditasText(item) {
  return (
    item?.komoditas?.nama_komoditas ||
    item?.Komoditas?.nama_komoditas ||
    item?.commodity?.[0] ||
    'Tidak Diketahui'
  );
}

function isCoordinateText(value) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

function getReadableValue(...values) {
  return values.find((v) => v && !isCoordinateText(v));
}

function getLocationText(item) {
  const lokasi = item?.lokasi || item?.Lokasi || {};

  return (
    getReadableValue(
      item?.nama_tempat,
      item?.lokasi_lahan,
      lokasi.nama_lokasi,
      lokasi.nama_desa,
      lokasi.desa_kelurahan,
      lokasi.alamat,
      lokasi.kecamatan,
      lokasi.kabupaten,
      lokasi.kabupaten_kota,
    ) || 'Lokasi belum diisi'
  );
}

function getCoordinate(item, field) {
  const value = item?.[field] || item?.lokasi?.[field] || item?.Lokasi?.[field];
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function getAreaInHa(item) {
  const luas = Number(item?.luas || item?.area_ha || 0);
  const satuan = String(item?.satuan_luas || 'ha').toLowerCase();

  if (satuan === 'm2' || satuan === 'm²') {
    return luas / 10000;
  }

  return luas;
}

function getPolygonPoints(item) {
  const polygon = item?.polygon_lahan;

  if (!polygon) return [];

  let points = polygon;

  if (typeof polygon === 'string') {
    try {
      points = JSON.parse(polygon);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(points)) return [];

  const validPoints = points
    .map((point) => {
      if (Array.isArray(point)) return [Number(point[0]), Number(point[1])];
      return [Number(point?.lat), Number(point?.lng)];
    })
    .filter((point) => !Number.isNaN(point[0]) && !Number.isNaN(point[1]));

  return sortPolygonPoints(validPoints);
}

function sortPolygonPoints(points) {
  if (!Array.isArray(points) || points.length < 3) return points || [];

  const center = points.reduce(
    (total, point) => ({
      lat: total.lat + point[0],
      lng: total.lng + point[1],
    }),
    { lat: 0, lng: 0 },
  );
  const centerLat = center.lat / points.length;
  const centerLng = center.lng / points.length;

  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a[0] - centerLat, a[1] - centerLng);
    const angleB = Math.atan2(b[0] - centerLat, b[1] - centerLng);

    return angleA - angleB;
  });
}

function getLahanPosition(item) {
  const lat = getCoordinate(item, 'latitude');
  const lng = getCoordinate(item, 'longitude');

  if (lat !== null && lng !== null) {
    return [lat, lng];
  }

  const polygon = getPolygonPoints(item);

  if (polygon.length === 0) return null;

  const total = polygon.reduce(
    (accumulator, point) => ({
      lat: accumulator.lat + point[0],
      lng: accumulator.lng + point[1],
    }),
    { lat: 0, lng: 0 },
  );

  return [total.lat / polygon.length, total.lng / polygon.length];
}

function getCommodityConfig(name) {
  const normalized = String(name || '').toLowerCase();

  return (
    COMMODITY_CONFIG.find((item) =>
      item.keywords.some((keyword) => normalized.includes(keyword)),
    ) || null
  );
}

function getRegionValue(item) {
  const location = getLocationText(item);
  if (isCoordinateText(location)) return 'Lokasi belum diisi';
  return location.split(',').slice(0, 2).join(',').trim() || location;
}

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('id-ID', options).format(Number(value) || 0);
}

function formatArea(value) {
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function normalizeStatus(status) {
  const value = String(status || 'baru').toLowerCase();

  if (value.includes('selesai')) return 'Selesai';
  if (value.includes('proses')) return 'Sedang Diproses';
  return 'Menunggu Verif';
}

function statusClassName(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes('selesai')) return 'is-complete';
  if (normalized.includes('proses')) return 'is-process';
  return 'is-waiting';
}

function MapFocus({ items }) {
  const map = useMap();

  useEffect(() => {
    const positions = items.map((item) => item.position).filter(Boolean);

    if (positions.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_MAP_ZOOM);
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 16);
      return;
    }

    map.fitBounds(positions, {
      padding: [35, 35],
      maxZoom: 16,
    });
  }, [items, map]);

  return null;
}

function enrichLahan(item) {
  const commodityName = getKomoditasText(item);
  const commodity = getCommodityConfig(commodityName);

  if (!commodity) return null;

  return {
    ...item,
    areaHa: getAreaInHa(item),
    commodityColor: commodity.color,
    commodityKey: commodity.key,
    commodityName,
    locationText: getLocationText(item),
    polygonPoints: getPolygonPoints(item),
    position: getLahanPosition(item),
    region: getRegionValue(item),
  };
}

function mapReportRows(laporan) {
  if (laporan.length === 0) return FALLBACK_REPORTS;

  return laporan.slice(0, 6).map((item) => {
    const lahan = item.lahan || item.Lahan || {};
    const luas = lahan.luas ? `${formatArea(getAreaInHa(lahan))} ha` : '-';

    return {
      id: `LP-${String(item.tanggal || item.created_at || '2026').slice(0, 4)}-${String(
        item.id_laporan || item.id || '',
      ).padStart(3, '0')}`,
      lokasi: lahan.nama_lahan || item.lokasi_kendala || '-',
      jenis: item.kategori || item.judul || 'Laporan potensi',
      luas,
      tanggal: formatDate(item.tanggal || item.created_at),
      status: normalizeStatus(item.status),
    };
  });
}

export default function PengurusDashboard() {
  const { user } = useAuth();
  const [lahan, setLahan] = useState([]);
  const [laporan, setLaporan] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('semua');
  const [selectedRegion, setSelectedRegion] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Ahmad Fauzi';

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [lahanResponse, laporanResponse] = await Promise.allSettled([
          lahanService.getAll(),
          laporanService.getAll({ limit: 10 }),
        ]);

        if (!active) return;

        if (lahanResponse.status === 'fulfilled') {
          setLahan(
            Array.isArray(lahanResponse.value.data?.data)
              ? lahanResponse.value.data.data
              : [],
          );
        }

        if (laporanResponse.status === 'fulfilled') {
          setLaporan(
            Array.isArray(laporanResponse.value.data?.data)
              ? laporanResponse.value.data.data
              : [],
          );
        }

        if (
          lahanResponse.status === 'rejected' &&
          laporanResponse.status === 'rejected'
        ) {
          setError('Gagal memuat data dashboard pengurus.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const enrichedLahan = useMemo(() => lahan.map(enrichLahan).filter(Boolean), [lahan]);
  const hasLiveLahan = enrichedLahan.length > 0;

  const commodityOptions = useMemo(() => {
    const keys = new Set(enrichedLahan.map((item) => item.commodityKey));

    return COMMODITY_CONFIG.filter((item) => keys.has(item.key));
  }, [enrichedLahan]);

  const regionOptions = useMemo(() => {
    return Array.from(new Set(enrichedLahan.map((item) => item.region))).filter(
      Boolean,
    );
  }, [enrichedLahan]);

  const filteredLahan = useMemo(() => {
    return enrichedLahan.filter((item) => {
      const matchesCommodity =
        selectedCommodity === 'semua' || item.commodityKey === selectedCommodity;
      const matchesRegion =
        selectedRegion === 'semua' || item.region === selectedRegion;

      return matchesCommodity && matchesRegion;
    });
  }, [enrichedLahan, selectedCommodity, selectedRegion]);

  const totalAreaHa = useMemo(() => {
    return enrichedLahan.reduce((total, item) => total + item.areaHa, 0);
  }, [enrichedLahan]);

  const unoptimizedAreaHa = useMemo(() => {
    return enrichedLahan
      .filter((item) => (item.status || 'aktif') !== 'aktif' || item.areaHa < 1)
      .reduce((total, item) => total + item.areaHa, 0);
  }, [enrichedLahan]);

  const commodityCount = useMemo(() => {
    return new Set(enrichedLahan.map((item) => item.commodityKey)).size;
  }, [enrichedLahan]);

  const reportRows = useMemo(() => mapReportRows(laporan), [laporan]);

  const summaryCards = [
    {
      label: 'Total Lahan Desa',
      value: hasLiveLahan ? `${formatArea(totalAreaHa)} ha` : '1.248 ha',
      note: hasLiveLahan ? `${enrichedLahan.length} lahan terdata` : '100% wilayah desa',
      icon: 'tree',
      tone: 'green',
    },
    {
      label: 'Laporan Petani',
      value: laporan.length || 24,
      note: laporan.length ? 'Data laporan aktual' : '+12% dari bulan lalu',
      icon: 'report',
      tone: 'orange',
    },
    {
      label: 'Komoditas teridentifikasi',
      value: hasLiveLahan ? commodityCount : 8,
      note: 'Jenis komoditas',
      icon: 'pin',
      tone: 'purple',
    },
    {
      label: 'Lahan Belum Optimal',
      value: hasLiveLahan ? `${formatArea(unoptimizedAreaHa)} ha` : '18.45 ha',
      note: 'Perlu tindak lanjut',
      icon: 'warning',
      tone: 'red',
    },
  ];

  return (
    <div className="pengurus-dashboard">
      <section className="pengurus-dashboard-hero">
        <div>
          <h1>Selamat datang, {userName}!</h1>
          <p>Kelola potensi desa dengan mudah dan efektif.</p>
        </div>
      </section>

      {error && <div className="pengurus-message is-error">{error}</div>}

      <section className="pengurus-summary-grid">
        {summaryCards.map((card) => (
          <article className="pengurus-summary-card" key={card.label}>
            <div className={`pengurus-summary-icon ${card.tone}`}>
              <DashboardIcon name={card.icon} />
            </div>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small className={card.tone}>{card.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="pengurus-map-row">
        <div className="pengurus-map-section">
          <div className="pengurus-section-heading">
            <h2>Peta Sebaran Komoditas</h2>
          </div>

          <div className="pengurus-map-filters">
            <label>
              <span>Pilih Komoditas</span>
              <select
                value={selectedCommodity}
                onChange={(event) => setSelectedCommodity(event.target.value)}
              >
                <option value="semua">Semua Komoditas</option>
                {commodityOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Lokasi</span>
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
              >
                <option value="semua">Semua Lokasi</option>
                {regionOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pengurus-map-card">
            <MapContainer
              center={DEFAULT_CENTER}
              className="pengurus-map"
              maxZoom={MAX_MAP_ZOOM}
              scrollWheelZoom
              zoom={DEFAULT_MAP_ZOOM}
            >
              <MapTiles />
              <MapFocus items={filteredLahan} />

              {filteredLahan.map((item) => {
                const key = item.id_lahan || item.id || item.nama_lahan;

                return (
                  <Fragment key={key}>
                    {item.polygonPoints.length >= 3 && (
                      <Polygon
                        pathOptions={{
                          color: item.commodityColor,
                          fillColor: item.commodityColor,
                          fillOpacity: 0.22,
                          weight: 2,
                        }}
                        positions={item.polygonPoints}
                      />
                    )}

                    {item.position && (
                      <CircleMarker
                        center={item.position}
                        pathOptions={{
                          color: '#ffffff',
                          fillColor: item.commodityColor,
                          fillOpacity: 0.95,
                          weight: 2,
                        }}
                        radius={7}
                      >
                        <Popup>
                          <div className="pengurus-map-popup">
                            <h3>{item.nama_lahan || 'Area Potensi'}</h3>
                            <p>{item.commodityName}</p>
                            <dl>
                              <div>
                                <dt>Luas</dt>
                                <dd>{formatArea(item.areaHa)} ha</dd>
                              </div>
                              <div>
                                <dt>Lokasi</dt>
                                <dd>{item.locationText}</dd>
                              </div>
                            </dl>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}
                  </Fragment>
                );
              })}
            </MapContainer>

            <div className="pengurus-map-switch">
              <DashboardIcon name="map" />
              <span>Semua Lahan</span>
            </div>

            <div className="pengurus-map-legend">
              {COMMODITY_CONFIG.map((item) => (
                <span key={item.key}>
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>

            {loading && <div className="pengurus-map-loading">Memuat peta...</div>}
          </div>
        </div>

        <aside className="pengurus-action-card">
          <h2>Aksi Cepat</h2>
          <Link to="/pengurus/rekomendasi" className="pengurus-action-link">
            <span className="pengurus-action-icon green">
              <DashboardIcon name="sparkles" />
            </span>
            <span>
              <strong>Rekomendasi AI</strong>
              <small>Berdasarkan data lahan</small>
            </span>
          </Link>
          <Link to="/pengurus/laporan" className="pengurus-action-link">
            <span className="pengurus-action-icon orange">
              <DashboardIcon name="history" />
            </span>
            <span>
              <strong>Riwayat Laporan</strong>
              <small>Lihat semua laporan yang telah dibuat</small>
            </span>
          </Link>
          <Link to="/pengurus/peta" className="pengurus-action-link">
            <span className="pengurus-action-icon red">
              <DashboardIcon name="map" />
            </span>
            <span>
              <strong>Lihat Peta Komoditas</strong>
              <small>Lihat sebaran komoditas desa</small>
            </span>
          </Link>
        </aside>
      </section>

      <section className="pengurus-report-card">
        <div className="pengurus-report-heading">
          <h2>Laporan Terbaru</h2>
          <Link to="/pengurus/laporan">Lihat Semua</Link>
        </div>

        <div className="pengurus-report-table-wrap">
          <table className="pengurus-report-table">
            <thead>
              <tr>
                <th>ID Laporan</th>
                <th>Lokasi</th>
                <th>Jenis Laporan</th>
                <th>Luas</th>
                <th>Tanggal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.lokasi}</td>
                  <td>{row.jenis}</td>
                  <td>{row.luas}</td>
                  <td>{row.tanggal}</td>
                  <td>
                    <span className={`pengurus-status ${statusClassName(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
