import { useState } from 'react'
import './Signup.css'

function Signup() {
  const [formData, setFormData] = useState({ email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.details || 'Registration failed')
      
      setSuccess(true)
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.user.username)
      setTimeout(() => {
        window.location.href = '/' // Quick redirect to home
      }, 1000)
    } catch (err) {
      setError(err.message)
    }
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

              {success && <div style={{ color: '#4caf50', marginBottom: '1rem', fontWeight: 'bold' }}>Account created successfully!</div>}
              {error && <div style={{ color: '#f44336', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}

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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.username}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
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