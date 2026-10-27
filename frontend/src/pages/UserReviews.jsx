import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './UserReviews.css'

function UserReviews() {
  const { username: paramUsername } = useParams()
  const navigate = useNavigate()
  
  const token = localStorage.getItem('token')
  const currentUsername = localStorage.getItem('username')
  const currentUserId = localStorage.getItem('userId')

  const isGlobal = !paramUsername
  const username = paramUsername || currentUsername || 'adhin1234'
  const isOwner = Boolean(
    !isGlobal && currentUsername && username && currentUsername.toLowerCase() === username.toLowerCase()
  )

  const [reviews, setReviews] = useState([])
  const [movieDetails, setMovieDetails] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [globalTab, setGlobalTab] = useState('popular') // 'popular' or 'recent'

  // Filters & Sorting
  const [ratingFilter, setRatingFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [sortBy, setSortBy] = useState('when-reviewed')

  // Dropdown states
  const [ratingOpen, setRatingOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const ratingRef = useRef(null)
  const yearRef = useRef(null)
  const sortRef = useRef(null)

  // Modal states for Editing & Deleting
  const [editingReview, setEditingReview] = useState(null)
  const [editRating, setEditRating] = useState(0)
  const [editLiked, setEditLiked] = useState(false)
  const [editWatched, setEditWatched] = useState(true)
  const [editReviewText, setEditReviewText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [deletingReview, setDeletingReview] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ratingRef.current && !ratingRef.current.contains(e.target)) setRatingOpen(false)
      if (yearRef.current && !yearRef.current.contains(e.target)) setYearOpen(false)
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    setReviewPage(1)
    if (isGlobal) {
      document.title = 'Reviews • Letterboxd'
      fetchReviews(1, true)
    } else {
      document.title = `${username}'s Reviews • Letterboxd`
      fetchReviews(1, true)
    }
  }, [username, isGlobal, globalTab])

  const fetchReviews = async (page = 1, isReset = false) => {
    try {
      if (isReset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      let endpoint = ''
      if (isGlobal) {
        endpoint = globalTab === 'popular'
          ? `http://localhost:5000/api/interactions/popular-reviews?limit=10&page=${page}`
          : `http://localhost:5000/api/interactions/recent-reviews?limit=10&page=${page}`
      } else {
        endpoint = `http://localhost:5000/api/interactions/user/${username}/reviews`
      }

      const res = await fetch(endpoint)
      if (!res.ok) {
        if (isReset) setReviews([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : []

      if (isGlobal) {
        if (list.length < 10) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }

        if (isReset) {
          setReviews(list)
        } else {
          setReviews(prev => {
            const seen = new Set(prev.map(p => p._id))
            const newItems = list.filter(item => !seen.has(item._id))
            return [...prev, ...newItems]
          })
        }
      } else {
        setReviews(list)
        setHasMore(false)
      }

      // Fetch TMDB Movie Details for newly fetched reviews
      const apiKey = import.meta.env.VITE_TMDB_API_KEY
      if (apiKey && list.length > 0) {
        const detailsObj = {}
        await Promise.all(
          list.map(async (item) => {
            try {
              const tmdbRes = await fetch(
                `https://api.themoviedb.org/3/movie/${item.movieId}?api_key=${apiKey}`
              )
              const movieData = await tmdbRes.json()
              if (movieData && !movieData.status_message) {
                detailsObj[String(item.movieId)] = movieData
              }
            } catch (err) {
              console.error('TMDB fetch error:', err)
            }
          })
        )
        setMovieDetails(prev => ({ ...prev, ...detailsObj }))
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
      if (isReset) setReviews([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = reviewPage + 1
    setReviewPage(nextPage)
    fetchReviews(nextPage, false)
  }

  // Edit Modal Handlers
  const openEditModal = (rev) => {
    setEditingReview(rev)
    setEditRating(rev.rating || 0)
    setEditLiked(Boolean(rev.liked))
    setEditWatched(rev.watched !== undefined ? rev.watched : true)
    setEditReviewText(rev.review || '')
  }

  const closeEditModal = () => {
    setEditingReview(null)
    setSavingEdit(false)
  }

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault()
    if (!token) {
      navigate('/login')
      return
    }

    if (!editingReview) return

    setSavingEdit(true)
    try {
      const res = await fetch(`http://localhost:5000/api/interactions/review/${editingReview._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          review: editReviewText.trim(),
          rating: editRating,
          liked: editLiked,
          watched: editWatched
        })
      })

      const data = await res.json()
      if (res.ok) {
        // Update local review state
        setReviews(prev =>
          prev.map(r => (r._id === editingReview._id ? data.interaction : r))
        )
        showToast('Review updated successfully!')
        closeEditModal()
      } else {
        alert(data.error || 'Failed to update review')
      }
    } catch (err) {
      console.error('Error saving review edit:', err)
      alert('Network error while updating review.')
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    const targetRev = deletingReview || editingReview
    if (!targetRev?._id) return

    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:5000/api/interactions/review/${targetRev._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        setReviews(prev => prev.filter(r => r._id !== targetRev._id))
        showToast('Review deleted successfully.')
        setDeletingReview(null)
        if (editingReview) closeEditModal()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete review')
      }
    } catch (err) {
      console.error('Error deleting review:', err)
      alert('Network error while deleting review.')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderStars = (rating) => {
    if (!rating) return null
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 !== 0
    let str = '★'.repeat(fullStars)
    if (halfStar) str += '½'
    return str
  }

  const formatReviewDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Derive unique years for filter
  const availableYears = Array.from(
    new Set(
      reviews.map(item => {
        const d = item.updatedAt || item.createdAt
        return d ? new Date(d).getFullYear().toString() : null
      }).filter(Boolean)
    )
  ).sort().reverse()

  // Filtering and Sorting
  let displayedReviews = [...reviews]

  // Filter: Rating
  if (ratingFilter !== 'all') {
    if (ratingFilter === 'unrated') {
      displayedReviews = displayedReviews.filter(r => !r.rating || r.rating === 0)
    } else {
      const threshold = parseFloat(ratingFilter)
      displayedReviews = displayedReviews.filter(r => r.rating && r.rating >= threshold)
    }
  }

  // Filter: Diary Year
  if (yearFilter !== 'all') {
    displayedReviews = displayedReviews.filter(r => {
      const d = r.updatedAt || r.createdAt
      return d && new Date(d).getFullYear().toString() === yearFilter
    })
  }

  // Sorting
  displayedReviews.sort((a, b) => {
    const movieA = movieDetails[String(a.movieId)]
    const movieB = movieDetails[String(b.movieId)]

    switch (sortBy) {
      case 'rating-desc':
        return (b.rating || 0) - (a.rating || 0)
      case 'rating-asc':
        return (a.rating || 0) - (b.rating || 0)
      case 'release-new': {
        const dateA = movieA?.release_date || ''
        const dateB = movieB?.release_date || ''
        return dateB.localeCompare(dateA)
      }
      case 'release-old': {
        const dateA = movieA?.release_date || ''
        const dateB = movieB?.release_date || ''
        return dateA.localeCompare(dateB)
      }
      case 'title': {
        const titleA = movieA?.title || ''
        const titleB = movieB?.title || ''
        return titleA.localeCompare(titleB)
      }
      case 'when-reviewed':
      default:
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    }
  })

  const getSortLabel = () => {
    switch (sortBy) {
      case 'rating-desc': return 'Sort by RATING (HIGHEST)'
      case 'rating-asc': return 'Sort by RATING (LOWEST)'
      case 'release-new': return 'Sort by RELEASE (NEWEST)'
      case 'release-old': return 'Sort by RELEASE (OLDEST)'
      case 'title': return 'Sort by TITLE (A–Z)'
      default: return 'Sort by WHEN REVIEWED'
    }
  }

  return (
    <div className="user-reviews-page">
      <Navbar />

      {/* Profile or Community Subnav Bar */}
      <div className="user-reviews-subnav-container">
        {isGlobal ? (
          <div className="user-reviews-profile-bar community-subnav-bar">
            <div className="profile-bar-left">
              <span className="profile-bar-username">Community Reviews</span>
            </div>
            <div className="profile-bar-tabs">
              <button
                type="button"
                className={`community-tab-btn ${globalTab === 'popular' ? 'active-tab' : ''}`}
                onClick={() => setGlobalTab('popular')}
              >
                Popular Reviews
              </button>
              <button
                type="button"
                className={`community-tab-btn ${globalTab === 'recent' ? 'active-tab' : ''}`}
                onClick={() => setGlobalTab('recent')}
              >
                Recent Reviews
              </button>
            </div>
          </div>
        ) : (
          <div className="user-reviews-profile-bar">
            <div className="profile-bar-left">
              <div className="profile-bar-avatar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#89a">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <Link to={`/${username}`} className="profile-bar-username-link">
                <span className="profile-bar-username">{username}</span>
              </Link>
            </div>

            <div className="profile-bar-tabs">
              <Link to={`/${username}`}>Activity</Link>
              <Link to={`/${username}/films`}>Films</Link>
              <Link to={`/${username}/diary`}>Diary</Link>
              <Link to={`/${username}/reviews`} className="active-tab">Reviews</Link>
              <Link to={`/${username}/watchlist`}>Watchlist</Link>
              <Link to={`/${username}/lists`}>Lists</Link>
              <Link to={`/${username}/likes`}>Likes</Link>
              <Link to={`/${username}/network`}>Network</Link>
            </div>

            {/* <div className="profile-bar-actions">
              <Link to="/search" className="subnav-icon-btn" title="Search">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </Link>
              <button className="subnav-icon-btn" title="RSS Feed" type="button">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <circle cx="6.18" cy="17.82" r="2.18"/>
                  <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
                </svg>
              </button>
            </div> */}
          </div>
        )}
      </div>

      {/* Main Reviews Container */}
      <main className="user-reviews-container">
        {/* Controls and Header Row (Matching Screenshot 1) */}
        <div className="reviews-header-row">
          <div className="reviews-section-title-wrap">
            <h1 className="reviews-section-title">REVIEWS</h1>
          </div>

          <div className="reviews-filters-bar">
            {/* Rating Filter Dropdown */}
            <div className="reviews-filter-dropdown" ref={ratingRef}>
              <button
                type="button"
                className={`filter-btn ${ratingFilter !== 'all' ? 'active' : ''}`}
                onClick={() => {
                  setRatingOpen(!ratingOpen)
                  setYearOpen(false)
                  setSortOpen(false)
                }}
              >
                {ratingFilter === 'all' ? 'RATING ⌵' : `${ratingFilter}★+ ⌵`}
              </button>

              {ratingOpen && (
                <div className="filter-dropdown-menu">
                  <div
                    className={`dropdown-item ${ratingFilter === 'all' ? 'selected' : ''}`}
                    onClick={() => { setRatingFilter('all'); setRatingOpen(false) }}
                  >
                    All Ratings
                  </div>
                  <div
                    className={`dropdown-item ${ratingFilter === '5' ? 'selected' : ''}`}
                    onClick={() => { setRatingFilter('5'); setRatingOpen(false) }}
                  >
                    ★★★★★ (5 stars)
                  </div>
                  <div
                    className={`dropdown-item ${ratingFilter === '4' ? 'selected' : ''}`}
                    onClick={() => { setRatingFilter('4'); setRatingOpen(false) }}
                  >
                    ★★★★ & up
                  </div>
                  <div
                    className={`dropdown-item ${ratingFilter === '3' ? 'selected' : ''}`}
                    onClick={() => { setRatingFilter('3'); setRatingOpen(false) }}
                  >
                    ★★★ & up
                  </div>
                  <div
                    className={`dropdown-item ${ratingFilter === '2' ? 'selected' : ''}`}
                    onClick={() => { setRatingFilter('2'); setRatingOpen(false) }}
                  >
                    ★★ & up
                  </div>
                  <div
                    className={`dropdown-item ${ratingFilter === 'unrated' ? 'selected' : ''}`}
                    onClick={() => { setRatingFilter('unrated'); setRatingOpen(false) }}
                  >
                    Unrated
                  </div>
                </div>
              )}
            </div>

            {/* Diary Year Filter Dropdown */}
            <div className="reviews-filter-dropdown" ref={yearRef}>
              <button
                type="button"
                className={`filter-btn ${yearFilter !== 'all' ? 'active' : ''}`}
                onClick={() => {
                  setYearOpen(!yearOpen)
                  setRatingOpen(false)
                  setSortOpen(false)
                }}
              >
                {yearFilter === 'all' ? 'DIARY YEAR ⌵' : `${yearFilter} ⌵`}
              </button>

              {yearOpen && (
                <div className="filter-dropdown-menu">
                  <div
                    className={`dropdown-item ${yearFilter === 'all' ? 'selected' : ''}`}
                    onClick={() => { setYearFilter('all'); setYearOpen(false) }}
                  >
                    All Years
                  </div>
                  {availableYears.map(yr => (
                    <div
                      key={yr}
                      className={`dropdown-item ${yearFilter === yr ? 'selected' : ''}`}
                      onClick={() => { setYearFilter(yr); setYearOpen(false) }}
                    >
                      {yr}
                    </div>
                  ))}
                  {availableYears.length === 0 && (
                    <div className="dropdown-item disabled">No diary years</div>
                  )}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="reviews-filter-dropdown" ref={sortRef}>
              <button
                type="button"
                className="filter-btn"
                onClick={() => {
                  setSortOpen(!sortOpen)
                  setRatingOpen(false)
                  setYearOpen(false)
                }}
              >
                {getSortLabel()} ⌵
              </button>

              {sortOpen && (
                <div className="filter-dropdown-menu sort-menu">
                  <div
                    className={`dropdown-item ${sortBy === 'when-reviewed' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('when-reviewed'); setSortOpen(false) }}
                  >
                    When Reviewed
                  </div>
                  <div
                    className={`dropdown-item ${sortBy === 'rating-desc' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('rating-desc'); setSortOpen(false) }}
                  >
                    Rating (Highest first)
                  </div>
                  <div
                    className={`dropdown-item ${sortBy === 'rating-asc' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('rating-asc'); setSortOpen(false) }}
                  >
                    Rating (Lowest first)
                  </div>
                  <div
                    className={`dropdown-item ${sortBy === 'release-new' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('release-new'); setSortOpen(false) }}
                  >
                    Release Date (Newest first)
                  </div>
                  <div
                    className={`dropdown-item ${sortBy === 'release-old' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('release-old'); setSortOpen(false) }}
                  >
                    Release Date (Oldest first)
                  </div>
                  <div
                    className={`dropdown-item ${sortBy === 'title' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('title'); setSortOpen(false) }}
                  >
                    Film Name (A–Z)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews List Layout */}
        <div className="reviews-content-layout">
          <div className="reviews-feed-column">
            {loading ? (
              <div className="reviews-loading-state">
                <div className="reviews-spinner"></div>
                <p>Loading reviews...</p>
              </div>
            ) : displayedReviews.length === 0 ? (
              <div className="reviews-empty-state">
                <div className="empty-state-icon">✍️</div>
                <h3>No reviews found</h3>
                <p>
                  {ratingFilter !== 'all' || yearFilter !== 'all'
                    ? 'No reviews match your selected filters.'
                    : `${username} hasn't written any reviews yet.`}
                </p>
                {isOwner && (
                  <Link to="/film" className="browse-films-btn">
                    Browse Films to Review
                  </Link>
                )}
              </div>
            ) : (
              <div className="reviews-list">
                {displayedReviews.map((rev) => {
                  const movie = movieDetails[String(rev.movieId)]
                  const title = movie?.title || 'Film'
                  const releaseYear = movie?.release_date ? movie.release_date.split('-')[0] : ''
                  const posterPath = movie?.poster_path
                  const reviewUrl = `/${username}/film/${rev.movieId}`

                  return (
                    <article key={rev._id} className="review-feed-item">
                      {/* Movie Poster */}
                      <Link to={reviewUrl} className="review-feed-poster-link">
                        {posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${posterPath}`}
                            alt={title}
                            className="review-feed-poster-img"
                          />
                        ) : (
                          <div className="review-feed-poster-placeholder">🎞</div>
                        )}
                      </Link>

                      {/* Review Content */}
                      <div className="review-feed-content">
                        {/* Film Title & Year */}
                        <div className="review-feed-header-line">
                          <Link to={reviewUrl} className="review-feed-film-title">
                            {title}
                          </Link>
                          {releaseYear && (
                            <span className="review-feed-film-year">{releaseYear}</span>
                          )}
                        </div>

                        {/* Stars, Heart & Watched Status */}
                        <div className="review-feed-meta-line">
                          {rev.rating > 0 && (
                            <span className="review-feed-stars">
                              {renderStars(rev.rating)}
                            </span>
                          )}
                          {rev.liked && (
                            <span className="review-feed-heart" title="Liked">
                              ♥
                            </span>
                          )}
                          <span className="review-feed-watched-text">
                            {rev.watched ? 'Watched' : 'Reviewed'}{' '}
                            {formatReviewDate(rev.updatedAt || rev.createdAt)}
                          </span>
                        </div>

                        {/* Review Body */}
                        <div className="review-feed-body">
                          <p>{rev.review}</p>
                        </div>

                        {/* Actions & Likes Footer */}
                        <div className="review-feed-footer-line">
                          <div className="review-feed-likes">
                            <span className="footer-heart-icon">♥</span>{' '}
                            {rev.reviewLikes && rev.reviewLikes.length > 0
                              ? `${rev.reviewLikes.length} ${
                                  rev.reviewLikes.length === 1 ? 'like' : 'likes'
                                }`
                              : 'No likes yet'}
                          </div>

                          <div className="review-feed-item-actions">
                            <Link to={reviewUrl} className="view-review-btn">
                              View review →
                            </Link>
                            {(() => {
                              const canModify = Boolean(
                                isOwner ||
                                (token && rev.userId && rev.userId === currentUserId) ||
                                (token && rev.username && currentUsername && rev.username.toLowerCase() === currentUsername.toLowerCase())
                              )
                              return canModify ? (
                                <>
                                  <button
                                    type="button"
                                    className="feed-action-btn edit-action-btn"
                                    onClick={() => openEditModal(rev)}
                                    title="Edit review"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="feed-action-btn delete-action-btn"
                                    onClick={() => setDeletingReview(rev)}
                                    title="Delete review"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : null
                            })()}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {isGlobal && hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', paddingBottom: '20px' }}>
                <button
                  type="button"
                  className="reviews-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'LOADING MORE REVIEWS...' : 'LOAD MORE REVIEWS'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT REVIEW MODAL */}
      {editingReview && (
        <div className="review-modal-backdrop" onClick={closeEditModal}>
          <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <span className="modal-title">EDIT REVIEW</span>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeEditModal}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="review-modal-body">
              {/* Film Header inside modal */}
              {(() => {
                const modalMovie = movieDetails[String(editingReview.movieId)]
                return (
                  <div className="modal-film-preview">
                    {modalMovie?.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${modalMovie.poster_path}`}
                        alt={modalMovie.title}
                        className="modal-film-poster"
                      />
                    ) : (
                      <div className="modal-poster-placeholder">🎞</div>
                    )}
                    <div className="modal-film-info">
                      <h3 className="modal-film-title">{modalMovie?.title || 'Film'}</h3>
                      {modalMovie?.release_date && (
                        <span className="modal-film-year">
                          {modalMovie.release_date.split('-')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Star Rating Selector */}
              <div className="modal-control-group">
                <label className="modal-control-label">Rating:</label>
                <div className="modal-star-picker">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      className={`star-pick-btn ${editRating >= starVal ? 'filled' : ''} ${
                        editRating === starVal - 0.5 ? 'half' : ''
                      }`}
                      onClick={() => {
                        if (editRating === starVal) {
                          setEditRating(starVal - 0.5)
                        } else if (editRating === starVal - 0.5) {
                          setEditRating(0)
                        } else {
                          setEditRating(starVal)
                        }
                      }}
                      title={`${starVal} Stars (click again for half-star)`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-indicator-text">
                    {editRating > 0 ? `${editRating} / 5` : 'No rating'}
                  </span>
                  {editRating > 0 && (
                    <button
                      type="button"
                      className="clear-rating-btn"
                      onClick={() => setEditRating(0)}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Liked & Watched Toggles */}
              <div className="modal-toggles-row">
                <button
                  type="button"
                  className={`modal-toggle-btn heart-toggle ${editLiked ? 'active' : ''}`}
                  onClick={() => setEditLiked(!editLiked)}
                >
                  <span className="toggle-icon">♥</span> {editLiked ? 'Liked' : 'Like'}
                </button>

                <button
                  type="button"
                  className={`modal-toggle-btn watched-toggle ${editWatched ? 'active' : ''}`}
                  onClick={() => setEditWatched(!editWatched)}
                >
                  <span className="toggle-icon">👁</span> Watched
                </button>
              </div>

              {/* Review Textarea */}
              <div className="modal-control-group">
                <label className="modal-control-label">Review:</label>
                <textarea
                  className="modal-review-textarea"
                  rows={6}
                  value={editReviewText}
                  onChange={(e) => setEditReviewText(e.target.value)}
                  placeholder="Write your review here..."
                  required
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer-row">
                <button
                  type="button"
                  className="modal-delete-link"
                  onClick={() => setDeletingReview(editingReview)}
                >
                  Delete review...
                </button>

                <div className="modal-save-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={closeEditModal}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-save-btn"
                    disabled={savingEdit || !editReviewText.trim()}
                  >
                    {savingEdit ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingReview && (
        <div className="review-modal-backdrop" onClick={() => !isDeleting && setDeletingReview(null)}>
          <div className="review-confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Delete Review?</h3>
            <p className="confirm-text">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="confirm-buttons-row">
              <button
                type="button"
                className="confirm-cancel-btn"
                onClick={() => setDeletingReview(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="review-floating-toast">
          <span className="toast-icon">✓</span>
          <span className="toast-text">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default UserReviews
