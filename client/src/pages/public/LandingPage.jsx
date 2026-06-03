import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
const MAX_NATIVE_TILE_ZOOM = 18;
const MAX_MAP_ZOOM = 20;
const REGION_MAP_ZOOM = 14;
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';

const indonesiaBounds = [
  [-11.2, 94.5],
  [6.5, 141.5],
];

/* Warna legenda per komoditas */
const COMMODITY_COLORS = {
  Padi: '#2f6f55',
  Kopi: '#b5651d',
  Jagung: '#d4a017',
  Sayuran: '#3fa672',
  Peternakan: '#0f766e',
  Kakao: '#7a4f2e',
  Sagu: '#6b8e23',
};

function getCommodityColor(name) {
  if (!name) return '#6c7b76';
  const key = Object.keys(COMMODITY_COLORS).find(
    (k) => name.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? COMMODITY_COLORS[key] : '#6c7b76';
}

const fallbackStats = [
  {
    label: 'Total Produksi Nasional',
    value: '54,2 jt ton',
    sub: 'Tahun 2026',
  },
  {
    label: 'Luas Lahan Tercatat',
    value: '10,1 jt ha',
    sub: 'Tahun 2026',
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

/* ─── Animated Counter Hook ─── */

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;

          const numericTarget =
            typeof target === 'number'
              ? target
              : Number(String(target).replace(/[^\d.]/g, ''));

          if (Number.isNaN(numericTarget) || numericTarget === 0) {
            setCount(0);
            return;
          }

          const startTime = performance.now();
          const isDecimal = numericTarget % 1 !== 0;

          function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setCount(
              isDecimal
                ? Number((eased * numericTarget).toFixed(2))
                : Math.round(eased * numericTarget),
            );

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, count };
}

/* ─── Map Focus ─── */

function LandingMapFocus({ regions, focusPosition }) {
  const map = useMap();

  useEffect(() => {
    if (focusPosition) {
      map.flyTo(focusPosition, REGION_MAP_ZOOM, { duration: 0.8 });
      return;
    }

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
          maxZoom: 12,
        },
      );
      return;
    }

    map.setView(indonesiaCenter, DEFAULT_MAP_ZOOM);
  }, [map, regions, focusPosition]);

  return null;
}

/* ─── Format helpers ─── */

function formatRupiah(value) {
  const num = Number(value);
  if (Number.isNaN(num) || num === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/* ─── Main Component ─── */

export default function LandingPage() {
  const [mapSearch, setMapSearch] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('semua');
  const [selectedYear, setSelectedYear] = useState('semua');
  const [publicLahan, setPublicLahan] = useState([]);
  const [publicLahanLoading, setPublicLahanLoading] = useState(false);
  const [publicWisata, setPublicWisata] = useState([]);
  const [panenSummary, setPanenSummary] = useState(null);

  // Nominatim search state
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [mapFocusPosition, setMapFocusPosition] = useState(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadPublicData = async () => {
      setPublicLahanLoading(true);

      try {
        const [lahanRes, wisataRes, panenRes] = await Promise.allSettled([
          fetch('/api/lahan/public'),
          fetch('/api/wisata/public'),
          fetch('/api/panen/public-summary'),
        ]);

        if (ignore) return;

        if (lahanRes.status === 'fulfilled' && lahanRes.value.ok) {
          const result = await lahanRes.value.json();
          setPublicLahan(Array.isArray(result.data) ? result.data : []);
        }

        if (wisataRes.status === 'fulfilled' && wisataRes.value.ok) {
          const result = await wisataRes.value.json();
          setPublicWisata(Array.isArray(result.data) ? result.data : []);
        }

        if (panenRes.status === 'fulfilled' && panenRes.value.ok) {
          const result = await panenRes.value.json();
          setPanenSummary(result.data || null);
        }
      } catch (error) {
        console.error('Load public data error:', error);
      } finally {
        if (!ignore) {
          setPublicLahanLoading(false);
        }
      }
    };

    loadPublicData();

    return () => {
      ignore = true;
    };
  }, []);

  const mapRegions = publicLahan;

  const mapStats = useMemo(() => {
    if (publicLahan.length === 0) return fallbackStats;

    const totalLuas = publicLahan.reduce((sum, item) => {
      const numericArea = Number(item.area_ha);
      return Number.isNaN(numericArea) ? sum : sum + numericArea;
    }, 0);

    const uniqueCommodities = new Set(
      publicLahan
        .flatMap((item) => item.commodity || [])
        .filter((c) => c && c !== 'Belum dipilih'),
    );

    return [
      {
        label: 'Total Lahan Petani',
        value: String(publicLahan.length),
        sub: 'Data tersinkron',
        numericValue: publicLahan.length,
      },
      {
        label: 'Luas Lahan Tercatat',
        value: `${totalLuas.toFixed(2)} ha`,
        sub: 'Akumulasi data',
        numericValue: totalLuas,
      },
      {
        label: 'Komoditas Aktif',
        value: `${uniqueCommodities.size} jenis`,
        sub: 'Dari data petani',
        numericValue: uniqueCommodities.size,
      },
    ];
  }, [publicLahan]);

  /* Commodity legend from real data */
  const commodityLegend = useMemo(() => {
    const names = new Set();
    mapRegions.forEach((region) => {
      (region.commodity || []).forEach((item) => {
        if (item && item !== 'Belum dipilih') names.add(item);
      });
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [mapRegions]);

  const filteredRegions = useMemo(() => {
    const keyword = mapSearch.trim().toLowerCase();

    return mapRegions.filter((region) => {
      const matchKeyword =
        !keyword ||
        (region.name || '').toLowerCase().includes(keyword) ||
        (region.location || '').toLowerCase().includes(keyword) ||
        (region.nama_tempat || '').toLowerCase().includes(keyword) ||
        (region.place_name || '').toLowerCase().includes(keyword) ||
        (region.commodity || []).some((item) => item.toLowerCase().includes(keyword));

      const matchCommodity =
        selectedCommodity === 'semua' ||
        (region.commodity || []).some(
          (item) => item.toLowerCase() === selectedCommodity.toLowerCase(),
        );

      let matchYear = true;
      if (selectedYear !== 'semua') {
        const plantDate = region.planting_date || region.created_at || '';
        const yearStr = String(plantDate).slice(0, 4);
        matchYear = yearStr === selectedYear;
      }

      return matchKeyword && matchCommodity && matchYear;
    });
  }, [mapRegions, mapSearch, selectedCommodity, selectedYear]);

  /* ── Dynamic commodity chart data ── */
  const commodityChartData = useMemo(() => {
    // Hitung berdasarkan lahan (mapRegions) agar merespons filter Tahun/Wilayah
    // dan menampilkan semua komoditas yang diinput pengguna
    const counts = {};
    mapRegions.forEach((region) => {
      (region.commodity || []).forEach((c) => {
        if (c && c !== 'Belum dipilih' && c !== 'Area Komoditas') {
          counts[c] = (counts[c] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    if (sorted.length === 0) return [];

    const max = sorted[0]?.[1] || 1;

    return sorted.slice(0, 5).map(([name, count]) => ({
      name,
      value: `${Math.round((count / max) * 100)}%`,
      rawValue: count,
    }));
  }, [mapRegions]);

  /* ── Dynamic trend line data ── */
  const trendData = useMemo(() => {
    if (panenSummary?.by_year?.length > 0) {
      return panenSummary.by_year.map((item) => ({
        year: String(item.year),
        production: Number(item.total_production) || 0,
        count: Number(item.harvest_count) || 0,
      }));
    }
    return null;
  }, [panenSummary]);

  /* ── Dynamic insight ── */
  const insightData = useMemo(() => {
    if (!mapRegions || mapRegions.length === 0) {
      return {
        title: 'Ringkasan Data',
        description: 'Belum ada data lahan yang sesuai dengan filter yang dipilih.',
        metrics: [
          { title: 'Lahan tercatat', value: '0 unit', text: '-' },
          { title: 'Lokasi terdaftar', value: '0 lokasi', text: '-' },
          { title: 'Total luas', value: '0 ha', text: '-' },
        ],
      };
    }

    // Count unique locations
    const locationSet = new Set();
    mapRegions.forEach((item) => {
      const loc = item.nama_tempat || item.place_name || item.location || '';
      if (loc && loc !== 'Area Komoditas' && loc !== 'Lokasi belum diisi') {
        locationSet.add(loc);
      }
    });
    const uniqueLocationCount = locationSet.size;

    // Find the most common commodities
    const commodityCounts = {};
    mapRegions.forEach((item) => {
      (item.commodity || []).forEach((c) => {
        if (c && c !== 'Belum dipilih') {
          commodityCounts[c] = (commodityCounts[c] || 0) + 1;
        }
      });
    });
    const topCommodities = Object.entries(commodityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const totalArea = mapRegions.reduce(
      (sum, item) => sum + (Number(item.area_ha) || 0),
      0,
    );

    const avgArea = mapRegions.length > 0 ? (totalArea / mapRegions.length) : 0;

    // Find the largest single piece of land
    let maxArea = 0;
    let maxLocation = '';
    mapRegions.forEach((item) => {
      const area = Number(item.area_ha) || 0;
      if (area > maxArea) {
        maxArea = area;
        maxLocation = item.nama_tempat || item.place_name || item.location || 'Wilayah tak bernama';
      }
    });

    const shortMaxLocation = maxLocation.split(',')[0].slice(0, 15);

    return {
      title: `Ringkasan Data — ${mapRegions.length} Lahan Terpilih`,
      description: `Sistem menampilkan ${mapRegions.length} lahan dari ${uniqueLocationCount} lokasi berbeda dengan komoditas unggulan ${topCommodities.map((c) => c.name).join(', ') || '-'}. Total luas lahan keseluruhan mencapai ${totalArea.toFixed(1)} ha berdasarkan filter.`,
      metrics: [
        {
          title: 'Lahan tercatat',
          value: `${mapRegions.length} unit`,
          text: `dari ${uniqueLocationCount} lokasi`,
        },
        {
          title: 'Lokasi terdaftar',
          value: `${uniqueLocationCount} lokasi`,
          text: `rata-rata ${avgArea.toFixed(1)} ha/lahan`,
        },
        {
          title: 'Total luas',
          value: `${totalArea.toFixed(1)} ha`,
          text: maxLocation ? `terluas: ${shortMaxLocation} (${maxArea.toFixed(1)} ha)` : 'akumulasi seluruh lahan',
        },
      ],
    };
  }, [mapRegions]);

  /* ── Place search (Nominatim) ── */
  const handleSearchPlace = useCallback(async (query) => {
    const keyword = (query || '').trim();
    if (keyword.length < 3) {
      setPlaceSearchResults([]);
      return;
    }

    setPlaceSearchLoading(true);
    setPlaceSearchResults([]);

    try {
      const params = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        countrycodes: 'id',
        limit: '5',
        q: keyword,
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      );

      if (!response.ok) throw new Error('Search request failed');

      const results = await response.json();
      setPlaceSearchResults(
        results
          .map((item) => ({
            id: item.place_id,
            name: item.display_name,
            lat: Number(item.lat),
            lng: Number(item.lon),
          }))
          .filter((item) => item.id && item.name && !Number.isNaN(item.lat) && !Number.isNaN(item.lng)),
      );
    } catch (error) {
      console.error('Search place error:', error);
    } finally {
      setPlaceSearchLoading(false);
    }
  }, []);

  const handlePlaceSearchInput = (event) => {
    const value = event.target.value;
    setPlaceSearchQuery(value);
    setMapSearch(value);

    // Debounce search
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (value.trim().length >= 3) {
      searchTimerRef.current = setTimeout(() => {
        handleSearchPlace(value);
      }, 500);
    } else {
      setPlaceSearchResults([]);
    }
  };

  const handleSelectPlace = (place) => {
    const shortName = place.name.split(',').slice(0, 3).join(', ');
    setPlaceSearchQuery(shortName);
    setMapSearch(shortName.split(',')[0]?.trim() || shortName);
    setPlaceSearchResults([]);
    setMapFocusPosition([place.lat, place.lng]);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (placeSearchQuery.trim().length >= 3) {
      handleSearchPlace(placeSearchQuery);
    }

    const mapSection = document.getElementById('peta');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetFilter = () => {
    setMapSearch('');
    setPlaceSearchQuery('');
    setSelectedCommodity('semua');
    setSelectedYear('semua');
    setPlaceSearchResults([]);
    setMapFocusPosition(null);
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
          <a href="#wisata">Wisata</a>
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
              value={placeSearchQuery}
              onChange={handlePlaceSearchInput}
            />

            <button type="submit">Cari</button>
          </form>

          <Link to="/login" className="landing-login-button">
            Masuk
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section id="beranda" className="landing-hero-section">
          <div className="landing-hero-bg-glow" aria-hidden="true" />

          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">
                MANPROSI - Sistem Manajemen Desa
              </p>

              <h1>Observasi Potensi Wilayah Pertanian</h1>

              <p>
                Jelajahi potensi pertanian, hasil panen, wisata, dan laporan
                desa dalam satu tampilan terpadu berbasis wilayah
                Indonesia.
              </p>

              {publicLahan.length > 0 && (
                <span className="landing-sync-badge">
                  <span className="landing-sync-dot" />
                  {publicLahan.length} data lahan tersinkron
                </span>
              )}

              <form className="landing-search-card" onSubmit={handleSearchSubmit}>
                <label className="visually-hidden" htmlFor="landing-search">
                  Cari wilayah
                </label>

                <div className="landing-search-input-wrap">
                  <input
                    id="landing-search"
                    type="search"
                    placeholder="Cari patokan tempat, desa, atau jalan..."
                    value={placeSearchQuery}
                    onChange={handlePlaceSearchInput}
                    autoComplete="off"
                  />

                  {placeSearchResults.length > 0 && (
                    <div className="landing-search-dropdown">
                      {placeSearchResults.map((place) => (
                        <button
                          type="button"
                          key={place.id}
                          className="landing-search-result"
                          onClick={() => handleSelectPlace(place)}
                        >
                          <span className="landing-search-result-icon">📍</span>
                          <span>{place.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {placeSearchLoading && (
                    <div className="landing-search-dropdown">
                      <div className="landing-search-loading">Mencari tempat...</div>
                    </div>
                  )}
                </div>

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

        {/* ── Stats ── */}
        <section
          id="potensi"
          className="landing-container landing-stats-section"
          aria-labelledby="stats-title"
        >
          <h2 id="stats-title">Highlight Statistik Nasional</h2>

          <div className="landing-stats-grid">
            {mapStats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                sub={item.sub}
                numericValue={item.numericValue}
              />
            ))}
          </div>
        </section>

        {/* ── Map ── */}
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

              <LandingMapFocus regions={filteredRegions} focusPosition={mapFocusPosition} />

              {filteredRegions.map((region, index) => {
                const mainCommodity = (region.commodity || [])[0] || '';
                const markerColor = getCommodityColor(mainCommodity);

                return (
                  <CircleMarker
                    key={region.id || region.name || index}
                    center={region.position}
                    radius={9}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 2,
                      fillColor: markerColor,
                      fillOpacity: 0.95,
                    }}
                  >
                    <Popup>
                      <div className="landing-map-popup">
                        <h3>{region.nama_tempat || region.place_name || region.name}</h3>
                        <p>{region.location || '-'}</p>
                        <span>{region.status}</span>

                        <div className="landing-popup-tags">
                          {(region.commodity || []).map((item) => (
                            <b key={item}>{item}</b>
                          ))}
                        </div>

                        <dl>
                          <div>
                            <dt>Nama Lahan</dt>
                            <dd>{region.name || '-'}</dd>
                          </div>

                          <div>
                            <dt>Luas lahan</dt>
                            <dd>{region.area || '-'}</dd>
                          </div>

                          {region.planting_date && (
                            <div>
                              <dt>Tanam terakhir</dt>
                              <dd>{region.planting_date}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            <aside className="landing-map-filter" aria-label="Filter peta">
              <h3>Cari Wilayah</h3>

              <label>
                Wilayah
                <div className="landing-filter-search-wrap">
                  <input
                    type="text"
                    placeholder="Cari patokan tempat, desa, atau jalan"
                    value={placeSearchQuery}
                    onChange={handlePlaceSearchInput}
                    autoComplete="off"
                  />

                  {placeSearchResults.length > 0 && (
                    <div className="landing-filter-search-dropdown">
                      {placeSearchResults.map((place) => (
                        <button
                          type="button"
                          key={place.id}
                          className="landing-search-result"
                          onClick={() => handleSelectPlace(place)}
                        >
                          <span className="landing-search-result-icon">📍</span>
                          <span>{place.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {placeSearchLoading && (
                    <div className="landing-filter-search-dropdown">
                      <div className="landing-search-loading">Mencari tempat...</div>
                    </div>
                  )}
                </div>
              </label>

              <label>
                Komoditas
                <select
                  value={selectedCommodity}
                  onChange={(event) => setSelectedCommodity(event.target.value)}
                >
                  <option value="semua">Semua komoditas</option>
                  {commodityLegend.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tahun Data
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                >
                  <option value="semua">Semua Tahun</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </label>



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
                <div className="landing-filter-search-wrap">
                  <input
                    type="text"
                    placeholder="Cari patokan tempat, desa, atau jalan..."
                    value={placeSearchQuery}
                    onChange={handlePlaceSearchInput}
                    autoComplete="off"
                  />

                  {placeSearchResults.length > 0 && (
                    <div className="landing-filter-search-dropdown">
                      {placeSearchResults.map((place) => (
                        <button
                          type="button"
                          key={place.id}
                          className="landing-search-result"
                          onClick={() => handleSelectPlace(place)}
                        >
                          <span className="landing-search-result-icon">📍</span>
                          <span>{place.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              <label>
                Pilih Komoditas
                <select
                  value={selectedCommodity}
                  onChange={(event) => setSelectedCommodity(event.target.value)}
                >
                  <option value="semua">Semua Komoditas</option>

                  {commodityLegend.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tahun Data
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                >
                  <option value="semua">Semua Tahun</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
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

        {/* ── Wisata Desa ── */}
        {publicWisata.length > 0 && (
          <section
            id="wisata"
            className="landing-container landing-wisata-section"
            aria-labelledby="wisata-title"
          >
            <div className="landing-section-heading">
              <div>
                <p className="landing-eyebrow">Destinasi Desa</p>
                <h2 id="wisata-title">Wisata Desa Menarik</h2>
              </div>
              <p>
                Jelajahi destinasi wisata terbaik di wilayah desa. Data diambil
                langsung dari pengelola wisata MANPROSI.
              </p>
            </div>

            <div className="landing-wisata-grid">
              {publicWisata.slice(0, 6).map((wisata) => (
                <article className="landing-wisata-card" key={wisata.id}>
                  <div className="landing-wisata-image-wrap">
                    {wisata.image ? (
                      <img
                        src={wisata.image}
                        alt={wisata.nama_wisata}
                        className="landing-wisata-image"
                      />
                    ) : (
                      <div className="landing-wisata-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </div>
                    )}
                    <span className="landing-wisata-category">
                      {wisata.jenis_wisata || wisata.category || 'Alam'}
                    </span>
                  </div>

                  <div className="landing-wisata-body">
                    <h3>{wisata.nama_wisata || wisata.name}</h3>
                    <p className="landing-wisata-location">
                      📍 {wisata.location || 'Lokasi belum diisi'}
                    </p>

                    <div className="landing-wisata-meta">
                      {wisata.rating > 0 && (
                        <span className="landing-wisata-rating">
                          ⭐ {Number(wisata.rating).toFixed(1)}
                        </span>
                      )}
                      <span className="landing-wisata-price">
                        {formatRupiah(wisata.harga_tiket || wisata.ticket_price)}
                      </span>
                    </div>

                    {wisata.facilities && wisata.facilities.length > 0 && (
                      <div className="landing-wisata-facilities">
                        {wisata.facilities.slice(0, 3).map((f) => (
                          <span key={f}>{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="landing-wisata-cta">
              <Link to="/login" className="landing-secondary-button">
                Masuk untuk melihat semua wisata →
              </Link>
            </div>
          </section>
        )}

        {/* ── Wisata Fallback ── */}
        {publicWisata.length === 0 && (
          <section
            id="wisata"
            className="landing-container landing-wisata-section"
            aria-labelledby="wisata-title-empty"
          >
            <div className="landing-section-heading">
              <div>
                <p className="landing-eyebrow">Destinasi Desa</p>
                <h2 id="wisata-title-empty">Wisata Desa</h2>
              </div>
              <p>
                Data wisata akan muncul di sini setelah pengelola wisata
                menambahkan lokasi wisata melalui MANPROSI.
              </p>
            </div>

            <div className="landing-wisata-empty">
              <div className="landing-wisata-empty-icon">🏞️</div>
              <h3>Belum ada data wisata</h3>
              <p>Pengelola wisata dapat menambahkan lokasi wisata melalui dashboard.</p>
              <Link to="/login" className="landing-secondary-button">
                Masuk sebagai Pengelola Wisata
              </Link>
            </div>
          </section>
        )}

        {/* ── Production Analytics ── */}
        <section
          id="produksi"
          className="landing-container landing-analytics-section"
          aria-label="Analitik produksi"
        >
          <article className="landing-chart-card landing-line-card">
            <h2>
              Tren Produksi{' '}
              <span>(
                {trendData && trendData.length > 0
                  ? trendData.length === 1
                    ? `Tahun ${trendData[0]?.year || '-'}`
                    : `${trendData[0]?.year || ''} – ${trendData[trendData.length - 1]?.year || ''}`
                  : 'Semua Komoditas'}
              )</span>
            </h2>
            <TrendLineChart data={trendData} />
          </article>

          <article className="landing-chart-card landing-growth-card">
            <div className="landing-growth-icon">✦</div>
            <h2>
              {panenSummary?.totals?.total_harvests > 0
                ? `${panenSummary.totals.total_harvests} panen tercatat`
                : 'Produksi terus meningkat'}
            </h2>
            <p>
              {panenSummary?.totals?.total_harvests > 0
                ? `Data panen dari ${panenSummary.totals.unique_fields || 0} lahan dengan ${panenSummary.totals.unique_commodities || 0} jenis komoditas telah tercatat di sistem MANPROSI.`
                : 'Dalam 5 tahun terakhir, produksi pertanian nasional memperlihatkan arah peningkatan. Kenaikan ini didorong oleh perluasan lahan produktif dan pencatatan wilayah yang lebih baik.'}
            </p>
          </article>

          <article className="landing-chart-card">
            <h2>
              Komoditas Unggulan{' '}
              <span>(Berdasarkan Lahan)</span>
            </h2>

            {commodityChartData.length === 0 ? (
              <div className="landing-chart-empty">
                <p>Belum ada data komoditas tercatat</p>
              </div>
            ) : (
              <div className="landing-commodity-list">
                {commodityChartData.map((item) => (
                  <div className="landing-commodity-row" key={item.name}>
                    <span>{item.name}</span>

                    <div className="landing-commodity-track">
                      <i style={{ width: item.value, background: `linear-gradient(90deg, ${getCommodityColor(item.name)}, ${getCommodityColor(item.name)}88)` }} />
                    </div>

                    <strong>
                      {item.rawValue} lahan
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="landing-chart-card">
            <div className="landing-card-title-row">
              <h2>Perbandingan Wilayah</h2>
              <span style={{ fontSize: '12px', color: '#687972', background: '#f0f7f2', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>Top 5 Lokasi</span>
            </div>

            <BarComparisonChart regions={publicLahan} />
          </article>
        </section>

        {/* ── Insight ── */}
        <section
          id="laporan"
          className="landing-container landing-insight-section"
          aria-label="Insight wilayah"
        >
          <div className="landing-insight-main">
            <div className="landing-insight-icon">i</div>

            <div>
              <h2>{insightData.title}</h2>
              <p>{insightData.description}</p>
            </div>
          </div>

          <div className="landing-insight-metrics">
            {insightData.metrics.map((metric) => (
              <Metric
                key={metric.title}
                title={metric.title}
                value={metric.value}
                text={metric.text}
              />
            ))}
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="landing-container landing-cta-section">
          <div className="landing-cta-header">
            <p className="landing-eyebrow">Bergabung Sekarang</p>
            <h2>Kelola Potensi Desa Bersama Agrosync</h2>
            <p>
              Masuk sesuai peran Anda untuk mengakses fitur lengkap sistem
              manajemen potensi desa.
            </p>
          </div>

          <div className="landing-cta-grid">
            <Link to="/login" className="landing-cta-card">
              <div className="landing-cta-icon landing-cta-green">🌾</div>
              <h3>Petani</h3>
              <p>Kelola lahan, catat panen, dan lapor kendala pertanian Anda</p>
              <span className="landing-cta-arrow">Masuk →</span>
            </Link>

            <Link to="/login" className="landing-cta-card">
              <div className="landing-cta-icon landing-cta-blue">🏛️</div>
              <h3>Pengurus Desa</h3>
              <p>Pantau potensi desa, buat laporan, dan analisis wilayah</p>
              <span className="landing-cta-arrow">Masuk →</span>
            </Link>

            <Link to="/login" className="landing-cta-card">
              <div className="landing-cta-icon landing-cta-orange">🏞️</div>
              <h3>Pengelola Wisata</h3>
              <p>Kelola destinasi wisata, catat kunjungan, dan promosikan desa</p>
              <span className="landing-cta-arrow">Masuk →</span>
            </Link>

            <Link to="/login" className="landing-cta-card">
              <div className="landing-cta-icon landing-cta-purple">👥</div>
              <h3>Masyarakat</h3>
              <p>Jelajahi komoditas, wisata, dan potensi desa Anda</p>
              <span className="landing-cta-arrow">Masuk →</span>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div className="landing-footer-brand">
            <Link to="/" className="landing-logo">
              <img
                src={agrosyncLogo}
                alt=""
                className="landing-logo-image"
                aria-hidden="true"
              />
              <span>Agrosync</span>
            </Link>
            <p>
              Sistem Manajemen Potensi Desa terpadu. Observasi potensi
              pertanian, wisata, dan sumber daya desa dalam satu platform.
            </p>
          </div>

          <div className="landing-footer-links">
            <h4>Navigasi</h4>
            <a href="#beranda">Beranda</a>
            <a href="#potensi">Potensi</a>
            <a href="#peta">Peta</a>
            <a href="#wisata">Wisata</a>
            <a href="#produksi">Produksi</a>
          </div>

          <div className="landing-footer-links">
            <h4>Fitur</h4>
            <a href="#peta">Peta Komoditas</a>
            <a href="#wisata">Wisata Desa</a>
            <a href="#produksi">Data Produksi</a>
            <a href="#laporan">Insight Wilayah</a>
          </div>

          <div className="landing-footer-links">
            <h4>Akun</h4>
            <Link to="/login">Masuk</Link>
            <Link to="/register">Daftar</Link>
          </div>
        </div>

        <div className="landing-container landing-footer-bottom">
          <p>© 2026 Agrosync — MANPROSI. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub Components ─── */

function StatCard({ label, value, sub, numericValue }) {
  const counter = useCountUp(numericValue ?? 0, 1200);

  return (
    <article className="landing-stat-card" ref={counter.ref}>
      <div className="landing-stat-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path d="M12 21c-4.4-2.2-7-5.7-7-9.4A7 7 0 0 1 18.9 10h-2.1a5 5 0 0 0-9.8 1.6c0 2.5 1.7 5 5 6.8 1.6-.9 2.9-1.9 3.7-3.1h-3.4V13h7.1c-.5 3.3-3.1 6.2-7.4 8Z" />
        </svg>
      </div>

      <div>
        <p>{label}</p>
        <strong>{numericValue !== undefined ? counter.count : value}
          {numericValue !== undefined && (
            <span className="landing-stat-suffix">
              {' '}{value.replace(/[\d.,]+\s*/, '')}
            </span>
          )}
        </strong>
        <span>{sub}</span>
      </div>
    </article>
  );
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function Metric({ title, value, text }) {
  const isRankedList = Array.isArray(value);

  return (
    <article className="landing-metric-card">
      <span>{title}</span>
      {isRankedList ? (
        <ol className="landing-metric-ranking">
          {value.length > 0 ? value.map((item, index) => (
            <li key={item.name} className="landing-metric-rank-item">
              <span className="landing-rank-medal">{RANK_MEDALS[index] || `${index + 1}.`}</span>
              <span className="landing-rank-name">{item.name}</span>
              <span className="landing-rank-count">{item.count} lahan</span>
            </li>
          )) : (
            <strong>-</strong>
          )}
        </ol>
      ) : (
        <strong>{value}</strong>
      )}
      <p>{text}</p>
    </article>
  );
}

function TrendLineChart({ data }) {
  if (!data || data.length === 0) {
    // Fallback static chart
    return (
      <svg
        className="landing-line-chart"
        viewBox="0 0 620 260"
        role="img"
        aria-label="Grafik garis tren produksi nasional"
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

        {['2024', '2025', '2026', '2027', '2028'].map((year, index) => (
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

  // If only 1 year of data, show a bar chart instead of a line
  if (data.length === 1) {
    const item = data[0];
    const maxVal = Math.max(item.production, item.count, 1);

    return (
      <svg
        className="landing-line-chart"
        viewBox="0 0 620 260"
        role="img"
        aria-label={`Ringkasan produksi tahun ${item.year}`}
      >
        <text x="310" y="30" textAnchor="middle" fill="#374b44" fontSize="16" fontWeight="700">
          Tahun {item.year}
        </text>

        {/* Production bar */}
        <rect x="120" y="70" width={Math.max((item.production / maxVal) * 300, 30)} height="36" rx="8" fill="#315f4d" />
        <text x="110" y="94" textAnchor="end" fill="#51645d" fontSize="13" fontWeight="600">Produksi</text>
        <text x={130 + Math.max((item.production / maxVal) * 300, 30)} y="94" fill="#315f4d" fontSize="14" fontWeight="800">
          {Number(item.production).toLocaleString('id-ID')}
        </text>

        {/* Harvest count bar */}
        <rect x="120" y="130" width={Math.max((item.count / maxVal) * 300, 30)} height="36" rx="8" fill="#d9b06c" />
        <text x="110" y="154" textAnchor="end" fill="#51645d" fontSize="13" fontWeight="600">Panen</text>
        <text x={130 + Math.max((item.count / maxVal) * 300, 30)} y="154" fill="#7a6042" fontSize="14" fontWeight="800">
          {item.count} kali
        </text>

        <text x="310" y="220" textAnchor="middle" fill="#81908a" fontSize="12">
          Data akan bertambah seiring pencatatan panen baru
        </text>
      </svg>
    );
  }

  // Dynamic chart from real data (2+ years)
  const maxProduction = Math.max(...data.map((d) => d.production), 1);
  const chartWidth = 580;
  const chartHeight = 180;
  const padLeft = 60;
  const padTop = 20;

  const points = data.map((d, i) => {
    const x = padLeft + (i / Math.max(data.length - 1, 1)) * (chartWidth - padLeft);
    const y = padTop + chartHeight - (d.production / maxProduction) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`))
    .join(' ');

  const areaD = `${pathD} L${points[points.length - 1].x} ${padTop + chartHeight} L${points[0].x} ${padTop + chartHeight} Z`;

  return (
    <svg
      className="landing-line-chart"
      viewBox="0 0 620 260"
      role="img"
      aria-label="Grafik tren produksi dari data real"
    >
      <defs>
        <linearGradient id="lineFillDynamic" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2f6f55" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2f6f55" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padTop + chartHeight - ratio * chartHeight;
        return <line key={ratio} x1={padLeft} x2={chartWidth} y1={y} y2={y} />;
      })}

      {points.map((p) => (
        <text key={p.year} x={p.x} y={padTop + chartHeight + 30} textAnchor="middle">
          {p.year}
        </text>
      ))}

      <path d={areaD} fill="url(#lineFillDynamic)" />
      <path d={pathD} className="line-main" />

      {points.map((p) => (
        <g key={p.year}>
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#2f6f55"
            stroke="#fff"
            strokeWidth="2"
          />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#315f4d" fontSize="11" fontWeight="700">
            {Number(p.production).toLocaleString('id-ID')}
          </text>
        </g>
      ))}
    </svg>
  );
}

function BarComparisonChart({ regions }) {
  const regionData = useMemo(() => {
    if (!regions || regions.length === 0) {
      return [
        { label: 'Wilayah A', area: 118, count: 82, production: 95 },
        { label: 'Wilayah B', area: 76, count: 88, production: 98 },
        { label: 'Wilayah C', area: 82, count: 95, production: 116 },
      ];
    }

    const byLocation = {};
    regions.forEach((item) => {
      // Use shorter name: take first meaningful part of nama_tempat
      let loc = item.nama_tempat || item.place_name || item.location || 'Lainnya';
      if (loc === 'Area Komoditas' || loc === 'Lokasi belum diisi') return;

      // Shorten: take first 2 words max
      const words = loc.split(/[,\s]+/).filter(Boolean);
      if (words.length > 3) {
        loc = words.slice(0, 3).join(' ');
      }

      if (!byLocation[loc]) byLocation[loc] = { count: 0, area: 0 };
      byLocation[loc].count += 1;
      byLocation[loc].area += Number(item.area_ha) || 0;
    });

    return Object.entries(byLocation)
      .sort(([, a], [, b]) => {
        if (b.area !== a.area) return b.area - a.area;
        return b.count - a.count;
      })
      .slice(0, 5)
      .map(([label, data]) => ({
        label: label.length > 14 ? `${label.slice(0, 12)}…` : label,
        count: data.count,
        area: data.area > 0 ? Math.round(data.area * 100) / 100 : 0,
        production: data.count * 15,
      }));
  }, [regions]);

  if (regionData.length === 0) {
    return (
      <svg className="landing-bar-chart" viewBox="0 0 620 260">
        <text x="310" y="130" textAnchor="middle" fill="#81908a" fontSize="14">
          Belum ada data wilayah untuk dibandingkan
        </text>
      </svg>
    );
  }

  const colors = ['#315f4d', '#d9b06c', '#6f5840'];

  // Render as horizontal bars for better readability with small data
  const barHeight = 28;
  const gapY = 12;
  const startY = 55;
  const maxLabelWidth = 100;
  const barAreaWidth = 320;
  const maxCount = Math.max(...regionData.map((r) => r.count), 1);
  const maxArea = Math.max(...regionData.map((r) => r.area), 0.01);

  return (
    <svg
      className="landing-bar-chart"
      viewBox="0 0 620 260"
      role="img"
      aria-label="Grafik batang perbandingan wilayah"
    >
      {/* Legend */}
      <text x="30" y="28" fill="#374b44" fontSize="13" fontWeight="700">Jumlah Lahan</text>
      <text x="330" y="28" fill="#374b44" fontSize="13" fontWeight="700">Luas (ha)</text>

      {regionData.map((r, i) => {
        const y = startY + i * (barHeight + gapY);
        const barWidth = Math.max((r.count / maxCount) * (barAreaWidth / 2 - 20), 20);
        const areaBarWidth = maxArea > 0 ? Math.max((r.area / maxArea) * (barAreaWidth / 2 - 20), 20) : 20;

        return (
          <g key={r.label}>
            {/* Label */}
            <text x="30" y={y + barHeight / 2 + 5} fill="#3d5049" fontSize="12" fontWeight="700">
              {r.label}
            </text>

            {/* Count bar */}
            <rect
              x={maxLabelWidth + 30}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="6"
              fill={colors[i % 3]}
            />
            <text
              x={maxLabelWidth + 36 + barWidth}
              y={y + barHeight / 2 + 5}
              fill={colors[i % 3]}
              fontSize="13"
              fontWeight="800"
            >
              {r.count}
            </text>

            {/* Area bar */}
            <rect
              x={330}
              y={y}
              width={areaBarWidth}
              height={barHeight}
              rx="6"
              fill={colors[i % 3]}
              opacity="0.65"
            />
            <text
              x={336 + areaBarWidth}
              y={y + barHeight / 2 + 5}
              fill={colors[i % 3]}
              fontSize="13"
              fontWeight="800"
            >
              {r.area > 0 ? r.area.toFixed(2) : '-'}
            </text>
          </g>
        );
      })}

      {regionData.length <= 2 && (
        <text x="310" y="240" textAnchor="middle" fill="#81908a" fontSize="11">
          Data akan bertambah seiring petani menginput lahan baru
        </text>
      )}
    </svg>
  );
}
