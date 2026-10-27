import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username') || 'USER'

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const searchContainerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef, searchContainerRef])

  // Live search debounced fetch
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    const apiKey = import.meta.env.VITE_TMDB_API_KEY
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(trimmed)}&page=1`
        )
        const data = await res.json()
        setSearchResults((data.results || []).slice(0, 6))
        setShowSearchResults(true)
      } catch (err) {
        console.error('Navbar search error:', err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    window.location.reload() // Refresh to clear state
  }

  const handleSelectMovie = (movieId) => {
    setShowSearchResults(false)
    setSearchQuery('')
    navigate(`/film/${movieId}`)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(false)
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    } else if (e.key === 'Escape') {
      setShowSearchResults(false)
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <div className="navbar-left">

          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            <span className="logo-dots">
              <span className="dot orange"></span>
              <span className="dot green"></span>
              <span className="dot blue"></span>
            </span>

            <span className="logo-text">letterboxd</span>
          </Link>

          <div className="nav-links">
            <Link to="/films">FILMS</Link>
            <Link to="/lists">LISTS</Link>
            <Link to="/members">MEMBERS</Link>
          </div>

        </div>

        <div className="navbar-right">

          {token ? (
            <div className="navbar-user-actions">
              <div className="user-profile-container" ref={dropdownRef}>
                <div className="user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <div className="avatar"></div>
                  <span className="username">{username.toUpperCase()}</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {dropdownOpen && (
                  <div className="profile-dropdown">
                    <Link to="/" onClick={() => setDropdownOpen(false)}>Home</Link>
                    <Link to={`/${username.toLowerCase()}`} onClick={() => setDropdownOpen(false)}>Profile</Link>
                    <Link to={`/${username.toLowerCase()}/films`} onClick={() => setDropdownOpen(false)}>Films</Link>
                    <Link to={`/${username.toLowerCase()}/diary`} onClick={() => setDropdownOpen(false)}>Diary</Link>
                    <Link to={`/${username.toLowerCase()}/reviews`} onClick={() => setDropdownOpen(false)}>Reviews</Link>
                    <Link to={`/${username.toLowerCase()}/watchlist`} onClick={() => setDropdownOpen(false)}>Watchlist</Link>
                    <Link to={`/${username.toLowerCase()}/lists`} onClick={() => setDropdownOpen(false)}>Lists</Link>
                    <Link to={`/${username.toLowerCase()}/likes`} onClick={() => setDropdownOpen(false)}>Likes</Link>
                    <Link to={`/${username.toLowerCase()}/network`} onClick={() => setDropdownOpen(false)}>Network</Link>
                    <div className="divider"></div>
                    <Link to="/settings" onClick={() => setDropdownOpen(false)}>Settings</Link>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Sign Out</a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-link">
                SIGN IN
              </Link>

              <Link to="/signup" className="signup-link">
                CREATE ACCOUNT
              </Link>
            </>
          )}

          {/* Live Search Bar with Dropdown */}
          <div className="navbar-search-wrapper" ref={searchContainerRef}>
            <div className="navbar-search-bar">
              <input 
                type="text"
                placeholder="Search films..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim().length >= 2) {
                    setShowSearchResults(true)
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowSearchResults(true)
                  }
                }}
                onKeyDown={handleKeyDown}
                className="navbar-search-input"
              />
              <button 
                type="button"
                className="navbar-search-btn" 
                aria-label="Search" 
                onClick={handleSearchSubmit}
              >
                <span>⌕</span>
              </button>
            </div>

            {/* Live Search Results Dropdown */}
            {showSearchResults && searchQuery.trim().length >= 2 && (
              <div className="navbar-search-dropdown">
                {searchLoading ? (
                  <div className="navbar-search-loading">
                    <span className="navbar-search-spinner"></span>
                    <span>Searching films...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="navbar-search-header">
                      <span>FILMS</span>
                    </div>
                    <div className="navbar-search-list">
                      {searchResults.map(movie => {
                        const year = movie.release_date ? movie.release_date.split('-')[0] : ''
                        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null
                        const posterUrl = movie.poster_path 
                          ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                          : null

                        return (
                          <div 
                            key={movie.id} 
                            className="navbar-search-item"
                            onClick={() => handleSelectMovie(movie.id)}
                          >
                            <div className="navbar-search-poster">
                              {posterUrl ? (
                                <img src={posterUrl} alt={movie.title} />
                              ) : (
                                <div className="navbar-search-no-poster">🎬</div>
                              )}
                            </div>
                            <div className="navbar-search-info">
                              <span className="navbar-search-title">{movie.title}</span>
                              <div className="navbar-search-meta">
                                {year && <span className="navbar-search-year">{year}</span>}
                                {rating && Number(rating) > 0 && (
                                  <span className="navbar-search-rating">★ {rating}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div 
                      className="navbar-search-footer"
                      onClick={handleSearchSubmit}
                    >
                      <span>See all results for "{searchQuery.trim()}" →</span>
                    </div>
                  </>
                ) : (
                  <div className="navbar-search-empty">
                    <span>No films found for "{searchQuery.trim()}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </nav>
  )
}

export default Navbar