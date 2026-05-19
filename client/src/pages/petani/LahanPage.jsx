import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';

import { lahanService } from '../../services/lahanService';
import { komoditasService } from '../../services/komoditasService';
import jagungImage from '../../assets/jagung.jpeg';
import kopiImage from '../../assets/kopi.jpeg';
import padiImage from '../../assets/padi.jpeg';
import sayuranImage from '../../assets/sayuran.jpeg';

import './LahanPage.css';

const DEFAULT_CENTER = [-6.9175, 107.6191];
const MAX_NATIVE_TILE_ZOOM = 19;
const MAX_MAP_ZOOM = MAX_NATIVE_TILE_ZOOM;
const DEFAULT_MAP_ZOOM = 18;
const SELECTED_MAP_ZOOM = MAX_MAP_ZOOM;

const INDONESIA_BOUNDS = [
  [-11.2, 94.5],
  [6.5, 141.5],
];

const defaultForm = {
  nama_lahan: '',
  id_komoditas: '',
  luas: '',
  satuan_luas: 'ha',
  lokasi_lahan: '',
  tanggal_tanam_terakhir: '',
  latitude: '',
  longitude: '',
  polygon_lahan: [],
  catatan: '',
  status: 'aktif',
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

const vertexIcon = L.divIcon({
  className: 'lahan-vertex-icon-wrapper',
  html: '<div class="lahan-vertex-icon"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function LahanIcon({ name, size = 18 }) {
  const commonProps = {
    width: size,
    height: size,
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
      <svg {...commonProps}>
        <path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" />
        <path d="M8 4v13" />
        <path d="M16 7v13" />
      </svg>
    ),
    pencil: (
      <svg {...commonProps}>
        <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
        <path d="m13 7 4 4" />
      </svg>
    ),
    check: (
      <svg {...commonProps}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),
    trash: (
      <svg {...commonProps}>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </svg>
    ),
    leaf: (
      <svg {...commonProps}>
        <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z" />
        <path d="M5 19c4-5 8-8 14-14" />
      </svg>
    ),
    document: (
      <svg {...commonProps}>
        <path d="M7 3h7l4 4v14H7V3Z" />
        <path d="M14 3v5h5" />
        <path d="M10 12h5" />
        <path d="M10 16h5" />
      </svg>
    ),
    crop: (
      <svg {...commonProps}>
        <path d="M4 4h16v16H4V4Z" />
        <path d="M4 12h16" />
        <path d="M12 4v16" />
      </svg>
    ),
    location: (
      <svg {...commonProps}>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    calendar: (
      <svg {...commonProps}>
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 10h16" />
      </svg>
    ),
    status: (
      <svg {...commonProps}>
        <path d="M12 3 4 7v6c0 5 3.5 7.5 8 8 4.5-.5 8-3 8-8V7l-8-4Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function MapTiles() {
  return (
    <>
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
    </>
  );
}

function PickLocation({
  isDrawingPolygon,
  onPick,
  onAddPolygonPoint,
}) {
  useMapEvents({
    click(event) {
      if (isDrawingPolygon) {
        onAddPolygonPoint(event.latlng);
        return;
      }

      onPick(event.latlng);
    },
  });

  return null;
}

function MapFocus({ focusPosition, selectedPosition }) {
  const map = useMap();

  useEffect(() => {
    if (focusPosition) {
      map.flyTo(focusPosition, SELECTED_MAP_ZOOM, {
        duration: 0.8,
      });
      return;
    }

    if (selectedPosition) {
      map.setView(selectedPosition, SELECTED_MAP_ZOOM);
      return;
    }

    map.setView(DEFAULT_CENTER, DEFAULT_MAP_ZOOM);
  }, [map, focusPosition, selectedPosition]);

  return null;
}

function getLocationText(item) {
  return (
    item.lokasi_lahan ||
    item.lokasi?.nama_lokasi ||
    item.lokasi?.nama_desa ||
    item.lokasi?.alamat ||
    item.lokasi?.kecamatan ||
    item.lokasi?.kabupaten ||
    item.lokasi?.kabupaten_kota ||
    item.Lokasi?.nama_lokasi ||
    item.Lokasi?.nama_desa ||
    item.Lokasi?.alamat ||
    item.Lokasi?.kecamatan ||
    item.Lokasi?.kabupaten ||
    item.Lokasi?.kabupaten_kota ||
    'Lokasi belum diisi'
  );
}

function getKomoditasText(item) {
  return (
    item.komoditas?.nama_komoditas ||
    item.Komoditas?.nama_komoditas ||
    'Komoditas belum dipilih'
  );
}

function getKomoditasImage(item) {
  const komoditas = getKomoditasText(item).toLowerCase();

  if (komoditas.includes('jagung')) {
    return { src: jagungImage, className: 'is-jagung' };
  }

  if (komoditas.includes('kopi')) {
    return { src: kopiImage, className: 'is-kopi' };
  }

  if (komoditas.includes('padi')) {
    return { src: padiImage, className: 'is-padi' };
  }

  if (komoditas.includes('sayur')) {
    return { src: sayuranImage, className: 'is-sayuran' };
  }

  return null;
}

function getCoordinate(item, field) {
  return item[field] || item.lokasi?.[field] || item.Lokasi?.[field] || '';
}

function formatArea(item) {
  if (!item?.luas) return '-';

  return `${item.luas} ${item.satuan_luas || 'ha'}`;
}

function formatCoordinateLabel(latitude, longitude) {
  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

function formatDateDisplay(value) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getHarvestEstimate(item) {
  if (!item?.tanggal_tanam_terakhir) return '-';

  const date = new Date(`${item.tanggal_tanam_terakhir}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '-';

  date.setMonth(date.getMonth() + 3);

  return `${formatDateDisplay(date)} (+3 bulan)`;
}

function getPolygonPoints(item) {
  const polygon = item.polygon_lahan;

  if (!polygon) return [];

  if (typeof polygon === 'string') {
    try {
      const parsed = JSON.parse(polygon);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(polygon) ? polygon : [];
}

function getPolygonCenter(points) {
  if (!Array.isArray(points) || points.length === 0) return null;

  const total = points.reduce(
    (accumulator, point) => {
      return {
        lat: accumulator.lat + Number(point[0]),
        lng: accumulator.lng + Number(point[1]),
      };
    },
    { lat: 0, lng: 0 },
  );

  return [
    Number((total.lat / points.length).toFixed(8)),
    Number((total.lng / points.length).toFixed(8)),
  ];
}

function DetailInfoItem({ icon, label, value, children }) {
  return (
    <div className="lahan-info-item">
      <div className="lahan-info-icon" aria-hidden="true">
        {icon}
      </div>

      <div>
        <strong>{label}</strong>
        {children || <p>{value || '-'}</p>}
      </div>
    </div>
  );
}

export default function LahanPage() {
  const [lahan, setLahan] = useState([]);
  const [komoditas, setKomoditas] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [mapFocusPosition, setMapFocusPosition] = useState(null);

  const selectedPosition = useMemo(() => {
    if (!form.latitude || !form.longitude) return null;

    return [Number(form.latitude), Number(form.longitude)];
  }, [form.latitude, form.longitude]);

  const polygonCenter = useMemo(() => {
    return getPolygonCenter(polygonPoints);
  }, [polygonPoints]);

  const activeMapPosition = selectedPosition || polygonCenter;

  const visibleLahan = useMemo(() => {
    if (filterStatus === 'semua') return lahan;

    return lahan.filter((item) => item.status === filterStatus);
  }, [lahan, filterStatus]);

  const selectedDetail = useMemo(() => {
    if (!detailId) return null;

    return (
      lahan.find((item) => String(item.id_lahan) === String(detailId)) || null
    );
  }, [detailId, lahan]);

  const loadData = async () => {
    setLoading(true);
    setMessage('');

    try {
      const [lahanResponse, komoditasResponse] = await Promise.all([
        lahanService.getAll(),
        komoditasService.getAll(),
      ]);

      const nextLahan = lahanResponse.data.data || [];

      setLahan(nextLahan);
      setKomoditas(komoditasResponse.data.data || []);

      return nextLahan;
    } catch (error) {
      console.error('Load lahan page error:', error);

      setMessage(
        error.response?.data?.message ||
          'Gagal mengambil data lahan atau komoditas.',
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetEditorState = () => {
    setEditingId(null);
    setForm(defaultForm);
    setPolygonPoints([]);
    setPlaceSearchQuery('');
    setPlaceSearchResults([]);
    setMapFocusPosition(null);
    setIsDrawingPolygon(false);
  };

  const syncEditorWithItem = (item) => {
    const savedPolygon = getPolygonPoints(item);
    const locationText = getLocationText(item);

    setEditingId(item.id_lahan);
    setPolygonPoints(savedPolygon);
    setIsDrawingPolygon(false);

    setForm({
      nama_lahan: item.nama_lahan || '',
      id_komoditas: item.id_komoditas || '',
      luas: item.luas || '',
      satuan_luas: item.satuan_luas || 'ha',
      lokasi_lahan: locationText,
      tanggal_tanam_terakhir: item.tanggal_tanam_terakhir || '',
      latitude: getCoordinate(item, 'latitude'),
      longitude: getCoordinate(item, 'longitude'),
      polygon_lahan: savedPolygon,
      catatan: item.catatan || item.deskripsi || '',
      status: item.status || 'aktif',
    });

    setPlaceSearchQuery(locationText === 'Lokasi belum diisi' ? '' : locationText);
    setPlaceSearchResults([]);
    setMapFocusPosition(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'latitude' || name === 'longitude') {
      const nextLatitude = name === 'latitude' ? value : form.latitude;
      const nextLongitude = name === 'longitude' ? value : form.longitude;
      const hasValidCoordinate =
        nextLatitude &&
        nextLongitude &&
        !Number.isNaN(Number(nextLatitude)) &&
        !Number.isNaN(Number(nextLongitude));

      if (hasValidCoordinate) {
        const locationLabel = formatCoordinateLabel(nextLatitude, nextLongitude);

        setForm((previous) => ({
          ...previous,
          [name]: value,
          lokasi_lahan: locationLabel,
        }));
        setPlaceSearchQuery(locationLabel);
        setMapFocusPosition(null);
        return;
      }
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePickLocation = (latlng) => {
    const locationLabel = formatCoordinateLabel(latlng.lat, latlng.lng);

    setForm((previous) => ({
      ...previous,
      latitude: latlng.lat.toFixed(8),
      longitude: latlng.lng.toFixed(8),
      lokasi_lahan: locationLabel,
    }));

    setPlaceSearchQuery(locationLabel);
    setPlaceSearchResults([]);
    setMapFocusPosition(null);
  };

  const handleSearchPlace = async () => {
    const keyword = placeSearchQuery.trim();

    if (keyword.length < 3) {
      setMessage('Masukkan minimal 3 karakter untuk mencari tempat.');
      return;
    }

    setPlaceSearchLoading(true);
    setPlaceSearchResults([]);
    setMessage('');

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
        .filter((item) => {
          return (
            item.id &&
            item.name &&
            !Number.isNaN(item.lat) &&
            !Number.isNaN(item.lng)
          );
        });

      setPlaceSearchResults(normalizedResults);

      setMessage(
        normalizedResults.length > 0
          ? 'Pilih salah satu hasil pencarian untuk mengarahkan map sebagai patokan.'
          : 'Tempat tidak ditemukan. Coba gunakan kata kunci lain.',
      );
    } catch (error) {
      console.error('Search place error:', error);
      setMessage('Gagal mencari tempat. Periksa koneksi internet lalu coba lagi.');
    } finally {
      setPlaceSearchLoading(false);
    }
  };

  const handleSelectPlace = (place) => {
    const nextPosition = [place.lat, place.lng];
    const shortName = place.name.split(',').slice(0, 4).join(', ');

    setPlaceSearchQuery(shortName);
    setPlaceSearchResults([]);
    setMapFocusPosition(nextPosition);
    setMessage('Map diarahkan ke patokan. Klik peta untuk memilih titik lahan yang tepat.');
  };

  const handleViewDetail = (item) => {
    setDetailId(item.id_lahan);
    syncEditorWithItem(item);
    setMessage('');
  };

  const handleBackToList = () => {
    setDetailId(null);
    resetEditorState();
    setMessage('');
  };

  const handleAddNew = () => {
    setDetailId(null);
    resetEditorState();
    setMessage('');
  };

  const handleAddPolygonPoint = (latlng) => {
    const nextPoint = [
      Number(latlng.lat.toFixed(8)),
      Number(latlng.lng.toFixed(8)),
    ];

    setPolygonPoints((previous) => {
      const next = [...previous, nextPoint];

      setForm((prevForm) => ({
        ...prevForm,
        polygon_lahan: next,
      }));

      return next;
    });
  };

  const handleMovePolygonPoint = (index, latlng) => {
    setPolygonPoints((previous) => {
      const next = previous.map((point, pointIndex) => {
        if (pointIndex === index) {
          return [
            Number(latlng.lat.toFixed(8)),
            Number(latlng.lng.toFixed(8)),
          ];
        }

        return point;
      });

      const center = getPolygonCenter(next);
      const locationLabel = center ? formatCoordinateLabel(center[0], center[1]) : '';

      setForm((prevForm) => ({
        ...prevForm,
        polygon_lahan: next,
        latitude: center ? String(center[0]) : prevForm.latitude,
        longitude: center ? String(center[1]) : prevForm.longitude,
        lokasi_lahan: locationLabel || prevForm.lokasi_lahan,
      }));

      if (locationLabel) {
        setPlaceSearchQuery(locationLabel);
        setMapFocusPosition(null);
      }

      return next;
    });
  };

  const handleStartDrawPolygon = () => {
    setIsDrawingPolygon(true);
    setMessage(
      'Mode gambar aktif. Klik beberapa titik pada peta untuk membuat batas lahan.',
    );
  };

  const handleFinishDrawPolygon = () => {
    if (polygonPoints.length < 3) {
      setMessage('Minimal 3 titik diperlukan untuk membuat batas lahan.');
      return;
    }

    const center = getPolygonCenter(polygonPoints);
    const locationLabel = center ? formatCoordinateLabel(center[0], center[1]) : '';

    setIsDrawingPolygon(false);

    setForm((previous) => ({
      ...previous,
      polygon_lahan: polygonPoints,
      latitude: previous.latitude || String(center?.[0] || ''),
      longitude: previous.longitude || String(center?.[1] || ''),
      lokasi_lahan: locationLabel || previous.lokasi_lahan,
    }));

    if (locationLabel) {
      setPlaceSearchQuery(locationLabel);
    }

    setMessage(
      'Batas lahan berhasil dibuat. Titik kuning sekarang bisa digeser bebas.',
    );
  };

  const handleClearPolygon = () => {
    setIsDrawingPolygon(false);
    setPolygonPoints([]);

    setForm((previous) => ({
      ...previous,
      polygon_lahan: [],
    }));

    setMessage('Batas lahan dihapus.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        id_komoditas: form.id_komoditas || null,
        luas: Number(form.luas),
        lokasi_lahan: form.lokasi_lahan || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        polygon_lahan: polygonPoints.length >= 3 ? polygonPoints : null,
        tanggal_tanam_terakhir: form.tanggal_tanam_terakhir || null,
      };

      if (editingId) {
        await lahanService.update(editingId, payload);
        const nextLahan = await loadData();

        if (detailId) {
          const updatedItem = nextLahan.find(
            (item) => String(item.id_lahan) === String(detailId),
          );

          if (updatedItem) {
            syncEditorWithItem(updatedItem);
          }
        } else {
          resetEditorState();
        }

        setMessage('Data lahan berhasil diperbarui.');
      } else {
        await lahanService.create(payload);
        resetEditorState();
        await loadData();
        setMessage('Data lahan berhasil disimpan.');
      }
    } catch (error) {
      console.error('Save lahan error:', error);

      setMessage(
        error.response?.data?.message || 'Gagal menyimpan data lahan.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    syncEditorWithItem(item);
    setMessage(
      'Mode edit aktif. Kamu bisa menggeser titik kuning untuk mengubah bentuk batas lahan.',
    );
  };

  const handleCancel = () => {
    if (selectedDetail) {
      syncEditorWithItem(selectedDetail);
      setMessage('Perubahan dibatalkan.');
      return;
    }

    resetEditorState();
    setMessage('');
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Hapus data lahan ini?');

    if (!confirmed) return;

    try {
      await lahanService.remove(id);

      if (String(detailId) === String(id)) {
        setDetailId(null);
        resetEditorState();
      }

      setMessage('Data lahan berhasil dihapus.');
      await loadData();
    } catch (error) {
      console.error('Delete lahan error:', error);

      setMessage(
        error.response?.data?.message || 'Gagal menghapus data lahan.',
      );
    }
  };

  return (
    <div className="lahan-page-shell">
      <div className="lahan-page-header">
        <div>
          <p className="lahan-page-kicker">Lahan Saya</p>
          <h1>{selectedDetail ? 'Detail Lahan' : 'Peta Lahan'}</h1>
          <p>
            {selectedDetail
              ? 'Informasi lengkap lahan pertanian.'
              : 'Lihat sebaran dan detail lahan pertanian Anda.'}
          </p>
        </div>

        <button
          type="button"
          className="lahan-add-button"
          onClick={handleAddNew}
        >
          + Tambahkan Lahan Baru
        </button>
      </div>

      {message && <div className="lahan-message">{message}</div>}

      <div className="lahan-main-grid">
        {selectedDetail ? (
          <section className="lahan-detail-column">
            <button
              type="button"
              className="lahan-back-button"
              onClick={handleBackToList}
            >
              ← Kembali ke daftar lahan
            </button>

            <div className="lahan-detail-map-card">
              <div className="lahan-map-filter">
                <span className="lahan-filter-icon">
                  <LahanIcon name="map" size={22} />
                </span>

                <select value="detail" disabled>
                  <option value="detail">{selectedDetail.nama_lahan}</option>
                </select>
              </div>

              <MapContainer
                key={`detail-map-${selectedDetail.id_lahan}`}
                center={activeMapPosition || DEFAULT_CENTER}
                zoom={activeMapPosition ? SELECTED_MAP_ZOOM : DEFAULT_MAP_ZOOM}
                minZoom={5}
                maxZoom={MAX_MAP_ZOOM}
                maxBounds={INDONESIA_BOUNDS}
                maxBoundsViscosity={0.85}
                scrollWheelZoom
                className="lahan-detail-map"
              >
                <MapTiles />

                <PickLocation
                  isDrawingPolygon={isDrawingPolygon}
                  onPick={handlePickLocation}
                  onAddPolygonPoint={handleAddPolygonPoint}
                />

                <MapFocus
                  focusPosition={mapFocusPosition}
                  selectedPosition={activeMapPosition}
                />

                {polygonPoints.length >= 3 && (
                  <Polygon
                    positions={polygonPoints}
                    pathOptions={{
                      color: '#facc15',
                      weight: 4,
                      fillColor: '#facc15',
                      fillOpacity: 0.18,
                    }}
                  />
                )}

                {polygonPoints.map((point, index) => (
                  <Marker
                    key={`detail-vertex-${index}`}
                    position={point}
                    icon={vertexIcon}
                    draggable
                    eventHandlers={{
                      drag: (event) => {
                        const latlng = event.target.getLatLng();
                        handleMovePolygonPoint(index, latlng);
                      },
                      dragend: (event) => {
                        const latlng = event.target.getLatLng();
                        handleMovePolygonPoint(index, latlng);
                      },
                    }}
                  />
                ))}

                {selectedPosition && (
                  <Marker position={selectedPosition} icon={markerIcon}>
                    <Popup>Lokasi lahan</Popup>
                  </Marker>
                )}
              </MapContainer>

              <small>
                Sumber peta: Esri World Imagery. Klik peta untuk memperbarui
                titik lokasi lahan.
              </small>
            </div>

            <p className="lahan-detail-map-meta">
              Luas: {formatArea(selectedDetail)}
            </p>

            <div className="lahan-info-card">
              <h2>Informasi Lahan</h2>

              <div className="lahan-info-grid">
                <div className="lahan-info-column">
                  <DetailInfoItem
                    icon={<LahanIcon name="document" size={20} />}
                    label="Nama Lahan"
                    value={selectedDetail.nama_lahan}
                  />

                  <DetailInfoItem
                    icon={<LahanIcon name="leaf" size={20} />}
                    label="Komoditas Utama"
                    value={getKomoditasText(selectedDetail)}
                  />

                  <DetailInfoItem
                    icon={<LahanIcon name="crop" size={20} />}
                    label="Luas Lahan"
                    value={formatArea(selectedDetail)}
                  />

                  <DetailInfoItem
                    icon={<LahanIcon name="location" size={20} />}
                    label="Lokasi Lahan"
                    value={getLocationText(selectedDetail)}
                  />
                </div>

                <div className="lahan-info-column">
                  <DetailInfoItem
                    icon={<LahanIcon name="status" size={20} />}
                    label="Status Lahan"
                  >
                    <span
                      className={`lahan-status ${
                        selectedDetail.status === 'aktif'
                          ? 'is-active'
                          : 'is-muted'
                      }`}
                    >
                      {selectedDetail.status || 'aktif'}
                    </span>
                  </DetailInfoItem>

                  <DetailInfoItem
                    icon={<LahanIcon name="calendar" size={20} />}
                    label="Tanggal Tanam Terakhir"
                    value={formatDateDisplay(
                      selectedDetail.tanggal_tanam_terakhir,
                    )}
                  />

                  <DetailInfoItem
                    icon={<LahanIcon name="calendar" size={20} />}
                    label="Estimasi Panen"
                    value={getHarvestEstimate(selectedDetail)}
                  />
                </div>
              </div>

              <div className="lahan-info-note">
                <strong>Catatan</strong>
                <p>{selectedDetail.catatan || selectedDetail.deskripsi || '-'}</p>
              </div>
            </div>
          </section>
        ) : (
        <section className="lahan-left-column">
          <div className="lahan-map-card">
            <div className="lahan-map-filter">
              <span className="lahan-filter-icon">
                <LahanIcon name="map" size={22} />
              </span>

              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="semua">Semua Lahan</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="lahan-polygon-tools">
              <button
                type="button"
                className={isDrawingPolygon ? 'is-active' : ''}
                onClick={handleStartDrawPolygon}
              >
                <LahanIcon name="pencil" />
                <span>Gambar Batas</span>
              </button>

              <button type="button" onClick={handleFinishDrawPolygon}>
                <LahanIcon name="check" />
                <span>Selesai</span>
              </button>

              <button type="button" onClick={handleClearPolygon}>
                <LahanIcon name="trash" />
                <span>Hapus</span>
              </button>
            </div>

            <MapContainer
              center={activeMapPosition || DEFAULT_CENTER}
              zoom={activeMapPosition ? SELECTED_MAP_ZOOM : DEFAULT_MAP_ZOOM}
              minZoom={5}
              maxZoom={MAX_MAP_ZOOM}
              maxBounds={INDONESIA_BOUNDS}
              maxBoundsViscosity={0.85}
              scrollWheelZoom
              className="lahan-map"
            >
              <MapTiles />

              <PickLocation
                isDrawingPolygon={isDrawingPolygon}
                onPick={handlePickLocation}
                onAddPolygonPoint={handleAddPolygonPoint}
              />

              <MapFocus
                focusPosition={mapFocusPosition}
                selectedPosition={activeMapPosition}
              />

              {/* Polygon lahan tersimpan selain yang sedang diedit */}
              {visibleLahan.map((item) => {
                if (editingId && item.id_lahan === editingId) return null;

                const polygon = getPolygonPoints(item);

                if (polygon.length < 3) return null;

                return (
                  <Polygon
                    key={`polygon-${item.id_lahan}`}
                    positions={polygon}
                    pathOptions={{
                      color: '#facc15',
                      weight: 3,
                      fillColor: '#facc15',
                      fillOpacity: 0.12,
                    }}
                  >
                    <Popup>
                      <strong>{item.nama_lahan}</strong>
                      <br />
                      {getKomoditasText(item)}
                      <br />
                      {item.luas} {item.satuan_luas || 'ha'}
                    </Popup>
                  </Polygon>
                );
              })}

              {/* Polygon yang sedang dibuat / diedit */}
              {polygonPoints.length >= 2 && (
                <Polygon
                  positions={polygonPoints}
                  pathOptions={{
                    color: '#facc15',
                    weight: 4,
                    fillColor: '#facc15',
                    fillOpacity: 0.18,
                    dashArray: isDrawingPolygon ? '8 6' : null,
                  }}
                />
              )}

              {/* Titik polygon yang bisa digeser */}
              {polygonPoints.map((point, index) => (
                <Marker
                  key={`vertex-${index}`}
                  position={point}
                  icon={vertexIcon}
                  draggable
                  eventHandlers={{
                    drag: (event) => {
                      const latlng = event.target.getLatLng();
                      handleMovePolygonPoint(index, latlng);
                    },
                    dragend: (event) => {
                      const latlng = event.target.getLatLng();
                      handleMovePolygonPoint(index, latlng);
                    },
                  }}
                />
              ))}

              {/* Marker lahan tersimpan */}
              {visibleLahan.map((item) => {
                if (editingId && item.id_lahan === editingId) return null;

                const lat = Number(getCoordinate(item, 'latitude'));
                const lng = Number(getCoordinate(item, 'longitude'));

                if (!lat || !lng) return null;

                return (
                  <Marker
                    key={item.id_lahan}
                    position={[lat, lng]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <strong>{item.nama_lahan}</strong>
                      <br />
                      {getKomoditasText(item)}
                      <br />
                      {item.luas} {item.satuan_luas || 'ha'}
                    </Popup>
                  </Marker>
                );
              })}

              {/* Marker lokasi yang sedang dipilih */}
              {selectedPosition && (
                <Marker position={selectedPosition} icon={markerIcon}>
                  <Popup>Lokasi yang dipilih</Popup>
                </Marker>
              )}
            </MapContainer>

            <small>
              Sumber peta: Esri World Imagery. Klik peta untuk memilih lokasi
              lahan.
            </small>
          </div>

          <div className="lahan-list-card">
            <div className="lahan-list-header">
              <h2>Lahan Saya</h2>
              <span>{loading ? 'Memuat...' : `${visibleLahan.length} data`}</span>
            </div>

            <div className="lahan-list">
              {visibleLahan.length === 0 && !loading ? (
                <div className="lahan-empty-state">Belum ada data lahan.</div>
              ) : (
                visibleLahan.map((item) => {
                  const komoditasImage = getKomoditasImage(item);

                  return (
                    <article
                      className="lahan-item"
                      key={item.id_lahan}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleViewDetail(item)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;

                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleViewDetail(item);
                        }
                      }}
                    >
                      <div
                        className={`lahan-thumb ${
                          komoditasImage ? 'has-image' : ''
                        }`}
                        aria-hidden="true"
                      >
                        {komoditasImage ? (
                          <img
                            src={komoditasImage.src}
                            alt=""
                            className={`lahan-thumb-image ${komoditasImage.className}`}
                          />
                        ) : (
                          <LahanIcon name="leaf" size={24} />
                        )}
                      </div>

                      <div className="lahan-item-body">
                        <div className="lahan-item-title-row">
                          <h3>{item.nama_lahan}</h3>

                          <span
                            className={`lahan-status ${
                              item.status === 'aktif' ? 'is-active' : 'is-muted'
                            }`}
                          >
                            {item.status || 'aktif'}
                          </span>
                        </div>

                        <p>
                          {item.luas} {item.satuan_luas || 'ha'} •{' '}
                          {getLocationText(item)} • {getKomoditasText(item)}
                        </p>
                      </div>

                      <div className="lahan-item-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(item);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(item.id_lahan);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
        )}

        <aside
          className={`lahan-form-card ${
            selectedDetail ? 'lahan-detail-form-card' : ''
          }`}
        >
          <h2>
            {selectedDetail
              ? 'Edit Informasi Lahan'
              : editingId
                ? 'Edit Lahan'
                : 'Input Lahan Baru'}
          </h2>
          <p>Lengkapi informasi lahan Anda.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Nama Lahan
              <input
                name="nama_lahan"
                value={form.nama_lahan}
                onChange={handleChange}
                placeholder="Contoh: Lahan D-4 - Jagung"
                required
              />
            </label>

            <label>
              Komoditas Utama
              <select
                name="id_komoditas"
                value={form.id_komoditas}
                onChange={handleChange}
              >
                <option value="">Pilih komoditas</option>

                {komoditas.map((item) => (
                  <option key={item.id_komoditas} value={item.id_komoditas}>
                    {item.nama_komoditas}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Luas Lahan
              <div className="lahan-inline-inputs">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="luas"
                  value={form.luas}
                  onChange={handleChange}
                  placeholder="Contoh: 1.5"
                  required
                />

                <select
                  name="satuan_luas"
                  value={form.satuan_luas}
                  onChange={handleChange}
                >
                  <option value="ha">ha</option>
                  <option value="m2">m²</option>
                </select>
              </div>
            </label>

            <div className="lahan-location-field">
              <label htmlFor="place_search">Patokan Lokasi</label>

              <div className="lahan-location-search-row">
                <input
                  id="place_search"
                  value={placeSearchQuery}
                  onChange={(event) => setPlaceSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSearchPlace();
                    }
                  }}
                  placeholder="Cari patokan tempat, desa, atau jalan"
                />

                <button
                  type="button"
                  onClick={handleSearchPlace}
                  disabled={placeSearchLoading}
                >
                  {placeSearchLoading ? '...' : 'Cari'}
                </button>
              </div>

              {placeSearchResults.length > 0 && (
                <div className="lahan-location-results">
                  {placeSearchResults.map((place) => (
                    <button
                      type="button"
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                    >
                      {place.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lahan-coordinate-grid">
              <label>
                Latitude
                <input
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="-6.9175"
                />
              </label>

              <label>
                Longitude
                <input
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="107.6191"
                />
              </label>
            </div>

            <label>
              Tanggal Tanam Terakhir
              <input
                type="date"
                name="tanggal_tanam_terakhir"
                value={form.tanggal_tanam_terakhir}
                onChange={handleChange}
              />
            </label>

            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </label>

            <label>
              Catatan Opsional
              <textarea
                name="catatan"
                value={form.catatan}
                onChange={handleChange}
                placeholder="Tambahkan catatan tentang lahan ini..."
                rows="5"
              />
            </label>

            <div className="lahan-form-actions">
              <button
                type="button"
                className="secondary"
                onClick={handleCancel}
              >
                Batal
              </button>

              <button type="submit" disabled={saving}>
                {saving
                  ? 'Menyimpan...'
                  : editingId
                    ? 'Simpan Perubahan'
                    : 'Simpan Lahan'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
