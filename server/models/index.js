const Role = require('./Role');
const User = require('./User');
const Lokasi = require('./Lokasi');
const Lahan = require('./Lahan');
const Peternakan = require('./Peternakan');
const Kategori = require('./Kategori');
const Komoditas = require('./Komoditas');
const Panen = require('./Panen');
const Wisata = require('./Wisata');
const WisataRating = require('./WisataRating');
const KunjunganWisata = require('./KunjunganWisata');
const KendalaWisata = require('./KendalaWisata');
const Laporan = require('./Laporan');
const RekomendasiAI = require('./RekomendasiAI');

// Role -> User
Role.hasMany(User, {
  foreignKey: 'id_role',
});

User.belongsTo(Role, {
  foreignKey: 'id_role',
});

// User -> Lahan
User.hasMany(Lahan, {
  foreignKey: 'id_user',
  as: 'lahan',
});

Lahan.belongsTo(User, {
  foreignKey: 'id_user',
  as: 'user',
});

// User -> Peternakan
User.hasMany(Peternakan, {
  foreignKey: 'id_user',
});

Peternakan.belongsTo(User, {
  foreignKey: 'id_user',
});

// User -> Laporan
User.hasMany(Laporan, {
  foreignKey: 'id_user',
});

Laporan.belongsTo(User, {
  foreignKey: 'id_user',
});

// User -> KendalaWisata
User.hasMany(KendalaWisata, {
  foreignKey: 'id_user',
  as: 'kendala_wisata',
});

KendalaWisata.belongsTo(User, {
  foreignKey: 'id_user',
  as: 'user',
});

// Lokasi -> Lahan
Lokasi.hasMany(Lahan, {
  foreignKey: 'id_lokasi',
  as: 'lahan',
});

Lahan.belongsTo(Lokasi, {
  foreignKey: 'id_lokasi',
  as: 'lokasi',
});

// Lokasi -> Peternakan
Lokasi.hasMany(Peternakan, {
  foreignKey: 'id_lokasi',
});

Peternakan.belongsTo(Lokasi, {
  foreignKey: 'id_lokasi',
});

// Lokasi -> Wisata
Lokasi.hasMany(Wisata, {
  foreignKey: 'id_lokasi',
});

Wisata.belongsTo(Lokasi, {
  foreignKey: 'id_lokasi',
});

// Wisata -> WisataRating
Wisata.hasMany(WisataRating, {
  foreignKey: 'id_wisata',
  as: 'ratings',
});

WisataRating.belongsTo(Wisata, {
  foreignKey: 'id_wisata',
  as: 'wisata',
});

User.hasMany(WisataRating, {
  foreignKey: 'id_user',
  as: 'wisata_ratings',
});

WisataRating.belongsTo(User, {
  foreignKey: 'id_user',
  as: 'user',
});

// Kategori -> Komoditas
Kategori.hasMany(Komoditas, {
  foreignKey: 'id_kategori',
  as: 'komoditas',
});

Komoditas.belongsTo(Kategori, {
  foreignKey: 'id_kategori',
  as: 'kategori',
});

// Komoditas -> Lahan
Komoditas.hasMany(Lahan, {
  foreignKey: 'id_komoditas',
  as: 'lahan',
});

Lahan.belongsTo(Komoditas, {
  foreignKey: 'id_komoditas',
  as: 'komoditas',
});

// Lahan -> Panen
Lahan.hasMany(Panen, {
  foreignKey: 'id_lahan',
});

Panen.belongsTo(Lahan, {
  foreignKey: 'id_lahan',
});

// Komoditas -> Panen
Komoditas.hasMany(Panen, {
  foreignKey: 'id_komoditas',
});

Panen.belongsTo(Komoditas, {
  foreignKey: 'id_komoditas',
});

// Wisata -> KunjunganWisata
Wisata.hasMany(KunjunganWisata, {
  foreignKey: 'id_wisata',
  as: 'kunjungan',
});

KunjunganWisata.belongsTo(Wisata, {
  foreignKey: 'id_wisata',
  as: 'wisata',
});

// Wisata -> KendalaWisata
Wisata.hasMany(KendalaWisata, {
  foreignKey: 'id_wisata',
  as: 'kendala',
});

KendalaWisata.belongsTo(Wisata, {
  foreignKey: 'id_wisata',
  as: 'wisata',
});

module.exports = {
  Role,
  User,
  Lokasi,
  Lahan,
  Peternakan,
  Kategori,
  Komoditas,
  Panen,
  Wisata,
  WisataRating,
  KunjunganWisata,
  KendalaWisata,
  Laporan,
  RekomendasiAI,
};
