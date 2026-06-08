import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import PetaniLayout from './pages/petani/PetaniLayout';

import LandingPage from './pages/public/LandingPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/auth/ProfilePage';

import { ComingSoonPage, NotFoundPage, UnauthorizedPage } from './pages/ErrorPages';

import PetaniDashboard from './pages/petani/DashboardPage';
import LahanPage from './pages/petani/LahanPage';
import PanenPage from './pages/petani/PanenPage';
import KendalaPage from './pages/petani/KendalaPage';
import KomoditasMapPage from './pages/petani/KomoditasMapPage';
import PetaniWisataMapPage from './pages/petani/WisataMapPage';
import AiChatPage from './pages/petani/AiChatPage';

import PengurusDashboard from './pages/pengurus/DashboardPage';
import PotensiDesaPage from './pages/pengurus/PotensiDesaPage';
import LaporanPotensiPage from './pages/pengurus/LaporanPotensiPage';
import LahanTidakTermanfaatkanPage from './pages/pengurus/LahanTidakTermanfaatkanPage';

import MasyarakatWisataMapPage from './pages/masyarakat/WisataMapPage';
import MasyarakatKomoditasMapPage from './pages/masyarakat/KomoditasMapPage';
import WisataDashboard from './pages/wisata/DashboardPage';
import WisataKunjunganPage from './pages/wisata/KunjunganPage';
import WisataKendalaPage from './pages/wisata/KendalaPage';
import WisataUlasanPage from './pages/wisata/UlasanPage';
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
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Profile Route for all authenticated users */}
            <Route element={<ProtectedRoute roles={['petani', 'pengurus', 'masyarakat', 'wisata']} />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Petani */}
            <Route element={<ProtectedRoute roles={['petani']} />}>
              <Route element={<PetaniLayout />}>
                <Route path="/petani/dashboard" element={<PetaniDashboard />} />
                <Route path="/petani/lahan" element={<LahanPage />} />
                <Route path="/petani/panen" element={<PanenPage />} />
                <Route path="/petani/kendala" element={<KendalaPage />} />
                <Route path="/petani/komoditas" element={<KomoditasMapPage />} />
                <Route path="/petani/wisata" element={<PetaniWisataMapPage />} />
                <Route path="/petani/ulasan" element={<WisataUlasanPage />} />
                <Route path="/petani/rekomendasi" element={<AiChatPage />} />
              </Route>
            </Route>

            {/* Pengurus Desa */}
            <Route element={<ProtectedRoute roles={['pengurus']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/pengurus/dashboard" element={<PengurusDashboard />} />
                <Route path="/pengurus/potensi" element={<PotensiDesaPage />} />
                <Route path="/pengurus/peta" element={<MasyarakatKomoditasMapPage />} />
                <Route path="/pengurus/laporan" element={<LaporanPotensiPage />} />
                <Route
                  path="/pengurus/lahan-tidak-termanfaatkan"
                  element={<LahanTidakTermanfaatkanPage />}
                />
                <Route path="/pengurus/rekomendasi" element={<AiChatPage variant="pengurus" />} />
              </Route>
            </Route>

            {/* Masyarakat */}
            <Route element={<ProtectedRoute roles={['masyarakat']} />}>
              <Route element={<DashboardLayout />}>

                <Route path="/masyarakat/wisata" element={<MasyarakatWisataMapPage />} />
                <Route path="/masyarakat/ulasan" element={<WisataUlasanPage />} />
                <Route path="/masyarakat/komoditas" element={<MasyarakatKomoditasMapPage />} />
              </Route>
            </Route>

            {/* Pengelola Wisata */}
            <Route element={<ProtectedRoute roles={['wisata']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/wisata/dashboard" element={<WisataDashboard />} />
                <Route path="/wisata/data" element={<ComingSoonPage title="Data Wisata" />} />
                <Route path="/wisata/laporan" element={<WisataKunjunganPage />} />
                <Route path="/wisata/laporan/riwayat" element={<WisataKunjunganPage />} />
                <Route path="/wisata/pengunjung" element={<WisataKunjunganPage />} />
                <Route path="/wisata/pengunjung/riwayat" element={<WisataKunjunganPage />} />
                <Route path="/wisata/kendala" element={<WisataKendalaPage />} />
                <Route path="/wisata/ulasan" element={<WisataUlasanPage />} />
                <Route path="/wisata/lokasi" element={<WisataMapPage />} />
                <Route path="/wisata/rekomendasi" element={<AiChatPage variant="wisata" />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
