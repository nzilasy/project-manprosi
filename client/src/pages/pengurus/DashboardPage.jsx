export default function PengurusDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard Pengurus Desa</h1>
      <p className="text-slate-500 text-sm mb-6">Pantau potensi wilayah dan kelola laporan desa.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Lahan Terdaftar', value: '—', icon: '🗺️' },
          { label: 'Lahan Belum Dimanfaatkan', value: '—', icon: '🌱' },
          { label: 'Komoditas Unggulan', value: '—', icon: '🏆' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <span className="text-3xl">{card.icon}</span>
            <div>
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="text-xl font-bold text-slate-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
