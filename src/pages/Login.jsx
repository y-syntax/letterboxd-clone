import './Login.css'

function Login() {
  return (
    <main className="login-page">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-content">

            <div className="login-logo">
              <span className="logo-dot orange"></span>
              <span className="logo-dot green"></span>
              <span className="logo-dot blue"></span>
            </div>

            <h1>Sign in to Letterboxd</h1>

            <div className="signup-prompt">
              <span>New to Letterboxd?</span>
              <a href="/signup">Create an account</a>
            </div>

            <form className="login-form">
              <div className="form-group">
                <label htmlFor="username">
                  Username
                </label>

                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                />
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="remember"
                  />
                  <span>Remember me</span>
                </label>

                <a href="/reset-password">
                  Reset password
                </a>
              </div>

              <button type="submit" className="login-button">
                SIGN IN
              </button>
            </form>
          </div>
        </div>

        <div className="login-footer">
          <a href="#">Terms</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </main>
  )
}

export default Login