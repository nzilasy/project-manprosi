import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navByRole = {
  petani: [
    { to: '/petani/dashboard', label: '🏠 Dashboard' },
    { to: '/petani/lahan', label: '🗺️ Peta Lahan' },
    { to: '/petani/panen', label: '🌾 Laporan Panen' },
    { to: '/petani/rekomendasi', label: '🤖 Rekomendasi AI' },
  ],
  pengurus: [
    { to: '/pengurus/dashboard', label: '🏠 Dashboard' },
    { to: '/pengurus/peta', label: '🗺️ Peta Komoditas' },
    { to: '/pengurus/laporan', label: '📊 Laporan Potensi' },
    { to: '/pengurus/rekomendasi', label: '🤖 Rekomendasi AI' },
  ],
  masyarakat: [
    { to: '/masyarakat/dashboard', label: '🏠 Beranda' },
    { to: '/masyarakat/wisata', label: '🏞️ Wisata' },
    { to: '/masyarakat/komoditas', label: '🌿 Komoditas' },
  ],
  wisata: [
    { to: '/wisata/dashboard', label: '🏠 Dashboard' },
    { to: '/wisata/pengunjung', label: '👥 Laporan Pengunjung' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navByRole[user?.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-green-800 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-green-700">
        <h1 className="text-lg font-bold leading-tight">🌾 Potensi Desa</h1>
        <p className="text-xs text-green-300 mt-0.5 capitalize">{user?.role}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-green-600 font-semibold'
                  : 'hover:bg-green-700'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="px-4 py-4 border-t border-green-700">
        <p className="text-xs text-green-300 truncate mb-2">{user?.name}</p>
        <button
          onClick={handleLogout}
          className="w-full text-sm bg-green-900 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
