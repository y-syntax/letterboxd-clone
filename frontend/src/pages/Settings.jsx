import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const currentUsername = localStorage.getItem('username')

  const [activeTab, setActiveTab] = useState('PROFILE')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  // Form Fields
  const [username, setUsername] = useState('')
  const [givenName, setGivenName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [pronoun, setPronoun] = useState('They / their')
  const [posters, setPosters] = useState('Any')
  const [replies, setReplies] = useState('Anyone')
  const [includeInMembers, setIncludeInMembers] = useState(true)
  const [adultContent, setAdultContent] = useState(false)

  // 4 Favorite Films
  const [favoriteFilms, setFavoriteFilms] = useState([])

  // Modal for selecting favorite film
  const [activeSlotIndex, setActiveSlotIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setUsername(data.username || '')
        setGivenName(data.givenName || '')
        setFamilyName(data.familyName || '')
        setEmail(data.email || '')
        setLocation(data.location || '')
        setWebsite(data.website || '')
        setBio(data.bio || '')
        setPronoun(data.pronoun || 'They / their')
        setPosters(data.posters || 'Any')
        setReplies(data.replies || 'Anyone')
        setIncludeInMembers(data.includeInMembers !== undefined ? data.includeInMembers : true)
        setAdultContent(Boolean(data.adultContent))
        setFavoriteFilms(Array.isArray(data.favoriteFilms) ? data.favoriteFilms : [])
      } else {
        setErrorMsg(data.error || 'Failed to load settings.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Server error loading account settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setErrorMsg('')
      const res = await fetch('http://localhost:5000/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          givenName,
          familyName,
          location,
          website,
          bio,
          pronoun,
          posters,
          replies,
          includeInMembers,
          adultContent,
          favoriteFilms
        })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        if (data.user?.username) {
          localStorage.setItem('username', data.user.username)
        }
        setToastMsg('Settings saved successfully!')
        setTimeout(() => setToastMsg(''), 3000)
      } else {
        setErrorMsg(data.error || 'Failed to save settings.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Server error saving settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true)
      const res = await fetch('http://localhost:5000/api/auth/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        alert('Your account has been successfully deactivated.')
        window.location.href = '/'
      } else {
        alert(data.error || data.message || 'Failed to deactivate account')
        setDeactivating(false)
      }
    } catch (err) {
      console.error('Deactivation error:', err)
      alert('An error occurred while deactivating your account.')
      setDeactivating(false)
    }
  }

  // Search TMDB for movie modal
  useEffect(() => {
    if (!searchQuery.trim() || activeSlotIndex === null) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true)
        const apiKey = import.meta.env.VITE_TMDB_API_KEY
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results ? data.results.slice(0, 8) : [])
      } catch (err) {
        console.error(err)
      } finally {
        setSearchLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, activeSlotIndex])

  const selectMovieForSlot = (movie) => {
    const updated = [...favoriteFilms]
    updated[activeSlotIndex] = {
      movieId: String(movie.id),
      title: movie.title,
      posterPath: movie.poster_path || '',
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : ''
    }
    setFavoriteFilms(updated)
    setActiveSlotIndex(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const removeMovieFromSlot = (idx, e) => {
    e.stopPropagation()
    const updated = [...favoriteFilms]
    updated.splice(idx, 1)
    setFavoriteFilms(updated)
  }

  if (loading) {
    return (
      <div className="settings-page">
        <Navbar />
        <div className="settings-loading">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <Navbar />

      {toastMsg && <div className="settings-toast">{toastMsg}</div>}

      <main className="settings-container">
        {/* Top Header */}
        <div className="settings-top-header">
          <h1 className="settings-title">Account Settings</h1>
        </div>

        {/* Navigation Tabs */}
       <div className="settings-subtabs-row">
  <div className="settings-subtabs">
    <span className="settings-subtab active">
      PROFILE
    </span>
  </div>

  <button 
    type="button" 
    className="deactivate-link"
    onClick={() => setShowDeactivateModal(true)}
  >
    Deactivate account
  </button>
</div>


        {errorMsg && <div className="settings-error-banner">{errorMsg}</div>}

        {/* Profile Tab Content */}
        {activeTab === 'PROFILE' ? (
          <div className="settings-columns">
            {/* Left Column: Form */}
            <form onSubmit={handleSave} className="settings-form">
              <h2 className="settings-section-heading">Profile</h2>

              {/* Username */}
              <div className="form-group">
                <label>Username</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <span className="input-pencil-icon">✎</span>
                </div>
              </div>

              {/* Given Name & Family Name */}
              <div className="form-row-two">
                <div className="form-group">
                  <label>Given name</label>
                  <input
                    type="text"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Family name</label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="input-disabled"
                  title="Email cannot be changed here"
                />
              </div>

              {/* Location & Website */}
              <div className="form-row-two">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Pronoun */}
              <div className="form-group dropdown-field">
                <label>Pronoun <span className="help-icon" title="Used in public feed updates">🛈</span></label>
                <div className="field-with-help">
                  <select
                    value={pronoun}
                    onChange={(e) => setPronoun(e.target.value)}
                  >
                    <option value="They / their">They / their</option>
                    <option value="He / him">He / him</option>
                    <option value="She / her">She / her</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="field-help-text">
                    Example use: <strong>{username || 'adhin1234'}</strong> added <em>Pride</em> to their watchlist
                  </span>
                </div>
              </div>

              {/* Posters */}
              <div className="form-group dropdown-field">
                <label>Posters <span className="help-icon" title="Poster selection preference">🛈</span></label>
                <div className="field-with-help">
                  <select
                    value={posters}
                    onChange={(e) => setPosters(e.target.value)}
                  >
                    <option value="Any">Any</option>
                    <option value="Original">Original</option>
                  </select>
                  <span className="field-help-text">custom posters will be shown</span>
                </div>
              </div>

              {/* Replies */}
              <div className="form-group dropdown-field">
                <label>Replies <span className="help-icon" title="Who can comment or reply">🛈</span></label>
                <div className="field-with-help">
                  <select
                    value={replies}
                    onChange={(e) => setReplies(e.target.value)}
                  >
                    <option value="Anyone">Anyone</option>
                    <option value="Friends only">Friends only</option>
                    <option value="Off">Off</option>
                  </select>
                  <span className="field-help-text">can reply to your content</span>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeInMembers}
                    onChange={(e) => setIncludeInMembers(e.target.checked)}
                  />
                  <span>Include profile in the <strong>Members</strong> section</span>
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={adultContent}
                    onChange={(e) => setAdultContent(e.target.checked)}
                  />
                  <span>
                    Adult content <span className="help-icon">🛈</span>
                    <span className="checkbox-subtext">
                      I'm at least 18 years old and consent to seeing visual content of an adult nature in friends' activity and search results
                    </span>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="form-submit-row">
                <button
                  type="submit"
                  className="save-changes-btn"
                  disabled={saving}
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>

            {/* Right Column: Favorite Films */}
            <aside className="settings-favorite-column">
              <div className="fav-column-heading">FAVORITE FILMS</div>

              <div className="fav-slots-grid">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const film = favoriteFilms[slotIdx]
                  return (
                    <div
                      key={slotIdx}
                      className={`fav-slot-card ${film ? 'filled' : 'empty'}`}
                      onClick={() => {
                        setActiveSlotIndex(slotIdx)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      title={film ? `${film.title} (Click to change)` : 'Add favorite film'}
                    >
                      {film ? (
                        <div className="fav-slot-poster-wrap">
                          {film.posterPath ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${film.posterPath}`}
                              alt={film.title}
                            />
                          ) : (
                            <div className="fav-slot-no-img">{film.title}</div>
                          )}
                          <button
                            type="button"
                            className="fav-remove-btn"
                            onClick={(e) => removeMovieFromSlot(slotIdx, e)}
                            title="Remove film"
                          >
                            ✕
                          </button>
                          <div className="fav-slot-overlay">
                            <span>{film.title}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="fav-plus-circle">
                          <span>+</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <span className="fav-drag-hint">Drag posters to reorder.</span>
            </aside>
          </div>
        ) : (
          <div className="settings-placeholder-tab">
            <h3>{activeTab} settings</h3>
            <p>Settings for {activeTab.toLowerCase()} are in default configuration.</p>
          </div>
        )}
      </main>

      {/* TMDB Search Modal for Favorite Films */}
      {activeSlotIndex !== null && (
        <div className="fav-modal-backdrop" onClick={() => setActiveSlotIndex(null)}>
          <div className="fav-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fav-modal-header">
              <h3>Pick Favorite Film #{activeSlotIndex + 1}</h3>
              <button
                type="button"
                className="fav-modal-close"
                onClick={() => setActiveSlotIndex(null)}
              >
                ✕
              </button>
            </div>

            <div className="fav-modal-search-wrap">
              <input
                type="text"
                placeholder="Search film title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {searchLoading && <div className="fav-search-loading">Searching TMDB...</div>}

            <div className="fav-results-list">
              {searchResults.map((movie) => (
                <div
                  key={movie.id}
                  className="fav-result-item"
                  onClick={() => selectMovieForSlot(movie)}
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt={movie.title}
                      className="fav-result-thumb"
                    />
                  ) : (
                    <div className="fav-result-no-thumb">🎞</div>
                  )}
                  <div className="fav-result-info">
                    <span className="fav-result-title">{movie.title}</span>
                    <span className="fav-result-year">
                      {movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
              {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                <div className="fav-no-results">No movies found for "{searchQuery}".</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Deactivate Account Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fav-modal-backdrop" onClick={() => !deactivating && setShowDeactivateModal(false)}>
          <div className="deactivate-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="deactivate-modal-header">
              <span className="deactivate-modal-title">DEACTIVATE ACCOUNT</span>
              <button
                type="button"
                className="fav-modal-close"
                onClick={() => !deactivating && setShowDeactivateModal(false)}
                disabled={deactivating}
              >
                ✕
              </button>
            </div>
            <div className="deactivate-modal-body">
              <p className="deactivate-warning-text">
                Are you sure you want to deactivate your account?
              </p>
              <p className="deactivate-details-text">
                This action is permanent and cannot be undone. All your ratings, reviews, diary logs, lists, and account settings will be permanently erased.
              </p>
            </div>
            <div className="deactivate-modal-actions">
              <button
                type="button"
                className="deactivate-cancel-btn"
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="deactivate-confirm-btn"
                onClick={handleDeactivateAccount}
                disabled={deactivating}
              >
                {deactivating ? 'Deactivating...' : 'Yes, Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
