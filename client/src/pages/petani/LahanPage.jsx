import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';

import { lahanService } from '../../services/lahanService';
import { komoditasService } from '../../services/komoditasService';

import './LahanPage.css';

const DEFAULT_CENTER = [-6.9175, 107.6191];

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

function getCoordinate(item, field) {
  return item[field] || item.lokasi?.[field] || item.Lokasi?.[field] || '';
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

export default function LahanPage() {
  const [lahan, setLahan] = useState([]);
  const [komoditas, setKomoditas] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);

  const selectedPosition = useMemo(() => {
    if (!form.latitude || !form.longitude) return null;

    return [Number(form.latitude), Number(form.longitude)];
  }, [form.latitude, form.longitude]);

  const visibleLahan = useMemo(() => {
    if (filterStatus === 'semua') return lahan;

    return lahan.filter((item) => item.status === filterStatus);
  }, [lahan, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    setMessage('');

    try {
      const [lahanResponse, komoditasResponse] = await Promise.all([
        lahanService.getAll(),
        komoditasService.getAll(),
      ]);

      setLahan(lahanResponse.data.data || []);
      setKomoditas(komoditasResponse.data.data || []);
    } catch (error) {
      console.error('Load lahan page error:', error);

      setMessage(
        error.response?.data?.message ||
          'Gagal mengambil data lahan atau komoditas.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePickLocation = (latlng) => {
    setForm((previous) => ({
      ...previous,
      latitude: latlng.lat.toFixed(8),
      longitude: latlng.lng.toFixed(8),
      lokasi_lahan:
        previous.lokasi_lahan ||
        `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
    }));
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

      setForm((prevForm) => ({
        ...prevForm,
        polygon_lahan: next,
        latitude: center ? String(center[0]) : prevForm.latitude,
        longitude: center ? String(center[1]) : prevForm.longitude,
      }));

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

    setIsDrawingPolygon(false);

    setForm((previous) => ({
      ...previous,
      polygon_lahan: polygonPoints,
      latitude: previous.latitude || String(center?.[0] || ''),
      longitude: previous.longitude || String(center?.[1] || ''),
      lokasi_lahan:
        previous.lokasi_lahan ||
        `${center?.[0]?.toFixed?.(5) || center?.[0]}, ${
          center?.[1]?.toFixed?.(5) || center?.[1]
        }`,
    }));

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
        setMessage('Data lahan berhasil diperbarui.');
      } else {
        await lahanService.create(payload);
        setMessage('Data lahan berhasil disimpan.');
      }

      setForm(defaultForm);
      setPolygonPoints([]);
      setIsDrawingPolygon(false);
      setEditingId(null);

      await loadData();
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
    const savedPolygon = getPolygonPoints(item);

    setEditingId(item.id_lahan);
    setPolygonPoints(savedPolygon);
    setIsDrawingPolygon(false);

    setForm({
      nama_lahan: item.nama_lahan || '',
      id_komoditas: item.id_komoditas || '',
      luas: item.luas || '',
      satuan_luas: item.satuan_luas || 'ha',
      lokasi_lahan: getLocationText(item),
      tanggal_tanam_terakhir: item.tanggal_tanam_terakhir || '',
      latitude: getCoordinate(item, 'latitude'),
      longitude: getCoordinate(item, 'longitude'),
      polygon_lahan: savedPolygon,
      catatan: item.catatan || item.deskripsi || '',
      status: item.status || 'aktif',
    });

    setMessage(
      'Mode edit aktif. Kamu bisa menggeser titik kuning untuk mengubah bentuk batas lahan.',
    );
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(defaultForm);
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
    setMessage('');
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Hapus data lahan ini?');

    if (!confirmed) return;

    try {
      await lahanService.remove(id);

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
          <h1>Peta Lahan</h1>
          <p>Lihat sebaran dan detail lahan pertanian Anda.</p>
        </div>

        <button
          type="button"
          className="lahan-add-button"
          onClick={handleCancel}
        >
          + Tambahkan Lahan Baru
        </button>
      </div>

      {message && <div className="lahan-message">{message}</div>}

      <div className="lahan-main-grid">
        <section className="lahan-left-column">
          <div className="lahan-map-card">
            <div className="lahan-map-filter">
              <span>🗺️</span>

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
                ✏️ Gambar Batas
              </button>

              <button type="button" onClick={handleFinishDrawPolygon}>
                ✅ Selesai
              </button>

              <button type="button" onClick={handleClearPolygon}>
                🗑️ Hapus
              </button>
            </div>

            <MapContainer
              center={selectedPosition || DEFAULT_CENTER}
              zoom={selectedPosition ? 14 : 12}
              minZoom={5}
              maxBounds={INDONESIA_BOUNDS}
              maxBoundsViscosity={0.85}
              scrollWheelZoom
              className="lahan-map"
            >
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />

              <TileLayer
                attribution="Labels &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              />

              <PickLocation
                isDrawingPolygon={isDrawingPolygon}
                onPick={handlePickLocation}
                onAddPolygonPoint={handleAddPolygonPoint}
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
                visibleLahan.map((item) => (
                  <article className="lahan-item" key={item.id_lahan}>
                    <div className="lahan-thumb" aria-hidden="true">
                      🌾
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
                      <button type="button" onClick={() => handleEdit(item)}>
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(item.id_lahan)}
                      >
                        Hapus
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="lahan-form-card">
          <h2>{editingId ? 'Edit Lahan' : 'Input Lahan Baru'}</h2>
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

            <label>
              Lokasi Lahan
              <input
                name="lokasi_lahan"
                value={form.lokasi_lahan}
                onChange={handleChange}
                placeholder="Pilih lokasi atau cari di peta"
              />
            </label>

            <button
              type="button"
              className="lahan-pick-button"
              onClick={() =>
                setMessage('Klik area pada peta untuk memilih lokasi lahan.')
              }
            >
              📍 Pilih lokasi di peta
            </button>

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
                {saving ? 'Menyimpan...' : 'Simpan Lahan'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}