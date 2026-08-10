import { useState } from 'react'
import Navbar from '../components/Navbar'
import movies from '../data/movies'
import './Profile.css'

function Profile() {
  const [activeTab, setActiveTab] = useState('Profile')
  const [following, setFollowing] = useState(false)

  const favoriteMovies = [
    movies[0],
    movies[2],
    movies[4],
    movies[5],
  ]

  const recentMovies = [
    {
      ...movies[1],
      userRating: 4.5,
      watched: '2 days ago',
    },
    {
      ...movies[4],
      userRating: 4,
      watched: '5 days ago',
    },
    {
      ...movies[2],
      userRating: 5,
      watched: '1 week ago',
    },
    {
      ...movies[0],
      userRating: 4.5,
      watched: '2 weeks ago',
    },
  ]

  return (
    <>
      <Navbar />

      <main className="profile-page">

        {/* Profile Header */}
        <section className="profile-header">

          <div className="profile-avatar">
            A
          </div>

          <div className="profile-info">

            <div className="profile-name-row">
              <div>
                <h1>Abhirami</h1>
                <p className="username">@abhirami</p>
              </div>

              <button
                className={`follow-button ${
                  following ? 'following' : ''
                }`}
                onClick={() => setFollowing(!following)}
              >
                {following ? 'FOLLOWING' : 'FOLLOW'}
              </button>
            </div>

            <p className="profile-bio">
              Movies, reviews and everything in between.
              <br />
              Just another film lover 🎬
            </p>

            <div className="profile-stats">

              <div>
                <strong>24</strong>
                <span>Films</span>
              </div>

              <div>
                <strong>8</strong>
                <span>Following</span>
              </div>

              <div>
                <strong>12</strong>
                <span>Followers</span>
              </div>

            </div>

          </div>

        </section>


        {/* Profile Navigation */}
        <nav className="profile-tabs">

          {[
            'Profile',
            'Activity',
            'Films',
            'Diary',
            'Reviews',
            'Watchlist',
            'Lists',
            'Likes',
          ].map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab ? 'active' : ''
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}

        </nav>


        {/* Profile Content */}

        {activeTab === 'Profile' && (

          <div className="profile-content">

            {/* Favorites */}
            <section className="profile-section">

              <div className="section-title">
                <h2>Favorite films</h2>

                <span>
                  EDIT
                </span>
              </div>

              <div className="favorite-grid">

                {favoriteMovies.map((movie) => (

                  <div
                    className="favorite-card"
                    key={movie.id}
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                    />
                  </div>

                ))}

              </div>

            </section>


            {/* Recent Activity */}
            <section className="profile-section">

              <div className="section-title">

                <h2>Recent activity</h2>

                <button>
                  MORE
                </button>

              </div>

              <div className="activity-list">

                {recentMovies.map((movie) => (

                  <article
                    className="activity-item"
                    key={movie.id}
                  >

                    <img
                      src={movie.poster}
                      alt={movie.title}
                    />

                    <div className="activity-info">

                      <h3>{movie.title}</h3>

                      <p>
                        {movie.year}
                      </p>

                      <div className="activity-rating">

                        {'★'.repeat(
                          Math.floor(movie.userRating)
                        )}

                        {movie.userRating % 1 !== 0 && '½'}

                      </div>

                      <span>
                        Watched {movie.watched}
                      </span>

                    </div>

                  </article>

                ))}

              </div>

            </section>


            {/* Reviews */}
            <section className="profile-section">

              <div className="section-title">

                <h2>Recent reviews</h2>

                <button>
                  MORE
                </button>

              </div>

              <div className="review-card">

                <div className="review-poster">

                  <img
                    src={movies[2].poster}
                    alt={movies[2].title}
                  />

                </div>

                <div className="review-content">

                  <h3>
                    Parasite
                  </h3>

                  <p className="review-year">
                    2019
                  </p>

                  <div className="review-stars">
                    ★★★★★
                  </div>

                  <p className="review-text">
                    A brilliant film with incredible
                    storytelling, atmosphere and
                    performances.
                  </p>

                  <span className="review-date">
                    Watched recently
                  </span>

                </div>

              </div>

            </section>


            {/* Watchlist */}
            <section className="profile-section">

              <div className="section-title">

                <h2>Watchlist</h2>

                <button>
                  VIEW ALL
                </button>

              </div>

              <div className="watchlist-grid">

                {movies.slice(0, 5).map((movie) => (

                  <div
                    className="watchlist-card"
                    key={movie.id}
                  >

                    <img
                      src={movie.poster}
                      alt={movie.title}
                    />

                  </div>

                ))}

              </div>

            </section>

          </div>

        )}


        {/* Other tabs - frontend placeholder for now */}

        {activeTab !== 'Profile' && (

          <div className="empty-profile-tab">

            <h2>{activeTab}</h2>

            <p>
              This section will be connected to the
              backend later.
            </p>

          </div>

        )}

      </main>
    </>
  )
}

export default Profile