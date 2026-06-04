const fs = require('fs');

function updatePengurus() {
  const path = 'd:/project-manprosi/client/src/pages/pengurus/DashboardPage.css';
  let css = fs.readFileSync(path, 'utf-8');
  
  const regex = /\.pengurus-dashboard-hero \{[\s\S]*?font-size: 15px;\r?\n\}/;
  const replacement = `.pengurus-dashboard-hero {
  position: relative;
  margin-bottom: 32px;
  padding: 36px 40px 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%);
  color: #ffffff;
  overflow: hidden;
  animation: heroFadeIn 0.6s ease-out;
}

.pengurus-hero-content {
  position: relative;
  z-index: 2;
}

.pengurus-dashboard-hero h1 {
  margin: 0;
  color: #ffffff;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.pengurus-dashboard-hero p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 15px;
  line-height: 1.5;
}

.pengurus-dashboard-hero time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.pengurus-dashboard-hero time svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.pengurus-hero-decoration {
  position: absolute;
  top: -40px;
  right: -30px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}

.pengurus-hero-decoration::after {
  content: '';
  position: absolute;
  bottom: -60px;
  left: -120px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`;

  css = css.replace(regex, replacement);
  fs.writeFileSync(path, css);
}

function updatePengurusJSX() {
  const path = 'd:/project-manprosi/client/src/pages/pengurus/DashboardPage.jsx';
  let jsx = fs.readFileSync(path, 'utf-8');

  // Add helpers if they don't exist
  if (!jsx.includes('function getGreeting')) {
    const helpers = `
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function getFormattedDate() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}
`;
    // Insert before DashboardIcon
    jsx = jsx.replace('function DashboardIcon', helpers + '\nfunction DashboardIcon');
  }

  if (!jsx.includes('calendar:')) {
    const calendarIcon = `calendar: (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
    map:`;
    jsx = jsx.replace('map:', calendarIcon);
  }

  // Update greeting and date usage inside PengurusDashboard
  if (!jsx.includes('const greeting = getGreeting();')) {
    jsx = jsx.replace(/const userName =[\s\S]*?'Ahmad Fauzi';/, 
      `const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Ahmad Fauzi';

  const greeting = getGreeting();
  const formattedDate = getFormattedDate();`
    );
  }

  // Update JSX hero section
  const oldHero = `<section className="pengurus-dashboard-hero">
        <div>
          <h1>Selamat datang, {userName}!</h1>
          <p>Kelola potensi desa dengan mudah dan efektif.</p>
        </div>
      </section>`;
  
  const newHero = `<section className="pengurus-dashboard-hero">
        <div className="pengurus-hero-content">
          <h1>{greeting}, {userName}! 👋</h1>
          <p>Berikut ringkasan potensi dan laporan milik desa Anda</p>
          <time>
            <DashboardIcon name="calendar" />
            {formattedDate}
          </time>
        </div>
        <div className="pengurus-hero-decoration" aria-hidden="true" />
      </section>`;
      
  jsx = jsx.replace(oldHero, newHero);
  fs.writeFileSync(path, jsx);
}

function updateWisataJSX() {
  const path = 'd:/project-manprosi/client/src/pages/wisata/DashboardPage.jsx';
  let jsx = fs.readFileSync(path, 'utf-8');

  // Add helpers if they don't exist
  if (!jsx.includes('function getGreeting')) {
    const helpers = `
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function getFormattedDate() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}
`;
    // Insert before DashboardIcon
    jsx = jsx.replace('function DashboardIcon', helpers + '\nfunction DashboardIcon');
  }

  if (!jsx.includes('calendar:')) {
    const calendarIcon = `calendar: (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
    plus:`;
    jsx = jsx.replace('plus:', calendarIcon);
  }

  // Update greeting and date usage inside WisataDashboard
  if (!jsx.includes('const greeting = getGreeting();')) {
    jsx = jsx.replace(/const userName =[\s\S]*?'Pengelola Wisata';/, 
      `const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Pengelola Wisata';

  const greeting = getGreeting();
  const formattedDate = getFormattedDate();`
    );
  }

  // Update JSX hero section
  const oldHero = `<header className="wisata-dashboard-header">
        <h1>Selamat datang, {userName}!</h1>
        <p>Kelola data kunjungan dan kembangkan potensi wisata desa.</p>
      </header>`;
  
  const newHero = `<section className="wisata-dashboard-hero">
        <div className="wisata-hero-content">
          <h1>{greeting}, {userName}! 👋</h1>
          <p>Berikut ringkasan kunjungan dan potensi wisata desa Anda</p>
          <time>
            <DashboardIcon name="calendar" />
            {formattedDate}
          </time>
        </div>
        <div className="wisata-hero-decoration" aria-hidden="true" />
      </section>`;
      
  jsx = jsx.replace(oldHero, newHero);
  fs.writeFileSync(path, jsx);
}

updatePengurus();
updatePengurusJSX();
updateWisataJSX();
console.log('Success');
