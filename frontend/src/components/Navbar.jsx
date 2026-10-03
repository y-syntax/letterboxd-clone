import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username') || 'USER'

  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    window.location.reload() // Refresh to clear state
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }
  return (
    <nav className="navbar">
      <div className="navbar-container">

        <div className="navbar-left">

          <div className="logo">
            <span className="logo-dots">
              <span className="dot orange"></span>
              <span className="dot green"></span>
              <span className="dot blue"></span>
            </span>

            <span className="logo-text">letterboxd</span>
          </div>

          <div className="nav-links">
            <Link to="/film">FILMS</Link>
            <a href="#">LISTS</a>
            <a href="#">MEMBERS</a>
            <a href="#">JOURNAL</a>
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
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
                    <Link to="/film" onClick={() => setDropdownOpen(false)}>Films</Link>
                    <a href="#">Diary</a>
                    <a href="#">Reviews</a>
                    <a href="#">Watchlist</a>
                    <a href="#">Lists</a>
                    <a href="#">Likes</a>
                    <a href="#">Tags</a>
                    <a href="#">Network</a>
                    <a href="#">Video Store rentals</a>
                    <div className="divider"></div>
                    <a href="#">Settings</a>
                    <a href="#">Subscriptions</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Sign Out</a>
                  </div>
                )}
              </div>
              <button className="log-btn">+ LOG</button>
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

          <div className="search-container" style={{ display: 'flex', alignItems: 'center', background: '#2c3440', borderRadius: '15px', padding: '0 10px' }}>
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '5px', outline: 'none', width: '120px' }}
            />
            <button className="search-btn" aria-label="Search" onClick={() => {
              if(searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
            }} style={{ background: 'transparent', border: 'none', color: '#678', cursor: 'pointer' }}>
              <span>⌕</span>
            </button>
          </div>

        </div>

      </div>
    </nav>
  )
}

export default Navbar