import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navByRole = {
  petani: [
    {
      group: 'LAHAN SAYA',
      items: [
        { to: '/petani/dashboard', label: 'Ringkasan', icon: 'home' },
        { to: '/petani/lahan', label: 'Kelola Lahan', icon: 'land' },
        { to: '/petani/panen', label: 'Hasil Panen', icon: 'leaf' },
        { to: '/petani/kendala', label: 'Lapor Kendala', icon: 'alert' },
      ],
    },
    {
      group: 'LIHAT PETA',
      items: [
        { to: '/petani/komoditas', label: 'Peta Komoditas', icon: 'map' },
        { to: '/petani/wisata', label: 'Lokasi Wisata', icon: 'map-pin' },
        { to: '/petani/ulasan', label: 'Ulasan Wisata', icon: 'star' },
      ],
    },
    {
      group: 'AI',
      items: [
        { to: '/petani/rekomendasi', label: 'Tanya AI', icon: 'chat' },
      ],
    },
  ],

  pengurus: [
    {
      group: 'LAHAN SAYA',
      items: [
        { to: '/pengurus/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/pengurus/potensi', label: 'Potensi Desa', icon: 'chart' },
        { to: '/pengurus/peta', label: 'Peta Komoditas', icon: 'map' },
        { to: '/pengurus/laporan', label: 'Laporan potensi', icon: 'leaf' },
        {
          to: '/pengurus/lahan-tidak-termanfaatkan',
          label: 'Lahan Tidak Termanfaatkan',
          icon: 'alert',
        },
      ],
    },
    {
      group: 'AI',
      items: [
        { to: '/pengurus/rekomendasi', label: 'Tanya AI', icon: 'chat' },
      ],
    },
  ],

  masyarakat: [
    {
      group: 'INFORMASI DESA',
      items: [
        { to: '/masyarakat/komoditas', label: 'Peta Komoditas', icon: 'file-search' },
        {
          to: '/masyarakat/wisata',
          label: 'Informasi Wisata',
          icon: 'map',
          children: [
            { to: '/masyarakat/wisata', label: 'Lokasi Wisata' },
            { to: '/masyarakat/ulasan', label: 'Ulasan Wisata' },
          ],
        },
      ],
    },
  ],

  wisata: [
    {
      group: '',
      items: [
        { to: '/wisata/dashboard', label: 'Beranda', icon: 'home' },
        {
          to: '/wisata/laporan',
          label: 'Laporan Pengunjung',
          icon: 'report',
          children: [
            { to: '/wisata/laporan', label: 'Buat Laporan' },
            { to: '/wisata/laporan/riwayat', label: 'Riwayat Laporan' },
          ],
        },
        { to: '/wisata/ulasan', label: 'Ulasan Pengunjung', icon: 'star' },
        { to: '/wisata/kendala', label: 'Lapor Kendala', icon: 'alert' },
      ],
    },
    {
      group: 'LIHAT PETA',
      items: [
        { to: '/wisata/lokasi', label: 'Lokasi Wisata', icon: 'map-pin' },
      ],
    },
  ],
};

const sidebarIcons = {
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5V20h5v-5.5h3V20h5V9.5" />
    </>
  ),
  land: (
    <>
      <path d="M4 6.5h16v12H4z" />
      <path d="M4 14.5c3.2-2.2 6.3-2.2 9.5 0 2.2 1.5 4.3 1.7 6.5.5" />
      <path d="M8 10h.01" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c8.5-.2 13.5-5.2 14-14-8.8.5-13.8 5.5-14 14Z" />
      <path d="M5 19c2.8-5 6.2-8.3 10.5-10" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21 19H3L12 3.5Z" />
      <path d="M12 8.5v5" />
      <path d="M12 17h.01" />
    </>
  ),
  map: (
    <>
      <path d="m3.5 6 5-2 7 2 5-2v14l-5 2-7-2-5 2V6Z" />
      <path d="M8.5 4v14" />
      <path d="M15.5 6v14" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  chat: (
    <>
      <path d="M4.5 5.5h15v10h-8l-4.5 4v-4H4.5z" />
      <path d="M8 9.5h8" />
      <path d="M8 12.5h5" />
    </>
  ),
  report: (
    <>
      <path d="M6 3.5h9l3 3V20.5H6z" />
      <path d="M15 3.5v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </>
  ),
  star: (
    <>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.7 9l5.3 2-5.3 2L12 18.5 10.3 13 5 11l5.3-2L12 3.5Z" />
      <path d="M19 4v4" />
      <path d="M21 6h-4" />
    </>
  ),
  data: (
    <>
      <path d="M5 6.5c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3Z" />
      <path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      <path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.7-3 2.6-5 5.5-5s4.8 2 5.5 5" />
      <path d="M15 11.5a2.7 2.7 0 1 0-.7-5.3" />
      <path d="M16 14c2.2.3 3.7 1.9 4.5 5" />
    </>
  ),
  chart: (
    <>
      <path d="M5 20V11" />
      <path d="M12 20V5" />
      <path d="M19 20v-8" />
      <path d="M3 20h18" />
    </>
  ),
  'file-search': (
    <>
      <path d="M6 3.5h8l4 4V20.5H6z" />
      <path d="M14 3.5v4.5h4.5" />
      <circle cx="11" cy="13" r="2.4" />
      <path d="m12.8 14.8 3.2 3.2" />
    </>
  ),
};

function SidebarIcon({ name }) {
  const icon = sidebarIcons[name];

  if (!icon) {
    return <span className="dashboard-nav-icon-text">{name}</span>;
  }

  return (
    <svg
      className="dashboard-nav-icon-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {icon}
    </svg>
  );
}

function SidebarItem({ item }) {
  const location = useLocation();
  const isChildActive = item.children?.some(
    (child) => location.pathname === child.to || location.pathname.startsWith(`${child.to}/`)
  );
  const isParentActive = location.pathname === item.to;
  
  const [isOpen, setIsOpen] = useState(isChildActive || isParentActive);

  if (!item.children?.length) {
    return (
      <div className="dashboard-nav-item">
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            isActive ? 'dashboard-nav-link is-active' : 'dashboard-nav-link'
          }
        >
          <span className="dashboard-nav-icon" aria-hidden="true">
            <SidebarIcon name={item.icon} />
          </span>
          <span>{item.label}</span>
        </NavLink>
      </div>
    );
  }

  return (
    <div className="dashboard-nav-item">
      <button
        type="button"
        className={`dashboard-nav-link dashboard-nav-link-btn ${
          isChildActive || isParentActive ? 'is-active' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span className="dashboard-nav-icon" aria-hidden="true">
          <SidebarIcon name={item.icon} />
        </span>
        <span>{item.label}</span>
        <span
          className="dashboard-nav-chevron"
          aria-hidden="true"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="m5 7 5 5 5-5" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="dashboard-nav-children">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.to === item.to}
              className={({ isActive }) =>
                isActive ? 'dashboard-nav-child-link is-active' : 'dashboard-nav-child-link'
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <aside className={`dashboard-sidebar dashboard-sidebar-${role}`}>
      <div className="dashboard-sidebar-inner">
        {groups.map((group) => (
          <section className="dashboard-nav-group" key={group.group || 'main'}>
            {group.group && <h2>{group.group}</h2>}

            <nav>
              {group.items.map((item) => (
                <SidebarItem key={item.to} item={item} />
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
