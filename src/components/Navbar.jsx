import './Navbar.css'

function Navbar() {
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
            <a href="#">FILMS</a>
            <a href="#">LISTS</a>
            <a href="#">MEMBERS</a>
            <a href="#">JOURNAL</a>
          </div>

        </div>

        <div className="navbar-right">

          <a href="#" className="login-link">
            SIGN IN
          </a>

          <a href="#" className="signup-link">
            CREATE ACCOUNT
          </a>

          <button className="search-btn" aria-label="Search">
            <span>⌕</span>
          </button>

        </div>

      </div>
    </nav>
  )
}

export default Navbar