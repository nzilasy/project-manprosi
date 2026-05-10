export default function WisataDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard Pengelola Wisata</h1>
      <p className="text-slate-500 text-sm mb-6">Catat dan pantau kunjungan wisatawan desa.</p>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 inline-flex items-center gap-4">
        <span className="text-3xl">👥</span>
        <div>
          <p className="text-xs text-slate-500">Total Pengunjung Bulan Ini</p>
          <p className="text-xl font-bold text-slate-800">—</p>
        </div>
      </div>
    </div>
  );
}
