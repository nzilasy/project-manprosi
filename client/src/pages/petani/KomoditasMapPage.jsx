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
import { lahanService } from '../../services/lahanService';
import './KomoditasMapPage.css';

const DEFAULT_CENTER = [-6.9175, 107.6191];
const DEFAULT_MAP_ZOOM = 13;
const MAX_NATIVE_TILE_ZOOM = 18;
const MAX_MAP_ZOOM = 20;
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
const INDONESIA_BOUNDS = [
  [-11.2, 94.5],
  [6.5, 141.5],
];

const COMMODITY_FILTERS = [
  {
    key: 'padi',
    label: 'Padi',
    color: '#2f9e73',
    bg: '#e8f7ef',
    keywords: ['padi'],
  },
  {
    key: 'kopi',
    label: 'Kopi',
    color: '#a4632f',
    bg: '#f7efe8',
    keywords: ['kopi'],
  },
  {
    key: 'jagung',
    label: 'Jagung',
    color: '#e7b416',
    bg: '#fff7d6',
    keywords: ['jagung'],
  },
  {
    key: 'sayuran',
    label: 'Sayuran',
    color: '#a855f7',
    bg: '#f4e8ff',
    keywords: ['sayur', 'sayuran'],
  },
  {
    key: 'peternakan',
    label: 'Peternakan',
    color: '#0f766e',
    bg: '#e6f6f2',
    keywords: ['peternakan', 'ternak', 'sapi', 'kambing', 'domba', 'ayam'],
  },
];

const HARVEST_ESTIMATES = {
  padi: {
    minDays: 105,
    maxDays: 120,
    note: 'Estimasi dari tanggal tanam',
  },
  jagung: {
    minDays: 90,
    maxDays: 110,
    note: 'Estimasi dari tanggal tanam',
  },
  sayuran: {
    minDays: 30,
    maxDays: 75,
    note: 'Estimasi dari tanggal tanam',
  },
  kopi: {
    seasonLabel: 'Mei - September',
    note: 'Musim panen utama',
  },
  peternakan: {
    seasonLabel: 'Tidak berbasis musim panen',
    note: 'Komoditas peternakan',
  },
};

function MapTiles() {
  return (
    <>
      <TileLayer
        attribution={ESRI_ATTRIBUTION}
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={MAX_MAP_ZOOM}
        maxNativeZoom={MAX_NATIVE_TILE_ZOOM}
      />

      <TileLayer
        attribution="Labels &copy; OpenStreetMap contributors &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={MAX_MAP_ZOOM}
        maxNativeZoom={MAX_NATIVE_TILE_ZOOM}
      />
    </>
  );
}

function MapIcon({ name, size = 18 }) {
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
    map: (
      <svg {...commonProps}>
        <path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" />
        <path d="M8 4v13" />
        <path d="M16 7v13" />
      </svg>
    ),
    reset: (
      <svg {...commonProps}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v6h6" />
      </svg>
    ),
    padi: (
      <svg {...commonProps}>
        <path d="M12 21V5" />
        <path d="M12 7c-4 1-6 3-6 7 4-1 6-3 6-7Z" />
        <path d="M12 10c4 1 6 3 6 7-4-1-6-3-6-7Z" />
      </svg>
    ),
    kopi: (
      <svg {...commonProps}>
        <path d="M8 19c-3-2-4-6-2-9 2-4 7-5 10-3 3 2 4 6 2 9-2 4-7 5-10 3Z" />
        <path d="M9 18c2-4 3-7 6-10" />
      </svg>
    ),
    jagung: (
      <svg {...commonProps}>
        <path d="M12 21c4-4 6-8 6-12a6 6 0 0 0-12 0c0 4 2 8 6 12Z" />
        <path d="M9 9h6" />
        <path d="M8 13h8" />
      </svg>
    ),
    sayuran: (
      <svg {...commonProps}>
        <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z" />
        <path d="M5 19c4-5 8-8 14-14" />
      </svg>
    ),
    peternakan: (
      <svg {...commonProps}>
        <path d="M5 11.5V19h14v-7.5" />
        <path d="M7 11.5 12 6l5 5.5" />
        <path d="M9 19v-4h6v4" />
        <path d="M4 9.5h16" />
      </svg>
    ),

  };

  return icons[name] || icons.map;
}

function getKomoditasText(item) {
  return (
    item.komoditas?.nama_komoditas ||
    item.Komoditas?.nama_komoditas ||
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
  return (
    getReadableValue(
      item.nama_tempat,
      item.lokasi_lahan,
      item.lokasi?.nama_lokasi,
      item.lokasi?.nama_desa,
      item.lokasi?.alamat,
      item.lokasi?.kecamatan,
      item.lokasi?.kabupaten,
      item.lokasi?.kabupaten_kota,
      item.Lokasi?.nama_lokasi,
      item.Lokasi?.nama_desa,
      item.Lokasi?.alamat,
      item.Lokasi?.kecamatan,
      item.Lokasi?.kabupaten,
      item.Lokasi?.kabupaten_kota,
    ) || 'Lokasi belum diisi'
  );
}

function getCoordinate(item, field) {
  const value = item[field] || item.lokasi?.[field] || item.Lokasi?.[field];
  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function getAreaInHa(item) {
  const luas = Number(item.luas || 0);
  const satuan = String(item.satuan_luas || 'ha').toLowerCase();

  return satuan === 'm2' || satuan === 'm²' ? luas / 10000 : luas;
}

function formatArea(value) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function parseDateValue(value) {
  if (!value) return null;

  const dateText = String(value).slice(0, 10);
  const date = new Date(`${dateText}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return '-';
  if (!startDate) return formatDate(endDate);
  if (!endDate) return formatDate(startDate);

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getHarvestSeason(item, commodityKey) {
  const actualStartDate = parseDateValue(
    item.tanggal_mulai_periode || item.harvest_start,
  );
  const actualEndDate = parseDateValue(
    item.tanggal_selesai_periode ||
    item.tanggal_panen ||
    item.harvest_date,
  );

  if (actualStartDate || actualEndDate) {
    return {
      label: formatDateRange(actualStartDate, actualEndDate),
      note: 'Data panen tercatat',
    };
  }

  const estimate = HARVEST_ESTIMATES[commodityKey];

  if (!estimate) {
    return {
      label: 'Belum tersedia',
      note: 'Data tanggal tanam belum cukup',
    };
  }

  if (estimate.seasonLabel) {
    return {
      label: estimate.seasonLabel,
      note: estimate.note,
    };
  }

  const plantingDate = parseDateValue(
    item.planting_date ||
    item.tanggal_tanam_terakhir ||
    item.tanggal_tanam,
  );

  if (!plantingDate) {
    return {
      label: 'Tanggal tanam belum tersedia',
      note: estimate.note,
    };
  }

  return {
    label: formatDateRange(
      addDays(plantingDate, estimate.minDays),
      addDays(plantingDate, estimate.maxDays),
    ),
    note: estimate.note,
  };
}

function getCommodityConfig(name) {
  const normalizedName = String(name || '').toLowerCase();

  return (
    COMMODITY_FILTERS.find((item) =>
      item.keywords.some((keyword) => normalizedName.includes(keyword)),
    ) || null
  );
}

function getPolygonPoints(item) {
  const polygon = item.polygon_lahan;

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
    .map((point) => [Number(point[0]), Number(point[1])])
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

function getYearValue(item) {
  const source =
    item.tanggal_tanam_terakhir || item.created_at || item.updated_at || '';

  return String(source).slice(0, 4);
}

function getRegionValue(item) {
  const location = getLocationText(item);
  if (isCoordinateText(location)) return 'Lokasi belum diisi';
  return location.split(',').slice(0, 2).join(',').trim() || location;
}

function MapFocus({ items, resetKey }) {
  const map = useMap();

  useEffect(() => {
    const positions = items.map((item) => item.position).filter(Boolean);

    if (positions.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_MAP_ZOOM);
      return;
    }

    if (positions.length === 1) {
      map.flyTo(positions[0], MAX_MAP_ZOOM, { duration: 0.8 });
      return;
    }

    map.fitBounds(positions, {
      padding: [50, 50],
      maxZoom: MAX_MAP_ZOOM,
    });
  }, [items, map, resetKey]);

  return null;
}

function enrichLahan(item) {
  const commodityName = getKomoditasText(item);
  const commodity = getCommodityConfig(commodityName);

  if (!commodity) return null;

  const position = getLahanPosition(item);
  const harvestSeason = getHarvestSeason(item, commodity.key);

  return {
    ...item,
    commodityName,
    commodityKey: commodity.key,
    commodityColor: commodity.color,
    commodityBg: commodity.bg,
    harvestSeasonLabel: harvestSeason.label,
    harvestSeasonNote: harvestSeason.note,
    position,
    polygonPoints: getPolygonPoints(item),
    areaHa: getAreaInHa(item),
    locationText: getLocationText(item),
    year: getYearValue(item),
    region: getRegionValue(item),
  };
}

export default function KomoditasMapPage() {
  const [lahan, setLahan] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    COMMODITY_FILTERS.map((item) => item.key),
  );
  const [selectedYear, setSelectedYear] = useState('semua');
  const [selectedRegion, setSelectedRegion] = useState('semua');
  const [selectedMapType, setSelectedMapType] = useState('satelit');
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await lahanService.getAll();

        if (!active) return;

        setLahan(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          'Gagal memuat data lahan untuk peta komoditas.',
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

  const enrichedLahan = useMemo(() => {
    return lahan.map(enrichLahan).filter(Boolean);
  }, [lahan]);

  const years = useMemo(() => {
    const fixedYears = ['2026', '2027', '2028'];
    const dataYears = enrichedLahan.map((item) => item.year).filter(Boolean);
    const values = [...new Set([...fixedYears, ...dataYears])];
    return values.sort((a, b) => Number(a) - Number(b));
  }, [enrichedLahan]);

  const regions = useMemo(() => {
    return [...new Set(enrichedLahan.map((item) => item.region).filter(Boolean))].sort();
  }, [enrichedLahan]);

  const filteredLahan = useMemo(() => {
    return enrichedLahan.filter((item) => {
      const matchCategory = selectedCategories.includes(item.commodityKey);
      const matchYear = selectedYear === 'semua' || item.year === selectedYear;
      const matchRegion =
        selectedRegion === 'semua' || item.region === selectedRegion;

      return matchCategory && matchYear && matchRegion;
    });
  }, [enrichedLahan, selectedCategories, selectedRegion, selectedYear]);

  const summary = useMemo(() => {
    return COMMODITY_FILTERS.map((category) => {
      const totalArea = filteredLahan
        .filter((item) => item.commodityKey === category.key)
        .reduce((sum, item) => sum + item.areaHa, 0);

      return {
        ...category,
        totalArea,
      };
    });
  }, [filteredLahan]);

  const allSelected = selectedCategories.length === COMMODITY_FILTERS.length;

  const handleCategoryToggle = (key) => {
    if (key === 'semua') {
      setSelectedCategories(
        allSelected ? [] : COMMODITY_FILTERS.map((item) => item.key),
      );
      return;
    }

    setSelectedCategories((current) => {
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }

      return [...current, key];
    });
  };

  const handleApplyFilter = () => {
    setResetKey((current) => current + 1);
  };

  const handleResetFilter = () => {
    setSelectedCategories(COMMODITY_FILTERS.map((item) => item.key));
    setSelectedYear('semua');
    setSelectedRegion('semua');
    setResetKey((current) => current + 1);
  };

  return (
    <div className="komoditas-map-page">
      <header className="komoditas-map-header">
        <div>
          <h1>Peta Sebaran Komoditas & Filter</h1>
          <p>Lihat persebaran komoditas pertanian di wilayah sekitar Anda.</p>
        </div>
      </header>

      {error && <div className="komoditas-map-message">{error}</div>}

      <section className="komoditas-map-layout">
        <div className="komoditas-map-main">
          <div className="komoditas-map-card">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_MAP_ZOOM}
              minZoom={5}
              maxZoom={MAX_MAP_ZOOM}
              maxBounds={INDONESIA_BOUNDS}
              maxBoundsViscosity={0.85}
              scrollWheelZoom
              className="komoditas-map"
            >
              <MapTiles />
              <MapFocus items={filteredLahan} resetKey={resetKey} />

              {filteredLahan.filter((item) => item.position).map((item) => (
                <Fragment key={item.id_lahan}>
                  {item.polygonPoints.length >= 3 && (
                    <Polygon
                      positions={item.polygonPoints}
                      pathOptions={{
                        color: item.commodityColor,
                        weight: 2,
                        fillColor: item.commodityColor,
                        fillOpacity: 0.22,
                      }}
                    />
                  )}

                  <CircleMarker
                    center={item.position}
                    radius={10}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 3,
                      fillColor: item.commodityColor,
                      fillOpacity: 0.95,
                    }}
                  >
                    <Popup closeButton={false}>
                      <div className="komoditas-popup">
                        <h3>{item.nama_lahan}</h3>
                        <strong>{item.commodityName}</strong>
                        <p>{item.locationText}</p>
                        <dl>
                          <div>
                            <dt>Luas Lahan</dt>
                            <dd>
                              {item.luas || '-'} {item.satuan_luas || 'ha'}
                            </dd>
                          </div>
                          <div>
                            <dt>Tahun Data</dt>
                            <dd>{item.year || '-'}</dd>
                          </div>
                          <div>
                            <dt>Periode Panen</dt>
                            <dd>
                              {item.harvestSeasonLabel}
                              {item.harvestSeasonNote && (
                                <small className="komoditas-popup-hint">
                                  {item.harvestSeasonNote}
                                </small>
                              )}
                            </dd>
                          </div>
                        </dl>
                        <Link to={`/petani/lahan?detail=${item.id_lahan}`}>
                          Lihat Detail
                        </Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                </Fragment>
              ))}
            </MapContainer>

            <div className="komoditas-map-switch">
              <MapIcon name="map" size={18} />
              <select
                value={selectedMapType}
                onChange={(event) => setSelectedMapType(event.target.value)}
                aria-label="Pilih tipe peta"
              >
                <option value="satelit">Satelit</option>
              </select>
            </div>

            <button
              type="button"
              className="komoditas-map-reset"
              onClick={handleResetFilter}
            >
              <MapIcon name="reset" size={15} />
              Reset Peta
            </button>

            <div className="komoditas-map-legend">
              <strong>Legenda Komoditas</strong>
              {COMMODITY_FILTERS.map((item) => (
                <span key={item.key}>
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>

            {loading && (
              <div className="komoditas-map-loading">Memuat data peta...</div>
            )}
          </div>

          <section className="komoditas-summary-section">
            <div className="komoditas-summary-heading">
              <h2>Ringkasan Komoditas ({selectedYear === 'semua' ? 'Semua Tahun' : selectedYear})</h2>
              <span>{filteredLahan.length} titik lahan</span>
            </div>

            <div className="komoditas-summary-grid">
              {summary.map((item) => (
                <article className="komoditas-summary-card" key={item.key}>
                  <span
                    className="komoditas-summary-icon"
                    style={{
                      backgroundColor: item.bg,
                      color: item.color,
                    }}
                  >
                    <MapIcon name={item.key} size={22} />
                  </span>
                  <div>
                    <p>{item.label}</p>
                    <strong>{formatArea(item.totalArea)} ha</strong>
                    <small>Total Luas</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="komoditas-filter-card">
          <h2>Filter Peta</h2>

          <div className="komoditas-filter-group">
            <strong>Kategori Komoditas</strong>

            <label className="komoditas-checkbox">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => handleCategoryToggle('semua')}
              />
              <span>Semua Komoditas</span>
            </label>

            {COMMODITY_FILTERS.map((item) => (
              <label className="komoditas-checkbox" key={item.key}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(item.key)}
                  onChange={() => handleCategoryToggle(item.key)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <label className="komoditas-select-field">
            <span>Tahun Data</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              <option value="semua">Semua Tahun</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="komoditas-select-field">
            <span>Lokasi</span>
            <select
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
            >
              <option value="semua">Semua Lokasi</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="komoditas-apply-button"
            onClick={handleApplyFilter}
          >
            Terapkan Filter
          </button>
        </aside>
      </section>
    </div>
  );
}
