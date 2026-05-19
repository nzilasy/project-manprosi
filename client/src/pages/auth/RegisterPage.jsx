import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import agrosyncLogo from '../../assets/Logo_project.jpeg';

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
        <Link to="/" style={styles.logo}>
          <img src={agrosyncLogo} alt="Agrosync ID" style={styles.logoImage} />
          <span style={styles.logoText}>agrosyncid</span>
        </Link>
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

            {/* Register button */}
            <OvalButton type="submit" disabled={loading}>
              {loading ? 'Mendaftar...' : 'Register'}
            </OvalButton>
          </form>

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
};
