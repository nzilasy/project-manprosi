import { useAuth } from '../../context/AuthContext';
import './DashboardPage.css';

const summaryCards = [
  {
    label: 'Lahan Terdaftar',
    value: '3',
    note: 'Semua aktif',
    icon: '🌱',
    tone: 'green',
  },
  {
    label: 'Panen Terakhir',
    value: '4,2 ton',
    note: '+8% periode ini',
    icon: '▥',
    tone: 'orange',
  },
  {
    label: 'Total Luas Lahan',
    value: '2,8 ha',
    note: '',
    icon: '⌖',
    tone: 'blue',
  },
  {
    label: 'Kendala Aktif',
    value: '1',
    note: 'Hama Wereng',
    icon: '△',
    tone: 'red',
  },
];

const chartData = [
  { month: 'Jan', value: 68, color: 'blue' },
  { month: 'Feb', value: 54, color: 'gray' },
  { month: 'Mar', value: 88, color: 'green' },
  { month: 'Apr', value: 88, color: 'green' },
  { month: 'Mei', value: 62, color: 'blue' },
  { month: 'Jun', value: 88, color: 'green' },
];

const recommendations = [
  {
    icon: '☷',
    title: 'Optimalkan irigasi tetes',
    text: 'Potensi efisiensi air 30% di musim kemarau',
    tone: 'green',
  },
  {
    icon: '↺',
    title: 'Rotasi tanaman jagung',
    text: 'Cocok untuk lahan B-02 berdasarkan jenis tanah',
    tone: 'orange',
  },
];

export default function PetaniDashboard() {
  const { user } = useAuth();

  const userName =
    user?.name ||
    user?.nama_user ||
    user?.username ||
    'Budi Santoso';

  return (
    <div className="petani-dashboard">
      <section className="petani-dashboard-hero">
        <h1>Selamat datang, {userName}! 👋</h1>
        <p>Berikut ringkasan lahan dan aktivitas pertanian milik Anda</p>
      </section>

      <section className="petani-summary-grid">
        {summaryCards.map((card) => (
          <article className="petani-summary-card" key={card.label}>
            <div className={`petani-summary-icon ${card.tone}`}>
              {card.icon}
            </div>

            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>

              {card.note && (
                <span className={`petani-summary-note ${card.tone}`}>
                  {card.note}
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="petani-dashboard-grid">
        <article className="petani-chart-card">
          <div className="petani-card-heading">
            <h2>Riwayat Panen Lahan Padi Ciherang</h2>
            <p>6 periode terakhir</p>
          </div>

          <div className="petani-chart-area">
            <div className="petani-chart-lines">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="petani-bar-chart">
              {chartData.map((item) => (
                <div className="petani-bar-item" key={item.month}>
                  <div
                    className={`petani-bar ${item.color}`}
                    style={{ height: `${item.value}%` }}
                  />
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="petani-ai-card">
          <div className="petani-ai-header">
            <div className="petani-ai-main-icon">✦</div>
            <div>
              <h2>Rekomendasi AI</h2>
              <p>Berdasarkan data lahan</p>
            </div>
          </div>

          <div className="petani-ai-list">
            {recommendations.map((item) => (
              <div className="petani-ai-item" key={item.title}>
                <div className={`petani-ai-icon ${item.tone}`}>
                  {item.icon}
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}