import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const { user } = useAuth();

  const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Budi Santoso';

  const userRole = user?.role || 'petani';

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <button type="button" className="dashboard-menu-button" aria-label="Menu">
          ☰
        </button>

        <div className="dashboard-user-info">
          <span className="dashboard-user-icon">☻</span>
          <strong>{userName}</strong>
          <span>•</span>
          <span className="dashboard-user-role">{userRole}</span>
        </div>
      </header>

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
