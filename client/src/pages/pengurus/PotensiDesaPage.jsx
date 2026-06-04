import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { lahanService } from '../../services/lahanService';
import './PotensiDesaPage.css';

const DEFAULT_CENTER = [-6.9175, 107.6191];
const DEFAULT_MAP_ZOOM = 16;
const MAX_MAP_ZOOM = 20;
const MAX_NATIVE_TILE_ZOOM = 18;
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';

const STATUS_CONFIG = {
  optimal: {
    label: 'Lahan Aktif',
    color: '#22b07d',
    bg: '#e8f8ef',
    icon: 'leaf',
  },
  belum: {
    label: 'Belum Dimanfaatkan',
    color: '#ef1f1f',
    bg: '#feecec',
    icon: 'close',
  },
};

const FALLBACK_POTENSI = [
  {
    id_lahan: 'fallback-sawah',
    nama_lahan: 'Sawah Blok A',
    lokasi_lahan: 'Dusun Sukamaju',
    luas: 2.8,
    satuan_luas: 'ha',
    status: 'aktif',
    komoditas: { nama_komoditas: 'Padi' },
    latitude: -6.9177,
    longitude: 107.619,
  },
  {
    id_lahan: 'fallback-ternak',
    nama_lahan: 'Peternakan Sapi RT 02',
    lokasi_lahan: 'Dusun Sukamaju',
    luas: 1.2,
    satuan_luas: 'ha',
    status: 'aktif',
    komoditas: { nama_komoditas: 'Peternakan' },
    latitude: -6.9183,
    longitude: 107.6205,
  },
  {
    id_lahan: 'fallback-kosong',
    nama_lahan: 'Lahan Kosong',
    lokasi_lahan: 'Dusun Makmur',
    luas: 0.4,
    satuan_luas: 'ha',
    status: 'nonaktif',
    komoditas: { nama_komoditas: 'Tidak Diketahui' },
    latitude: -6.9192,
    longitude: 107.6196,
  },
];

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

function PotensiIcon({ name }) {
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
    leaf: (
      <svg {...props}>
        <path d="M5 19c8.5-.2 13.5-5.2 14-14-8.8.5-13.8 5.5-14 14Z" />
        <path d="M5 19c2.8-5 6.2-8.3 10.5-10" />
      </svg>
    ),
    animal: (
      <svg {...props}>
        <path d="M5 13v5" />
        <path d="M18 13v5" />
        <path d="M6 10h12l2 3-2 3H7l-3-3 2-3Z" />
        <path d="M8 10V7" />
        <path d="M16 10V7" />
        <path d="M18.5 8.5 20 7" />
        <path d="M5.5 8.5 4 7" />
      </svg>
    ),
    building: (
      <svg {...props}>
        <path d="M4 20h16" />
        <path d="M6 20V9l6-4 6 4v11" />
        <path d="M9 20v-5h6v5" />
        <path d="M9 11h.01" />
        <path d="M12 11h.01" />
        <path d="M15 11h.01" />
      </svg>
    ),
    warning: (
      <svg {...props}>
        <path d="M12 3.5 21 19H3L12 3.5Z" />
        <path d="M12 8.5v5" />
        <path d="M12 17h.01" />
      </svg>
    ),
    chart: (
      <svg {...props}>
        <path d="M5 20V10" />
        <path d="M12 20V5" />
        <path d="M19 20v-8" />
        <path d="M3 20h18" />
      </svg>
    ),
    check: (
      <svg {...props}>
        <path d="m6 12 4 4 8-8" />
      </svg>
    ),
    close: (
      <svg {...props}>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </svg>
    ),
  };

  return icons[name] || icons.leaf;
}

function getKomoditasText(item) {
  return (
    item?.komoditas?.nama_komoditas ||
    item?.Komoditas?.nama_komoditas ||
    'Tidak Diketahui'
  );
}

function getCoordinate(item, field) {
  const value = item?.[field] || item?.lokasi?.[field] || item?.Lokasi?.[field];
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function getAreaInHa(item) {
  const luas = Number(item?.luas || 0);
  const satuan = String(item?.satuan_luas || 'ha').toLowerCase();

  return satuan === 'm2' ? luas / 10000 : luas;
}

function parsePolygon(item) {
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

function getPosition(item) {
  const latitude = getCoordinate(item, 'latitude');
  const longitude = getCoordinate(item, 'longitude');

  if (latitude !== null && longitude !== null) {
    return [latitude, longitude];
  }

  const polygon = parsePolygon(item);

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

function getStatusKey(item) {
  const status = String(item?.status || 'aktif').toLowerCase();

  if (status.includes('non') || status.includes('belum')) return 'belum';
  return 'optimal';
}

function getIconKey(item) {
  const komoditas = getKomoditasText(item).toLowerCase();

  if (
    komoditas.includes('ternak') ||
    komoditas.includes('sapi') ||
    komoditas.includes('kambing') ||
    komoditas.includes('ayam')
  ) {
    return 'animal';
  }

  if (komoditas.includes('industri') || komoditas.includes('pandai')) {
    return 'building';
  }

  if (String(item?.status || '').toLowerCase().includes('non')) {
    return 'building';
  }

  return 'leaf';
}

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('id-ID', options).format(Number(value) || 0);
}

function formatPercent(value) {
  return `${formatNumber(value, { maximumFractionDigits: 1 })}% dari total`;
}

function createMarkerIcon(item) {
  const status = STATUS_CONFIG[item.statusKey] || STATUS_CONFIG.optimal;
  const markerSvg = getMarkerSvg(item.displayIconKey);

  return L.divIcon({
    className: '',
    html: `
      <span class="potensi-map-marker" style="color: #ffffff; background: ${status.color}; border-color: ${status.bg};">
        ${markerSvg}
      </span>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -18],
  });
}

function getMarkerSvg(iconKey) {
  if (iconKey === 'close') {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </svg>
    `;
  }

  if (iconKey === 'animal') {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 13v5" />
        <path d="M18 13v5" />
        <path d="M6 10h12l2 3-2 3H7l-3-3 2-3Z" />
        <path d="M8 10V7" />
        <path d="M16 10V7" />
      </svg>
    `;
  }

  if (iconKey === 'building') {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h16" />
        <path d="M6 20V9l6-4 6 4v11" />
        <path d="M9 20v-5h6v5" />
        <path d="M9 11h.01" />
        <path d="M12 11h.01" />
        <path d="M15 11h.01" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19c8.5-.2 13.5-5.2 14-14-8.8.5-13.8 5.5-14 14Z" />
      <path d="M5 19c2.8-5 6.2-8.3 10.5-10" />
    </svg>
  `;
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
      map.setView(positions[0], 17);
      return;
    }

    map.fitBounds(positions, {
      padding: [40, 40],
      maxZoom: 17,
    });
  }, [items, map]);

  return null;
}

function formatLocationText(text) {
  if (!text) return 'Lokasi belum diisi';
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(text)) {
    return text.split(',').map(n => Number(n).toFixed(4)).join(', ');
  }
  return text;
}

function enrichPotensi(item) {
  const statusKey = getStatusKey(item);
  const iconKey = getIconKey(item);
  const displayIconKey =
    statusKey === 'belum' ? STATUS_CONFIG.belum.icon : iconKey;

  return {
    ...item,
    areaHa: getAreaInHa(item),
    displayIconKey,
    iconKey,
    locationText: formatLocationText(item.lokasi_lahan),
    polygon: parsePolygon(item),
    position: getPosition(item),
    statusKey,
  };
}

export default function PotensiDesaPage() {
  const [lahan, setLahan] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadPotensi = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await lahanService.getAll();

        if (!active) return;

        setLahan(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || 'Gagal memuat data potensi desa.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPotensi();

    return () => {
      active = false;
    };
  }, []);

  const rawItems = lahan.length > 0 ? lahan : FALLBACK_POTENSI;
  const items = useMemo(() => rawItems.map(enrichPotensi), [rawItems]);
  const visibleItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      (item.nama_lahan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.locationText || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);
  const total = items.length;
  const optimal = items.filter((item) => item.statusKey === 'optimal').length;
  const belum = items.filter((item) => item.statusKey === 'belum').length;

  const summaryCards = [
    {
      label: 'Total Potensi',
      value: total,
      note: 'Semua Potensi Desa',
      icon: 'chart',
      tone: 'green',
    },
    {
      label: 'Lahan Aktif',
      value: optimal,
      note: formatPercent(total ? (optimal / total) * 100 : 0),
      icon: 'check',
      tone: 'green',
    },
    {
      label: 'Belum Dimanfaatkan',
      value: belum,
      note: formatPercent(total ? (belum / total) * 100 : 0),
      icon: 'close',
      tone: 'red',
    },
  ];

  return (
    <div className="potensi-page">
      <header className="potensi-header">
        <h1>Potensi Desa</h1>
        <p>Kelola dan pantau potensi sumber daya desa</p>
      </header>

      {error && <div className="potensi-message">{error}</div>}

      <section className="potensi-summary-section" style={{ marginBottom: '32px' }}>
        <div className="potensi-summary-grid">
          {summaryCards.map((card) => (
            <article className="potensi-summary-card" key={card.label}>
              <div className={`potensi-summary-icon ${card.tone}`}>
                <PotensiIcon name={card.icon} />
              </div>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.note}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="potensi-main-grid">
        <div className="potensi-map-section">
          <h2>Peta Potensi Desa</h2>

          <div className="potensi-map-card">
            <MapContainer
              center={DEFAULT_CENTER}
              className="potensi-map"
              maxZoom={MAX_MAP_ZOOM}
              scrollWheelZoom
              zoom={DEFAULT_MAP_ZOOM}
            >
              <MapTiles />
              <MapFocus items={items} />

              {items.map((item) => {
                const status = STATUS_CONFIG[item.statusKey] || STATUS_CONFIG.optimal;

                return (
                  <Marker
                    icon={createMarkerIcon(item)}
                    key={item.id_lahan || item.nama_lahan}
                    position={item.position || DEFAULT_CENTER}
                  >
                    <Popup>
                      <div className="potensi-popup">
                        <h3>{item.nama_lahan}</h3>
                        <p>{item.locationText}</p>
                        <span style={{ backgroundColor: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {items.map((item) =>
                item.polygon.length >= 3 ? (
                  <Polygon
                    key={`${item.id_lahan || item.nama_lahan}-polygon`}
                    pathOptions={{
                      color: STATUS_CONFIG[item.statusKey].color,
                      fillColor: STATUS_CONFIG[item.statusKey].color,
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                    positions={item.polygon}
                  />
                ) : null,
              )}
            </MapContainer>

            <div className="potensi-map-legend">
              {Object.values(STATUS_CONFIG).map((item) => (
                <span key={item.label}>
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>

            {loading && <div className="potensi-map-loading">Memuat peta...</div>}
          </div>
        </div>

        <aside className="potensi-list-card">
          <h2>Daftar Potensi Desa</h2>

          <div className="potensi-search">
            <input
              type="text"
              placeholder="Cari potensi lahan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="potensi-list-wrap">
            <div className="potensi-list">
              {visibleItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '13px' }}>Tidak ada data ditemukan.</div>
              ) : (
                visibleItems.map((item) => {
                  const status = STATUS_CONFIG[item.statusKey] || STATUS_CONFIG.optimal;

                  return (
                    <article className="potensi-list-item" key={item.id_lahan || item.nama_lahan}>
                      <div
                        className="potensi-list-icon"
                        style={{ backgroundColor: status.bg, color: status.color }}
                      >
                        <PotensiIcon name={item.displayIconKey} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nama_lahan}</strong>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📍 {item.locationText}
                        </span>
                      </div>
                      <small style={{ backgroundColor: status.bg, color: status.color, flexShrink: 0 }}>
                        {item.statusKey === 'optimal' ? 'Aktif' : status.label}
                      </small>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
