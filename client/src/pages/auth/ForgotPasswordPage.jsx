import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import agrosyncLogo from '../../assets/Logo_project.jpeg';

const BTN_COLOR = '#4d7c6f';
const BTN_HOVER = '#3d6b5e';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);

    try {
      const { data } = await authService.forgotPassword(email);
      setMessage(data.message || 'Permintaan reset password berhasil diproses.');
      setResetUrl(data.reset_url || '');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Gagal membuat link reset password.');
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
          <h1 style={styles.title}>Lupa Password</h1>
          <p style={styles.subtitle}>
            Masukkan email akun Anda untuk membuat link reset password.
          </p>

          {error && <div style={styles.errorBanner}>{error}</div>}
          {message && <div style={styles.successBanner}>{message}</div>}

          {resetUrl && (
            <div style={styles.resetBox}>
              <span style={styles.resetLabel}>Link reset password</span>
              <Link to={resetUrl} style={styles.resetLink}>
                Buka halaman reset password
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="agrosync@gmail.com"
                required
              />
            </Field>

            <OvalButton type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Kirim Link Reset'}
            </OvalButton>
          </form>

          <p style={styles.footerText}>
            Ingat password?{' '}
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
  resetBox: {
    display: 'grid',
    gap: '6px',
    marginBottom: '16px',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #d1fae5',
    backgroundColor: '#f7fee7',
  },
  resetLabel: {
    color: '#4b5563',
    fontSize: '12px',
    fontWeight: '600',
  },
  resetLink: {
    color: '#166534',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'underline',
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
