import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import './ProfilePage.css';

// Using some SVG icons for UI
const Icons = {
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  role: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9.9 4.2A8.5 8.5 0 0 1 12 4c7 0 10 7 10 7a13.2 13.2 0 0 1-2.8 3.7M6.6 6.6C4 8.3 2 12 2 12s3 7 10 7c1.8 0 3.4-.5 4.8-1.3" />
      <path d="m2 2 20 20" />
    </svg>
  )
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const roleLabels = {
    petani: 'Petani',
    pengurus: 'Pengurus Desa',
    masyarakat: 'Masyarakat',
    wisata: 'Pengelola Wisata',
  };

  const userName = user?.name || user?.nama_user || user?.username || 'User';
  const userEmail = user?.email || '-';
  const userRoleKey = user?.role || 'petani';
  const userRole = roleLabels[userRoleKey] || userRoleKey;

  const handleBack = () => {
    navigate(-1);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdError('Semua field wajib diisi.');
      return;
    }

    if (pwdForm.newPassword.length < 6) {
      setPwdError('Password baru minimal 6 karakter.');
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Konfirmasi password baru tidak sesuai.');
      return;
    }

    if (pwdForm.currentPassword === pwdForm.newPassword) {
      setPwdError('Password baru harus berbeda dari password lama.');
      return;
    }

    setPwdLoading(true);

    try {
      const { data } = await authService.changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      setPwdSuccess(data.message || 'Password berhasil diperbarui.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setPwdSuccess('');
      }, 5000);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <div className="profile-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="profile-content">
        <button className="profile-back-btn" onClick={handleBack}>
          {Icons.back}
          <span>Kembali</span>
        </button>

        <div className="profile-grid">
          {/* Info Card */}
          <div className="profile-card info-card glass-panel">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                <span>{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="profile-badge">{userRole}</div>
            </div>
            
            <h2 className="profile-name">{userName}</h2>
            
            <div className="profile-details">
              <div className="profile-detail-item">
                <div className="detail-icon">{Icons.mail}</div>
                <div className="detail-text">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{userEmail}</span>
                </div>
              </div>
              
              <div className="profile-detail-item">
                <div className="detail-icon">{Icons.role}</div>
                <div className="detail-text">
                  <span className="detail-label">Role Akses</span>
                  <span className="detail-value">{userRole}</span>
                </div>
              </div>
            </div>

            <button className="profile-logout-btn" onClick={handleLogout}>
              Keluar dari akun
            </button>
          </div>

          {/* Change Password Card */}
          <div className="profile-card password-card glass-panel">
            <div className="card-header">
              <div className="card-icon">{Icons.lock}</div>
              <div className="card-title-wrap">
                <h3>Ubah Kata Sandi</h3>
                <p>Pastikan akun Anda tetap aman dengan menggunakan kata sandi yang kuat.</p>
              </div>
            </div>

            {pwdError && <div className="profile-alert profile-alert-error">{pwdError}</div>}
            {pwdSuccess && <div className="profile-alert profile-alert-success">{pwdSuccess}</div>}

            <form className="password-form" onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Kata Sandi Lama</label>
                <div className="input-with-icon">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    placeholder="Masukkan kata sandi lama"
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-pwd-btn" 
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  >
                    {showCurrentPwd ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Kata Sandi Baru</label>
                <div className="input-with-icon">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-pwd-btn" 
                    onClick={() => setShowNewPwd(!showNewPwd)}
                  >
                    {showNewPwd ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Konfirmasi Kata Sandi Baru</label>
                <div className="input-with-icon">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    placeholder="Ulangi kata sandi baru"
                    minLength={6}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-pwd-btn" 
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  >
                    {showConfirmPwd ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
              </div>

              <button type="submit" className="save-pwd-btn" disabled={pwdLoading}>
                {pwdLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
