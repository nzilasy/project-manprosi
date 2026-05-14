import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Rectangle,
} from 'react-leaflet';

import heroImage from '../../assets/orang_petani.jpeg';
import './LandingPage.css';

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
    status: 'Potensi Baru',
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

export default function LandingPage() {
    const [searchTerm, setSearchTerm] = useState('');

  const filteredRegions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return highlightedRegions;
    }

    return highlightedRegions.filter((region) => {
      return (
        region.name.toLowerCase().includes(keyword) ||
        region.province.toLowerCase().includes(keyword) ||
        region.commodity.some((item) => item.toLowerCase().includes(keyword))
      );
    });
  }, [searchTerm]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const mapSection = document.getElementById('peta');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <Link to="/" className="landing-logo" aria-label="Agrosync Beranda">
          <span className="landing-logo-mark">A</span>
          <span>Agrosync</span>
        </Link>

        <nav className="landing-nav-links" aria-label="Navigasi utama">
          <a href="#beranda">Beranda</a>
          <a href="#potensi">Potensi</a>
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
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
    />

    <button type="submit" aria-label="Cari wilayah">
      Cari
    </button>
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

              <form
                className="landing-search-card"
                onSubmit={handleSearchSubmit}
              >
                <label className="visually-hidden" htmlFor="landing-search">
                  Cari wilayah
                </label>

                <input
                  id="landing-search"
                  type="search"
                  placeholder="Contoh: Bandung, Garut, Cianjur..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />

                <a href="#peta" className="landing-primary-button">
                  Lihat Peta
                </a>
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

              <div className="landing-farmer-card">
              </div>
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
            {stats.map((item) => (
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
              Data masih statis dan siap disambungkan ke database MANPROSI.
            </p>
          </div>

          <div className="landing-map-card">
            <MapContainer
              bounds={indonesiaBounds}
              maxBounds={indonesiaBounds}
              maxBoundsViscosity={0.85}
              minZoom={4}
              scrollWheelZoom={false}
              className="landing-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Rectangle
                bounds={indonesiaBounds}
                pathOptions={{
                  color: '#2f6f55',
                  weight: 1,
                  fillOpacity: 0,
                }}
              />

              {filteredRegions.map((region) => (
                <CircleMarker
                  key={region.name}
                  center={region.position}
                  radius={9}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2,
                    fillColor: region.color,
                    fillOpacity: 0.92,
                  }}
                >
                  <Popup>
                    <div className="landing-map-popup">
                      <h3>{region.name}</h3>
                      <p>{region.province}</p>
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
                 value={searchTerm}
                 onChange={(event) => setSearchTerm(event.target.value)}
                    />
              </label>

              <label>
                Komoditas
                <select defaultValue="semua">
                  <option value="semua">Semua komoditas</option>
                  <option value="padi">Padi</option>
                  <option value="sayuran">Sayuran</option>
                  <option value="kopi">Kopi</option>
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
                <span>
                  <i className="legend-high" />
                  Tinggi
                </span>
                <span>
                  <i className="legend-medium" />
                  Sedang
                </span>
                <span>
                  <i className="legend-low" />
                  Baru
                </span>
              </div>

              <button type="button">Terapkan Filter</button>
            </aside>
          </div>

          <div className="landing-filter-panel">
            <div className="landing-filter-header">
              <h3>Filter Data</h3>
              <button type="button">Terapkan</button>
            </div>

            <div className="landing-filter-grid">
              <label>
                Pilih Wilayah
                <input type="text" placeholder="Contoh: Subang, Garut..." />
              </label>

              <label>
                Pilih Komoditas
                <select defaultValue="semua">
                  <option value="semua">Semua Komoditas</option>
                  <option value="padi">Padi</option>
                  <option value="sayuran">Sayuran</option>
                  <option value="kopi">Kopi</option>
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
                <select defaultValue="semua">
                  <option value="semua">Semua</option>
                  <option value="tinggi">Tinggi</option>
                  <option value="sedang">Sedang</option>
                  <option value="baru">Baru</option>
                </select>
              </label>
            </div>
          </div>
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