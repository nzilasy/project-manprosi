import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { NotFoundPage, UnauthorizedPage } from './pages/ErrorPages';

import PetaniDashboard from './pages/petani/DashboardPage';
import PengurusDashboard from './pages/pengurus/DashboardPage';
import MasyarakatDashboard from './pages/masyarakat/DashboardPage';
import WisataDashboard from './pages/wisata/DashboardPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Petani */}
            <Route element={<ProtectedRoute roles={['petani']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/petani/dashboard" element={<PetaniDashboard />} />
              </Route>
            </Route>

            {/* Pengurus Desa */}
            <Route element={<ProtectedRoute roles={['pengurus']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/pengurus/dashboard" element={<PengurusDashboard />} />
              </Route>
            </Route>

            {/* Masyarakat */}
            <Route element={<ProtectedRoute roles={['masyarakat']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/masyarakat/dashboard" element={<MasyarakatDashboard />} />
              </Route>
            </Route>

            {/* Pengelola Wisata */}
            <Route element={<ProtectedRoute roles={['wisata']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/wisata/dashboard" element={<WisataDashboard />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
