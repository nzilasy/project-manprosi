import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navByRole = {
  petani: [
    {
      group: 'LAHAN SAYA',
      items: [
        { to: '/petani/dashboard', label: 'Ringkasan', icon: '⌂' },
        { to: '/petani/lahan', label: 'Kelola Lahan', icon: '▱' },
        { to: '/petani/panen', label: 'Hasil Panen', icon: '🌾' },
        { to: '/petani/kendala', label: 'Lapor Kendala', icon: '!' },
      ],
    },
    {
      group: 'LIHAT PETA',
      items: [
        { to: '/petani/komoditas', label: 'Peta Komoditas', icon: '▱' },
        { to: '/petani/wisata', label: 'Lokasi Wisata', icon: '⌖' },
      ],
    },
    {
      group: 'AI',
      items: [
        { to: '/petani/rekomendasi', label: 'Tanya AI', icon: '☷' },
      ],
    },
  ],

  pengurus: [
    {
      group: 'MANAJEMEN DESA',
      items: [
        { to: '/pengurus/dashboard', label: 'Dashboard', icon: '⌂' },
        { to: '/pengurus/peta', label: 'Peta Komoditas', icon: '▱' },
        { to: '/pengurus/laporan', label: 'Laporan Potensi', icon: '▤' },
        { to: '/pengurus/rekomendasi', label: 'Rekomendasi AI', icon: '✦' },
      ],
    },
  ],

  masyarakat: [
    {
      group: 'INFORMASI DESA',
      items: [
        { to: '/masyarakat/dashboard', label: 'Beranda', icon: '⌂' },
        { to: '/masyarakat/wisata', label: 'Wisata', icon: '⌖' },
        { to: '/masyarakat/komoditas', label: 'Komoditas', icon: '🌿' },
      ],
    },
  ],

  wisata: [
    {
      group: '',
      items: [
        { to: '/wisata/dashboard', label: 'Ringkasan', icon: '⌂' },
        { to: '/wisata/data', label: 'Data Wisata', icon: '▧' },
        { to: '/wisata/pengunjung', label: 'Kunjungan', icon: '▣' },
        { to: '/wisata/laporan', label: 'Laporan', icon: '▤' },
      ],
    },
    {
      group: 'LIHAT PETA',
      items: [
        { to: '/wisata/lokasi', label: 'Lokasi Wisata', icon: '⌖' },
      ],
    },
    {
      group: 'AI',
      items: [
        { to: '/wisata/rekomendasi', label: 'Tanya AI', icon: '☷' },
      ],
    },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'petani';
  const groups = navByRole[role] || navByRole.petani;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-inner">
        {groups.map((group) => (
          <section className="dashboard-nav-group" key={group.group || 'main'}>
            {group.group && <h2>{group.group}</h2>}

            <nav>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'dashboard-nav-link is-active'
                      : 'dashboard-nav-link'
                  }
                >
                  <span className="dashboard-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </section>
        ))}

        <button type="button" className="dashboard-logout-button" onClick={handleLogout}>
          Keluar
        </button>
      </div>
    </aside>
  );
}
