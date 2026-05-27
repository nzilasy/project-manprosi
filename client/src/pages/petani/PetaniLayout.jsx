import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PetaniLayout.css';

function LayoutIcon({ name }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const icons = {
    menu: (
      <svg {...commonProps}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    ),
    user: (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
    home: (
      <svg {...commonProps}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10.5V20h14v-9.5" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
    map: (
      <svg {...commonProps}>
        <path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" />
        <path d="M8 4v13" />
        <path d="M16 7v13" />
      </svg>
    ),
    leaf: (
      <svg {...commonProps}>
        <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z" />
        <path d="M5 19c4-5 8-8 14-14" />
      </svg>
    ),
    alert: (
      <svg {...commonProps}>
        <path d="M12 3 2 21h20L12 3Z" />
        <path d="M12 9v5" />
        <path d="M12 18h.01" />
      </svg>
    ),
    pin: (
      <svg {...commonProps}>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    bot: (
      <svg {...commonProps}>
        <rect x="5" y="8" width="14" height="10" rx="3" />
        <path d="M12 4v4" />
        <path d="M9 13h.01" />
        <path d="M15 13h.01" />
        <path d="M9 18v2" />
        <path d="M15 18v2" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function PetaniLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showSidebar, setShowSidebar] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'User';

  const userRole = user?.role || 'petani';

  const handleLogout = () => {
    setShowUserMenu(false);

    if (typeof logout === 'function') {
      logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    navigate('/login');
  };

  return (
    <div className="petani-layout">
      <header className="petani-topbar">
        <button
          type="button"
          className="petani-menu-button"
          onClick={() => setShowSidebar((previous) => !previous)}
          aria-label={showSidebar ? 'Sembunyikan menu' : 'Tampilkan menu'}
        >
          <LayoutIcon name="menu" />
        </button>

        <div className="petani-user-area">
          <button
            type="button"
            className="petani-user-button"
            onClick={() => setShowUserMenu((previous) => !previous)}
          >
            <span className="petani-user-icon">
              <LayoutIcon name="user" />
            </span>
            <strong>{userName}</strong>
            <span>•</span>
            <span className="petani-user-role">{userRole}</span>
          </button>

          {showUserMenu && (
            <div className="petani-user-dropdown">
              <div className="petani-user-dropdown-header">
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>

              <button type="button" onClick={handleLogout}>
                Keluar dari akun
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={showSidebar ? 'petani-body' : 'petani-body sidebar-hidden'}>
        {showSidebar && (
          <aside className="petani-sidebar">
            <div className="petani-sidebar-title">
              <strong>
                <LayoutIcon name="leaf" />
                Potensi Desa
              </strong>
              <span>{userRole}</span>
            </div>

            <nav className="petani-sidebar-nav">
              <p>LAHAN SAYA</p>

              <NavLink to="/petani/dashboard">
                <span className="petani-nav-icon">
                  <LayoutIcon name="home" />
                </span>
                <span>Ringkasan</span>
              </NavLink>

              <NavLink to="/petani/lahan">
                <span className="petani-nav-icon">
                  <LayoutIcon name="map" />
                </span>
                <span>Kelola Lahan</span>
              </NavLink>

              <NavLink to="/petani/panen">
                <span className="petani-nav-icon">
                  <LayoutIcon name="leaf" />
                </span>
                <span>Hasil Panen</span>
              </NavLink>

              <NavLink to="/petani/kendala">
                <span className="petani-nav-icon">
                  <LayoutIcon name="alert" />
                </span>
                <span>Lapor Kendala</span>
              </NavLink>

              <p>LIHAT PETA</p>

              <NavLink to="/petani/komoditas">
                <span className="petani-nav-icon">
                  <LayoutIcon name="map" />
                </span>
                <span>Peta Komoditas</span>
              </NavLink>

              <NavLink to="/petani/wisata">
                <span className="petani-nav-icon">
                  <LayoutIcon name="pin" />
                </span>
                <span>Lokasi Wisata</span>
              </NavLink>

              <p>AI</p>

              <NavLink to="/petani/rekomendasi">
                <span className="petani-nav-icon">
                  <LayoutIcon name="bot" />
                </span>
                <span>Tanya AI</span>
              </NavLink>
            </nav>

            <button
              type="button"
              className="petani-sidebar-logout"
              onClick={handleLogout}
            >
              Keluar
            </button>
          </aside>
        )}

        <main className="petani-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
