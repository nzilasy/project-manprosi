import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';

import heroImage from '../../assets/orang_petani.jpeg';
import agrosyncLogo from '../../assets/Logo_project.jpeg';
import './LandingPage.css';

const indonesiaCenter = [-2.5489, 118.0149];
const DEFAULT_MAP_ZOOM = 5;
const REGION_MAP_ZOOM = 17;
const MAX_NATIVE_TILE_ZOOM = 19;
const MAX_MAP_ZOOM = MAX_NATIVE_TILE_ZOOM;

const indonesiaBounds = [
  [-11.2, 94.5],
  [6.5, 141.5],
];

const highlightedRegions = [
  {
    name: 'Kabupaten Bandung',
    province: 'Jawa Barat',
    position: [-7.02, 107.52],
    status: 'Potensi Tinggi',
    color: '#2f6f55',
    commodity: ['Padi', 'Sayuran', 'Kopi'],
    production: '124.430 Ton',
    area: '58.230 Ha',
    productivity: '5,2 Ton/Ha',
  },
  {
    name: 'Kabupaten Tabanan',
    province: 'Bali',
    position: [-8.53, 115.12],
    status: 'Potensi Tinggi',
    color: '#4c8a63',
    commodity: ['Padi', 'Kakao'],
    production: '97.800 Ton',
    area: '32.400 Ha',
    productivity: '4,8 Ton/Ha',
  },
  {
    name: 'Kabupaten Karo',
    province: 'Sumatera Utara',
    position: [3.12, 98.49],
    status: 'Potensi Sedang',
    color: '#c59b4a',
    commodity: ['Kopi', 'Sayuran'],
    production: '64.250 Ton',
    area: '26.900 Ha',
    productivity: '3,9 Ton/Ha',
  },
  {
    name: 'Kabupaten Maros',
    province: 'Sulawesi Selatan',
    position: [-5.01, 119.57],
    status: 'Potensi Tinggi',
    color: '#2f6f55',
    commodity: ['Padi', 'Jagung'],
    production: '88.120 Ton',
    area: '41.700 Ha',
    productivity: '4,6 Ton/Ha',
  },
  {
    name: 'Kabupaten Jayapura',
    province: 'Papua',
    position: [-2.53, 140.72],
    status: 'Potensi Rendah',
    potential: 'rendah',
    color: '#7a6042',
    commodity: ['Sagu', 'Kakao'],
    production: '42.760 Ton',
    area: '29.800 Ha',
    productivity: '3,1 Ton/Ha',
  },
];

const stats = [
  {
    label: 'Total Produksi Nasional',
    value: '54,2 jt ton',
    sub: 'Tahun 2024',
  },
  {
    label: 'Luas Lahan Tercatat',
    value: '10,1 jt ha',
    sub: 'Tahun 2024',
  },
  {
    label: 'Komoditas Aktif',
    value: '127 jenis',
    sub: 'Lintas wilayah',
  },
  {
    label: 'Wilayah Terpantau',
    value: '514 kab/kota',
    sub: 'Data nasional',
  },
];

const commodities = [
  { name: 'Padi', value: '76%' },
  { name: 'Sayuran', value: '48%' },
  { name: 'Kopi', value: '35%' },
];

function normalizeStaticRegion(region) {
  const potential = region.status.toLowerCase().includes('tinggi')
    ? 'tinggi'
    : region.status.toLowerCase().includes('sedang')
      ? 'sedang'
      : 'rendah';

  return {
    ...region,
    location: region.province,
    potential,
  };
}

const fallbackRegions = highlightedRegions.map(normalizeStaticRegion);

function LandingMapFocus({ regions }) {
  const map = useMap();

  useEffect(() => {
    if (regions.length === 1) {
      map.flyTo(regions[0].position, REGION_MAP_ZOOM, {
        duration: 0.8,
      });
      return;
    }

    if (regions.length > 1) {
      map.fitBounds(
        regions.map((region) => region.position),
        {
          padding: [70, 70],
          maxZoom: REGION_MAP_ZOOM,
        },
      );
      return;
    }

    map.setView(indonesiaCenter, DEFAULT_MAP_ZOOM);
  }, [map, regions]);

  return null;
}

export default function LandingPage() {
  const [mapSearch, setMapSearch] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('semua');
  const [selectedPotential, setSelectedPotential] = useState('semua');
  const [publicLahan, setPublicLahan] = useState([]);
  const [publicLahanLoading, setPublicLahanLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadPublicLahan = async () => {
      setPublicLahanLoading(true);

      try {
        const response = await fetch('/api/lahan/public');

        if (!response.ok) {
          throw new Error('Failed to load public lahan');
        }

        const result = await response.json();

        if (!ignore) {
          setPublicLahan(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error('Load public lahan error:', error);

        if (!ignore) {
          setPublicLahan([]);
        }
      } finally {
        if (!ignore) {
          setPublicLahanLoading(false);
        }
      }
    };

    loadPublicLahan();

    return () => {
      ignore = true;
    };
  }, []);

  const mapRegions = publicLahan.length > 0 ? publicLahan : fallbackRegions;

  const mapStats = useMemo(() => {
    if (publicLahan.length === 0) return stats;

    const totalLuas = publicLahan.reduce((sum, item) => {
      const numericArea = Number(item.area_ha);
      return Number.isNaN(numericArea) ? sum : sum + numericArea;
    }, 0);

    const uniqueCommodities = new Set(
      publicLahan.flatMap((item) => item.commodity || []),
    );
    const uniqueLocations = new Set(publicLahan.map((item) => item.location));

    return [
      {
        label: 'Total Lahan Petani',
        value: String(publicLahan.length),
        sub: 'Data tersinkron',
      },
      {
        label: 'Luas Lahan Tercatat',
        value: `${Number(totalLuas.toFixed(2))} ha`,
        sub: 'Akumulasi data',
      },
      {
        label: 'Komoditas Aktif',
        value: `${uniqueCommodities.size} jenis`,
        sub: 'Dari data petani',
      },
      {
        label: 'Wilayah Terpantau',
        value: `${uniqueLocations.size} lokasi`,
        sub: 'Berdasarkan input lahan',
      },
    ];
  }, [publicLahan]);

  const mapCommodities = useMemo(() => {
    const names = new Set();

    mapRegions.forEach((region) => {
      (region.commodity || []).forEach((item) => names.add(item));
    });

    return [...names].sort((a, b) => a.localeCompare(b));
  }, [mapRegions]);

  const filteredRegions = useMemo(() => {
    const keyword = mapSearch.trim().toLowerCase();

    return mapRegions.filter((region) => {
      const matchKeyword =
        !keyword ||
        region.name.toLowerCase().includes(keyword) ||
        region.location.toLowerCase().includes(keyword) ||
        region.commodity.some((item) => item.toLowerCase().includes(keyword));

      const matchCommodity =
        selectedCommodity === 'semua' ||
        region.commodity.some(
          (item) => item.toLowerCase() === selectedCommodity.toLowerCase(),
        );

      const matchPotential =
        selectedPotential === 'semua' ||
        region.potential === selectedPotential;

      return matchKeyword && matchCommodity && matchPotential;
    });
  }, [mapRegions, mapSearch, selectedCommodity, selectedPotential]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const mapSection = document.getElementById('peta');

    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetFilter = () => {
    setMapSearch('');
    setSelectedCommodity('semua');
    setSelectedPotential('semua');
  };

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <Link to="/" className="landing-logo" aria-label="Agrosync Beranda">
          <img
            src={agrosyncLogo}
            alt=""
            className="landing-logo-image"
            aria-hidden="true"
          />
          <span>Agrosync</span>
        </Link>

        <nav className="landing-nav-links" aria-label="Navigasi utama">
          <a href="#beranda">Beranda</a>
          <a href="#potensi">Potensi</a>
          <a href="#peta">Peta</a>
          <a href="#produksi">Produksi</a>
          <a href="#laporan">Laporan</a>
        </nav>

        <div className="landing-nav-actions">
          <form className="landing-nav-search" onSubmit={handleSearchSubmit}>
            <label className="visually-hidden" htmlFor="navbar-search">
              Cari wilayah
            </label>

            <input
              id="navbar-search"
              type="search"
              placeholder="Cari wilayah..."
              value={mapSearch}
              onChange={(event) => setMapSearch(event.target.value)}
            />

            <button type="submit">Cari</button>
          </form>

          <Link to="/login" className="landing-login-button">
            Masuk
          </Link>
        </div>
      </header>

      <main>
        <section id="beranda" className="landing-hero-section">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">
                MANPROSI - Sistem Manajemen Desa
              </p>

              <h1>Observasi Potensi Wilayah Pertanian</h1>

              <p>
                Jelajahi potensi pertanian, peternakan, hasil panen, wisata,
                dan laporan desa dalam satu tampilan terpadu berbasis wilayah
                Indonesia.
              </p>

              <form className="landing-search-card" onSubmit={handleSearchSubmit}>
                <label className="visually-hidden" htmlFor="landing-search">
                  Cari wilayah
                </label>

                <input
                  id="landing-search"
                  type="search"
                  placeholder="Contoh: Bandung, Garut, Cianjur..."
                  value={mapSearch}
                  onChange={(event) => setMapSearch(event.target.value)}
                />

                <button type="submit" className="landing-primary-button">
                  Lihat Peta
                </button>
              </form>
            </div>

            <div
              className="landing-hero-visual"
              aria-label="Foto petani sedang bekerja di area persawahan"
            >
              <img
                src={heroImage}
                alt="Petani sedang bekerja di area persawahan"
                className="landing-hero-image"
              />

              <div className="landing-hero-image-fade" />
            </div>
          </div>
        </section>

        <section
          id="potensi"
          className="landing-container landing-stats-section"
          aria-labelledby="stats-title"
        >
          <h2 id="stats-title">Highlight Statistik Nasional</h2>

          <div className="landing-stats-grid">
            {mapStats.map((item) => (
              <article className="landing-stat-card" key={item.label}>
                <div className="landing-stat-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M12 21c-4.4-2.2-7-5.7-7-9.4A7 7 0 0 1 18.9 10h-2.1a5 5 0 0 0-9.8 1.6c0 2.5 1.7 5 5 6.8 1.6-.9 2.9-1.9 3.7-3.1h-3.4V13h7.1c-.5 3.3-3.1 6.2-7.4 8Z" />
                  </svg>
                </div>

                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                  <span>{item.sub}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="peta"
          className="landing-container landing-map-section"
          aria-labelledby="map-title"
        >
          <div className="landing-section-heading">
            <div>
              <p className="landing-eyebrow">Peta Nasional</p>
              <h2 id="map-title">Peta Potensi Pertanian Indonesia</h2>
            </div>

            <p>
              Peta difokuskan ke Indonesia dengan contoh titik potensi wilayah.
              Data peta tersinkron dari input lahan petani MANPROSI.
            </p>
          </div>

          <div className="landing-map-card">
            <MapContainer
              center={indonesiaCenter}
              zoom={DEFAULT_MAP_ZOOM}
              minZoom={5}
              maxZoom={MAX_MAP_ZOOM}
              maxBounds={indonesiaBounds}
              maxBoundsViscosity={0.85}
              scrollWheelZoom
              className="landing-map"
            >
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
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

              <LandingMapFocus regions={filteredRegions} />

              {filteredRegions.map((region) => (
                <CircleMarker
                  key={region.name}
                  center={region.position}
                  radius={9}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2,
                    fillColor: region.color,
                    fillOpacity: 0.95,
                  }}
                >
                  <Popup>
                    <div className="landing-map-popup">
                      <h3>{region.name}</h3>
                      <p>{region.location}</p>
                      <span>{region.status}</span>

                      <div className="landing-popup-tags">
                        {region.commodity.map((item) => (
                          <b key={item}>{item}</b>
                        ))}
                      </div>

                      <dl>
                        <div>
                          <dt>Produksi</dt>
                          <dd>{region.production}</dd>
                        </div>

                        <div>
                          <dt>Luas lahan</dt>
                          <dd>{region.area}</dd>
                        </div>

                        <div>
                          <dt>Produktivitas</dt>
                          <dd>{region.productivity}</dd>
                        </div>
                      </dl>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            <aside className="landing-map-filter" aria-label="Filter peta">
              <h3>Cari Wilayah</h3>

              <label>
                Wilayah
                <input
                  type="text"
                  placeholder="Contoh: Bandung"
                  value={mapSearch}
                  onChange={(event) => setMapSearch(event.target.value)}
                />
              </label>

              <label>
                Komoditas
                <select
                  value={selectedCommodity}
                  onChange={(event) => setSelectedCommodity(event.target.value)}
                >
                  <option value="semua">Semua komoditas</option>
                  {mapCommodities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tahun Data
                <select defaultValue="2024">
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </label>

              <div className="landing-map-legend">
                <p>Tingkat Potensi</p>

                <button
                  type="button"
                  className={selectedPotential === 'semua' ? 'is-active' : ''}
                  onClick={() => setSelectedPotential('semua')}
                >
                  Semua
                </button>

                <button
                  type="button"
                  className={selectedPotential === 'tinggi' ? 'is-active' : ''}
                  onClick={() => setSelectedPotential('tinggi')}
                >
                  <i className="legend-high" />
                  Tinggi
                </button>

                <button
                  type="button"
                  className={selectedPotential === 'sedang' ? 'is-active' : ''}
                  onClick={() => setSelectedPotential('sedang')}
                >
                  <i className="legend-medium" />
                  Sedang
                </button>

                <button
                  type="button"
                  className={selectedPotential === 'rendah' ? 'is-active' : ''}
                  onClick={() => setSelectedPotential('rendah')}
                >
                  <i className="legend-low" />
                  Rendah
                </button>
              </div>

              <button type="button" onClick={handleResetFilter}>
                Reset Filter
              </button>

              <p className="landing-map-source">
                {publicLahanLoading
                  ? 'Memuat data petani...'
                  : publicLahan.length > 0
                    ? `${publicLahan.length} data lahan petani tersinkron.`
                    : 'Menampilkan data contoh karena data petani belum tersedia.'}
              </p>
            </aside>
          </div>

          <section className="landing-filter-panel" aria-label="Filter data peta">
            <div className="landing-filter-panel-header">
              <h3>Filter Data</h3>

              <button
                type="button"
                className="landing-filter-caret"
                aria-label="Buka pilihan filter"
              >
               ⌄
              </button>
            </div>

            <div className="landing-filter-grid">
              <label>
                Pilih Wilayah
                <input
                  type="text"
                  placeholder="Contoh: Bandung, Garut, Cimahi..."
                  value={mapSearch}
                  onChange={(event) => setMapSearch(event.target.value)}
                />
              </label>

              <label>
                Pilih Komoditas
                <select
                  value={selectedCommodity}
                  onChange={(event) => setSelectedCommodity(event.target.value)}
                >
                  <option value="semua">Semua Komoditas</option>

                  {mapCommodities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tahun Data
                <select defaultValue="2024">
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </label>

              <label>
                Tingkat Potensi
                <select
                  value={selectedPotential}
                  onChange={(event) => setSelectedPotential(event.target.value)}
                >
                  <option value="semua">Semua</option>
                  <option value="tinggi">Tinggi</option>
                  <option value="sedang">Sedang</option>
                  <option value="rendah">Rendah</option>
                </select>
              </label>

              <button
                type="button"
                className="landing-filter-apply"
                onClick={handleSearchSubmit}
              >
                <span aria-hidden="true">≡</span>
                Terapkan Filter
              </button>
            </div>
          </section>
        </section>

        <section
          id="produksi"
          className="landing-container landing-analytics-section"
          aria-label="Analitik produksi"
        >
          <article className="landing-chart-card landing-line-card">
            <h2>
              Tren Produksi Nasional <span>(Semua Komoditas)</span>
            </h2>
            <TrendLineChart />
          </article>

          <article className="landing-chart-card landing-growth-card">
            <div className="landing-growth-icon">✦</div>
            <h2>Produksi terus meningkat</h2>
            <p>
              Dalam 5 tahun terakhir, produksi pertanian nasional
              memperlihatkan arah peningkatan. Kenaikan ini didorong oleh
              perluasan lahan produktif dan pencatatan wilayah yang lebih baik.
            </p>
          </article>

          <article className="landing-chart-card">
            <h2>
              Komoditas Unggulan <span>(2024)</span>
            </h2>

            <div className="landing-commodity-list">
              {commodities.map((item) => (
                <div className="landing-commodity-row" key={item.name}>
                  <span>{item.name}</span>

                  <div className="landing-commodity-track">
                    <i style={{ width: item.value }} />
                  </div>

                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="landing-chart-card">
            <div className="landing-card-title-row">
              <h2>Perbandingan dengan Wilayah Lain</h2>

              <select defaultValue="3wilayah">
                <option value="3wilayah">3 Wilayah</option>
              </select>
            </div>

            <BarComparisonChart />
          </article>
        </section>

        <section
          id="laporan"
          className="landing-container landing-insight-section"
          aria-label="Insight wilayah"
        >
          <div className="landing-insight-main">
            <div className="landing-insight-icon">i</div>

            <div>
              <h2>Insight Wilayah</h2>
              <p>
                Kabupaten Bandung memiliki potensi pertanian tinggi dengan
                komoditas unggulan padi, sayuran, dan kopi. Produksi meningkat
                sekitar 20% dalam 3 tahun terakhir.
              </p>
            </div>
          </div>

          <div className="landing-insight-metrics">
            <Metric
              title="Produksi meningkat"
              value="20%"
              text="dari tahun sebelumnya"
            />

            <Metric
              title="Komoditas unggulan"
              value="Padi, Sayuran, Kopi"
              text="berdasarkan data wilayah"
            />

            <Metric
              title="Curah hujan ideal"
              value="1.800 - 2.500 mm"
              text="per tahun"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ title, value, text }) {
  return (
    <article className="landing-metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </article>
  );
}

function TrendLineChart() {
  return (
    <svg
      className="landing-line-chart"
      viewBox="0 0 620 260"
      role="img"
      aria-label="Grafik garis tren produksi nasional 2020 sampai 2024"
    >
      <defs>
        <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2f6f55" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2f6f55" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[40, 80, 120, 160, 200].map((y) => (
        <line key={y} x1="50" x2="590" y1={y} y2={y} />
      ))}

      {['2020', '2021', '2022', '2023', '2024'].map((year, index) => (
        <text key={year} x={70 + index * 125} y="235">
          {year}
        </text>
      ))}

      <path
        d="M60 174 C130 150 140 95 210 112 C280 130 285 70 350 86 C430 108 425 58 500 74 C545 82 555 54 590 45 L590 205 L60 205 Z"
        fill="url(#lineFill)"
      />

      <path
        d="M60 174 C130 150 140 95 210 112 C280 130 285 70 350 86 C430 108 425 58 500 74 C545 82 555 54 590 45"
        className="line-main"
      />

      <path
        d="M60 196 C128 178 150 138 212 150 C280 164 302 108 355 122 C425 132 440 90 505 106 C550 112 565 86 590 78"
        className="line-second"
      />

      <path
        d="M60 212 C128 198 148 170 212 180 C278 192 300 145 355 160 C428 170 442 132 505 146 C548 152 565 122 590 116"
        className="line-third"
      />
    </svg>
  );
}

function BarComparisonChart() {
  const groups = [
    { label: 'Produksi', values: [118, 82, 95] },
    { label: 'Luas Lahan', values: [122, 76, 88] },
    { label: 'Produktivitas', values: [116, 82, 98] },
  ];

  return (
    <svg
      className="landing-bar-chart"
      viewBox="0 0 620 260"
      role="img"
      aria-label="Grafik batang perbandingan wilayah"
    >
      <g className="bar-legend">
        <circle className="legend-circle-one" cx="250" cy="28" r="6" />
        <text x="264" y="32">
          Kab. Bandung
        </text>

        <circle className="legend-circle-two" cx="365" cy="28" r="6" />
        <text x="379" y="32">
          Tabanan
        </text>

        <circle className="legend-circle-three" cx="460" cy="28" r="6" />
        <text x="474" y="32">
          Karo
        </text>
      </g>

      {groups.map((group, groupIndex) => {
        const baseX = 95 + groupIndex * 175;

        return (
          <g key={group.label}>
            {group.values.map((value, index) => (
              <rect
                key={`${group.label}-${index}`}
                className={`bar-${index + 1}`}
                x={baseX + index * 34}
                y={190 - value}
                width="24"
                height={value}
                rx="6"
              />
            ))}

            <text x={baseX + 30} y="226" textAnchor="middle">
              {group.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
