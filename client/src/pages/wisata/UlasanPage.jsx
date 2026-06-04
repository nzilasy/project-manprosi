import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { wisataService } from '../../services/wisataService';
import api from '../../services/api';
import './UlasanPage.css';

// SVG Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ulasan-search-icon">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ReplyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"></polyline>
    <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
  </svg>
);

export default function UlasanPage() {
  const { user } = useAuth();
  const [wisataPoints, setWisataPoints] = useState([]);
  const [allRatings, setAllRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWisataId, setSelectedWisataId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // For reviews modal
  const [currentLocationPage, setCurrentLocationPage] = useState(1); // For main location grid

  // Reply state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);

  const canReply = ['wisata', 'pengurus'].includes(user?.role);

  // Reset page when selected location changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWisataId]);

  // Reset main grid page when search query changes
  useEffect(() => {
    setCurrentLocationPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pointsRes, ratingsRes] = await Promise.all([
          wisataService.getPoints(),
          api.get('/wisata/ratings')
        ]);
        
        setWisataPoints(pointsRes.data.data || []);
        setAllRatings(ratingsRes.data.data || []);
      } catch (err) {
        setError('Gagal memuat data wisata.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const wisataWithStats = useMemo(() => {
    return wisataPoints.map((wisata) => {
      const ratings = allRatings.filter((r) => r.id_wisata === wisata.id_wisata);
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalRatings 
        : 0;
      return { ...wisata, totalRatings, averageRating };
    });
  }, [wisataPoints, allRatings]);

  const filteredWisataPoints = useMemo(() => {
    if (!searchQuery.trim()) return wisataWithStats;
    const query = searchQuery.toLowerCase();
    return wisataWithStats.filter((w) => 
      w.nama_wisata?.toLowerCase().includes(query) || 
      w.alamat?.toLowerCase().includes(query)
    );
  }, [wisataWithStats, searchQuery]);

  const selectedWisataData = useMemo(() => {
    if (!selectedWisataId) return null;
    return wisataWithStats.find(w => w.id_wisata === selectedWisataId);
  }, [wisataWithStats, selectedWisataId]);

  const selectedWisataRatings = useMemo(() => {
    if (!selectedWisataId) return [];
    return allRatings.filter((r) => r.id_wisata === selectedWisataId);
  }, [allRatings, selectedWisataId]);

  const handleSubmitReply = async (ratingId) => {
    if (!replyText.trim()) return;
    setReplySaving(true);
    try {
      await api.put(`/wisata/ratings/${ratingId}/reply`, { balasan: replyText });
      // Update the rating in local state
      setAllRatings((prev) =>
        prev.map((r) =>
          r.id_rating === ratingId
            ? {
                ...r,
                balasan: replyText,
                balasan_by: user?.id_user || user?.id,
                balasan_by_name: user?.name || 'Pengelola',
                balasan_at: new Date().toISOString(),
              }
            : r
        )
      );
      setReplyingToId(null);
      setReplyText('');
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('Gagal menyimpan balasan');
    } finally {
      setReplySaving(false);
    }
  };

  const handleDeleteReply = async (ratingId) => {
    if (!window.confirm('Yakin ingin menghapus balasan ini?')) return;
    setReplySaving(true);
    try {
      await api.put(`/wisata/ratings/${ratingId}/reply`, { balasan: '' });
      setAllRatings((prev) =>
        prev.map((r) =>
          r.id_rating === ratingId
            ? {
                ...r,
                balasan: null,
                balasan_by: null,
                balasan_by_name: null,
                balasan_at: null,
              }
            : r
        )
      );
    } catch (error) {
      console.error('Failed to delete reply:', error);
      alert('Gagal menghapus balasan');
    } finally {
      setReplySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ulasan-page">
        <div className="ulasan-loading">Memuat data lokasi wisata...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ulasan-page">
        <div className="ulasan-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ulasan-page">
      <header className="ulasan-header">
        <div className="ulasan-header-content">
          <div>
            <h1>Daftar Lokasi Wisata</h1>
            <p>Menampilkan semua {filteredWisataPoints.length} lokasi wisata yang tersedia.</p>
          </div>
          <div className="ulasan-header-actions">
            <button className="ulasan-btn-ringkas">Tampilkan Ringkas</button>
            <div className="ulasan-search">
              <span className="ulasan-search-label">Pencarian</span>
              <div className="ulasan-search-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Cari lokasi wisata..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* GRID WISATA */}
      <div className="wisata-cards-grid">
        {(() => {
          const LOCATIONS_PER_PAGE = 6; // Display 6 items per page (2 rows of 3)
          const paginatedLocations = filteredWisataPoints.slice(
            (currentLocationPage - 1) * LOCATIONS_PER_PAGE,
            currentLocationPage * LOCATIONS_PER_PAGE
          );

          return paginatedLocations.map((wisata) => {
            let imageUrl = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
            if (wisata.image) imageUrl = wisata.image;
          else if (Array.isArray(wisata.photos) && wisata.photos[0]) imageUrl = wisata.photos[0];
          else if (Array.isArray(wisata.foto) && wisata.foto[0]) imageUrl = wisata.foto[0];
          else if (typeof wisata.foto === 'string' && wisata.foto.startsWith('http')) imageUrl = wisata.foto;
          else if (typeof wisata.photos === 'string' && wisata.photos.startsWith('http')) imageUrl = wisata.photos;

          return (
          <div key={wisata.id_wisata} className="wisata-grid-card">
            <div className="wisata-card-image">
              <img src={imageUrl} alt={wisata.nama_wisata} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80'; }} />
            </div>
            <div className="wisata-card-content">
              <div className="wisata-card-badge">Buatan</div>
              <h3 className="wisata-card-title">{wisata.nama_wisata}</h3>
              <p className="wisata-card-desc">{wisata.alamat || wisata.deskripsi || 'Tidak ada alamat'}</p>
              
              <div className="wisata-card-stats-box">
                <span>Jarak dari lokasi saat ini:</span>
                <strong>-</strong>
              </div>

              <div className="wisata-card-rating-row">
                <span className="star-rating-text">
                  <span className="star-icon active">★</span>
                  {wisata.averageRating.toFixed(1).replace('.', ',')} ({wisata.totalRatings})
                </span>
              </div>

              <button 
                className="wisata-card-action-btn"
                onClick={() => setSelectedWisataId(wisata.id_wisata)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Lihat Ulasan Pengunjung
              </button>
            </div>
          </div>
          );
        })})()}
        {filteredWisataPoints.length === 0 && (
          <div className="ulasan-empty-state">
            <p>Tidak ada lokasi wisata yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* PAGINATION FOR LOCATIONS */}
      {filteredWisataPoints.length > 6 && (() => {
        const totalLocationPages = Math.ceil(filteredWisataPoints.length / 6);
        return (
          <div className="ulasan-pagination" style={{ marginTop: '32px' }}>
            <button 
              className="ulasan-pagination-btn" 
              disabled={currentLocationPage === 1}
              onClick={() => setCurrentLocationPage(prev => Math.max(prev - 1, 1))}
            >
              &laquo; Prev
            </button>
            
            <span className="ulasan-pagination-info">
              Halaman {currentLocationPage} dari {totalLocationPages}
            </span>

            <button 
              className="ulasan-pagination-btn"
              disabled={currentLocationPage === totalLocationPages}
              onClick={() => setCurrentLocationPage(prev => Math.min(prev + 1, totalLocationPages))}
            >
              Next &raquo;
            </button>
          </div>
        );
      })()}

      {/* MODAL ULASAN */}
      {selectedWisataId && selectedWisataData && (() => {
        const ITEMS_PER_PAGE = 10;
        const totalPages = Math.ceil(selectedWisataRatings.length / ITEMS_PER_PAGE);
        const currentRatings = selectedWisataRatings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return (
          <div className="ulasan-modal-overlay">
          <div className="ulasan-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ulasan-modal-header">
              <div>
                <h2>Ulasan: {selectedWisataData.nama_wisata}</h2>
                <div className="ulasan-modal-stats">
                  <span className="star-icon active">★</span>
                  <strong>{selectedWisataData.averageRating.toFixed(1)}</strong>
                  <span className="text-muted">({selectedWisataData.totalRatings} Ulasan)</span>
                </div>
              </div>
              <button className="ulasan-modal-close" onClick={() => { setSelectedWisataId(null); setReplyingToId(null); setReplyText(''); }}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="ulasan-modal-body">
              {selectedWisataRatings.length > 0 && (
                <div className="rating-distribution-container">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = selectedWisataRatings.filter(r => Math.round(r.rating || 0) === star).length;
                    const percentage = (count / selectedWisataRatings.length) * 100;
                    return (
                      <div key={star} className="rating-bar-row">
                        <span className="rating-bar-star">{star} ★</span>
                        <div className="rating-bar-bg">
                          <div className="rating-bar-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="rating-bar-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedWisataRatings.length === 0 ? (
                <div className="ulasan-empty-state">
                  <p>Belum ada ulasan untuk lokasi ini.</p>
                </div>
              ) : (
                <div className="ulasan-list">
                  {currentRatings.map((rating) => (
                    <div key={rating.id_rating || Math.random()} className="ulasan-card">
                      <div className="ulasan-card-header">
                        <div>
                          <h3 className="ulasan-user-name">{rating.user?.name || 'Pengunjung'}</h3>
                          <div className="ulasan-date">
                            {(rating.created_at || rating.createdAt) 
                              ? new Date(rating.created_at || rating.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : '-'}
                          </div>
                        </div>
                        <div className="ulasan-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={`star-icon ${star <= rating.rating ? 'active' : ''}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="ulasan-text">{rating.ulasan || <i>Tidak ada teks ulasan</i>}</p>

                      {/* Balasan Pengelola */}
                      {rating.balasan && (
                        <div className="ulasan-reply-box">
                          <div className="ulasan-reply-header">
                            <ReplyIcon />
                            <strong>Balasan Pengelola</strong>
                            {rating.balasan_at && (
                              <span className="ulasan-reply-date">
                                {new Date(rating.balasan_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="ulasan-reply-text">{rating.balasan}</p>
                        </div>
                      )}

                      {/* Tombol & Form Balas (hanya pengelola) */}
                      {canReply && !rating.balasan && (
                        <>
                          {replyingToId === rating.id_rating ? (
                            <div className="ulasan-reply-form">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Tulis balasan untuk ulasan ini..."
                                rows={3}
                              />
                              <div className="ulasan-reply-form-actions">
                                <button
                                  className="ulasan-reply-submit-btn"
                                  disabled={replySaving || !replyText.trim()}
                                  onClick={() => handleSubmitReply(rating.id_rating)}
                                >
                                  {replySaving ? 'Mengirim...' : 'Kirim Balasan'}
                                </button>
                                <button
                                  className="ulasan-reply-cancel-btn"
                                  onClick={() => { setReplyingToId(null); setReplyText(''); }}
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="ulasan-reply-btn"
                              onClick={() => { setReplyingToId(rating.id_rating); setReplyText(''); }}
                            >
                              <ReplyIcon />
                              Balas Ulasan
                            </button>
                          )}
                        </>
                      )}

                      {/* Tombol edit balasan (jika sudah ada balasan) */}
                      {canReply && rating.balasan && (
                        <>
                          {replyingToId === rating.id_rating ? (
                            <div className="ulasan-reply-form">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Edit balasan..."
                                rows={3}
                              />
                              <div className="ulasan-reply-form-actions">
                                <button
                                  className="ulasan-reply-submit-btn"
                                  disabled={replySaving || !replyText.trim()}
                                  onClick={() => handleSubmitReply(rating.id_rating)}
                                >
                                  {replySaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                                <button
                                  className="ulasan-reply-cancel-btn"
                                  onClick={() => { setReplyingToId(null); setReplyText(''); }}
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="ulasan-reply-actions-row">
                              <button
                                className="ulasan-reply-btn edit"
                                onClick={() => { setReplyingToId(rating.id_rating); setReplyText(rating.balasan); }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                className="ulasan-reply-btn delete"
                                onClick={() => handleDeleteReply(rating.id_rating)}
                                disabled={replySaving}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                                Hapus
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="ulasan-pagination">
                      <button 
                        className="ulasan-pagination-btn" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        &laquo; Prev
                      </button>
                      
                      <span className="ulasan-pagination-info">
                        Halaman {currentPage} dari {totalPages}
                      </span>

                      <button 
                        className="ulasan-pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        Next &raquo;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
