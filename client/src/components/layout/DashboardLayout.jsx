import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

function DashboardIcon({ name }) {
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
  };

  return icons[name] || null;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Budi Santoso';

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
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <button
          type="button"
          className="dashboard-menu-button"
          onClick={() => setShowSidebar((previous) => !previous)}
          aria-label={showSidebar ? 'Sembunyikan menu' : 'Tampilkan menu'}
        >
          <DashboardIcon name="menu" />
        </button>

        <div className="dashboard-user-area">
          <button
            type="button"
            className="dashboard-user-button"
            onClick={() => setShowUserMenu((previous) => !previous)}
          >
            <span className="dashboard-user-icon">
              <DashboardIcon name="user" />
            </span>
            <strong>{userName}</strong>
            <span>•</span>
            <span className="dashboard-user-role">{userRole}</span>
          </button>

          {showUserMenu && (
            <div className="dashboard-user-dropdown">
              <div className="dashboard-user-dropdown-header">
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

      <div className={showSidebar ? 'dashboard-body' : 'dashboard-body sidebar-hidden'}>
        {showSidebar && <Sidebar />}

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
