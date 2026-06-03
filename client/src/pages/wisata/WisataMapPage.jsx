import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext';
import { wisataService } from '../../services/wisataService';
import {
  formatFormValidationMessage,
  getEmptyFieldIssues,
  scrollToPageTop,
} from '../../utils/formValidation';
import './WisataMapPage.css';

const DEFAULT_CENTER = [-6.829512, 107.798604];
const DEFAULT_MAP_ZOOM = 13;
const FOCUS_MAP_ZOOM = 14;
const SELECTED_PLACE_ZOOM = 17;
const MAX_NATIVE_TILE_ZOOM = 18;
const MAX_MAP_ZOOM = 20;
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
const INDONESIA_BOUNDS = [
  [-11.2, 94.5],
  [6.5, 141.5],
];

const FACILITY_OPTIONS = ['Parkir', 'Toilet', 'Musholla', 'Kuliner', 'Penginapan'];
const ADD_WISATA_INITIAL_FORM = {
  nama_wisata: '',
  jenis_wisata: '',
  status: 'aktif',
  alamat: '',
  desa_kelurahan: '',
  kecamatan: '',
  kabupaten_kota: '',
  provinsi: '',
  latitude: '',
  longitude: '',
  harga_tiket: '',
  rating: '',
  reviews: '',
  fasilitas: '',
  foto: '',
  deskripsi: '',
};

const CATEGORY_CONFIG = {
  alam: {
    label: 'Alam',
    color: '#4f7468',
    bg: '#e8f5ef',
  },
  buatan: {
    label: 'Buatan',
    color: '#6c7f9b',
    bg: '#e9eef8',
  },
  budaya: {
    label: 'Budaya',
    color: '#d6ad5d',
    bg: '#fff4d7',
  },
};

const FALLBACK_WISATA = [
  {
    id: 'fallback-1',
    name: 'Lembah Tengkorak Bandung',
    category: 'Alam',
    location: 'Kadakajaya, Tanjungsari',
    position: [-6.842821, 107.746318],
    facilities: ['Parkir', 'Toilet', 'Kuliner'],
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    reviews: 64,
  },
  {
    id: 'fallback-2',
    name: 'Wisata Alam Cipacet',
    category: 'Alam',
    location: 'Sukasari, Sumedang Regency',
    position: [-6.829512, 107.798604],
    facilities: ['Parkir', 'Toilet', 'Musholla', 'Kuliner'],
    image:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
    rating: 4.4,
    reviews: 243,
  },
  {
    id: 'fallback-3',
    name: 'Gunung Jambu',
    category: 'Alam',
    location: 'Cijambu, Tanjungsari',
    position: [-6.812508, 107.822214],
    facilities: ['Parkir', 'Kuliner'],
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    rating: 5,
    reviews: 15,
  },
  {
    id: 'fallback-4',
    name: 'Basecamp Gunung Cijambu',
    category: 'Alam',
    location: 'Cijambu',
    position: [-6.801412, 107.781533],
    facilities: ['Parkir', 'Toilet', 'Penginapan'],
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    rating: 4.6,
    reviews: 31,
  },
];

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

function WisataIcon({ name, size = 18 }) {
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
    pin: (
      <svg {...commonProps}>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    ticket: (
      <svg {...commonProps}>
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
        <path d="M13 6v12" />
      </svg>
    ),
    mountain: (
      <svg {...commonProps}>
        <path d="m3 20 7-13 4 7 2-3 5 9H3Z" />
        <path d="m10 7 2 4 2-2" />
      </svg>
    ),
    dots: (
      <svg {...commonProps}>
        <path d="M5 12h.01" />
        <path d="M12 12h.01" />
        <path d="M19 12h.01" />
      </svg>
    ),
    plus: (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
    star: (
      <svg {...commonProps} fill="currentColor" stroke="none">
        <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3Z" />
      </svg>
    ),
    trash: (
      <svg {...commonProps}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    ),
    edit: (
      <svg {...commonProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function normalizeCategory(value) {
  const normalized = String(value || 'Alam').toLowerCase();

  if (normalized.includes('budaya')) return 'budaya';
  if (normalized.includes('buatan')) return 'buatan';

  return 'alam';
}

function getCategoryConfig(category) {
  return CATEGORY_CONFIG[normalizeCategory(category)] || CATEGORY_CONFIG.alam;
}

function normalizeStatus(value) {
  return String(value || 'aktif').toLowerCase().replace(/\s+/g, '_');
}

function isNewlyOpenedStatus(value) {
  return ['baru_dibuka', 'baru', 'new', 'new_open'].includes(normalizeStatus(value));
}

function getWisataStatusLabel(value) {
  return isNewlyOpenedStatus(value) ? 'Baru Dibuka' : 'Aktif';
}

function getPlaceResultName(item) {
  const address = item?.address || {};
  const primary =
    item?.namedetails?.name ||
    item?.name ||
    address.road ||
    address.village ||
    address.town ||
    address.city ||
    address.county ||
    item?.display_name;
  const secondary = [
    address.suburb,
    address.village,
    address.town,
    address.city,
    address.county,
    address.state,
  ]
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .slice(0, 3)
    .join(', ');

  return secondary && primary !== secondary ? `${primary}, ${secondary}` : primary;
}

function createWisataMarkerIcon(config) {
  return L.divIcon({
    className: 'wisata-marker-wrapper',
    html: `
      <div class="wisata-marker-dot" style="--marker-color: ${config.color}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m7 16 4-7 3 4 1.5-2 2.5 5H7Z"></path>
          <path d="m11 9 1.4 2.2 1.6-1.2"></path>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
    tooltipAnchor: [0, -22],
  });
}

function createCurrentLocationIcon() {
  return L.divIcon({
    className: 'wisata-current-location-wrapper',
    html: `
      <div class="wisata-current-location-dot">
        <span></span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    tooltipAnchor: [0, -16],
  });
}

function getPosition(item) {
  if (Array.isArray(item.position) && item.position.length >= 2) {
    const lat = Number(item.position[0]);
    const lng = Number(item.position[1]);

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }

  const lat = Number(item.latitude);
  const lng = Number(item.longitude);

  return Number.isNaN(lat) || Number.isNaN(lng) ? null : [lat, lng];
}

function normalizeWisata(item) {
  const category = item.category || item.jenis_wisata || 'Alam';
  const facilities = Array.isArray(item.facilities)
    ? item.facilities
    : Array.isArray(item.fasilitas)
      ? item.fasilitas
      : [];

  return {
    id: item.id || item.id_wisata,
    name: item.name || item.nama_wisata || 'Lokasi Wisata',
    category,
    categoryKey: normalizeCategory(category),
    location:
      item.location ||
      item.address ||
      item.alamat ||
      item.lokasi?.alamat ||
      item.Lokasi?.alamat ||
      'Lokasi belum diisi',
    address: item.address || item.alamat || item.lokasi?.alamat || item.Lokasi?.alamat || '',
    position: getPosition(item),
    facilities,
    photos: Array.isArray(item.photos)
      ? item.photos
      : Array.isArray(item.foto)
        ? item.foto
        : [],
    ticketPrice: item.ticket_price ?? item.harga_tiket ?? '',
    lokasi: item.lokasi || item.Lokasi || null,
    image:
      item.image ||
      (Array.isArray(item.photos) ? item.photos[0] : null) ||
      (Array.isArray(item.foto) ? item.foto[0] : null) ||
      FALLBACK_WISATA[0].image,
    rating: Number(item.rating ?? 4.4),
    reviews: Number(item.reviews ?? item.jumlah_ulasan ?? 24),
    description: item.description || item.deskripsi || '',
    status: normalizeStatus(item.status),
    createdAt: item.created_at || item.createdAt || null,
    isFallback: String(item.id || '').startsWith('fallback-'),
  };
}

function calculateDistanceKm(from, to) {
  if (!from || !to) return null;

  const earthRadiusKm = 6371;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const deltaLat = ((to[0] - from[0]) * Math.PI) / 180;
  const deltaLng = ((to[1] - from[1]) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLng / 2) *
    Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function formatDistance(value) {
  if (value === null || value === undefined) return '-';

  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)} km`;
}

function isPositionInsideBounds(position) {
  if (!position) return false;

  const [[south, west], [north, east]] = INDONESIA_BOUNDS;
  const [lat, lng] = position;

  return lat >= south && lat <= north && lng >= west && lng <= east;
}

function getGeolocationErrorMessage(error) {
  if (error?.code === error?.PERMISSION_DENIED) {
    return 'Izin lokasi ditolak. Aktifkan GPS dan izin lokasi browser untuk menghitung jarak dari posisi anda.';
  }

  if (error?.code === error?.POSITION_UNAVAILABLE) {
    return 'Lokasi perangkat belum tersedia. Pastikan GPS aktif lalu coba lagi.';
  }

  if (error?.code === error?.TIMEOUT) {
    return 'Pencarian lokasi terlalu lama. Pastikan GPS aktif lalu coba lagi.';
  }

  return 'Lokasi perangkat belum dapat digunakan. Aktifkan GPS untuk menghitung jarak.';
}

function formatRating(value) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatReviewCount(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value || 0));
}

function parseRatingInput(value) {
  const rating = Number(String(value || '').replace(',', '.'));

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;

  return Math.round(rating * 10) / 10;
}

function getNewestSortValue(item) {
  const createdTime = Date.parse(item.createdAt || '');

  if (!Number.isNaN(createdTime)) return createdTime;

  const numericId = Number(item.id);
  return Number.isNaN(numericId) ? 0 : numericId;
}

function listFromText(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getWisataAddFormIssues(form, position) {
  const issues = getEmptyFieldIssues([
    { key: 'nama_wisata', label: 'Nama Wisata', value: form.nama_wisata },
    { key: 'jenis_wisata', label: 'Kategori', value: form.jenis_wisata },
    { key: 'desa_kelurahan', label: 'Desa/Kelurahan', value: form.desa_kelurahan },
    { key: 'kecamatan', label: 'Kecamatan', value: form.kecamatan },
    { key: 'kabupaten_kota', label: 'Kab/Kota', value: form.kabupaten_kota },
    { key: 'provinsi', label: 'Provinsi', value: form.provinsi },
  ]);
  const selectedFacilities = listFromText(form.fasilitas);

  if (selectedFacilities.length === 0) {
    issues.push({ key: 'fasilitas', label: 'Fasilitas' });
  }

  const latitudeText = String(form.latitude || '').trim();
  const longitudeText = String(form.longitude || '').trim();

  if (!latitudeText && !longitudeText) {
    issues.push({
      key: 'coordinates',
      label: 'Titik lokasi pada peta (klik peta atau isi latitude & longitude)',
    });
  } else if (!position) {
    if (!latitudeText) {
      issues.push({ key: 'latitude', label: 'Latitude' });
    } else if (!longitudeText) {
      issues.push({ key: 'longitude', label: 'Longitude' });
    } else {
      issues.push({
        key: 'coordinates',
        label: 'Koordinat valid (periksa format latitude/longitude)',
      });
    }
  }

  return issues;
}

function getWisataFormValues(item) {
  const lokasi = item.lokasi || {};
  const position = item.position || [];

  return {
    nama_wisata: item.name || '',
    jenis_wisata: item.category || 'Alam',
    status: item.status || 'aktif',
    alamat: item.address || lokasi.alamat || '',
    desa_kelurahan: lokasi.desa_kelurahan || '',
    kecamatan: lokasi.kecamatan || '',
    kabupaten_kota: lokasi.kabupaten_kota || '',
    provinsi: lokasi.provinsi || '',
    latitude: position[0] === undefined ? '' : String(position[0]),
    longitude: position[1] === undefined ? '' : String(position[1]),
    harga_tiket: item.ticketPrice === null || item.ticketPrice === undefined
      ? ''
      : String(item.ticketPrice),
    rating: item.rating === null || item.rating === undefined ? '' : String(item.rating),
    reviews: item.reviews === null || item.reviews === undefined
      ? ''
      : formatReviewCount(item.reviews),
    fasilitas: item.facilities.join(', '),
    foto: item.photos.join(', '),
    deskripsi: item.description || '',
  };
}

function isValidCoordinate(value, type) {
  if (Number.isNaN(value)) return false;

  return type === 'lat' ? value >= -90 && value <= 90 : value >= -180 && value <= 180;
}

function parseCompactDmsCoordinate(value, type) {
  const text = String(value || '').trim().replace(',', '.');
  const match = text.match(/^(-)?(\d+)(?:\.(\d+))?$/);

  if (!match) return null;

  const wholePart = match[2];
  const fractionPart = match[3] ? `.${match[3]}` : '';

  if (wholePart.length < 5) return null;

  const degreeLength = wholePart.length - 4;
  const degrees = Number(wholePart.slice(0, degreeLength));
  const minutes = Number(wholePart.slice(degreeLength, degreeLength + 2));
  const seconds = Number(`${wholePart.slice(degreeLength + 2)}${fractionPart}`);

  if (
    Number.isNaN(degrees) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    minutes >= 60 ||
    seconds >= 60
  ) {
    return null;
  }

  const sign = match[1] ? -1 : type === 'lat' && DEFAULT_CENTER[0] < 0 ? -1 : 1;
  const coordinate = sign * (degrees + minutes / 60 + seconds / 3600);

  return isValidCoordinate(coordinate, type) ? coordinate : null;
}

function parseCoordinateInput(value, type) {
  if (value === '' || value === null || value === undefined) return null;

  const normalizedText = String(value).trim().replace(',', '.');
  const directValue = Number(normalizedText);

  if (!Number.isNaN(directValue) && isValidCoordinate(directValue, type)) {
    return directValue;
  }

  return parseCompactDmsCoordinate(normalizedText, type);
}

function MapFocus({ items, resetKey, focusTarget }) {
  const map = useMap();
  const handledResetKeyRef = useRef(null);
  const focusKey = focusTarget?.key || null;
  const focusMode = focusTarget?.mode || null;
  const focusPosition = focusTarget?.position || null;
  const focusZoom = focusTarget?.zoom || null;
  const pendingResetKey = focusMode === 'reset' ? focusKey : null;

  useEffect(() => {
    if (pendingResetKey && pendingResetKey !== handledResetKeyRef.current) {
      return;
    }

    const positions = items.map((item) => item.position).filter(Boolean);

    if (positions.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_MAP_ZOOM);
      return;
    }

    if (positions.length === 1) {
      map.flyTo(positions[0], FOCUS_MAP_ZOOM, { duration: 0.75 });
      return;
    }

    map.fitBounds(positions, {
      padding: [58, 58],
      maxZoom: FOCUS_MAP_ZOOM,
    });
  }, [items, map, pendingResetKey, resetKey]);

  useEffect(() => {
    if (!focusPosition) return;

    if (focusMode === 'reset') {
      map.closePopup();
      map.setView(focusPosition, focusZoom || DEFAULT_MAP_ZOOM, {
        animate: true,
      });
      handledResetKeyRef.current = focusKey;
      return;
    }

    map.flyTo(focusPosition, focusZoom || SELECTED_PLACE_ZOOM, {
      duration: 0.8,
    });
  }, [focusKey, focusMode, focusPosition, focusZoom, map]);

  return null;
}

function DraftLocationFocus({ active, position }) {
  const map = useMap();

  useEffect(() => {
    if (!active || !position) return;

    map.flyTo(position, 16, { duration: 0.6 });
  }, [active, map, position]);

  return null;
}

function AddWisataMapPicker({ active, onPick }) {
  useMapEvents({
    click(event) {
      if (!active) return;

      onPick(event.latlng);
    },
  });

  return null;
}

export default function WisataMapPage({ readOnly = false }) {
  const { user } = useAuth();
  const mapCardRef = useRef(null);
  const listCardRef = useRef(null);
  const addFormPanelRef = useRef(null);
  const focusKeyRef = useRef(0);
  const geolocationRequestRef = useRef(0);
  const currentLocationRef = useRef(null);
  const [wisata, setWisata] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [category, setCategory] = useState('semua');
  const [distance, setDistance] = useState('semua');
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [sortOrder, setSortOrder] = useState('terbaru');
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWisata, setEditingWisata] = useState(null);
  const [addForm, setAddForm] = useState(ADD_WISATA_INITIAL_FORM);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [mapFocusTarget, setMapFocusTarget] = useState(null);
  const [showAllWisata, setShowAllWisata] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [missingFieldKeys, setMissingFieldKeys] = useState(() => new Set());
  const [ratingForms, setRatingForms] = useState({});
  const [ratingSavingId, setRatingSavingId] = useState(null);
  const canManageWisata = !readOnly && ['wisata', 'pengurus'].includes(user?.role);
  const canRateWisata = readOnly && user?.role === 'masyarakat';
  const showCurrentLocationMarker = Boolean(currentLocation);
  const createMapFocusKey = (prefix) => {
    focusKeyRef.current += 1;
    return `${prefix}-${focusKeyRef.current}`;
  };

  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  const loadWisata = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) {
      setError('');
      setMessage('');
    }

    try {
      const { data } = await wisataService.getPoints();
      const nextData = Array.isArray(data.data) ? data.data : [];
      setWisata(nextData);

      if (nextData.length === 0) {
        setMessage('Data wisata belum tersedia.');
      }
    } catch (err) {
      console.error('Load wisata points error:', err);
      setWisata([]);
      setError('Titik wisata belum dapat dimuat dari server.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialWisata = async () => {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const { data } = await wisataService.getPoints();

        if (!active) return;

        const nextData = Array.isArray(data.data) ? data.data : [];
        setWisata(nextData);

        if (nextData.length === 0) {
          setMessage('Data wisata belum tersedia.');
        }
      } catch (err) {
        if (!active) return;

        console.error('Load wisata points error:', err);
        setWisata([]);
        setError('Titik wisata belum dapat dimuat dari server.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialWisata();

    return () => {
      active = false;
    };
  }, []);

  const allWisata = useMemo(() => {
    return wisata.map(normalizeWisata).filter((item) => item.position);
  }, [wisata]);

  const enrichedWisata = useMemo(() => {
    return allWisata.map((item) => ({
      ...item,
      distanceKm: calculateDistanceKm(currentLocation, item.position),
    }));
  }, [allWisata, currentLocation]);

  const filteredWisata = useMemo(() => {
    const requiredFacilities = selectedFacilities.includes('semua')
      ? FACILITY_OPTIONS
      : selectedFacilities;

    return enrichedWisata.filter((item) => {
      const matchCategory = category === 'semua' || item.categoryKey === category;
      const matchFacilities =
        requiredFacilities.length === 0 ||
        requiredFacilities.every((facility) =>
          item.facilities.some(
            (itemFacility) =>
              itemFacility.toLowerCase() === facility.toLowerCase(),
          ),
        );
      const matchDistance =
        distance === 'semua' ||
        (item.distanceKm !== null && item.distanceKm <= Number(distance));

      return matchCategory && matchFacilities && matchDistance;
    });
  }, [category, distance, enrichedWisata, selectedFacilities]);

  const nearestWisata = useMemo(() => {
    if (!currentLocation) return [];

    return [...filteredWisata]
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
      .slice(0, 3);
  }, [currentLocation, filteredWisata]);

  const displayedWisata = useMemo(() => {
    const nextWisata = [...filteredWisata];

    if (sortOrder === 'terdekat') {
      return nextWisata.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return nextWisata.sort((a, b) => {
      const statusPriority = Number(isNewlyOpenedStatus(b.status)) -
        Number(isNewlyOpenedStatus(a.status));

      if (statusPriority !== 0) return statusPriority;

      return getNewestSortValue(b) - getNewestSortValue(a);
    });
  }, [filteredWisata, sortOrder]);

  const visibleWisataCards = showAllWisata
    ? displayedWisata
    : displayedWisata.slice(0, 3);

  const summary = useMemo(() => {
    return {
      total: enrichedWisata.length,
      budaya: enrichedWisata.filter((item) => item.categoryKey === 'budaya').length,
      alam: enrichedWisata.filter((item) => item.categoryKey === 'alam').length,
      buatan: enrichedWisata.filter((item) => item.categoryKey === 'buatan').length,
    };
  }, [enrichedWisata]);

  const addFormPosition = useMemo(() => {
    const latitude = parseCoordinateInput(addForm.latitude, 'lat');
    const longitude = parseCoordinateInput(addForm.longitude, 'lng');

    if (latitude === null || longitude === null) return null;

    return [latitude, longitude];
  }, [addForm.latitude, addForm.longitude]);
  const hasCoordinateInput = addForm.latitude !== '' || addForm.longitude !== '';
  const hasInvalidCoordinate =
    showAddForm && addForm.latitude !== '' && addForm.longitude !== '' && !addFormPosition;
  const selectedAddFacilities = useMemo(
    () => listFromText(addForm.fasilitas),
    [addForm.fasilitas],
  );
  const selectedAddFacilityNames = useMemo(
    () => new Set(selectedAddFacilities.map((item) => item.toLowerCase())),
    [selectedAddFacilities],
  );
  const allAddFacilitiesSelected = FACILITY_OPTIONS.every((facility) =>
    selectedAddFacilityNames.has(facility.toLowerCase()),
  );

  const allFacilitiesSelected =
    selectedFacilities.includes('semua') ||
    FACILITY_OPTIONS.every((facility) => selectedFacilities.includes(facility));

  const handleFacilityToggle = (facility) => {
    if (facility === 'semua') {
      setSelectedFacilities((current) =>
        current.includes('semua') ? [] : ['semua'],
      );
      return;
    }

    setSelectedFacilities((current) => {
      if (current.includes('semua')) {
        return [facility];
      }

      const withoutAll = current.filter((item) => item !== 'semua');

      if (withoutAll.includes(facility)) {
        return withoutAll.filter((item) => item !== facility);
      }

      const next = [...withoutAll, facility];

      return next.length === FACILITY_OPTIONS.length ? ['semua'] : next;
    });
  };

  const handleResetMap = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    setCategory('semua');
    setDistance('semua');
    setSelectedFacilities([]);
    setSortOrder('terbaru');
    setShowAllWisata(false);
    setMapFocusTarget({
      mode: 'reset',
      position: DEFAULT_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      key: createMapFocusKey('reset-map'),
    });
    setResetKey((current) => current + 1);
  };

  const handleApplyFilter = () => {
    setResetKey((current) => current + 1);
  };

  const scrollMapIntoView = () => {
    mapCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const applyLocationError = (statusText, requestId) => {
    if (requestId && requestId !== geolocationRequestRef.current) return;

    if (currentLocationRef.current) {
      setLocationStatus('Lokasi perangkat berhasil digunakan.');
      setError('');
      setIsLocating(false);
      return;
    }

    setCurrentLocation(null);
    setLocationStatus(statusText);
    setError(statusText);
    setIsLocating(false);
  };

  const handleUseBrowserLocation = () => {
    const requestId = geolocationRequestRef.current + 1;
    geolocationRequestRef.current = requestId;

    setIsLocating(true);
    setError('');
    setLocationStatus('Mendeteksi lokasi perangkat...');
    setMessage('Mendeteksi lokasi perangkat...');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const statusText =
        typeof window !== 'undefined' && !window.isSecureContext
          ? 'Lokasi otomatis hanya tersedia di HTTPS atau localhost. Aktifkan GPS melalui browser yang mendukung lokasi.'
          : 'Browser belum mendukung lokasi otomatis. Gunakan browser yang mendukung GPS.';
      applyLocationError(statusText, requestId);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== geolocationRequestRef.current) return;

        const nextLocation = [
          Number(position.coords.latitude),
          Number(position.coords.longitude),
        ];

        if (!Number.isFinite(nextLocation[0]) || !Number.isFinite(nextLocation[1])) {
          applyLocationError('Koordinat lokasi perangkat tidak valid. Coba aktifkan GPS ulang.', requestId);
          return;
        }

        if (!isPositionInsideBounds(nextLocation)) {
          applyLocationError('Lokasi perangkat berada di luar area peta Indonesia.', requestId);
          return;
        }

        setCurrentLocation(nextLocation);
        currentLocationRef.current = nextLocation;
        setMapFocusTarget({
          position: nextLocation,
          zoom: FOCUS_MAP_ZOOM,
          key: createMapFocusKey('current-location'),
        });
        setLocationStatus('Lokasi perangkat berhasil digunakan.');
        setMessage('Lokasi saat ini berhasil digunakan sebagai patokan jarak.');
        setError('');
        setIsLocating(false);
        scrollMapIntoView();
      },
      (locationError) => {
        applyLocationError(getGeolocationErrorMessage(locationError), requestId);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  };

  const handleFocusWisataOnMap = (item) => {
    if (!item?.position) return;

    setMapFocusTarget({
      position: item.position,
      key: createMapFocusKey(`wisata-${item.id}`),
    });
    scrollMapIntoView();
  };

  const handleViewAllWisata = () => {
    setCategory('semua');
    setDistance('semua');
    setSelectedFacilities([]);
    setSortOrder('terbaru');
    setMapFocusTarget(null);
    setShowAllWisata(true);
    setResetKey((current) => current + 1);
    listCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleShowFeaturedWisata = () => {
    setShowAllWisata(false);
    listCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const clearMissingField = (field) => {
    setMissingFieldKeys((current) => {
      const next = new Set(current);
      next.delete(field);

      if (field === 'latitude' || field === 'longitude') {
        next.delete('coordinates');
      }

      return next;
    });
  };

  const handleAddFormChange = (field, value) => {
    setAddForm((current) => ({
      ...current,
      [field]: value,
    }));
    clearMissingField(field);
    setError('');
  };

  const isMissingField = (key) => missingFieldKeys.has(key);

  const handleSearchPlace = async () => {
    const query = placeSearchQuery.trim();

    if (!query) {
      setPlaceSearchResults([]);
      setError('Masukkan patokan lokasi terlebih dahulu.');
      return;
    }

    setPlaceSearchLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        q: `${query}, Indonesia`,
        format: 'json',
        addressdetails: '1',
        namedetails: '1',
        limit: '5',
        countrycodes: 'id',
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error('Pencarian lokasi gagal.');
      }

      const results = await response.json();
      const nextResults = Array.isArray(results)
        ? results
          .map((item) => {
            const latitude = Number(item.lat);
            const longitude = Number(item.lon);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            return {
              id: item.place_id || `${latitude}-${longitude}`,
              name: getPlaceResultName(item),
              displayName: item.display_name,
              address: item.address || {},
              position: [latitude, longitude],
            };
          })
          .filter(Boolean)
        : [];

      setPlaceSearchResults(nextResults);

      if (nextResults.length === 0) {
        setError('Patokan lokasi tidak ditemukan. Coba nama tempat yang lebih spesifik.');
      }
    } catch (err) {
      setPlaceSearchResults([]);
      setError(err.message || 'Gagal mencari patokan lokasi.');
    } finally {
      setPlaceSearchLoading(false);
    }
  };

  const handleSelectPlace = (place) => {
    const address = place.address || {};
    const [latitude, longitude] = place.position;
    const city = address.city || address.town || address.county || address.regency || '';
    const streetLine = [address.house_number, address.road || address.pedestrian]
      .filter(Boolean)
      .join(' ');

    setAddForm((current) => ({
      ...current,
      // Patokan lokasi hanya untuk navigasi peta; jangan isi alamat dengan nama pencarian.
      alamat: streetLine || current.alamat,
      desa_kelurahan:
        address.village ||
        address.suburb ||
        address.neighbourhood ||
        current.desa_kelurahan,
      kecamatan: address.district || address.subdistrict || current.kecamatan,
      kabupaten_kota: city || current.kabupaten_kota,
      provinsi: address.state || current.provinsi,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
    setPlaceSearchQuery(place.name || '');
    setPlaceSearchResults([]);
    setMissingFieldKeys((current) => {
      const next = new Set(current);
      [
        'desa_kelurahan',
        'kecamatan',
        'kabupaten_kota',
        'provinsi',
        'latitude',
        'longitude',
        'coordinates',
      ].forEach((key) => next.delete(key));
      return next;
    });
    setMapFocusTarget({
      position: place.position,
      zoom: SELECTED_PLACE_ZOOM,
      key: createMapFocusKey('search-place'),
    });
    setMessage('Map diarahkan ke patokan lokasi yang dipilih.');
    scrollMapIntoView();
  };

  const handleAddFacilityToggle = (facility) => {
    if (facility === 'semua') {
      handleAddFormChange(
        'fasilitas',
        allAddFacilitiesSelected ? '' : FACILITY_OPTIONS.join(', '),
      );
      return;
    }

    const nextFacilities = selectedAddFacilityNames.has(facility.toLowerCase())
      ? FACILITY_OPTIONS.filter(
        (item) =>
          selectedAddFacilityNames.has(item.toLowerCase()) &&
          item.toLowerCase() !== facility.toLowerCase(),
      )
      : [
        ...FACILITY_OPTIONS.filter((item) =>
          selectedAddFacilityNames.has(item.toLowerCase()),
        ),
        facility,
      ];

    handleAddFormChange('fasilitas', nextFacilities.join(', '));
  };

  const handlePickAddLocation = (latlng) => {
    setAddForm((current) => ({
      ...current,
      latitude: latlng.lat.toFixed(6),
      longitude: latlng.lng.toFixed(6),
    }));
    setMissingFieldKeys((current) => {
      const next = new Set(current);
      next.delete('coordinates');
      next.delete('latitude');
      next.delete('longitude');
      return next;
    });
    setMessage('Titik lokasi wisata dipilih dari peta.');
  };

  const handleClearAddLocation = () => {
    setAddForm((current) => ({
      ...current,
      latitude: '',
      longitude: '',
    }));
    setMessage('Titik lokasi wisata dibatalkan.');
  };

  const handleOpenAddForm = () => {
    setEditingWisata(null);
    setAddForm(ADD_WISATA_INITIAL_FORM);
    setPlaceSearchQuery('');
    setPlaceSearchResults([]);
    setError('');
    setMessage('');
    setMissingFieldKeys(new Set());
    setShowAddForm(true);
  };

  const handleStartEditWisata = (item) => {
    if (!canManageWisata || item.isFallback) return;

    setEditingWisata(item);
    setAddForm(getWisataFormValues(item));
    setPlaceSearchQuery('');
    setPlaceSearchResults([]);
    setError('');
    setMessage('');
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setEditingWisata(null);
    setAddForm(ADD_WISATA_INITIAL_FORM);
    setPlaceSearchQuery('');
    setPlaceSearchResults([]);
    setMissingFieldKeys(new Set());
  };

  const handleSubmitAddWisata = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const issues = getWisataAddFormIssues(addForm, addFormPosition);

    if (issues.length > 0) {
      setMissingFieldKeys(new Set(issues.map((issue) => issue.key)));
      setError(formatFormValidationMessage(issues));
      addFormPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrollToPageTop();
      return;
    }

    setMissingFieldKeys(new Set());
    setSaving(true);

    try {
      const payload = {
        ...addForm,
        harga_tiket: addForm.harga_tiket === '' ? null : Number(addForm.harga_tiket),
        rating: addForm.rating,
        jumlah_ulasan: addForm.reviews,
        latitude: addFormPosition[0],
        longitude: addFormPosition[1],
        fasilitas: listFromText(addForm.fasilitas),
        foto: listFromText(addForm.foto),
      };

      if (editingWisata) {
        await wisataService.update(editingWisata.id, payload);
      } else {
        await wisataService.create(payload);
      }

      setMessage(
        editingWisata
          ? 'Lokasi wisata berhasil diperbarui.'
          : 'Lokasi wisata berhasil ditambahkan.',
      );
      handleCloseAddForm();
      await loadWisata({ silent: true });
      setCategory('semua');
      setDistance('semua');
      setSelectedFacilities([]);
      setSortOrder('terbaru');
      setResetKey((current) => current + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        (editingWisata
          ? 'Gagal memperbarui lokasi wisata.'
          : 'Gagal menambahkan lokasi wisata.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWisata = async (item) => {
    if (!canManageWisata || item.isFallback) return;

    const confirmed = window.confirm(
      `Hapus lokasi wisata "${item.name}" dari peta?`,
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setError('');
    setMessage('');

    try {
      await wisataService.delete(item.id);
      await loadWisata({ silent: true });
      setMessage('Lokasi wisata berhasil dihapus.');
      setResetKey((current) => current + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus lokasi wisata.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      handleUseBrowserLocation();
    }, 0);

    return () => window.clearTimeout(timer);
    // Peta wisata memakai GPS pengguna sebagai patokan jarak, jadi diminta saat halaman dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRatingFormChange = (id, field, value) => {
    setRatingForms((current) => ({
      ...current,
      [id]: {
        rating: '',
        ulasan: '',
        ...(current[id] || {}),
        [field]: value,
      },
    }));
    setError('');
  };

  const handleSubmitRating = async (event, item) => {
    event.preventDefault();
    if (!canRateWisata || item.isFallback) return;

    const form = ratingForms[item.id] || {};
    const rating = parseRatingInput(form.rating);

    if (rating === null) {
      setError('Rating harus diisi antara 1 sampai 5.');
      return;
    }

    setRatingSavingId(item.id);
    setError('');
    setMessage('');

    try {
      const { data } = await wisataService.rate(item.id, {
        rating,
        ulasan: form.ulasan || '',
      });
      const updated = data.data;

      if (updated) {
        setWisata((current) =>
          current.map((row) => {
            const rowId = row.id || row.id_wisata;
            return Number(rowId) === Number(item.id) ? updated : row;
          }),
        );
      } else {
        await loadWisata({ silent: true });
      }

      setRatingForms((current) => ({
        ...current,
        [item.id]: { rating: '', ulasan: '' },
      }));
      setMessage(data.message || 'Rating wisata berhasil disimpan.');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan rating wisata.');
    } finally {
      setRatingSavingId(null);
    }
  };

  return (
    <div className="wisata-page-shell">
      <header className="wisata-page-header">
        <div>
          <h1>Lokasi Wisata</h1>
          <p>Lihat dan jelajahi tempat-tempat wisata yang ada di wilayah sekitar anda.</p>
        </div>

        {canManageWisata && (
          <button
            type="button"
            className="wisata-add-button"
            onClick={handleOpenAddForm}
          >
            <WisataIcon name="plus" size={15} />
            Tambahkan Lokasi Wisata
          </button>
        )}
      </header>

      {message && <div className="wisata-message is-info">{message}</div>}
      {error && !showAddForm && <div className="wisata-message is-error">{error}</div>}

      {showAddForm && (
        <section className="wisata-add-panel" ref={addFormPanelRef}>
          <div className="wisata-add-panel-header">
            <div>
              <h2>{editingWisata ? 'Edit Lokasi Wisata' : 'Tambah Lokasi Wisata'}</h2>
              <p>
                {editingWisata
                  ? 'Perbarui profil wisata dan titik koordinat yang tampil pada peta.'
                  : 'Masukkan profil wisata dan titik koordinat untuk ditampilkan pada peta.'}
              </p>
            </div>
            <button type="button" onClick={handleCloseAddForm} aria-label="Tutup form">
              x
            </button>
          </div>

          <form onSubmit={handleSubmitAddWisata} className="wisata-add-form" noValidate>
            {error && (
              <div className="wisata-form-validation-error" role="alert">
                {error}
              </div>
            )}

            <label className={isMissingField('nama_wisata') ? 'wisata-field-missing' : undefined}>
              <span className="wisata-required-label">Nama Wisata</span>
              <input
                value={addForm.nama_wisata}
                onChange={(event) => handleAddFormChange('nama_wisata', event.target.value)}
                placeholder="Contoh: Wisata Alam Cipacet"
              />
            </label>

            <div className="wisata-add-form-grid">
              <label className={isMissingField('jenis_wisata') ? 'wisata-field-missing' : undefined}>
                <span className="wisata-required-label">Kategori</span>
                <select
                  value={addForm.jenis_wisata}
                  onChange={(event) => handleAddFormChange('jenis_wisata', event.target.value)}
                >
                  <option value="">Pilih kategori</option>
                  <option value="Alam">Alam</option>
                  <option value="Buatan">Buatan</option>
                  <option value="Budaya">Budaya</option>
                </select>
              </label>

              <label>
                Harga Tiket
                <input
                  type="number"
                  min="0"
                  value={addForm.harga_tiket}
                  onChange={(event) => handleAddFormChange('harga_tiket', event.target.value)}
                  placeholder="Contoh: 10000"
                />
              </label>
            </div>

            <div className="wisata-place-search-field">
              <label htmlFor="wisata-place-search">Patokan Lokasi</label>
              <div className="wisata-place-search-row">
                <input
                  id="wisata-place-search"
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
                <div className="wisata-place-results">
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

            <label>
              Alamat / Detail Lokasi
              <input
                value={addForm.alamat}
                onChange={(event) => handleAddFormChange('alamat', event.target.value)}
                placeholder="Contoh: Jalan Braga No. 12 (opsional)"
              />
            </label>

            <div className="wisata-add-form-grid four">
              <label className={isMissingField('desa_kelurahan') ? 'wisata-field-missing' : undefined}>
                <span className="wisata-required-label">Desa/Kelurahan</span>
                <input
                  value={addForm.desa_kelurahan}
                  onChange={(event) => handleAddFormChange('desa_kelurahan', event.target.value)}
                  placeholder="Cijambu"
                />
              </label>

              <label className={isMissingField('kecamatan') ? 'wisata-field-missing' : undefined}>
                <span className="wisata-required-label">Kecamatan</span>
                <input
                  value={addForm.kecamatan}
                  onChange={(event) => handleAddFormChange('kecamatan', event.target.value)}
                  placeholder="Tanjungsari"
                />
              </label>

              <label className={isMissingField('kabupaten_kota') ? 'wisata-field-missing' : undefined}>
                <span className="wisata-required-label">Kab/Kota</span>
                <input
                  value={addForm.kabupaten_kota}
                  onChange={(event) => handleAddFormChange('kabupaten_kota', event.target.value)}
                  placeholder="Sumedang"
                />
              </label>

              <label className={isMissingField('provinsi') ? 'wisata-field-missing' : undefined}>
                <span className="wisata-required-label">Provinsi</span>
                <input
                  value={addForm.provinsi}
                  onChange={(event) => handleAddFormChange('provinsi', event.target.value)}
                  placeholder="Jawa Tengah"
                />
              </label>
            </div>

            <div className="wisata-add-form-grid">
              <label className={isMissingField('latitude') || isMissingField('coordinates') ? 'wisata-field-missing' : undefined}>
                <span className="wisata-required-label">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={addForm.latitude}
                  onChange={(event) => handleAddFormChange('latitude', event.target.value)}
                  placeholder="-6.829512"
                />
              </label>

              <label className={isMissingField('longitude') || isMissingField('coordinates') ? 'wisata-field-missing' : undefined}>
                <span className="wisata-required-label">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={addForm.longitude}
                  onChange={(event) => handleAddFormChange('longitude', event.target.value)}
                  placeholder="107.798604"
                />
              </label>
            </div>

            <p className={`wisata-add-map-hint${isMissingField('coordinates') ? ' wisata-field-missing-hint' : ''}`}>
              Klik area pada peta di bawah untuk mengisi titik latitude dan longitude secara otomatis.
              Jika mengetik manual, titik akan dibuat otomatis setelah koordinat valid.
            </p>

            {addFormPosition && (
              <p className="wisata-coordinate-preview">
                Titik otomatis dibuat di {addFormPosition[0].toFixed(6)},{' '}
                {addFormPosition[1].toFixed(6)}.
              </p>
            )}

            {hasInvalidCoordinate && (
              <p className="wisata-coordinate-preview is-error">
                Koordinat belum valid. Contoh: -6.829512 dan 107.798604, atau
                70832.1 dan 1072354.7.
              </p>
            )}

            <fieldset
              className={`wisata-add-facilities${isMissingField('fasilitas') ? ' wisata-fieldset-missing' : ''}`}
            >
              <legend>
                <span className="wisata-required-label">Fasilitas</span>
              </legend>
              <label>
                <input
                  type="checkbox"
                  checked={allAddFacilitiesSelected}
                  onChange={() => handleAddFacilityToggle('semua')}
                />
                Semua Fasilitas
              </label>

              {FACILITY_OPTIONS.map((facility) => (
                <label key={facility}>
                  <input
                    type="checkbox"
                    checked={selectedAddFacilityNames.has(facility.toLowerCase())}
                    onChange={() => handleAddFacilityToggle(facility)}
                  />
                  {facility}
                </label>
              ))}
            </fieldset>

            <label>
              Foto URL
              <input
                value={addForm.foto}
                onChange={(event) => handleAddFormChange('foto', event.target.value)}
                placeholder="https://..."
              />
            </label>

            <div className="wisata-add-form-grid">
              <label>
                Rating
                <input
                  type="text"
                  value={addForm.rating}
                  onChange={(event) => handleAddFormChange('rating', event.target.value)}
                  placeholder="Contoh: 4,5"
                />
              </label>

              <label>
                Jumlah Ulasan
                <input
                  type="text"
                  value={addForm.reviews}
                  onChange={(event) => handleAddFormChange('reviews', event.target.value)}
                  placeholder="Contoh: 1.980"
                />
              </label>
            </div>

            <label>
              Deskripsi
              <textarea
                value={addForm.deskripsi}
                onChange={(event) => handleAddFormChange('deskripsi', event.target.value)}
                placeholder="Tambahkan deskripsi singkat lokasi wisata..."
              />
            </label>

            <div className="wisata-add-actions">
              <button type="button" onClick={handleCloseAddForm}>
                Batal
              </button>
              <button type="submit" disabled={saving}>
                {saving
                  ? 'Menyimpan...'
                  : editingWisata
                    ? 'Simpan Perubahan'
                    : 'Simpan Lokasi Wisata'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="wisata-main-layout">
        <div className="wisata-content-column">
          <div className="wisata-map-card" ref={mapCardRef}>
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_MAP_ZOOM}
              minZoom={5}
              maxZoom={MAX_MAP_ZOOM}
              maxBounds={INDONESIA_BOUNDS}
              maxBoundsViscosity={0.85}
              scrollWheelZoom
              className="wisata-map"
            >
              <MapTiles />
              <MapFocus
                items={filteredWisata}
                resetKey={resetKey}
                focusTarget={mapFocusTarget}
              />
              <DraftLocationFocus active={showAddForm} position={addFormPosition} />
              <AddWisataMapPicker
                active={showAddForm}
                onPick={handlePickAddLocation}
              />

              {filteredWisata.map((item) => {
                const config = getCategoryConfig(item.category);
                const markerIcon = createWisataMarkerIcon(config);

                return (
                  <Marker key={item.id} position={item.position} icon={markerIcon}>
                    <Tooltip
                      permanent
                      direction="top"
                      offset={[0, -12]}
                      opacity={1}
                      className="wisata-map-label"
                    >
                      {item.name}
                    </Tooltip>

                    <Popup closeButton>
                      <div className="wisata-popup">
                        <img src={item.image} alt="" />
                        <div>
                          <h3>{item.name}</h3>
                          <span>{config.label}</span>
                          <p>{item.location}</p>
                          <p className="wisata-distance-line">
                            Jarak dari lokasi saat ini: {formatDistance(item.distanceKm)}
                          </p>
                          <strong>
                            <WisataIcon name="star" size={14} />
                            {formatRating(item.rating)} ({formatReviewCount(item.reviews)})
                          </strong>
                          {canManageWisata && !item.isFallback && (
                            <div className="wisata-popup-actions">
                              <button
                                type="button"
                                className="wisata-edit-button compact"
                                onClick={() => handleStartEditWisata(item)}
                              >
                                <WisataIcon name="edit" size={13} />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="wisata-delete-button compact"
                                disabled={deletingId === item.id}
                                onClick={() => handleDeleteWisata(item)}
                              >
                                <WisataIcon name="trash" size={13} />
                                {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {showCurrentLocationMarker && (
                <Marker position={currentLocation} icon={createCurrentLocationIcon()}>
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -10]}
                    opacity={1}
                    className="wisata-current-location-label"
                  >
                    Lokasi Saya
                  </Tooltip>
                  <Popup>
                    <div className="wisata-current-popup">
                      <strong>Lokasi Saya</strong>
                      <span>Patokan jarak memakai lokasi perangkat.</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {showAddForm && addFormPosition && (
                <Marker position={addFormPosition}>
                  <Popup closeButton>
                    <div className="wisata-draft-location-popup">
                      <strong>Lokasi yang dipilih</strong>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleClearAddLocation();
                        }}
                      >
                        Hapus lokasi
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            <div className="wisata-map-switch">
              <WisataIcon name="map" size={18} />
              <select defaultValue="satelit" aria-label="Pilih tipe peta">
                <option value="satelit">Satelit</option>
              </select>
            </div>

            <button type="button" className="wisata-map-reset" onClick={handleResetMap}>
              Reset Peta
            </button>

            <div className="wisata-map-legend">
              {Object.entries(CATEGORY_CONFIG).map(([key, item]) => (
                <span key={key}>
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>

            {loading && <div className="wisata-map-loading">Memuat titik wisata...</div>}
            {showAddForm && (
              <div className="wisata-map-pick-note">
                {hasCoordinateInput && addFormPosition
                  ? editingWisata
                    ? 'Titik lokasi wisata sudah diperbarui dari koordinat.'
                    : 'Titik lokasi wisata baru sudah dibuat dari koordinat.'
                  : editingWisata
                    ? 'Klik peta atau isi koordinat untuk memindahkan titik lokasi wisata.'
                    : 'Klik peta atau isi koordinat untuk memilih titik lokasi wisata baru.'}
              </div>
            )}
          </div>

          <section className="wisata-list-card" ref={listCardRef}>
            <div className="wisata-list-header">
              <div>
                <h2>Daftar Lokasi Wisata</h2>
                {showAllWisata && (
                  <p className="wisata-list-note">
                    Menampilkan semua {displayedWisata.length} lokasi wisata yang tersedia.
                  </p>
                )}
              </div>

              <div className="wisata-list-tools">
                {showAllWisata && (
                  <button type="button" onClick={handleShowFeaturedWisata}>
                    Tampilkan Ringkas
                  </button>
                )}
                <label>
                  Urutkan
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <option value="terbaru">Terbaru</option>
                    <option value="terdekat">Terdekat</option>
                  </select>
                </label>
              </div>
            </div>

            <div className={`wisata-card-scroll ${showAllWisata ? 'is-expanded' : ''}`}>
              <div className={`wisata-card-grid ${showAllWisata ? 'is-expanded' : ''}`}>
                {visibleWisataCards.map((item) => {
                  const config = getCategoryConfig(item.category);

                  return (
                    <article className="wisata-location-card" key={item.id}>
                      <button
                        type="button"
                        className="wisata-card-image-button"
                        onClick={() => handleFocusWisataOnMap(item)}
                        aria-label={`Fokuskan peta ke ${item.name}`}
                      >
                        <img src={item.image} alt="" />
                      </button>
                      <div>
                        <span style={{ backgroundColor: config.bg, color: config.color }}>
                          {config.label}
                        </span>
                        {isNewlyOpenedStatus(item.status) && (
                          <span className="wisata-card-status-badge">
                            {getWisataStatusLabel(item.status)}
                          </span>
                        )}
                        <h3>{item.name}</h3>
                        <p>{item.location}</p>
                        <p className="wisata-card-distance">
                          Jarak dari lokasi saat ini: <span>{formatDistance(item.distanceKm)}</span>
                        </p>
                        <strong>
                          <WisataIcon name="star" size={15} />
                          {formatRating(item.rating)} ({formatReviewCount(item.reviews)})
                        </strong>
                        {canRateWisata && !item.isFallback && (
                          <form
                            className="wisata-rating-form"
                            onSubmit={(event) => handleSubmitRating(event, item)}
                          >
                            <label>
                              Rating anda
                              <select
                                value={ratingForms[item.id]?.rating || ''}
                                onChange={(event) =>
                                  handleRatingFormChange(item.id, 'rating', event.target.value)
                                }
                              >
                                <option value="">Pilih rating</option>
                                <option value="5">5 - Sangat baik</option>
                                <option value="4">4 - Baik</option>
                                <option value="3">3 - Cukup</option>
                                <option value="2">2 - Kurang</option>
                                <option value="1">1 - Buruk</option>
                              </select>
                            </label>
                            <label>
                              Ulasan
                              <textarea
                                value={ratingForms[item.id]?.ulasan || ''}
                                onChange={(event) =>
                                  handleRatingFormChange(item.id, 'ulasan', event.target.value)
                                }
                                placeholder="Tulis ulasan singkat..."
                              />
                            </label>
                            <button type="submit" disabled={ratingSavingId === item.id}>
                              {ratingSavingId === item.id ? 'Menyimpan...' : 'Kirim Rating'}
                            </button>
                          </form>
                        )}
                        {canManageWisata && !item.isFallback && (
                          <div className="wisata-card-actions">
                            <button
                              type="button"
                              className="wisata-edit-button"
                              onClick={() => handleStartEditWisata(item)}
                            >
                              <WisataIcon name="edit" size={14} />
                              Edit Lokasi
                            </button>
                            <button
                              type="button"
                              className="wisata-delete-button"
                              disabled={deletingId === item.id}
                              onClick={() => handleDeleteWisata(item)}
                            >
                              <WisataIcon name="trash" size={14} />
                              {deletingId === item.id ? 'Menghapus...' : 'Hapus Lokasi'}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {!showAllWisata && displayedWisata.length > visibleWisataCards.length && (
              <button
                type="button"
                className="wisata-show-all-btn"
                onClick={handleViewAllWisata}
              >
                <WisataIcon name="plus" size={16} />
                Tampilkan Semua {displayedWisata.length} Lokasi Wisata
              </button>
            )}
          </section>

          <section className="wisata-summary-section">
            <h2>Ringkasan Wisata</h2>

            <div className="wisata-summary-grid">
              <SummaryCard
                icon="pin"
                label="Lokasi"
                value={summary.total}
                text="Total Lokasi"
                tone="green"
              />
              <SummaryCard
                icon="ticket"
                label="Wisata Budaya"
                value={summary.budaya}
                text="Total Wisata Budaya"
                tone="blue"
              />
              <SummaryCard
                icon="mountain"
                label="Wisata Alam"
                value={summary.alam}
                text="Total Wisata Alam"
                tone="orange"
              />
              <SummaryCard
                icon="dots"
                label="Wisata Buatan"
                value={summary.buatan}
                text="Total Wisata Buatan"
                tone="purple"
              />
            </div>
          </section>
        </div>

        <aside className="wisata-side-column">
          <section className="wisata-filter-card">
            <h2>Filter Wisata</h2>

            <label>
              Kategori Wisata
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="semua">Semua Kategori</option>
                <option value="alam">Alam</option>
                <option value="buatan">Buatan</option>
                <option value="budaya">Budaya</option>
              </select>
            </label>

            <div className="wisata-filter-group">
              <strong>Fasilitas</strong>

              <label>
                <input
                  type="checkbox"
                  checked={allFacilitiesSelected}
                  onChange={() => handleFacilityToggle('semua')}
                />
                Semua Fasilitas
              </label>

              {FACILITY_OPTIONS.map((facility) => (
                <label key={facility}>
                  <input
                    type="checkbox"
                    checked={selectedFacilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility)}
                  />
                  {facility}
                </label>
              ))}
            </div>

            <label>
              Jarak
              <select value={distance} onChange={(event) => setDistance(event.target.value)}>
                <option value="semua">Semua Jarak</option>
                <option value="10">Maks. 10 km</option>
                <option value="50">Maks. 50 km</option>
                <option value="100">Maks. 100 km</option>
              </select>
            </label>

            <button type="button" onClick={handleApplyFilter}>
              Terapkan Filter
            </button>
          </section>

          <section className="wisata-nearest-card">
            <h2>Lokasi Terdekat</h2>
            <p className="wisata-nearest-note">
              {currentLocation
                ? 'Dihitung dari lokasi perangkat saat ini.'
                : 'Aktifkan GPS dan beri izin lokasi browser untuk melihat jarak terdekat.'}
            </p>

            {nearestWisata.length > 0 ? (
              <ol>
                {nearestWisata.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <strong>{formatDistance(item.distanceKm)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="wisata-nearest-empty">
                Jarak belum tersedia karena GPS belum aktif.
              </p>
            )}

            <button type="button" onClick={handleViewAllWisata}>
              Lihat Semua Lokasi
            </button>
            <button
              type="button"
              className="wisata-location-button"
              onClick={handleUseBrowserLocation}
              disabled={isLocating}
            >
              {isLocating ? 'Mendeteksi Lokasi...' : 'Gunakan Lokasi Saat Ini'}
            </button>
            {locationStatus && (
              <p className="wisata-location-status" aria-live="polite">
                {locationStatus}
              </p>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value, text, tone }) {
  return (
    <article className={`wisata-summary-card ${tone}`}>
      <span>
        <WisataIcon name={icon} size={21} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{text}</small>
      </div>
    </article>
  );
}
