import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import agrosyncLogo from '../../assets/Logo_project.jpeg';

const BTN_COLOR = '#4d7c6f';
const BTN_HOVER = '#3d6b5e';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await authService.resetPassword(token, form.password);
      setMessage(data.message || 'Password berhasil diperbarui.');
      setForm({ password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Gagal memperbarui password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <Link to="/" style={styles.logo}>
          <img src={agrosyncLogo} alt="Agrosync ID" style={styles.logoImage} />
          <span style={styles.logoText}>agrosyncid</span>
        </Link>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>Masukkan password baru untuk akun Anda.</p>

          {error && <div style={styles.errorBanner}>{error}</div>}
          {message && <div style={styles.successBanner}>{message}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <Field label="Password Baru">
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••••"
                minLength={6}
                required
              />
            </Field>

            <Field label="Konfirmasi Password">
              <Input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••"
                minLength={6}
                required
              />
            </Field>

            <OvalButton type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </OvalButton>
          </form>

          <p style={styles.footerText}>
            Sudah reset password?{' '}
            <Link to="/login" style={styles.helperLink}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      {...props}
      style={{
        ...styles.input,
        borderColor: focused ? BTN_COLOR : '#d1d5db',
        boxShadow: focused ? `0 0 0 2px ${BTN_COLOR}22` : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function OvalButton({ children, disabled, type }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.ovalBtn,
        backgroundColor: disabled ? '#6b9e94' : hovered ? BTN_HOVER : BTN_COLOR,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  navbar: {
    height: '76px',
    padding: '0 30px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    backgroundColor: '#ffffff',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: '#0f172a',
    textDecoration: 'none',
  },
  logoImage: {
    width: '54px',
    height: '54px',
    borderRadius: '999px',
    objectFit: 'cover',
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.14)',
  },
  logoText: {
    fontSize: '21px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
  },
  title: {
    margin: '0 0 8px',
    color: '#111827',
    fontSize: '28px',
    fontWeight: '700',
  },
  subtitle: {
    margin: '0 0 22px',
    color: '#6b7280',
    fontSize: '14px',
  },
  errorBanner: {
    marginBottom: '16px',
    fontSize: '13px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  successBanner: {
    marginBottom: '16px',
    fontSize: '13px',
    color: '#166534',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '11px 14px',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  helperLink: {
    color: '#111827',
    fontWeight: '600',
    textDecoration: 'underline',
  },
  ovalBtn: {
    width: '100%',
    border: 'none',
    borderRadius: '50px',
    padding: '13px 20px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  },
  footerText: {
    marginTop: '20px',
    color: '#6b7280',
    fontSize: '13px',
    textAlign: 'center',
  },
};
