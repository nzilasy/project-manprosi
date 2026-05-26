import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🌾</div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">404 — Halaman Tidak Ditemukan</h1>
      <p className="text-slate-500 mb-6">Halaman yang Anda cari tidak tersedia.</p>
      <Link to="/" className="bg-green-700 text-white px-6 py-2.5 rounded-lg hover:bg-green-800 transition-colors">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
      <p className="text-slate-500 mb-6">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      <Link to="/" className="bg-green-700 text-white px-6 py-2.5 rounded-lg hover:bg-green-800 transition-colors">
        Kembali
      </Link>
    </div>
  );
}

export function ComingSoonPage({ title = 'Coming Soon' }) {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">▧</div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-500 max-w-md">
        Fitur ini sedang disiapkan dan belum tersedia pada versi saat ini.
      </p>
    </div>
  );
}
