import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { lahanService } from '../../services/lahanService';
import './LahanTidakTermanfaatkanPage.css';

const DEFAULT_CENTER = [-6.9175, 107.6191];
const DEFAULT_ZOOM = 18;
const MAX_ZOOM = 20;
const SELECTED_MAP_ZOOM = MAX_ZOOM;
const MAX_NATIVE_TILE_ZOOM = 18;
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
const MAP_SOURCE_TEXT = 'Sumber peta: Esri World Imagery.';
const INDONESIA_BOUNDS = [
  [-11.2, 94.5],
  [6.5, 141.5],
];

const INITIAL_FORM = {
  nama_lahan: '',
  nama_lokasi: '',
  nama_patokan: '',
  koordinat_lahan: '',
  luas: '',
  satuan_luas: 'm2',
  deskripsi: '',
};

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getCoordinateLabel(position) {
  if (!position) return '';
  return `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`;
}

function isCoordinateText(value) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

function getReportReference(item) {
  const reference = String(item.nama_tempat || '').trim();
  const name = String(item.nama_lahan || '').trim();
  const location = String(item.lokasi_lahan || '').trim();

  if (!reference || reference === name || reference === location) {
    return '';
  }

  return reference;
}

function getReportLocation(item) {
  const location = String(item.lokasi_lahan || '').trim();
  const reference = getReportReference(item);

  if (location && !isCoordinateText(location)) {
    return location;
  }

  if (reference) {
    return reference;
  }

  if (location) {
    return 'Titik koordinat tersimpan';
  }

  return 'Lokasi belum diisi';
}

function getAreaText(item) {
  const luas = Number(item.luas || 0);
  const satuan = item.satuan_luas || 'm2';

  return `${formatNumber(luas)} ${satuan}`;
}

function getReportPosition(item) {
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return [lat, lng];
}

function SatelliteTiles() {
  return (
    <>
      <TileLayer
        attribution={ESRI_ATTRIBUTION}
        maxNativeZoom={MAX_NATIVE_TILE_ZOOM}
        maxZoom={MAX_ZOOM}
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution="Labels &copy; OpenStreetMap contributors &copy; CARTO"
        maxNativeZoom={MAX_NATIVE_TILE_ZOOM}
        maxZoom={MAX_ZOOM}
        subdomains={['a', 'b', 'c', 'd']}
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
      />
    </>
  );
}

function isUnusedLand(item) {
  const status = String(item.status || '').toLowerCase();
  const komoditas = item.komoditas || item.Komoditas;

  return (
    status.includes('non') ||
    status.includes('belum') ||
    status.includes('tidak') ||
    !komoditas
  );
}

function isMapUiClick(event) {
  const target = event.originalEvent?.target;

  return Boolean(
    target?.closest?.(
      '.leaflet-popup, .leaflet-control, .unused-map-filter, .unused-map-tools',
    ),
  );
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      if (isMapUiClick(event)) {
        return;
      }

      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function MapFocus({ focusPosition }) {
  const map = useMap();

  useEffect(() => {
    if (focusPosition) {
      map.flyTo(focusPosition, SELECTED_MAP_ZOOM, {
        duration: 0.8,
      });
    }
  }, [map, focusPosition]);

  return null;
}

function MapResizeWatcher() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeMap = () => map.invalidateSize();

    resizeMap();
    requestAnimationFrame(resizeMap);

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(resizeMap);
    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function LahanTidakTermanfaatkanPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [position, setPosition] = useState(null);
  const [mapFocusPosition, setMapFocusPosition] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchingPatokan, setSearchingPatokan] = useState(false);
  const [patokanResults, setPatokanResults] = useState([]);
  const [patokanSearchStatus, setPatokanSearchStatus] = useState('idle');
  const [selectedPatokanName, setSelectedPatokanName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reportMarkers = useMemo(() => {
    return reports
      .map((item) => ({
        item,
        position: getReportPosition(item),
      }))
      .filter((marker) => marker.position);
  }, [reports]);

  const latestReports = useMemo(() => {
    if (reports.length === 0) {
      return [
        {
          id_lahan: 'fallback-1',
          nama_lahan: 'Lahan Kosong Dekat Sungai',
          lokasi_lahan: 'Sukapura',
          luas: 1250,
          satuan_luas: 'm2',
          created_at: '2024-05-20',
          statusLabel: 'Menunggu',
        },
        {
          id_lahan: 'fallback-2',
          nama_lahan: 'Lahan Terbengkalai',
          lokasi_lahan: 'Baleendah',
          luas: 2100,
          satuan_luas: 'm2',
          created_at: '2024-03-15',
          statusLabel: 'Diproses',
        },
      ];
    }

    return reports.slice(0, 2).map((item, index) => ({
      ...item,
      statusLabel: index === 0 ? 'Menunggu' : 'Diproses',
    }));
  }, [reports]);

  const loadReports = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await lahanService.getAll();
      const rows = Array.isArray(data.data) ? data.data : [];

      setReports(rows.filter(isUnusedLand));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat laporan lahan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleChange = (field, value) => {
    if (field === 'nama_patokan') {
      setPatokanResults([]);
      setPatokanSearchStatus('idle');
      setSelectedPatokanName('');
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePickLocation = (nextPosition) => {
    setPosition(nextPosition);
    setMapFocusPosition(null);
    setForm((current) => ({
      ...current,
      koordinat_lahan: getCoordinateLabel(nextPosition),
    }));
  };

  const handleClearSelectedLocation = () => {
    setPosition(null);
    setMapFocusPosition(null);
    setForm((current) => ({
      ...current,
      koordinat_lahan: '',
    }));
    setMessage('Titik lokasi yang ditandai sudah dibatalkan.');
    setError('');
  };

  const resetForm = (clearFeedback = true) => {
    setForm(INITIAL_FORM);
    setPosition(null);
    setMapFocusPosition(null);
    setPatokanResults([]);
    setPatokanSearchStatus('idle');
    setSelectedPatokanName('');
    if (clearFeedback) {
      setMessage('');
      setError('');
    }
  };

  const searchPatokan = async (keyword, { signal, showFeedback = false } = {}) => {
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
        {
          signal,
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const results = await response.json();
      const normalizedResults = results
        .map((item) => ({
          id: item.place_id,
          name: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
        }))
        .filter((item) => (
          item.id &&
          item.name &&
          !Number.isNaN(item.lat) &&
          !Number.isNaN(item.lng)
        ));

      if (normalizedResults.length === 0) {
        setPatokanResults([]);
        setPatokanSearchStatus('empty');
        if (showFeedback) {
          setError('Patokan tidak ditemukan. Coba gunakan nama tempat yang lebih spesifik.');
        }
        return;
      }

      setPatokanResults(normalizedResults);
      setPatokanSearchStatus('ready');
      if (showFeedback) {
        setMessage('Pilih salah satu hasil pencarian untuk mengarahkan peta.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }

      setPatokanResults([]);
      setPatokanSearchStatus('error');
      if (showFeedback) {
        setError('Gagal mencari patokan. Periksa koneksi internet lalu coba lagi.');
      }
    }
  };

  const handleSearchPatokan = async () => {
    const namaPatokan = form.nama_patokan.trim();
    const namaLokasi = form.nama_lokasi.trim();
    const keyword = [namaPatokan, namaLokasi].filter(Boolean).join(', ');

    setMessage('');
    setError('');
    setPatokanResults([]);

    if (keyword.length < 3) {
      setError('Isi nama patokan atau nama lokasi minimal 3 karakter untuk diarahkan ke peta.');
      return;
    }

    setSearchingPatokan(true);
    setPatokanSearchStatus('searching');

    await searchPatokan(keyword, { showFeedback: true });

    setSearchingPatokan(false);
  };

  const handleSelectPatokan = (result) => {
    const nextPosition = [result.lat, result.lng];
    const shortLocation = String(result.name || '')
      .split(',')
      .slice(0, 4)
      .join(',')
      .trim();
    const placeName = String(result.name || '').split(',')[0]?.trim() || shortLocation;

    setPosition(nextPosition);
    setMapFocusPosition(nextPosition);
    setPatokanResults([]);
    setPatokanSearchStatus('selected');
    setSelectedPatokanName(placeName);
    setForm((current) => ({
      ...current,
      nama_patokan: placeName,
      nama_lokasi: current.nama_lokasi || shortLocation,
      koordinat_lahan: getCoordinateLabel(nextPosition),
    }));
    setMessage('Patokan dipilih. Peta diarahkan ke lokasi tersebut.');
  };

  useEffect(() => {
    const namaPatokan = form.nama_patokan.trim();
    const namaLokasi = form.nama_lokasi.trim();

    if (!namaPatokan || namaPatokan === selectedPatokanName) {
      return undefined;
    }

    if (namaPatokan.length < 3) {
      setPatokanResults([]);
      setPatokanSearchStatus('idle');
      return undefined;
    }

    const controller = new AbortController();
    const keyword = [namaPatokan, namaLokasi].filter(Boolean).join(', ');

    setPatokanSearchStatus('searching');

    const timeoutId = window.setTimeout(() => {
      searchPatokan(keyword, { signal: controller.signal });
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [form.nama_patokan, form.nama_lokasi, selectedPatokanName]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    if (!position) {
      setSubmitting(false);
      setError('Pilih titik lokasi lahan pada peta terlebih dahulu.');
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      const namaLokasi = form.nama_lokasi.trim();
      const namaPatokan = form.nama_patokan.trim();
      const catatan = [
        'Laporan lahan tidak termanfaatkan',
        namaPatokan ? `Patokan lokasi: ${namaPatokan}` : null,
        form.deskripsi ? `Deskripsi: ${form.deskripsi}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      const payload = {
        nama_lahan: form.nama_lahan,
        nama_tempat: namaPatokan || namaLokasi || form.nama_lahan,
        lokasi_lahan: namaLokasi,
        luas: Number(form.luas || 0),
        satuan_luas: form.satuan_luas,
        latitude: position[0],
        longitude: position[1],
        tanggal_tanam_terakhir: today,
        status: 'nonaktif',
        deskripsi: form.deskripsi,
        catatan,
      };

      await lahanService.create(payload);
      resetForm(false);
      setMessage('Laporan lahan berhasil disimpan.');
      await loadReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan laporan lahan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unused-page">
      <header className="unused-header">
        <h1>Lahan Tidak Termanfaatkan</h1>
        <p>
          Laporkan lahan yang belum dimanfaatkan dengan baik agar dapat ditindaklanjuti.
        </p>
      </header>

      {message && <div className="unused-message is-success">{message}</div>}
      {error && <div className="unused-message is-error">{error}</div>}

      <section className="unused-layout">
        <form className="unused-form-card" onSubmit={handleSubmit}>
          <div className="unused-card-heading">
            <div>
              <h2>Form Laporan Lahan</h2>
              <p>Lengkapi informasi lahan, lalu pilih titik lokasi pada peta di bawah form.</p>
            </div>
          </div>

          <div className="unused-form-grid">
            <label className="unused-field">
              <span>Nama Lahan</span>
              <input
                type="text"
                value={form.nama_lahan}
                onChange={(event) => handleChange('nama_lahan', event.target.value)}
                placeholder="Contoh: Lahan kosong dekat sungai"
                required
              />
            </label>

            <label className="unused-field">
              <span>Luas Lahan</span>
              <div className="unused-unit-input">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.luas}
                  onChange={(event) => handleChange('luas', event.target.value)}
                  placeholder="Masukkan luas lahan"
                  required
                />
                <select
                  value={form.satuan_luas}
                  onChange={(event) => handleChange('satuan_luas', event.target.value)}
                  aria-label="Satuan luas lahan"
                >
                  <option value="m2">m2</option>
                  <option value="ha">ha</option>
                  <option value="are">are</option>
                </select>
              </div>
            </label>

            <label className="unused-field">
              <span>Nama Lokasi</span>
              <div className="unused-location-input">
                <input
                  type="text"
                  value={form.nama_lokasi}
                  onChange={(event) => handleChange('nama_lokasi', event.target.value)}
                  placeholder="Contoh: Dusun Sukamaju, Desa Cibiru"
                  required
                />
                <span aria-hidden="true">
                  <UnusedIcon name="pin" />
                </span>
              </div>
            </label>

            <label className="unused-field">
              <span>Nama Patokan</span>
              <div className="unused-search-wrap">
                <div className="unused-search-input">
                  <input
                    type="text"
                    value={form.nama_patokan}
                    onChange={(event) => handleChange('nama_patokan', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSearchPatokan();
                      }
                    }}
                    placeholder="Contoh: Bogor, balai desa, atau jalan utama"
                  />
                  <button type="button" onClick={handleSearchPatokan} disabled={searchingPatokan}>
                    {searchingPatokan ? 'Mencari...' : 'Cari'}
                  </button>
                </div>
                {patokanResults.length > 0 && (
                  <div className="unused-search-results">
                    {patokanResults.map((result) => (
                      <button
                        type="button"
                        key={result.id}
                        onClick={() => handleSelectPatokan(result)}
                      >
                        {result.name.split(',').slice(0, 3).join(', ')}
                      </button>
                    ))}
                  </div>
                )}
                {patokanResults.length === 0 && patokanSearchStatus === 'searching' && (
                  <div className="unused-search-results is-status">
                    <span>Mencari patokan...</span>
                  </div>
                )}
                {patokanResults.length === 0 && patokanSearchStatus === 'empty' && (
                  <div className="unused-search-results is-status">
                    <span>Patokan tidak ditemukan.</span>
                  </div>
                )}
              </div>
            </label>

            <label className="unused-field unused-field-wide">
              <span>Koordinat Titik Lahan</span>
              <div className="unused-location-input">
                <input
                  type="text"
                  value={form.koordinat_lahan}
                  placeholder="Klik lokasi lahan pada peta di bawah"
                  readOnly
                  required
                />
                <span aria-hidden="true">
                  <UnusedIcon name="pin" />
                </span>
              </div>
            </label>

            <label className="unused-field unused-field-wide">
              <span>Deskripsi Lahan</span>
              <textarea
                value={form.deskripsi}
                onChange={(event) => handleChange('deskripsi', event.target.value)}
                placeholder="Tuliskan deskripsi lengkap mengenai kondisi, akses, atau kendala pada lahan."
                rows={4}
              />
            </label>

            <div className="unused-field unused-field-wide">
              <span>Foto Lahan (Opsional)</span>
              <label className="unused-upload">
                <input type="file" accept="image/*" />
                <UnusedIcon name="upload" />
                <strong>Klik untuk mengunggah foto</strong>
                <small>PNG, JPG maksimal 5MB</small>
              </label>
            </div>
          </div>

          <div className="unused-actions">
            <button type="button" className="unused-secondary" onClick={() => resetForm()}>
              Reset
            </button>
            <button type="submit" className="unused-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
            </button>
          </div>
        </form>

        <div className="unused-side">
          <div className="unused-map-card">
            <div className="unused-map-filter">
              <span className="unused-filter-icon">
                <UnusedIcon name="map" />
              </span>
              <select value="lahan-tidak-termanfaatkan" disabled>
                <option value="lahan-tidak-termanfaatkan">
                  Lahan Tidak Termanfaatkan
                </option>
              </select>
            </div>

            {position && (
              <div className="unused-map-tools">
                <button
                  type="button"
                  className="unused-clear-location"
                  onClick={handleClearSelectedLocation}
                >
                  Batalkan Titik
                </button>
              </div>
            )}

            <MapContainer
              center={DEFAULT_CENTER}
              className="unused-map"
              maxBounds={INDONESIA_BOUNDS}
              maxBoundsViscosity={0.85}
              maxZoom={MAX_ZOOM}
              minZoom={5}
              scrollWheelZoom
              zoom={DEFAULT_ZOOM}
            >
              <SatelliteTiles />
              <MapClickHandler onPick={handlePickLocation} />
              <MapFocus focusPosition={mapFocusPosition} />
              <MapResizeWatcher />
              {reportMarkers.map((marker) => (
                <Marker
                  icon={markerIcon}
                  key={marker.item.id_lahan}
                  position={marker.position}
                  title={marker.item.nama_lahan}
                >
                  <Popup>
                    <div className="unused-map-popup">
                      <strong>{marker.item.nama_lahan}</strong>
                      <span>{getReportLocation(marker.item)}</span>
                      {getReportReference(marker.item) && (
                        <span>Patokan: {getReportReference(marker.item)}</span>
                      )}
                      <small>Luas: {getAreaText(marker.item)}</small>
                      <small>Dilaporkan: {formatDate(marker.item.created_at)}</small>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {position && (
                <Marker icon={markerIcon} position={position}>
                  <Popup>
                    <div className="unused-map-popup">
                      <strong>Lokasi yang ditandai</strong>
                      <span>{getCoordinateLabel(position)}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleClearSelectedLocation();
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        Batalkan titik ini
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
            <small>{MAP_SOURCE_TEXT} Klik peta untuk memilih lokasi lahan.</small>
          </div>

          <div className="unused-latest-card">
            <div className="unused-latest-heading">
              <h2>Laporan Terbaru</h2>
              <button type="button">Lihat Semua</button>
            </div>

            <div className="unused-latest-list">
              {loading ? (
                <div className="unused-loading">Memuat laporan...</div>
              ) : (
                latestReports.map((item) => (
                  <article className="unused-report-item" key={item.id_lahan}>
                    <div className="unused-report-thumb" />
                    <div>
                      <strong>{item.nama_lahan}</strong>
                      <span>{getReportLocation(item)}</span>
                      {getReportReference(item) && (
                        <span className="unused-report-reference">
                          Patokan: {getReportReference(item)}
                        </span>
                      )}
                      <small>
                        Dilaporkan: {formatDate(item.created_at)} | {getAreaText(item)}
                      </small>
                    </div>
                    <em
                      className={
                        item.statusLabel === 'Menunggu'
                          ? 'unused-status is-waiting'
                          : 'unused-status is-process'
                      }
                    >
                      {item.statusLabel}
                    </em>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function UnusedIcon({ name }) {
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
    map: (
      <svg {...props}>
        <path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" />
        <path d="M8 4v13" />
        <path d="M16 7v13" />
      </svg>
    ),
    pin: (
      <svg {...props}>
        <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    ),
    upload: (
      <svg {...props}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    ),
  };

  return icons[name] || icons.pin;
}
