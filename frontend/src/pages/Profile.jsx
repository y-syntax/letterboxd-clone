import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './Profile.css'

function Profile({ defaultTab }) {
  const { username: paramUsername } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const storedUsername = localStorage.getItem('username')
  const username = paramUsername || storedUsername || 'adhin1234'
  const isOwner = Boolean(storedUsername && storedUsername.toLowerCase() === username.toLowerCase())

  const isActivityRoute = Boolean(defaultTab === 'Activity' || location.pathname.endsWith('/activity') || location.search.includes('tab=activity'))
  const [activeTab, setActiveTab] = useState(isActivityRoute ? 'Activity' : 'Profile')

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab)
    } else if (location.pathname.endsWith('/activity') || location.search.includes('tab=activity')) {
      setActiveTab('Activity')
    } else if (location.pathname === '/profile' || location.pathname === `/${username}`) {
      setActiveTab('Profile')
    }
  }, [defaultTab, location.pathname, location.search, username])

  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [movieDetailsMap, setMovieDetailsMap] = useState({})
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  useEffect(() => {
    fetchProfileSummary()
  }, [username])

  const fetchProfileSummary = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/api/auth/user/${username}/summary`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json()
      if (res.ok) {
        setProfileData(data)
        setIsFollowing(Boolean(data.isFollowing))
        setIsBlocked(Boolean(data.isBlocked))

        // Set document title
        const u = data.user || {}
        const isOff = username.toLowerCase() === 'official' ||
          username.toLowerCase() === 'official lists' ||
          u.username === 'official' ||
          u.displayName === 'Official Lists'
        if (isOff) {
          document.title = "Official Lists's HQ profile"
        } else {
          document.title = `${u.displayName || u.username || username}'s profile • Letterboxd`
        }

        // Collect all movie IDs from likes, reviews, watchlist, activity, and favorites
        const allMovieIds = new Set([
          ...(data.favoriteFilms || []).map(f => String(f.movieId)),
          ...(data.recentLikes || []).map(l => String(l.movieId)),
          ...(data.recentReviews || []).map(r => String(r.movieId)),
          ...(data.recentWatchlist || []).map(w => String(w.movieId)),
          ...(data.activityTimeline || []).map(a => String(a.movieId)),
          ...(data.featuredList?.films || []).map(f => String(f.movieId))
        ])

        // Fetch TMDB details for movies that need posters or titles
        const apiKey = import.meta.env.VITE_TMDB_API_KEY
        if (apiKey && allMovieIds.size > 0) {
          const detailsObj = {}
          await Promise.all(
            Array.from(allMovieIds).map(async (movieId) => {
              try {
                const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`)
                const tmdbData = await tmdbRes.json()
                if (tmdbData && !tmdbData.status_message) {
                  detailsObj[movieId] = tmdbData
                }
              } catch (err) {
                // Ignore failure
              }
            })
          )
          setMovieDetailsMap(detailsObj)
        }
      }
    } catch (err) {
      console.error('Failed to load profile summary:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatRelativeTime = (dateString) => {
    if (!dateString) return ''
    const diffMs = new Date() - new Date(dateString)
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays}d`
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths}mo`
  }

  const formatReviewDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatWeekdayDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const weekday = date.toLocaleDateString(undefined, { weekday: 'long' })
    const month = date.toLocaleDateString(undefined, { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    return `${weekday} ${month} ${day}, ${year}`
  }

  const renderStars = (rating) => {
    if (!rating || rating <= 0) return ''
    const full = Math.floor(rating)
    const half = rating % 1 !== 0
    return `${'★'.repeat(full)}${half ? '½' : ''}`
  }

  const handleToggleFollow = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (actionLoading) return
    setActionLoading(true)

    const endpoint = isFollowing
      ? `http://localhost:5000/api/auth/user/${username}/unfollow`
      : `http://localhost:5000/api/auth/user/${username}/follow`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        setIsFollowing(!isFollowing)
        setProfileData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            followersCount: Math.max(0, (prev.stats?.followersCount || 0) + (isFollowing ? -1 : 1))
          }
        }))
        showToast(!isFollowing ? `Now following ${username}` : `Unfollowed ${username}`)
      } else {
        showToast(data.error || 'Failed to update follow status')
      }
    } catch (err) {
      showToast('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (actionLoading) return
    setMoreMenuOpen(false)
    setActionLoading(true)

    const endpoint = isBlocked
      ? `http://localhost:5000/api/auth/user/${username}/unblock`
      : `http://localhost:5000/api/auth/user/${username}/block`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        const nextBlocked = !isBlocked
        setIsBlocked(nextBlocked)
        if (nextBlocked && isFollowing) {
          setIsFollowing(false)
          setProfileData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              followersCount: Math.max(0, (prev.stats?.followersCount || 1) - 1)
            }
          }))
        }
        showToast(data.message || (nextBlocked ? `Blocked ${username}` : `Unblocked ${username}`))
      } else {
        showToast(data.error || 'Failed to update block status')
      }
    } catch (err) {
      showToast('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-loading">Loading profile...</div>
      </div>
    )
  }

  const user = profileData?.user || {}
  const stats = profileData?.stats || {}
  const favoriteFilms = profileData?.favoriteFilms || []
  const recentLikes = profileData?.recentLikes || []
  const recentReviews = profileData?.recentReviews || []
  const recentWatchlist = profileData?.recentWatchlist || []
  const activityTimeline = profileData?.activityTimeline || []
  const ratingsMap = stats.ratingsMap || {}
  const userLists = profileData?.userLists || []
  const featuredList = profileData?.featuredList || null

  const isOfficial = username.toLowerCase() === 'official' ||
    username.toLowerCase() === 'official lists' ||
    user?.username === 'official' ||
    user?.displayName === 'Official Lists'

  const backdropUrl = user.backdropUrl || (isOfficial ? 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg' : '')

  // Calculate histogram max count for chart bars
  const ratingKeys = [1, 2, 3, 4, 5]
  const maxRatingCount = Math.max(1, ...ratingKeys.map(k => (ratingsMap[k] || 0) + (ratingsMap[k - 0.5] || 0)))

  return (
    <div className="profile-page">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="profile-toast">
          {toastMsg}
        </div>
      )}

      {/* Cinematic Backdrop Hero Banner (Matching Screenshot 1) */}
      {backdropUrl && (
        <div className="profile-backdrop-hero">
          <img src={backdropUrl} alt="Backdrop" className="profile-backdrop-img" />
          <div className="profile-backdrop-gradient" />
        </div>
      )}

      {/* Main Profile Layout */}
      <main className={`profile-main-container ${backdropUrl ? 'has-backdrop' : ''}`}>
        {/* Profile Header */}
        <header className="profile-header-card">
          <div className="profile-avatar-wrap">
            {isOfficial ? (
              <div className="profile-avatar-circle official-avatar" title="Official Lists">
                <div className="official-avatar-dots">
                  <span className="dot orange" />
                  <span className="dot green" />
                  <span className="dot blue" />
                </div>
              </div>
            ) : (
              <div className="profile-avatar-circle">
                {user.username ? user.username[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div className="profile-name-area">
            <div className="profile-title-row">
              <h1 className="profile-username-heading">
                {user.displayName || user.username || username}
              </h1>

              {(user.badge || isOfficial) && (
                <span className="profile-hq-badge">{user.badge || 'HQ'}</span>
              )}

              {isOwner ? (
                <Link to="/settings" className="edit-profile-btn" id="edit-profile-btn">
                  EDIT PROFILE
                </Link>
              ) : isBlocked ? (
                <button
                  type="button"
                  className="profile-blocked-btn"
                  onClick={handleToggleBlock}
                  disabled={actionLoading}
                >
                  BLOCKED
                </button>
              ) : (
                <button
                  type="button"
                  className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={handleToggleFollow}
                  disabled={actionLoading}
                >
                  {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                </button>
              )}

              <div className="profile-more-container">
                <button
                  type="button"
                  className="profile-more-btn"
                  title="More options"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                >
                  •••
                </button>

                {moreMenuOpen && (
                  <div className="profile-more-menu">
                    {!isOwner && (
                      <button
                        type="button"
                        className="more-menu-item danger"
                        onClick={handleToggleBlock}
                        disabled={actionLoading}
                      >
                        {isBlocked ? 'Unblock this member' : 'Block this member'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href)
                        showToast('Profile link copied to clipboard!')
                        setMoreMenuOpen(false)
                      }}
                    >
                      Share profile
                    </button>
                    {!isOwner && (
                      <button
                        type="button"
                        className="more-menu-item"
                        onClick={() => {
                          showToast('Report submitted. Thank you.')
                          setMoreMenuOpen(false)
                        }}
                      >
                        Report this member
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {user.bio && <p className="profile-bio-text">{user.bio}</p>}

            {(user.location || user.website) && (
              <div className="profile-meta-row">
                {user.location && <span className="profile-location">📍 {user.location}</span>}
                {user.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-website"
                  >
                    🔗 {user.website}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Stats on the right (Dynamic based on user type) */}
          <div className="profile-stats-counters">
            {isOfficial ? (
              <>
                <Link to={`/${user.username || username}/lists`} className="stat-counter-item">
                  <span className="stat-number">{stats.listsCount || userLists.length || 523}</span>
                  <span className="stat-label">LISTS</span>
                </Link>
                <Link to={`/${user.username || username}/network?tab=followers`} className="stat-counter-item">
                  <span className="stat-number">
                    {stats.followersCount ? stats.followersCount.toLocaleString() : '48,342'}
                  </span>
                  <span className="stat-label">FOLLOWERS</span>
                </Link>
              </>
            ) : (
              <>
                <Link to={`/${username}/films`} className="stat-counter-item">
                  <span className="stat-number">{stats.watchedCount || 0}</span>
                  <span className="stat-label">FILMS</span>
                </Link>
                <div className="stat-counter-item">
                  <span className="stat-number">{stats.watchedThisYear || 0}</span>
                  <span className="stat-label">THIS YEAR</span>
                </div>
                {(stats.listsCount > 0 || userLists.length > 0) && (
                  <Link to={`/${username}/lists`} className="stat-counter-item">
                    <span className="stat-number">{stats.listsCount || userLists.length}</span>
                    <span className="stat-label">LISTS</span>
                  </Link>
                )}
                <Link to={`/${username}/network?tab=following`} className="stat-counter-item">
                  <span className="stat-number">{stats.followingCount || 0}</span>
                  <span className="stat-label">FOLLOWING</span>
                </Link>
                <Link to={`/${username}/network?tab=followers`} className="stat-counter-item">
                  <span className="stat-number">{stats.followersCount || 0}</span>
                  <span className="stat-label">FOLLOWERS</span>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Blocked User Alert Banner */}
        {isBlocked && (
          <div className="profile-blocked-banner">
            <span>You have blocked this member. You will not see their activity, reviews, or lists.</span>
            <button
              type="button"
              className="unblock-inline-btn"
              onClick={handleToggleBlock}
              disabled={actionLoading}
            >
              UNBLOCK
            </button>
          </div>
        )}

        {/* Subnav Tabs */}
        <div className="profile-subnav-row">
          <div className="profile-subnav-tabs">
            <Link
              to={`/${user.username || username}`}
              className={`profile-tab ${activeTab === 'Profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('Profile')}
            >
              Profile
            </Link>

            {isOfficial ? (
              <>
                <span
                  className={`profile-tab ${activeTab === 'Stories' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Stories')}
                >
                  Stories
                </span>
                <Link
                  to={`/${user.username || username}/activity`}
                  className={`profile-tab ${activeTab === 'Activity' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Activity')}
                >
                  Activity
                </Link>
                <Link to={`/${user.username || username}/lists`} className="profile-tab">
                  Lists
                </Link>
                <Link to={`/${user.username || username}/network`} className="profile-tab">
                  Network
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={`/${user.username || username}/activity`}
                  className={`profile-tab ${activeTab === 'Activity' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Activity')}
                >
                  Activity
                </Link>
                <Link to={`/${username}/films`} className="profile-tab">Films</Link>
                <Link to={`/${username}/diary`} className="profile-tab">Diary</Link>
                <Link to={`/${username}/reviews`} className="profile-tab">Reviews</Link>
                <Link to={`/${username}/watchlist`} className="profile-tab">Watchlist</Link>
                <Link to={`/${username}/lists`} className="profile-tab">Lists</Link>
                <Link to={`/${username}/likes`} className="profile-tab">Likes</Link>
                <Link to={`/${username}/network`} className="profile-tab">Network</Link>
              </>
            )}
          </div>
        </div>

        {/* FEATURED LIST SHOWCASE (Exact match to Screenshot 1) */}
        {featuredList && activeTab === 'Profile' && (
          <section className="profile-featured-list-section">
            <div className="featured-list-title-row">
              <h2 className="featured-list-title">{featuredList.name}</h2>
              <Link to={`/list/${featuredList._id}`} className="full-list-link">FULL LIST</Link>
            </div>

            <div className="featured-list-layout">
              {/* Left Column: 9-Poster Collage + Curated Description */}
              <div className="featured-list-left">
                <div className="featured-list-collage">
                  {featuredList.films && featuredList.films.length > 0 && (
                    <div className="collage-grid-wrap">
                      {/* Big #1 Feature Poster (Left, spans 2 rows) */}
                      <Link
                        to={`/film/${featuredList.films[0].movieId}`}
                        className="collage-item collage-item-main"
                        title={featuredList.films[0].title}
                      >
                        {featuredList.films[0].posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${featuredList.films[0].posterPath}`}
                            alt={featuredList.films[0].title}
                          />
                        ) : (
                          <div className="collage-fallback">{featuredList.films[0].title}</div>
                        )}
                        <span className="collage-rank-overlay">1</span>
                      </Link>

                      {/* 8 Smaller Posters (Right 4 columns x 2 rows) */}
                      <div className="collage-subgrid">
                        {featuredList.films.slice(1, 9).map((f, idx) => (
                          <Link
                            key={f.movieId || idx}
                            to={`/film/${f.movieId}`}
                            className="collage-item collage-item-sub"
                            title={f.title}
                          >
                            {f.posterPath ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w300${f.posterPath}`}
                                alt={f.title}
                              />
                            ) : (
                              <div className="collage-fallback">{f.title}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description / Notes below collage */}
                {featuredList.description && (
                  <div className="featured-list-description-card">
                    <p className="featured-list-desc-text">
                      {featuredList.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 2-Column Body Layout (Standard film activities: Favorite Films, Recent Likes, Recent Reviews, Watchlist, Diary, Ratings, Activity) */}
        {(!featuredList || !isOfficial || activeTab === 'Activity') && (
          <div className="profile-columns">
            {activeTab === 'Activity' ? (
              <div className="profile-main-column">
                <section className="profile-section">
                  <div className="section-title-row">
                    <span className="section-title">ALL ACTIVITY</span>
                  </div>

                  {activityTimeline && activityTimeline.length > 0 ? (
                    <div className="profile-activity-stream">
                      {activityTimeline.map((act) => {
                        const movie = movieDetailsMap[String(act.movieId)]
                        const title = movie?.title || `Film #${act.movieId}`
                        const year = movie?.release_date ? movie.release_date.split('-')[0] : ''
                        const poster = movie?.poster_path
                        const filmUrl = `/film/${act.movieId}`

                        return (
                          <div key={act._id} className="activity-feed-entry">
                            <Link to={filmUrl} className="activity-poster-wrap">
                              {poster ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w185${poster}`}
                                  alt={title}
                                  className="activity-poster-img"
                                />
                              ) : (
                                <div className="activity-poster-placeholder">🎞</div>
                              )}
                            </Link>

                            <div className="activity-details-wrap">
                              <div className="activity-headline">
                                <span className="activity-user-badge">
                                  {user.displayName || user.username || username}
                                </span>{' '}
                                <span className="activity-action-verb">
                                  {act.review
                                    ? 'reviewed'
                                    : act.liked && act.rating
                                    ? 'rated and liked'
                                    : act.rating
                                    ? 'rated'
                                    : act.liked
                                    ? 'liked'
                                    : act.watchlist
                                    ? 'added to watchlist'
                                    : act.watched
                                    ? 'watched'
                                    : 'interacted with'}
                                </span>{' '}
                                <Link to={filmUrl} className="activity-film-name">
                                  {title}
                                </Link>
                                {year && <span className="activity-film-year"> ({year})</span>}
                              </div>

                              <div className="activity-meta-line">
                                {act.rating > 0 && (
                                  <span className="activity-stars">{renderStars(act.rating)}</span>
                                )}
                                {act.liked && <span className="activity-heart">♥</span>}
                                <span className="activity-date-text">
                                  {formatRelativeTime(act.updatedAt)}
                                </span>
                              </div>

                              {act.review && (
                                <div className="activity-review-snippet">
                                  <p>{act.review}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="profile-empty-section">
                      <p>No activity yet. Watch, rate, like, or review films to see your activity here.</p>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              /* Main Left Column */
              <div className="profile-main-column">
              {/* FAVORITE FILMS */}
              <section className="profile-section">
                <div className="section-title-row">
                  <span className="section-title">FAVORITE FILMS</span>
                  {isOwner && (
                    <Link to="/settings" className="section-action-link">Edit favorites</Link>
                  )}
                </div>

                {favoriteFilms.length > 0 ? (
                  <div className="favorite-films-grid">
                    {favoriteFilms.map((film, idx) => (
                      <Link key={film.movieId || idx} to={`/film/${film.movieId}`} className="favorite-film-card">
                        {film.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w342${film.posterPath}`}
                            alt={film.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="fav-no-poster">{film.title}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="favorite-films-empty">
                    <p>Don't forget to select your <Link to="/settings">favorite films!</Link></p>
                  </div>
                )}
              </section>

              {/* RECENT LIKES */}
              <section className="profile-section">
                <div className="section-title-row">
                  <span className="section-title">RECENT LIKES</span>
                  <Link to={`/${username}/likes`} className="section-action-link likes-heart-link">
                    ♥ ALL
                  </Link>
                </div>

                {recentLikes.length > 0 ? (
                  <div className="recent-likes-grid">
                    {recentLikes.map((item) => {
                      const movie = movieDetailsMap[String(item.movieId)]
                      const poster = movie?.poster_path
                      const title = movie?.title || `Film #${item.movieId}`
                      return (
                        <Link key={item.movieId} to={`/film/${item.movieId}`} className="recent-like-card" title={title}>
                          {poster ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${poster}`}
                              alt={title}
                              loading="lazy"
                            />
                          ) : (
                            <div className="recent-like-fallback">{title}</div>
                          )}
                        </Link>
                      )
                    })}
                    {/* Fill empty slots up to 4 */}
                    {Array.from({ length: Math.max(0, 4 - recentLikes.length) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="recent-like-slot-empty" />
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-section">
                    <p>No liked films yet. Press ♥ on films to display them here.</p>
                  </div>
                )}
              </section>

              {/* RECENT REVIEWS */}
              <section className="profile-section">
                <div className="section-title-row">
                  <span className="section-title">RECENT REVIEWS</span>
                  <Link to="/profile" className="section-action-link">MORE</Link>
                </div>

                {recentReviews.length > 0 ? (
                  <div className="recent-reviews-list">
                    {recentReviews.map((rev) => {
                      const movie = movieDetailsMap[String(rev.movieId)]
                      const poster = movie?.poster_path
                      const title = movie?.title || 'Movie'
                      const year = movie?.release_date ? movie.release_date.split('-')[0] : ''

                      return (
                        <article key={rev._id} className="profile-review-card">
                          <Link to={`/film/${rev.movieId}`} className="review-poster-thumb">
                            {poster ? (
                              <img src={`https://image.tmdb.org/t/p/w154${poster}`} alt={title} />
                            ) : (
                              <div className="review-no-poster">🎞</div>
                            )}
                          </Link>

                          <div className="review-main-info">
                            <div className="review-title-line">
                              <Link to={`/film/${rev.movieId}`} className="review-film-name">
                                {title}
                              </Link>
                              {year && <span className="review-film-year">{year}</span>}
                            </div>

                            <div className="review-rating-line">
                              {rev.rating > 0 && (
                                <span className="review-stars-green">{renderStars(rev.rating)}</span>
                              )}
                              {rev.liked && <span className="review-liked-heart">♥</span>}
                              <span className="review-rewatched-tag">Rewatched</span>
                              <span className="review-date-text">{formatReviewDate(rev.updatedAt || rev.createdAt)}</span>
                            </div>

                            <p className="review-text-content">{rev.review}</p>

                            <div className="review-likes-count">
                              ♥ No likes yet
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="profile-empty-section">
                    <p>No reviews yet. Write reviews on film pages to display them here.</p>
                  </div>
                )}
              </section>
            </div>
            )}

            {/* Right Sidebar */}
            <aside className="profile-sidebar">
              {/* Watchlist */}
              <div className="sidebar-widget">
                <div className="widget-header">
                  <Link to={`/${username}/watchlist`} className="widget-title">WATCHLIST</Link>
                  <span className="widget-count">{stats.watchlistCount || 0}</span>
                </div>
                <div className="widget-watchlist-grid">
                  {recentWatchlist.slice(0, 4).map((item) => {
                    const movie = movieDetailsMap[String(item.movieId)]
                    return (
                      <Link key={item.movieId} to={`/film/${item.movieId}`} className="widget-poster-slot">
                        {movie?.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`} alt={movie.title || ''} />
                        ) : (
                          <div className="widget-empty-poster">🎞</div>
                        )}
                      </Link>
                    )
                  })}
                  {Array.from({ length: Math.max(0, 4 - recentWatchlist.length) }).map((_, idx) => (
                    <div key={`w-empty-${idx}`} className="widget-poster-slot empty" />
                  ))}
                </div>
              </div>

              {/* Diary */}
              <div className="sidebar-widget">
                <div className="widget-header">
                  <Link to={`/${username}/diary`} className="widget-title">DIARY</Link>
                  <span className="widget-count">{stats.diaryCount || 0}</span>
                </div>
                {stats.diaryCount > 0 ? (
                  <div className="diary-entry-row">
                    <div className="diary-calendar-badge">
                      <span className="cal-month">OCT</span>
                      <span className="cal-day">19</span>
                    </div>
                    <span className="diary-entry-title">
                      {movieDetailsMap[String(recentLikes[0]?.movieId || recentReviews[0]?.movieId)]?.title || 'Watched films'}
                    </span>
                  </div>
                ) : (
                  <p className="widget-empty-note">No diary entries yet.</p>
                )}
              </div>

              {/* Ratings Histogram */}
              <div className="sidebar-widget">
                <div className="widget-header">
                  <span className="widget-title">RATINGS</span>
                  <span className="widget-count">{stats.totalRatings || 0}</span>
                </div>
                <div className="ratings-chart-wrap">
                  <div className="ratings-bars-row">
                    {ratingKeys.map((stars) => {
                      const count = (ratingsMap[stars] || 0) + (ratingsMap[stars - 0.5] || 0)
                      const heightPercent = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0
                      return (
                        <div key={stars} className="rating-bar-col" title={`${stars} stars: ${count}`}>
                          <div
                            className="rating-bar-fill"
                            style={{ height: `${Math.max(count > 0 ? 15 : 2, heightPercent)}%` }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="ratings-labels-row">
                    <span className="star-label-left">★</span>
                    <span className="star-label-right">★★★★★</span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline (only shown on Profile tab) */}
              {activeTab === 'Profile' && (
                <div className="sidebar-widget">
                  <div className="widget-header">
                    <span className="widget-title">ACTIVITY</span>
                  </div>
                  <div className="activity-timeline-list">
                    {activityTimeline.length > 0 ? (
                      activityTimeline.slice(0, 6).map((act) => {
                        const movie = movieDetailsMap[String(act.movieId)]
                        const movieTitle = movie?.title || `Film #${act.movieId}`
                        const timeAgo = formatRelativeTime(act.updatedAt)

                        let actionText = 'interacted with'
                        if (act.review && act.liked && act.rating) {
                          actionText = `reviewed, liked and rated ${movieTitle} ${renderStars(act.rating)} on ${formatWeekdayDate(act.updatedAt)}`
                        } else if (act.liked) {
                          actionText = `liked ${movieTitle}`
                        } else if (act.rating) {
                          actionText = `rated ${movieTitle} ${renderStars(act.rating)}`
                        } else if (act.watchlist) {
                          actionText = `added ${movieTitle} to your watchlist`
                        } else if (act.watched) {
                          actionText = `watched ${movieTitle}`
                        }

                        return (
                          <div key={act._id} className="activity-item-row">
                            <span className="activity-bullet">●</span>
                            <p className="activity-text">
                              You {actionText}{' '}
                              <span className="activity-time">{timeAgo}</span>
                            </p>
                          </div>
                        )
                      })
                    ) : (
                      <p className="widget-empty-note">No recent activity.</p>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

export default Profile