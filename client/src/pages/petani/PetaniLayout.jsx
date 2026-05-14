import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PetaniLayout.css';

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
          ☰
        </button>

        <div className="petani-user-area">
          <button
            type="button"
            className="petani-user-button"
            onClick={() => setShowUserMenu((previous) => !previous)}
          >
            <span className="petani-user-icon">☻</span>
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
              <strong>🌾 Potensi Desa</strong>
              <span>{userRole}</span>
            </div>

            <nav className="petani-sidebar-nav">
              <p>LAHAN SAYA</p>

              <NavLink to="/petani/dashboard">
                🏠 Ringkasan
              </NavLink>

              <NavLink to="/petani/lahan">
                🗺️ Kelola Lahan
              </NavLink>

              <NavLink to="/petani/panen">
                🌾 Hasil Panen
              </NavLink>

              <NavLink to="/petani/peternakan">
                🐄 Peternakan
              </NavLink>

              <NavLink to="/petani/kendala">
                ⚠️ Lapor Kendala
              </NavLink>

              <p>LIHAT PETA</p>

              <NavLink to="/petani/komoditas">
                🗺️ Peta Komoditas
              </NavLink>

              <NavLink to="/petani/wisata">
                📍 Lokasi Wisata
              </NavLink>

              <p>AI</p>

              <NavLink to="/petani/rekomendasi">
                🤖 Tanya AI
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