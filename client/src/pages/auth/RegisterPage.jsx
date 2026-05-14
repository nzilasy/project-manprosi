import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

const ROLES = [
  { value: 'petani',     label: 'Petani' },
  { value: 'pengurus',   label: 'Pengurus Desa' },
  { value: 'masyarakat', label: 'Masyarakat Desa' },
  { value: 'wisata',     label: 'Pengelola Wisata' },
];

const BTN_COLOR = '#4d7c6f';
const BTN_HOVER  = '#3d6b5e';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'petani' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* ── Navbar ── */}
      <header style={styles.navbar}>
        <span style={styles.logo}>agrosyncid</span>
      </header>

      {/* ── Main ── */}
      <main style={styles.main}>
        <div style={styles.card}>

          {/* Error banner */}
          {error && (
            <div style={styles.errorBanner}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>

            {/* Username */}
            <Field label="Username">
              <Input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="agrosync@gmail.com"
                required
              />
            </Field>

            {/* Email */}
            <Field label="Email">
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="agrosync@gmail.com"
                required
              />
            </Field>

            {/* Password */}
            <Field label="Password">
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••••"
                required
                minLength={6}
              />
            </Field>

            {/* Peran */}
            <Field label="Peran">
              <SelectInput
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </SelectInput>
            </Field>

            {/* Helper link */}
            <p style={styles.helperText}>
              New to Agrosync.id?{' '}
              <Link to="/register" style={styles.helperLink}>
                Create an Account
              </Link>
            </p>

            {/* Register button */}
            <OvalButton type="submit" disabled={loading}>
              {loading ? 'Mendaftar...' : 'Register'}
            </OvalButton>
          </form>

          {/* Divider */}
          <Divider />

          {/* OAuth */}
          <div style={styles.oauthGroup}>
            <OvalButton type="button" icon={<GoogleIcon />}>
              Lanjut dengan Google
            </OvalButton>
            <OvalButton type="button" icon={<AppleIcon />}>
              Lanjut dengan Apple
            </OvalButton>
          </div>

          {/* Link ke login */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '20px' }}>
            Sudah punya akun?{' '}
            <Link to="/login" style={styles.helperLink}>Masuk di sini</Link>
          </p>

        </div>
      </main>
    </div>
  );
}

/* ── Reusable sub-components ── */

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

function SelectInput({ children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...styles.input,
        borderColor: focused ? BTN_COLOR : '#d1d5db',
        boxShadow: focused ? `0 0 0 2px ${BTN_COLOR}22` : 'none',
        cursor: 'pointer',
        appearance: 'auto',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

function OvalButton({ children, icon, disabled, type, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.ovalBtn,
        backgroundColor: disabled ? '#6b9e94' : hovered ? BTN_HOVER : BTN_COLOR,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={styles.dividerRow}>
      <div style={styles.dividerLine} />
      <span style={styles.dividerText}>or</span>
      <div style={styles.dividerLine} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" fill="#fff" style={{ marginRight: 8 }}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.9 0 663.4 0 541.8 0 360.5 124.7 256 247.5 256c64.4 0 117.9 42.3 158 42.3 38.5 0 99.6-45.2 170.4-45.2 27.8 0 130.3 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  );
}

/* ── Styles ── */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  navbar: {
    height: '64px',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    backgroundColor: '#ffffff',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    letterSpacing: '-0.3px',
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
  errorBanner: {
    marginBottom: '16px',
    fontSize: '13px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
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
  helperText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '-4px',
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
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: '13px',
    color: '#9ca3af',
  },
  oauthGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
};