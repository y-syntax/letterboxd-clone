import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Film from './pages/Film'
import Search from './pages/Search'

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />
        
        <Route
          path="/film/:id"
          element={<Film />}
        />

        <Route
          path="/search"
          element={<Search />}
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App