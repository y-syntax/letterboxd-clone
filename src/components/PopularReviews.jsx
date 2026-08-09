import ReviewCard from './ReviewCard'
import reviews from '../data/reviews'
import movies from '../data/movies'
import './PopularReviews.css'

function PopularReviews() {
  const popularLists = [
    {
      title: 'Letterboxd’s Top 500 Films',
      creator: 'Official Lists',
      films: '500 films',
      likes: '411K',
      comments: '34K',
      movies: [movies[0],movies[1],movies[2],movies[3]]
    },
    {
      title: 'Movies everyone should watch',
      creator: 'filmlover',
      films: '100 films',
      likes: '420K',
      comments: '1.9K',
      movies: [movies[4],movies[5],movies[2],movies[0]]
    },
    {
      title: 'Greatest films of all time',
      creator: 'cinemaniac',
      films: '250 films',
      likes: '280K',
      comments: '12K',
      movies: [movies[3],movies[1],movies[5],movies[4]]
    }
  ]

  const popularReviewers = [
    {
      username: 'filmlover',
      films: 276,
      reviews: 233
    },
    {
      username: 'cinemaniac',
      films: 779,
      reviews: 610
    },
    {
      username: 'moviebuff',
      films: 1904,
      reviews: 315
    },
    {
      username: 'reelcritic',
      films: 542,
      reviews: 189
    }
  ]

  return (
    <section className="reviews-section">
      <div className="reviews-intro">
        <h2>Write and share reviews. Compile your own lists. Share your life in film.</h2>
        <p>
          Below are some popular reviews and lists from this week.
          <span> Sign up to create your own.</span>
        </p>
      </div>

      <div className="reviews-layout">

        <div className="reviews-main">
          <div className="section-heading">
            <h2>POPULAR REVIEWS THIS WEEK</h2>
            <a href="#">MORE</a>
          </div>

          <div className="reviews-list">
            {reviews.map(review => {
              const movie = movies.find(movie => movie.id === review.movieId)

              return (
                <ReviewCard
                  key={review.id}
                  review={review}
                  movie={movie}
                />
              )
            })}
          </div>
        </div>

        <aside className="reviews-sidebar">

          <div className="sidebar-section">
            <div className="section-heading">
              <h2>POPULAR LISTS</h2>
              <a href="#">MORE</a>
            </div>

            <div className="lists-container">
              {popularLists.map((list,index) => (
                <div className="list-card" key={index}>

                  <div className="list-posters">
                    {list.movies.map(movie => (
                      <img
                        key={movie.id}
                        src={movie.poster}
                        alt={movie.title}
                      />
                    ))}
                  </div>

                  <h3>{list.title}</h3>

                  <div className="list-creator">
                    <span className="creator-icon">●</span>
                    {list.creator}
                  </div>

                  <div className="list-stats">
                    {list.films}
                    <span>♥ {list.likes}</span>
                    <span>▰ {list.comments}</span>
                  </div>

                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section reviewers-section">
            <div className="section-heading">
              <h2>POPULAR REVIEWERS</h2>
              <a href="#">MORE</a>
            </div>

            <div className="reviewers-list">
              {popularReviewers.map(reviewer => (
                <div className="reviewer" key={reviewer.username}>
                  <div className="reviewer-avatar">
                    {reviewer.username.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{reviewer.username}</strong>
                    <span>
                      {reviewer.films.toLocaleString()} films, {reviewer.reviews} reviews
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>
    </section>
  )
}

export default PopularReviews