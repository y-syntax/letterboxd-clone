import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Film from './pages/Film'
import Search from './pages/Search'
import Watchlist from './pages/Watchlist'
import Lists from './pages/Lists'
import CreateList from './pages/CreateList'
import UserLists from './pages/UserLists'
import ListDetail from './pages/ListDetail'
import UserFilms from './pages/UserFilms'
import BrowseFilms from './pages/BrowseFilms'
import Settings from './pages/Settings'
import ReviewDetail from './pages/ReviewDetail'
import UserReviews from './pages/UserReviews'
import Network from './pages/Network'
import Members from './pages/Members'
import Diary from './pages/Diary'

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
          path="/reset-password"
          element={<ResetPassword />}
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

        <Route
          path="/watchlist"
          element={<Watchlist />}
        />

        <Route
          path="/:username/watchlist"
          element={<Watchlist />}
        />

        <Route
          path="/lists"
          element={<Lists />}
        />

        <Route
          path="/list/new"
          element={<CreateList />}
        />

        <Route
          path="/lists/new"
          element={<CreateList />}
        />

        <Route
          path="/list/:id/edit"
          element={<CreateList />}
        />

        <Route
          path="/:username/list/:slug/edit"
          element={<CreateList />}
        />

        <Route
          path="/list/:id"
          element={<ListDetail />}
        />

        <Route
          path="/:username/list/:slug"
          element={<ListDetail />}
        />

        <Route
          path="/:username/lists"
          element={<UserLists />}
        />

        <Route
          path="/film"
          element={<BrowseFilms />}
        />

        <Route
          path="/films"
          element={<BrowseFilms />}
        />

        <Route
          path="/:username/films"
          element={<UserFilms />}
        />

        <Route
          path="/diary"
          element={<Diary />}
        />

        <Route
          path="/:username/diary"
          element={<Diary />}
        />

        <Route
          path="/likes"
          element={<UserFilms />}
        />

        <Route
          path="/:username/likes"
          element={<UserFilms />}
        />

        <Route
          path="/:username/likes/films"
          element={<UserFilms />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/reviews"
          element={<UserReviews />}
        />

        <Route
          path="/:username/reviews"
          element={<UserReviews />}
        />

        <Route
          path="/review/:id"
          element={<ReviewDetail />}
        />

        <Route
          path="/:username/film/:id"
          element={<ReviewDetail />}
        />

        <Route
          path="/network"
          element={<Network />}
        />

        <Route
          path="/:username/network"
          element={<Network />}
        />

        <Route
          path="/members"
          element={<Members />}
        />

        <Route
          path="/profile/activity"
          element={<Profile defaultTab="Activity" />}
        />

        <Route
          path="/:username/activity"
          element={<Profile defaultTab="Activity" />}
        />

        <Route
          path="/:username"
          element={<Profile />}
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App