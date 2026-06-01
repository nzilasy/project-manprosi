import { useMemo, useState } from 'react';
import { aiService } from '../../services/aiService';
import './AiChatPage.css';

const MAX_MESSAGE_LENGTH = 1000;

const PETANI_DEFAULT_MESSAGES = [
  {
    id: 'seed-user',
    role: 'user',
    content: 'Bagaimana cara mengatasi hama wereng pada tanaman padi?',
    createdAt: '10:32',
  },
  {
    id: 'seed-assistant',
    role: 'assistant',
    content:
      'Hama wereng dapat menyebabkan tanaman padi menguning dan bahkan puso jika tidak segera ditangani. Berikut beberapa cara mengatasinya:\n\n1. Pengendalian hayati\nGunakan musuh alami seperti laba-laba, capung, atau parasitoid.\n\n2. Pengendalian kultur teknis\nTanam varietas tahan wereng, atur jarak tanam, dan lakukan tanam serempak. Hindari pemupukan nitrogen berlebihan.\n\n3. Pengendalian kimia jika diperlukan\nGunakan insektisida sesuai dosis anjuran dan ikuti label produk. Konsultasikan dengan penyuluh pertanian setempat untuk pilihan bahan aktif yang tepat.',
    tip:
      'Lakukan pemantauan rutin pada tanaman, terutama saat awal musim tanam untuk mencegah serangan lebih parah.',
    createdAt: '10:32',
  },
];

const PENGURUS_DEFAULT_MESSAGES = [
  {
    id: 'seed-pengurus-user',
    role: 'user',
    content: 'Bagaimana menentukan prioritas tindak lanjut laporan potensi desa?',
    createdAt: '10:32',
  },
  {
    id: 'seed-pengurus-assistant',
    role: 'assistant',
    content:
      'Prioritas tindak lanjut bisa dibuat dari kombinasi dampak, urgensi, dan kesiapan sumber daya.\n\n1. Urutkan berdasarkan tingkat masalah\nDahulukan laporan yang menghambat produksi, akses lahan, atau keselamatan warga.\n\n2. Kelompokkan berdasarkan jenis potensi\nPisahkan pertanian, peternakan, pariwisata, dan lahan kosong agar keputusan lebih mudah dibandingkan.\n\n3. Gunakan data lokasi dan status\nLaporan yang lokasinya jelas dan statusnya belum diproses sebaiknya masuk daftar kerja awal.\n\n4. Buat rencana tindak lanjut\nTetapkan penanggung jawab, target waktu, dan catatan hasil verifikasi lapangan.',
    tip:
      'Gunakan data laporan terbaru sebagai dasar rapat desa, lalu tandai status laporan agar progresnya mudah dipantau.',
    createdAt: '10:32',
  },
];

const PETANI_TOPICS = [
  {
    title: 'Budidaya Tanaman',
    text: 'Cara menanam & merawat tanaman',
    tone: 'green',
    question: 'Bagaimana cara meningkatkan budidaya tanaman agar hasil panen lebih stabil?',
  },
  {
    title: 'Hama & Penyakit',
    text: 'Identifikasi & pengendalian hama',
    tone: 'cream',
    question: 'Bagaimana cara mengenali dan mengendalikan hama pada tanaman padi?',
  },
  {
    title: 'Pemupukan',
    text: 'Jenis pupuk & dosis yang tepat',
    tone: 'blue',
    question: 'Bagaimana menentukan jenis pupuk dan waktu pemupukan yang tepat?',
  },
  {
    title: 'Panen & Pascapanen',
    text: 'Waktu panen & penyimpanan hasil',
    tone: 'orange',
    question: 'Kapan waktu panen terbaik dan bagaimana menjaga kualitas hasil panen?',
  },
  {
    title: 'Iklim & Cuaca',
    text: 'Informasi cuaca & iklim terkini',
    tone: 'sky',
    question: 'Apa yang perlu disiapkan petani saat cuaca tidak menentu?',
  },
];

const PENGURUS_TOPICS = [
  {
    title: 'Prioritas Laporan',
    text: 'Urutkan laporan yang perlu ditindaklanjuti',
    tone: 'green',
    question: 'Bagaimana cara menentukan prioritas laporan potensi desa yang harus ditindaklanjuti lebih dulu?',
  },
  {
    title: 'Potensi Desa',
    text: 'Analisis pertanian, peternakan, dan wisata',
    tone: 'cream',
    question: 'Bagaimana membaca data potensi desa untuk membuat rekomendasi pengembangan wilayah?',
  },
  {
    title: 'Lahan Kosong',
    text: 'Ide pemanfaatan lahan belum produktif',
    tone: 'blue',
    question: 'Apa rekomendasi pemanfaatan lahan kosong agar lebih produktif untuk desa?',
  },
  {
    title: 'Peta Komoditas',
    text: 'Sebaran komoditas dan wilayah potensial',
    tone: 'orange',
    question: 'Bagaimana cara memakai peta komoditas untuk mengambil keputusan pengembangan desa?',
  },
  {
    title: 'Laporan Wisata',
    text: 'Kendala dan peluang destinasi wisata',
    tone: 'sky',
    question: 'Bagaimana menindaklanjuti laporan kendala wisata agar potensi wisata desa meningkat?',
  },
];

const AI_CONFIGS = {
  petani: {
    context: 'petani',
    storageKeySessions: 'agrosync_ai_sessions_v1',
    oldStorageKey: 'agrosync_ai_messages_v1',
    defaultSessions: [
      {
        id: 'default-session-1',
        title: 'Mengatasi hama wereng',
        updatedAt: Date.now(),
        messages: PETANI_DEFAULT_MESSAGES,
      },
    ],
    topics: PETANI_TOPICS,
    heading: 'Tanya Ai',
    subtitle: 'Dapatkan rekomendasi dan jawaban seputar pertanian dari Ai.',
    emptyTitle: 'Mulai percakapan pertanian',
    emptyText: 'Pilih topik populer atau tulis pertanyaan tentang lahan, panen, hama, dan peningkatan potensi.',
    placeholder: 'Tanyakan apa saja tentang pertanian...',
    typingText: 'Ai sedang menyusun rekomendasi...',
    tipLabel: 'Tips AgroAi',
  },
  pengurus: {
    context: 'pengurus',
    storageKeySessions: 'agrosync_pengurus_ai_sessions_v1',
    oldStorageKey: null,
    defaultSessions: [
      {
        id: 'default-pengurus-session-1',
        title: 'Prioritas laporan desa',
        updatedAt: Date.now(),
        messages: PENGURUS_DEFAULT_MESSAGES,
      },
    ],
    topics: PENGURUS_TOPICS,
    heading: 'Tanya Ai',
    subtitle: 'Dapatkan rekomendasi untuk memantau potensi, laporan, dan tindak lanjut wilayah desa.',
    emptyTitle: 'Mulai analisis potensi desa',
    emptyText: 'Pilih topik populer atau tulis pertanyaan tentang laporan potensi, lahan kosong, wisata, dan prioritas tindak lanjut.',
    placeholder: 'Tanyakan tentang potensi desa, laporan, atau tindak lanjut...',
    typingText: 'Ai sedang menyusun rekomendasi pengurus desa...',
    tipLabel: 'Catatan AgroAi',
  },
};

function loadSessions(config) {
  try {
    const stored = localStorage.getItem(config.storageKeySessions);
    const parsed = stored ? JSON.parse(stored) : null;

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }

    // Migrate from old format
    const oldStored = config.oldStorageKey ? localStorage.getItem(config.oldStorageKey) : null;
    const oldParsed = oldStored ? JSON.parse(oldStored) : null;
    if (Array.isArray(oldParsed) && oldParsed.length > 0) {
      const firstUserMsg = oldParsed.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content : 'Percakapan Sebelumnya';
      return [{
        id: createId(),
        title: title.length > 30 ? title.substring(0, 30) + '...' : title,
        updatedAt: Date.now(),
        messages: oldParsed
      }];
    }
  } catch {
    // Ignore corrupted local history.
  }

  return config.defaultSessions;
}

function saveSessions(storageKey, sessions) {
  localStorage.setItem(storageKey, JSON.stringify(sessions));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createInitialChatState(config) {
  const sessions = loadSessions(config);

  return {
    sessions,
    activeSessionId: sessions.length > 0 ? sessions[0].id : null,
  };
}

function getTimeLabel() {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function AiIcon({ name, size = 18 }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    width: size,
    height: size,
    'aria-hidden': 'true',
  };

  const icons = {
    sparkle: (
      <svg {...props}>
        <path d="M12 3l1.8 5.1L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.9L12 3Z" />
        <path d="M19 3l.7 2 .3.3 2 .7-2 .7-.3.3-.7 2-.7-2-.3-.3-2-.7 2-.7.3-.3.7-2Z" />
      </svg>
    ),
    chevron: (
      <svg {...props}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    ),
    send: (
      <svg {...props}>
        <path d="m5 12 14-7-7 14-2-5-5-2Z" />
        <path d="m10 14 4-4" />
      </svg>
    ),
    copy: (
      <svg {...props}>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    thumbsUp: (
      <svg {...props}>
        <path d="M7 10v10" />
        <path d="M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 6A2 2 0 0 1 18.4 20H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2.2L12 4.7a2 2 0 0 1 3 1.2Z" />
      </svg>
    ),
    thumbsDown: (
      <svg {...props}>
        <path d="M17 14V4" />
        <path d="M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-6A2 2 0 0 1 5.6 4H17a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2.2L12 19.3a2 2 0 0 1-3-1.2Z" />
      </svg>
    ),
    chat: (
      <svg {...props}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
      </svg>
    ),
    trash: (
      <svg {...props}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    ),
    plant: (
      <svg {...props}>
        <path d="M12 21V10" />
        <path d="M12 10c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Z" />
        <path d="M12 12c4 0 6.5-2.3 6.5-6.5C14.5 5.5 12 8 12 12Z" />
      </svg>
    ),
    bug: (
      <svg {...props}>
        <path d="M8 8a4 4 0 0 1 8 0v8a4 4 0 0 1-8 0V8Z" />
        <path d="M3 13h5" />
        <path d="M16 13h5" />
        <path d="M4 19l4-3" />
        <path d="M20 19l-4-3" />
        <path d="M4 7l4 3" />
        <path d="M20 7l-4 3" />
      </svg>
    ),
    calendar: (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
    cloud: (
      <svg {...props}>
        <path d="M17.5 18H8a5 5 0 1 1 1.5-9.8A6 6 0 0 1 21 11a3.5 3.5 0 0 1-3.5 7Z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function AiChatPage({ variant = 'petani' }) {
  const config = AI_CONFIGS[variant] || AI_CONFIGS.petani;
  const [initialChatState] = useState(() => createInitialChatState(config));
  const [sessions, setSessions] = useState(initialChatState.sessions);
  const [activeSessionId, setActiveSessionId] = useState(initialChatState.activeSessionId);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const messages = currentSession ? currentSession.messages : [];

  const startNewChat = () => {
    setActiveSessionId(null);
    setError('');
  };

  const sendQuestion = async (question) => {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || loading) return;

    let targetSessionId = activeSessionId;
    let nextSessions = [...sessions];
    let targetSessionIndex = targetSessionId
      ? nextSessions.findIndex((session) => session.id === targetSessionId)
      : -1;

    if (targetSessionIndex < 0) {
      targetSessionId = createId();
      const newSession = {
        id: targetSessionId,
        title: cleanQuestion.length > 30 ? cleanQuestion.substring(0, 30) + '...' : cleanQuestion,
        updatedAt: Date.now(),
        messages: []
      };
      nextSessions = [newSession, ...nextSessions];
      targetSessionIndex = 0;
      setActiveSessionId(targetSessionId);
    }

    const userMessage = {
      id: createId(),
      role: 'user',
      content: cleanQuestion,
      createdAt: getTimeLabel(),
    };
    
    const prevMessages = nextSessions[targetSessionIndex].messages;
    const nextMessages = [...prevMessages, userMessage];

    nextSessions[targetSessionIndex] = {
      ...nextSessions[targetSessionIndex],
      messages: nextMessages,
      updatedAt: Date.now()
    };

    setSessions(nextSessions);
    saveSessions(config.storageKeySessions, nextSessions);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const { data } = await aiService.chat({
        message: cleanQuestion,
        roleContext: config.context,
        history: prevMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      setSessions(prev => {
        const updatedSessions = [...prev];
        const idx = updatedSessions.findIndex(s => s.id === targetSessionId);
        if (idx >= 0) {
           updatedSessions[idx] = {
             ...updatedSessions[idx],
             messages: [
               ...updatedSessions[idx].messages,
               {
                 id: createId(),
                 role: 'assistant',
                 content: data.answer || 'AI belum memberikan jawaban.',
                 createdAt: getTimeLabel(),
               }
             ],
           updatedAt: Date.now()
           };
           saveSessions(config.storageKeySessions, updatedSessions);
        }
        return updatedSessions;
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Gagal menghubungi AI. Pastikan server dan Gemini API key sudah aktif.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuestion(input);
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('Yakin ingin menghapus obrolan ini?')) {
      setSessions(prev => {
        const nextSessions = prev.filter(s => s.id !== sessionId);
        saveSessions(config.storageKeySessions, nextSessions);
        return nextSessions;
      });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setError('');
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Yakin ingin menghapus semua riwayat percakapan?')) {
      setSessions([]);
      setActiveSessionId(null);
      saveSessions(config.storageKeySessions, []);
      setError('');
    }
  };

  return (
    <div className="ai-page-shell">
      <header className="ai-page-heading">
        <span className="ai-heading-icon">
          <AiIcon name="sparkle" size={34} />
        </span>
        <div>
          <h1>{config.heading}</h1>
          <p>{config.subtitle}</p>
        </div>
      </header>

      <section className="ai-layout-grid">
        <main className="ai-chat-card">
          <div className="ai-chat-stream">
            {messages.length === 0 && (
              <div className="ai-empty-state">
                <AiIcon name="plant" size={24} />
                <strong>{config.emptyTitle}</strong>
                <p>{config.emptyText}</p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} tipLabel={config.tipLabel} />
            ))}

            {loading && (
              <div className="ai-message-row assistant">
                <span className="ai-avatar" />
                <div className="ai-bubble assistant">
                  <span className="ai-typing">{config.typingText}</span>
                </div>
              </div>
            )}
          </div>

          {error && <div className="ai-error-banner">{error}</div>}

          <form className="ai-chat-input" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendQuestion(input);
                }
              }}
              placeholder={config.placeholder}
              disabled={loading}
            />
            <span>{input.length}/{MAX_MESSAGE_LENGTH}</span>
            <button type="submit" disabled={loading || !input.trim()} aria-label="Kirim pertanyaan">
              <AiIcon name="send" size={22} />
            </button>
          </form>

          <p className="ai-disclaimer">
            Ai dapat membuat kesalahan. Jawaban Ai tidak menggantikan saran ahli.
          </p>
        </main>

        <aside className="ai-side-column">
          <section className="ai-panel">
            <h2>Topik Populer</h2>

            <div className="ai-topic-list">
              {config.topics.map((topic) => (
                <button
                  type="button"
                  className="ai-topic-item"
                  key={topic.title}
                  onClick={() => sendQuestion(topic.question)}
                  disabled={loading}
                >
                  <span className={`ai-topic-icon ${topic.tone}`}>
                    <TopicIcon title={topic.title} />
                  </span>
                  <span>
                    <strong>{topic.title}</strong>
                    <small>{topic.text}</small>
                  </span>
                  <AiIcon name="chevron" size={18} />
                </button>
              ))}
            </div>
          </section>

          <section className="ai-panel ai-history-panel">
            <div className="ai-panel-heading">
              <h2>Riwayat Percakapan</h2>
              <button type="button" onClick={startNewChat}>+ Chat Baru</button>
            </div>

            <div className="ai-history-list">
              {sessions.length === 0 && (
                <p className="ai-history-empty">Belum ada riwayat percakapan.</p>
              )}

              {sessions.map((session) => (
                <div className={`ai-history-item ${session.id === activeSessionId ? 'active' : ''}`} key={session.id}>
                  <button
                    type="button"
                    className="ai-history-item-main"
                    onClick={() => setActiveSessionId(session.id)}
                  >
                    <AiIcon name="chat" size={15} />
                    <span>{session.title}</span>
                    <small>
                      {new Date(session.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </small>
                  </button>
                  <button 
                    type="button" 
                    className="ai-history-item-delete" 
                    onClick={() => handleDeleteSession(session.id)}
                    aria-label="Hapus obrolan"
                    title="Hapus obrolan"
                  >
                    <AiIcon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="ai-clear-history" onClick={handleClearHistory}>
              <AiIcon name="trash" size={16} />
              Hapus Semua Riwayat
            </button>
          </section>
        </aside>
      </section>
    </div>
  );
}

function TopicIcon({ title }) {
  if (title.includes('Hama')) return <AiIcon name="bug" size={18} />;
  if (title.includes('Panen')) return <AiIcon name="calendar" size={18} />;
  if (title.includes('Iklim')) return <AiIcon name="cloud" size={18} />;

  return <AiIcon name="plant" size={18} />;
}

function ChatMessage({ message, tipLabel }) {
  const isUser = message.role === 'user';

  return (
    <div className={`ai-message-row ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && <span className="ai-avatar" />}

      <div className={`ai-message-stack ${isUser ? 'user' : 'assistant'}`}>
        <div className={`ai-bubble ${isUser ? 'user' : 'assistant'}`}>
          <div className="ai-message-text">{message.content}</div>

          {message.tip && (
            <div className="ai-tip-box">
              <strong>
                <AiIcon name="sparkle" size={14} />
                {tipLabel}
              </strong>
              <p>{message.tip}</p>
            </div>
          )}
        </div>

        <div className={`ai-message-meta ${isUser ? 'user' : 'assistant'}`}>
          <span>{message.createdAt}</span>
          {!isUser && (
            <>
              <button type="button" aria-label="Salin jawaban">
                <AiIcon name="copy" size={15} />
              </button>
              <button type="button" aria-label="Jawaban membantu">
                <AiIcon name="thumbsUp" size={14} />
              </button>
              <button type="button" aria-label="Jawaban kurang membantu">
                <AiIcon name="thumbsDown" size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
