import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './Watchlist.css'

const DECADES = [
  { id: 'all', label: 'All Decades' },
  { id: '2020s', label: '2020s' },
  { id: '2010s', label: '2010s' },
  { id: '2000s', label: '2000s' },
  { id: '1990s', label: '1990s' },
  { id: '1980s', label: '1980s' },
  { id: '1970s', label: '1970s' },
  { id: '1960s', label: '1960s' },
  { id: '1950s', label: '1950s' },
  { id: 'earlier', label: 'Earlier' },
]

const GENRES = [
  { id: 'all', label: 'All Genres' },
  { id: 'Action', label: 'Action' },
  { id: 'Adventure', label: 'Adventure' },
  { id: 'Animation', label: 'Animation' },
  { id: 'Comedy', label: 'Comedy' },
  { id: 'Crime', label: 'Crime' },
  { id: 'Documentary', label: 'Documentary' },
  { id: 'Drama', label: 'Drama' },
  { id: 'Family', label: 'Family' },
  { id: 'Fantasy', label: 'Fantasy' },
  { id: 'History', label: 'History' },
  { id: 'Horror', label: 'Horror' },
  { id: 'Music', label: 'Music' },
  { id: 'Mystery', label: 'Mystery' },
  { id: 'Romance', label: 'Romance' },
  { id: 'Science Fiction', label: 'Sci-Fi' },
  { id: 'Thriller', label: 'Thriller' },
  { id: 'War', label: 'War' },
  { id: 'Western', label: 'Western' },
]

function Watchlist() {
  const { username: routeUsername } = useParams()
  const [watchlistItems, setWatchlistItems] = useState([])
  const [movieDetails, setMovieDetails] = useState({})
  const [loading, setLoading] = useState(true)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  
  const [selectedDecade, setSelectedDecade] = useState('all')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [sortBy, setSortBy] = useState('date-added')
  
  // Dropdown states
  const [showDecadeDropdown, setShowDecadeDropdown] = useState(false)
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Feedback Toast
  const [feedbackMsg, setFeedbackMsg] = useState('')

  // Privacy State
  const token = localStorage.getItem('token')
  const storedUsername = localStorage.getItem('username')
  const username = routeUsername || storedUsername || 'adhin1234'
  
  const [isPrivate, setIsPrivate] = useState(() => {
    return localStorage.getItem(`watchlist_private_${username}`) === 'true'
  })

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState('')
  const [importResults, setImportResults] = useState(null)
  const fileInputRef = useRef(null)

  // Close dropdowns on outside click
  const dropdownRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDecadeDropdown(false)
        setShowGenreDropdown(false)
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchWatchlist()
  }, [token])

  const fetchWatchlist = async () => {
    try {
      setLoading(true)
      if (!token) {
        setWatchlistItems([])
        setLoading(false)
        return
      }

      const res = await fetch('http://localhost:5000/api/interactions/user/watchlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      const items = Array.isArray(data) ? data : []
      setWatchlistItems(items)

      // Fetch TMDB details for each watchlisted movie
      const details = {}
      for (const item of items) {
        try {
          const tmdbRes = await fetch(
            `https://api.themoviedb.org/3/movie/${item.movieId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
          )
          const tmdbData = await tmdbRes.json()
          if (tmdbData && !tmdbData.status_message) {
            details[item.movieId] = tmdbData
          }
        } catch (err) {
          console.error('Failed to fetch TMDB data for', item.movieId)
        }
      }
      setMovieDetails(details)
    } catch (err) {
      console.error('Error fetching watchlist:', err)
      setWatchlistItems([])
    } finally {
      setLoading(false)
    }
  }

  const removeFromWatchlist = async (movieId) => {
    if (!token) {
      alert('Please log in to manage your watchlist.')
      return
    }

    try {
      await fetch('http://localhost:5000/api/interactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ movieId: movieId.toString(), watchlist: false })
      })
      // Optimistic update
      setWatchlistItems(prev => prev.filter(item => item.movieId.toString() !== movieId.toString()))
      setFeedbackMsg('Removed film from watchlist')
      setTimeout(() => setFeedbackMsg(''), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  const addToWatchlist = async (movie) => {
    if (!token) {
      alert('Please log in to add films to your watchlist.')
      return
    }

    try {
      const movieIdStr = movie.id.toString()
      const res = await fetch('http://localhost:5000/api/interactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ movieId: movieIdStr, watchlist: true })
      })

      if (res.ok) {
        setMovieDetails(prev => ({ ...prev, [movieIdStr]: movie }))
        setWatchlistItems(prev => {
          if (prev.some(item => item.movieId.toString() === movieIdStr)) {
            return prev
          }
          return [{ _id: Date.now().toString(), movieId: movieIdStr, updatedAt: new Date().toISOString() }, ...prev]
        })
        setSearchQuery('')
        setSearchResults([])
        setFeedbackMsg(`Added "${movie.title}" to watchlist!`)
        setTimeout(() => setFeedbackMsg(''), 3000)
      }
    } catch (err) {
      console.error('Failed to add movie to watchlist:', err)
    }
  }

  // Sidebar instant search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      setSearchLoading(true)
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults((data.results || []).slice(0, 6))
          setSearchLoading(false)
        })
        .catch(err => {
          console.error(err)
          setSearchLoading(false)
        })
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Toggle Privacy
  const togglePrivacy = () => {
    const nextState = !isPrivate
    setIsPrivate(nextState)
    localStorage.setItem(`watchlist_private_${username}`, nextState.toString())
    setFeedbackMsg(nextState ? '🔒 Watchlist is now private (only visible to you)' : '🌐 Watchlist is now public')
    setTimeout(() => setFeedbackMsg(''), 3500)
  }

  // Handle File Upload for Import
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        // Parse CSV or text lines
        const lines = content.split(/\r?\n/)
        const titles = lines.map(line => {
          // If CSV, extract first column or Name/Title column
          const cleaned = line.replace(/^["']|["']$/g, '').trim()
          if (cleaned.toLowerCase().startsWith('name') || cleaned.toLowerCase().startsWith('title')) {
            return '' // Skip CSV header
          }
          return cleaned.split(',')[0].replace(/^["']|["']$/g, '').trim()
        }).filter(Boolean)

        setImportText(titles.join('\n'))
      }
    }
    reader.readAsText(file)
  }

  // Execute Batch Import
  const handleBatchImport = async () => {
    if (!token) {
      alert('Please log in to import films into your watchlist.')
      return
    }

    const titles = importText
      .split(/\r?\n/)
      .map(t => t.trim())
      .filter(Boolean)

    if (titles.length === 0) {
      alert('Please enter at least one film title to import.')
      return
    }

    setImporting(true)
    setImportProgress(`Starting import of ${titles.length} film(s)...`)
    
    const successful = []
    const failed = []

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i]
      setImportProgress(`Searching TMDB for "${title}" (${i + 1}/${titles.length})...`)

      try {
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(title)}`
        )
        const searchData = await searchRes.json()
        const match = searchData.results?.[0]

        if (match) {
          // Add to backend watchlist
          const saveRes = await fetch('http://localhost:5000/api/interactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ movieId: match.id.toString(), watchlist: true })
          })

          if (saveRes.ok) {
            successful.push(match)
            setMovieDetails(prev => ({ ...prev, [match.id.toString()]: match }))
          } else {
            failed.push(title)
          }
        } else {
          failed.push(title)
        }
      } catch (err) {
        console.error('Import error for:', title, err)
        failed.push(title)
      }
    }

    setImporting(false)
    setImportResults({ successful, failed })
    // Refresh watchlist from backend
    fetchWatchlist()
    setFeedbackMsg(`Successfully imported ${successful.length} film(s) to your watchlist!`)
    setTimeout(() => setFeedbackMsg(''), 4000)
  }

  // Filter and Sort Items
  const getFilteredAndSortedItems = () => {
    let items = [...watchlistItems]

    // 1. Decade filter
    if (selectedDecade !== 'all') {
      items = items.filter(item => {
        const movie = movieDetails[item.movieId]
        if (!movie || !movie.release_date) return false
        const year = parseInt(movie.release_date.split('-')[0], 10)
        if (isNaN(year)) return false

        if (selectedDecade === '2020s') return year >= 2020 && year <= 2029
        if (selectedDecade === '2010s') return year >= 2010 && year <= 2019
        if (selectedDecade === '2000s') return year >= 2000 && year <= 2009
        if (selectedDecade === '1990s') return year >= 1990 && year <= 1999
        if (selectedDecade === '1980s') return year >= 1980 && year <= 1989
        if (selectedDecade === '1970s') return year >= 1970 && year <= 1979
        if (selectedDecade === '1960s') return year >= 1960 && year <= 1969
        if (selectedDecade === '1950s') return year >= 1950 && year <= 1959
        if (selectedDecade === 'earlier') return year < 1950
        return true
      })
    }

    // 2. Genre filter
    if (selectedGenre !== 'all') {
      items = items.filter(item => {
        const movie = movieDetails[item.movieId]
        if (!movie || !Array.isArray(movie.genres)) return false
        return movie.genres.some(g => g.name.toLowerCase() === selectedGenre.toLowerCase())
      })
    }

    // 3. Sorting
    if (sortBy === 'title') {
      items.sort((a, b) => {
        const titleA = movieDetails[a.movieId]?.title || ''
        const titleB = movieDetails[b.movieId]?.title || ''
        return titleA.localeCompare(titleB)
      })
    } else if (sortBy === 'release-date') {
      items.sort((a, b) => {
        const dateA = movieDetails[a.movieId]?.release_date || ''
        const dateB = movieDetails[b.movieId]?.release_date || ''
        return dateB.localeCompare(dateA)
      })
    } else if (sortBy === 'rating') {
      items.sort((a, b) => {
        const ratingA = movieDetails[a.movieId]?.vote_average || 0
        const ratingB = movieDetails[b.movieId]?.vote_average || 0
        return ratingB - ratingA
      })
    }

    return items
  }

  const displayedItems = getFilteredAndSortedItems()
  const hasActiveFilters = selectedDecade !== 'all' || selectedGenre !== 'all'

  return (
    <div className="watchlist-page">
      <Navbar />

      {/* Sub-header Profile Nav Bar */}
      <div className="watchlist-subnav-container">
        <div className="watchlist-profile-bar">
          <div className="profile-bar-left">
            <div className="profile-bar-avatar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#89a">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className="profile-bar-username">{username}</span>
          </div>

          <div className="profile-bar-tabs">
            <Link to="/profile">Activity</Link>
            <Link to={`/${username}/films`}>Films</Link>
            <Link to={`/${username}/diary`}>Diary</Link>
            <Link to={`/${username}/reviews`}>Reviews</Link>
            <Link to={`/${username}/watchlist`} className="active-tab">Watchlist</Link>
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
            <button className="subnav-icon-btn" title="RSS Feed">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <circle cx="6.18" cy="17.82" r="2.18"/>
                <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
              </svg>
            </button>
          </div> */}
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="watchlist-layout">
        <div className="watchlist-main">
          {/* Header row with count and interactive filters */}
          <div className="watchlist-header-row" ref={dropdownRef}>
            <div className="heading-with-privacy">
              <h2 className="watchlist-heading">
                YOU WANT TO SEE <span className="film-count">{watchlistItems.length} FILMS</span>
              </h2>
              {isPrivate && (
                <span className="privacy-badge" title="This list is private (only visible to you)">
                  🔒 PRIVATE
                </span>
              )}
            </div>

            <div className="watchlist-filters">
              {/* Decade Filter Dropdown */}
              <div className="filter-dropdown-container">
                <span 
                  className={`filter-item ${selectedDecade !== 'all' ? 'filter-active' : ''}`}
                  onClick={() => {
                    setShowDecadeDropdown(!showDecadeDropdown)
                    setShowGenreDropdown(false)
                    setShowSortDropdown(false)
                  }}
                >
                  {selectedDecade === 'all' ? 'DECADE' : selectedDecade} ▾
                </span>
                {showDecadeDropdown && (
                  <div className="filter-menu">
                    {DECADES.map(d => (
                      <div
                        key={d.id}
                        className={`filter-menu-item ${selectedDecade === d.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDecade(d.id)
                          setShowDecadeDropdown(false)
                        }}
                      >
                        {d.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Genre Filter Dropdown */}
              <div className="filter-dropdown-container">
                <span 
                  className={`filter-item ${selectedGenre !== 'all' ? 'filter-active' : ''}`}
                  onClick={() => {
                    setShowGenreDropdown(!showGenreDropdown)
                    setShowDecadeDropdown(false)
                    setShowSortDropdown(false)
                  }}
                >
                  {selectedGenre === 'all' ? 'GENRE' : (GENRES.find(g => g.id === selectedGenre)?.label || selectedGenre)} ▾
                </span>
                {showGenreDropdown && (
                  <div className="filter-menu genre-menu-scrollable">
                    {GENRES.map(g => (
                      <div
                        key={g.id}
                        className={`filter-menu-item ${selectedGenre === g.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedGenre(g.id)
                          setShowGenreDropdown(false)
                        }}
                      >
                        {g.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="filter-dropdown-container">
                <span 
                  className={`filter-item ${sortBy !== 'date-added' ? 'filter-active' : ''}`} 
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown)
                    setShowDecadeDropdown(false)
                    setShowGenreDropdown(false)
                  }}
                >
                  Sort by {sortBy === 'date-added' ? 'WHEN ADDED' : sortBy === 'title' ? 'NAME' : sortBy === 'rating' ? 'RATING' : 'RELEASE'} ▾
                </span>
                {showSortDropdown && (
                  <div className="filter-menu">
                    <div 
                      className={`filter-menu-item ${sortBy === 'date-added' ? 'active' : ''}`}
                      onClick={() => { setSortBy('date-added'); setShowSortDropdown(false); }}
                    >
                      When Added
                    </div>
                    <div 
                      className={`filter-menu-item ${sortBy === 'release-date' ? 'active' : ''}`}
                      onClick={() => { setSortBy('release-date'); setShowSortDropdown(false); }}
                    >
                      Release Date
                    </div>
                    <div 
                      className={`filter-menu-item ${sortBy === 'rating' ? 'active' : ''}`}
                      onClick={() => { setSortBy('rating'); setShowSortDropdown(false); }}
                    >
                      Highest Rated
                    </div>
                    <div 
                      className={`filter-menu-item ${sortBy === 'title' ? 'active' : ''}`}
                      onClick={() => { setSortBy('title'); setShowSortDropdown(false); }}
                    >
                      Film Name (A-Z)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="watchlist-divider"></div>

          {/* Active filter status pill & reset */}
          {hasActiveFilters && (
            <div className="active-filters-bar">
              <span>
                Showing {displayedItems.length} of {watchlistItems.length} films
                {selectedDecade !== 'all' && ` • Decade: ${selectedDecade}`}
                {selectedGenre !== 'all' && ` • Genre: ${selectedGenre}`}
              </span>
              <button 
                className="reset-filters-btn"
                onClick={() => {
                  setSelectedDecade('all')
                  setSelectedGenre('all')
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div className="watchlist-toast-alert">
              {feedbackMsg}
            </div>
          )}

          {/* Empty state or Grid of posters */}
          {loading ? (
            <div className="watchlist-empty-box">
              <p>Loading watchlist...</p>
            </div>
          ) : watchlistItems.length === 0 ? (
            <div className="watchlist-empty-box">
              <p>No films yet</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="watchlist-empty-box">
              <p>No films match your selected filters</p>
              <button 
                className="reset-filters-btn mt-10"
                onClick={() => {
                  setSelectedDecade('all')
                  setSelectedGenre('all')
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="watchlist-grid">
              {displayedItems.map(item => {
                const movie = movieDetails[item.movieId]
                return (
                  <div key={item._id || item.movieId} className="watchlist-card">
                    <Link to={`/film/${item.movieId}`} className="watchlist-poster-link">
                      {movie?.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                          alt={movie?.title || 'Film poster'}
                          loading="lazy"
                        />
                      ) : (
                        <div className="no-poster-card">
                          <span>{movie?.title || 'No Image'}</span>
                        </div>
                      )}
                    </Link>

                    {/* Quick remove action */}
                    <button
                      className="watchlist-remove-btn"
                      onClick={() => removeFromWatchlist(item.movieId)}
                      title="Remove from watchlist"
                    >
                      ✕
                    </button>

                    <div className="watchlist-card-info">
                      <span className="watchlist-card-title">{movie?.title}</span>
                      {movie?.release_date && (
                        <span className="watchlist-card-year">{movie.release_date.split('-')[0]}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="watchlist-sidebar">
          {/* Action buttons */}
          <div className="sidebar-actions">
            <button 
              className={`sidebar-action-btn top ${isPrivate ? 'active-private' : ''}`}
              onClick={togglePrivacy}
            >
              {isPrivate ? 'Make this list public' : 'Make this list private'}
            </button>
            <button 
              className="sidebar-action-btn bottom"
              onClick={() => {
                setImportResults(null)
                setShowImportModal(true)
              }}
            >
              Import to watchlist...
            </button>
          </div>

          {/* HOW TO ADD */}
          <div className="sidebar-section">
            <h4 className="sidebar-heading">HOW TO ADD</h4>
            <p className="sidebar-description">
              Add films you want to see to your watchlist from the ••• icon on each film poster, or click the Watchlist icon in the actions panel on a film or review page. Use the button above to import titles to your watchlist using our <a href="#" onClick={(e) => { e.preventDefault(); setShowImportModal(true); }} className="sidebar-link">import format</a>, up to a maximum of 1,900 titles per file.
            </p>
          </div>

          {/* ADD A FILM */}
          <div className="sidebar-section">
            <h4 className="sidebar-heading">ADD A FILM</h4>
            <div className="sidebar-search-container">
              <input
                type="text"
                placeholder="Search films..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sidebar-search-input"
              />
              {searchLoading && <div className="sidebar-search-loading">Searching...</div>}
              {searchResults.length > 0 && (
                <div className="sidebar-search-dropdown">
                  {searchResults.map(movie => (
                    <div 
                      key={movie.id} 
                      className="sidebar-search-item" 
                      onClick={() => addToWatchlist(movie)}
                    >
                      {movie.poster_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                          alt={movie.title} 
                          className="search-item-thumb"
                        />
                      ) : (
                        <div className="search-item-nothumb">🎞</div>
                      )}
                      <div className="sidebar-search-meta">
                        <span className="search-item-title">{movie.title}</span>
                        <span className="search-item-year">{movie.release_date?.split('-')[0] || ''}</span>
                      </div>
                      <span className="add-film-badge">+ Add</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* IMPORT TO WATCHLIST MODAL */}
      {showImportModal && (
        <div className="import-modal-overlay" onClick={() => !importing && setShowImportModal(false)}>
          <div className="import-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <h3>IMPORT TO WATCHLIST</h3>
              <button 
                className="import-modal-close" 
                onClick={() => !importing && setShowImportModal(false)}
                disabled={importing}
              >
                ✕
              </button>
            </div>

            <div className="import-modal-body">
              {!importResults ? (
                <>
                  <p className="import-modal-intro">
                    Add multiple films to your watchlist at once. Enter film titles one per line, or upload a Letterboxd export CSV or text file.
                  </p>

                  <div className="import-input-group">
                    <label className="import-label">Film Titles (one per line):</label>
                    <textarea
                      className="import-textarea"
                      rows="6"
                      placeholder="Inception&#10;Parasite&#10;Interstellar&#10;Spirited Away&#10;The Dark Knight"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      disabled={importing}
                    />
                  </div>

                  <div className="import-file-section">
                    <span className="import-file-hint">Or choose a CSV / TXT file:</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="import-file-input"
                      disabled={importing}
                    />
                  </div>

                  {importing && (
                    <div className="import-progress-box">
                      <div className="import-spinner"></div>
                      <span className="import-progress-text">{importProgress}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="import-results-container">
                  <div className="import-results-summary">
                    <span className="summary-success">
                      ✓ Successfully imported {importResults.successful.length} film(s)
                    </span>
                    {importResults.failed.length > 0 && (
                      <span className="summary-failed">
                        ⚠ {importResults.failed.length} title(s) could not be resolved
                      </span>
                    )}
                  </div>

                  {importResults.successful.length > 0 && (
                    <div className="imported-films-preview">
                      {importResults.successful.map(m => (
                        <div key={m.id} className="imported-film-badge">
                          {m.poster_path && (
                            <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt="" />
                          )}
                          <span>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {importResults.failed.length > 0 && (
                    <div className="failed-titles-box">
                      <p>Could not find:</p>
                      <ul>
                        {importResults.failed.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="import-modal-footer">
              {!importResults ? (
                <>
                  <button 
                    className="modal-btn-cancel" 
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                  >
                    Cancel
                  </button>
                  <button 
                    className="modal-btn-primary" 
                    onClick={handleBatchImport}
                    disabled={importing || !importText.trim()}
                  >
                    {importing ? 'Importing...' : 'Import Films'}
                  </button>
                </>
              ) : (
                <button 
                  className="modal-btn-primary" 
                  onClick={() => {
                    setShowImportModal(false)
                    setImportText('')
                    setImportResults(null)
                  }}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Watchlist
