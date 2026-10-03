import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.details || 'Login failed')
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.user.username)
      navigate('/') // Redirect to home page
    } catch (err) {
      setError(err.message)
    }
  }

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

            <form className="login-form" onSubmit={handleSubmit}>
              {error && <div style={{ color: '#f44336', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
              
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

              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
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