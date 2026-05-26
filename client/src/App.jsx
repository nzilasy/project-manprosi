import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import PetaniLayout from './pages/petani/PetaniLayout';

import LandingPage from './pages/public/LandingPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import { ComingSoonPage, NotFoundPage, UnauthorizedPage } from './pages/ErrorPages';

import PetaniDashboard from './pages/petani/DashboardPage';
import LahanPage from './pages/petani/LahanPage';
import PanenPage from './pages/petani/PanenPage';
import KendalaPage from './pages/petani/KendalaPage';
import KomoditasMapPage from './pages/petani/KomoditasMapPage';
import PetaniWisataMapPage from './pages/petani/WisataMapPage';
import AiChatPage from './pages/petani/AiChatPage';

import PengurusDashboard from './pages/pengurus/DashboardPage';
import MasyarakatDashboard from './pages/masyarakat/DashboardPage';
import WisataDashboard from './pages/wisata/DashboardPage';
import WisataMapPage from './pages/wisata/WisataMapPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Petani */}
            <Route element={<ProtectedRoute roles={['petani']} />}>
              <Route element={<PetaniLayout />}>
                <Route path="/petani/dashboard" element={<PetaniDashboard />} />
                <Route path="/petani/lahan" element={<LahanPage />} />
                <Route path="/petani/panen" element={<PanenPage />} />
                <Route path="/petani/kendala" element={<KendalaPage />} />
                <Route path="/petani/komoditas" element={<KomoditasMapPage />} />
                <Route path="/petani/wisata" element={<PetaniWisataMapPage />} />
                <Route path="/petani/rekomendasi" element={<AiChatPage />} />
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
                <Route path="/wisata/data" element={<ComingSoonPage title="Data Wisata" />} />
                <Route path="/wisata/pengunjung" element={<ComingSoonPage title="Kunjungan" />} />
                <Route path="/wisata/laporan" element={<ComingSoonPage title="Laporan" />} />
                <Route path="/wisata/lokasi" element={<WisataMapPage />} />
                <Route path="/wisata/rekomendasi" element={<ComingSoonPage title="Tanya AI" />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
