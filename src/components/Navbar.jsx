import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">

        <div className="navbar-left">
          <div className="logo">letterboxd</div>

          <div className="nav-links">
            <a href="#">FILMS</a>
            <a href="#">LISTS</a>
            <a href="#">MEMBERS</a>
            <a href="#">JOURNAL</a>
          </div>
        </div>

        <div className="navbar-right">
          <button className="search-btn" aria-label="Search">
            🔍
          </button>

          <a href="#" className="login-link">
            LOG IN
          </a>

          <a href="#" className="signup-btn">
            SIGN UP
          </a>
        </div>

      </div>
    </nav>
  )
}

export default Navbar