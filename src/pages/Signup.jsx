import './Signup.css'

function Signup() {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Backend connection will be added later
  }

  return (
    <main className="signup-page">
      <div className="signup-wrapper">

        <div className="signup-card">

          <div className="signup-content">

            {/* Letterboxd logo dots */}
            <div className="signup-logo">
              <span className="logo-dot orange"></span>
              <span className="logo-dot green"></span>
              <span className="logo-dot blue"></span>
            </div>

            <h1>Join Letterboxd</h1>

            <div className="login-prompt">
              <span>Already have a Letterboxd account?</span>
              <a href="/login">Sign in</a>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Username */}
              <div className="form-group">
                <label htmlFor="username">
                  Username
                </label>

                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Terms */}
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  name="terms"
                  required
                />

                <span>
                  I'm at least 16 years old and accept the{' '}
                  <a href="#">Terms of Use</a>.
                </span>
              </label>

              {/* Privacy */}
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  name="privacy"
                  required
                />

                <span>
                  I accept the{' '}
                  <a href="#">Privacy Policy</a> and consent
                  to the processing of my personal information
                  in accordance with it.
                </span>
              </label>

              <button
                type="submit"
                className="signup-button"
              >
                CREATE ACCOUNT
              </button>

            </form>

          </div>

        </div>

        <div className="signup-footer">
          <a href="#">Terms</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Contact</a>
        </div>

      </div>
    </main>
  )
}

export default Signup