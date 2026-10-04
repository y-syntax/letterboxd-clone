import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './Film.css'
import Navbar from '../components/Navbar'

function Film() {
  const { id: tmdbId } = useParams()

  const [movie, setMovie] = useState(null)
  const [similarMovies, setSimilarMovies] = useState([])
  const [allReviews, setAllReviews] = useState([])

  const [showReviewComposer,setShowReviewComposer]=useState(false)
  const [reviewText,setReviewText]=useState('')
  const [reviewRating,setReviewRating]=useState(0)
  const [reviewLiked,setReviewLiked]=useState(false)
  const [reviewWatched,setReviewWatched]=useState(true)
  const [reviewDate,setReviewDate]=useState(
    new Date().toISOString().split('T')[0]
  )
  const [reviewTags,setReviewTags]=useState('')
  const [reviewSpoiler,setReviewSpoiler]=useState(false)
  const [submittingReview,setSubmittingReview]=useState(false)

  const token = localStorage.getItem('token')

  const fetchReviews = () => {
    fetch(
      `http://localhost:5000/api/interactions/movie/${tmdbId}/reviews`
    )
      .then(res => res.json())
      .then(data => {
        setAllReviews(Array.isArray(data) ? data : [])
      })
      .catch(() => setAllReviews([]))
  }

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&append_to_response=credits`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.status_message || 'Failed to fetch movie'
          )
        }

        setMovie(data)
      } catch (error) {
        console.error('Movie fetch error:', error)
      }
    }

    const fetchSimilarMovies = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/recommendations?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
        )

        const data = await response.json()

        setSimilarMovies(
          Array.isArray(data.results)
            ? data.results.slice(0, 6)
            : []
        )
      } catch (error) {
        console.error('Similar movies error:', error)
        setSimilarMovies([])
      }
    }

    fetchMovie()
    fetchSimilarMovies()
    fetchReviews()
  }, [tmdbId])

  const handleSignIn = () => {
    window.location.href = '/login'
  }

  const openReviewComposer = () => {
    if (!token) {
      alert('Please log in first!')
      return
    }

    setReviewText('')
    setReviewRating(0)
    setReviewLiked(false)
    setReviewWatched(true)
    setShowReviewComposer(true)
  }

  const closeReviewComposer = () => {
    if (submittingReview) {
      return
    }

    setShowReviewComposer(false)
  }

  const submitReview = async event => {
    event.preventDefault()

    if (!token) {
      alert('Please log in first!')
      return
    }

    if (!reviewText.trim()) {
      alert('Please write your review.')
      return
    }

    setSubmittingReview(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/interactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            movieId: tmdbId,
            rating: reviewRating,
            liked: reviewLiked,
            watched: reviewWatched,
            review: reviewText.trim()
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to save review'
        )
      }

      setShowReviewComposer(false)
      setReviewText('')
      setReviewRating(0)
      setReviewLiked(false)
      setReviewWatched(true)

      fetchReviews()
    } catch (error) {
      console.error('Review submission error:', error)
      alert('Could not save your review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleLikeReview = reviewId => {
    if (!token) {
      alert('Please log in to like reviews!')
      return
    }

    fetch(
      `http://localhost:5000/api/interactions/${reviewId}/like`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(() => fetchReviews())
      .catch(console.error)
  }

  const handleReplyReview = reviewId => {
    if (!token) {
      alert('Please log in to reply!')
      return
    }

    const text = prompt('Write a reply:')

    if (!text?.trim()) {
      return
    }

    fetch(
      `http://localhost:5000/api/interactions/${reviewId}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text.trim()
        })
      }
    )
      .then(() => fetchReviews())
      .catch(console.error)
  }

  const director =
    movie?.credits?.crew?.find(
      member => member.job === 'Director'
    )?.name || 'Unknown'

  const cast =
    movie?.credits?.cast?.slice(0, 18) || []

  const writers =
    movie?.credits?.crew
      ?.filter(
        member =>
          member.job === 'Writer' ||
          member.job === 'Screenplay' ||
          member.job === 'Story'
      )
      .slice(0, 10) || []

  const formatCount = count => {
    if (!count && count !== 0) {
      return '0'
    }

    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }

    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }

    return count.toLocaleString()
  }

  if (!movie) {
    return (
      <div className="film-page">
        <Navbar />

        <div className="film-loading">
          <h2>Loading film details...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="film-page">
      <Navbar />

      <section className="film-hero">
        {movie.backdrop_path && (
          <img
            className="film-backdrop"
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt=""
          />
        )}

        <div className="film-hero-overlay"></div>
      </section>

      <main className="film-layout">
        <aside className="film-sidebar">
          <div className="film-poster-wrap">
            {movie.poster_path ? (
              <img
                className="film-poster"
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={`${movie.title} poster`}
              />
            ) : (
              <div className="poster-placeholder"></div>
            )}
          </div>

          <div className="film-stats">
            <span>
              <b className="stat-eye">●</b>
              {formatCount(movie.popularity)}
            </span>

            <span>
              <b className="stat-fan">■</b>
              {formatCount(movie.vote_count)}
            </span>

            <span>
              <b className="stat-like">♥</b>
              {movie.vote_average
                ? movie.vote_average.toFixed(1)
                : '0.0'}
            </span>
          </div>

          <div className="watch-panel">
            <div className="watch-header">
              <span>WHERE TO WATCH</span>

              <button type="button">
                ▶ Trailer
              </button>
            </div>

            <div className="watch-row">
              <span>▶ Google Play</span>
              <small>IN</small>
              <b>BUY</b>
            </div>

            <div className="watch-row">
              <span>▶ Google Play</span>
              <small>US</small>
              <b>RENT</b>
              <b>BUY</b>
            </div>

            <div className="watch-row">
              <span>● Amazon Video</span>
              <small>US</small>
              <b>RENT</b>
              <b>BUY</b>
            </div>

            <div className="watch-row">
              <span>● Netflix</span>
              <small>IN</small>
              <b>PLAY</b>
            </div>

            <div className="watch-more">
              Show 3 more
            </div>
          </div>
        </aside>

        <section className="film-main">
          <header className="film-title-row">
            <h1>{movie.title}</h1>

            <a href="#">
              {movie.release_date?.split('-')[0]}
            </a>

            <span>
              Directed by <strong>{director}</strong>
            </span>
          </header>

          {movie.tagline && (
            <p className="film-tagline">
              {movie.tagline}
            </p>
          )}

          <p className="film-overview">
            {movie.overview}
          </p>

          <div className="film-meta">
            <span>
              {movie.runtime
                ? `${movie.runtime} mins`
                : 'Runtime unavailable'}
            </span>

            <span>More at</span>

            <a
              href={`https://www.imdb.com/title/${movie.imdb_id || ''}`}
              target="_blank"
              rel="noreferrer"
            >
              IMDB
            </a>

            <a
              href={`https://www.themoviedb.org/movie/${movie.id}`}
              target="_blank"
              rel="noreferrer"
            >
              TMDB
            </a>
          </div>

          <div className="film-tabs">
            <button className="active">
              CAST
            </button>

            <button>CREW</button>
            <button>DETAILS</button>
            <button>GENRES</button>
            <button>RELEASES</button>
          </div>

          <div className="people-section">
            <div className="people-tags">
              {cast.map(person => (
                <span key={person.id}>
                  {person.name}
                </span>
              ))}
            </div>
          </div>

          {writers.length > 0 && (
            <div className="writers-section">
              <h3>WRITING</h3>

              <div className="people-tags">
                {writers.map((writer, index) => (
                  <span
                    key={`${writer.id}-${index}`}
                  >
                    {writer.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="genres-section">
            <h3>GENRES</h3>

            <div className="people-tags">
              {movie.genres?.map(genre => (
                <span key={genre.id}>
                  {genre.name}
                </span>
              ))}
            </div>
          </div>

          <section className="reviews-section">
            <div className="section-heading">
              <h2>POPULAR REVIEWS</h2>
              <button>MORE</button>
            </div>

            {allReviews.slice(0, 3).map(review => (
              <article
                className="review-item"
                key={review._id}
              >
                <div className="review-avatar">
                  {(review.username || 'A')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="review-body">
                  <div className="review-top">
                    <span>
                      Review by{' '}
                      <strong>
                        {review.username ||
                          'Anonymous'}
                      </strong>
                    </span>

                    <span className="review-stars">
                      {review.rating
                        ? `${'★'.repeat(
                            Math.floor(review.rating)
                          )}${review.rating % 1 ? '½' : ''}`
                        : '★★★★★'}
                    </span>

                    <button
                      type="button"
                      className="review-like"
                      onClick={() =>
                        handleLikeReview(
                          review._id
                        )
                      }
                    >
                      ♥
                    </button>

                    <button
                      type="button"
                      className="review-comments"
                      onClick={() =>
                        handleReplyReview(
                          review._id
                        )
                      }
                    >
                      ▰{' '}
                      {review.replies?.length || 0}
                    </button>
                  </div>

                  <p>{review.review}</p>

                  <div className="review-likes">
                    ♥{' '}
                    {review.reviewLikes?.length || 0}{' '}
                    likes
                  </div>
                </div>
              </article>
            ))}

            {allReviews.length === 0 && (
              <p className="no-reviews">
                No reviews yet.
              </p>
            )}
          </section>

          <section className="reviews-section recent">
            <div className="section-heading">
              <h2>RECENT REVIEWS</h2>
              <button>MORE</button>
            </div>

            {allReviews.slice(3, 6).map(review => (
              <article
                className="review-item"
                key={review._id}
              >
                <div className="review-avatar">
                  {(review.username || 'A')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="review-body">
                  <div className="review-top">
                    <span>
                      Review by{' '}
                      <strong>
                        {review.username ||
                          'Anonymous'}
                      </strong>
                    </span>

                    <span className="review-stars">
                      {review.rating
                        ? `${'★'.repeat(
                            Math.floor(review.rating)
                          )}${review.rating % 1 ? '½' : ''}`
                        : '★★★★★'}
                    </span>
                  </div>

                  <p>{review.review}</p>

                  <div className="review-likes">
                    ♥{' '}
                    {review.reviewLikes?.length || 0}{' '}
                    likes
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="similar-section">
            <div className="section-heading">
              <h2>SIMILAR FILMS</h2>
              <button>ALL</button>
            </div>

            {similarMovies.length > 0 ? (
              <div className="similar-grid">
                {similarMovies.map(similar => (
                  <a
                    key={similar.id}
                    className="similar-film"
                    href={`/film/${similar.id}`}
                  >
                    {similar.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${similar.poster_path}`}
                        alt={similar.title}
                      />
                    ) : (
                      <div className="similar-placeholder">
                        No poster
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="similar-placeholder">
                No similar films available.
              </div>
            )}
          </section>
        </section>

        <aside className="film-right">
  {token ? (
    <button
      className="signin-film-btn"
      onClick={openReviewComposer}
    >
      Log, rate or review
    </button>
  ) : (
    <button
      className="signin-film-btn"
      onClick={handleSignIn}
    >
      Sign in to log, rate or review
    </button>
  )}

  <button className="share-film-btn">
    Share
  </button>

          <div className="rating-summary">
            <div className="rating-heading">
              <span>RATINGS</span>

              <span>
                {formatCount(movie.vote_count)} VOTES
              </span>
            </div>

            <div className="rating-content">
              <div className="rating-histogram">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="rating-number">
                <strong>
                  {movie.vote_average
                    ? movie.vote_average.toFixed(1)
                    : '0.0'}
                </strong>

                <div>★★★★★</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {showReviewComposer && (
  <div
    className="review-modal-backdrop"
    onMouseDown={event => {
      if (
        event.target === event.currentTarget &&
        !submittingReview
      ) {
        closeReviewComposer()
      }
    }}
  >
    <div className="review-modal">

      <div className="review-modal-header">
        <h2>I watched...</h2>

        <button
          type="button"
          className="review-modal-close"
          onClick={closeReviewComposer}
          disabled={submittingReview}
        >
          ×
        </button>
      </div>

      <form onSubmit={submitReview}>
        <div className="review-modal-body">

          <div className="review-poster-column">
            {movie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={`${movie.title} poster`}
              />
            )}
          </div>

          <div className="review-form-area">

            <div className="review-film-title">
              {movie.title}
              <span>
                {movie.release_date?.split('-')[0]}
              </span>
            </div>

            <div className="review-date-row">

              <label className="check-option">
                <input
                  type="checkbox"
                  checked={reviewWatched}
                  onChange={event =>
                    setReviewWatched(
                      event.target.checked
                    )
                  }
                />

                <span>
                  Watched on
                </span>
              </label>

              <input
                type="date"
                value={reviewDate}
                onChange={event =>
                  setReviewDate(event.target.value)
                }
                disabled={!reviewWatched}
              />

              <label className="check-option">
                <input
                  type="checkbox"
                  checked={reviewWatched}
                  onChange={event =>
                    setReviewWatched(
                      event.target.checked
                    )
                  }
                />

                <span>
                  I've watched this before
                </span>
              </label>

            </div>

            <textarea
              className="letterboxd-review-input"
              value={reviewText}
              onChange={event =>
                setReviewText(event.target.value)
              }
              placeholder="Add a review..."
              disabled={submittingReview}
            />

            <div className="review-bottom-row">

              <div className="review-tags">
                <div className="review-control-title">
                  Tags
                </div>

                <input
                  value={reviewTags}
                  onChange={event =>
                    setReviewTags(event.target.value)
                  }
                  placeholder="eg. netflix"
                  disabled={submittingReview}
                />

                <span className="tag-hint">
                  Press Tab to complete, Enter to create
                </span>
              </div>

              <div className="review-rating">
                <div className="review-control-title">
                  Rating
                  <span>
                    {reviewRating > 0
                      ? `${reviewRating} out of 5`
                      : ''}
                  </span>
                </div>

                <div className="composer-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={
                        star <= reviewRating
                          ? 'selected'
                          : ''
                      }
                      onClick={() =>
                        setReviewRating(star)
                      }
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="review-like-control">

                <div className="review-control-title">
                  Like
                </div>

                <button
                  type="button"
                  className={
                    reviewLiked ? 'liked' : ''
                  }
                  onClick={() =>
                    setReviewLiked(
                      previous => !previous
                    )
                  }
                >
                  ♥
                </button>

              </div>

            </div>

            <label className="spoiler-control">
              <input
                type="checkbox"
                checked={reviewSpoiler}
                onChange={event =>
                  setReviewSpoiler(
                    event.target.checked
                  )
                }
              />

              Contains spoilers
            </label>

          </div>

        </div>

        <div className="review-modal-footer">

          <button
            type="button"
            className="review-cancel"
            onClick={closeReviewComposer}
            disabled={submittingReview}
          >
            CANCEL
          </button>

          <button
            type="submit"
            className="review-submit"
            disabled={submittingReview}
          >
            {submittingReview
              ? 'SAVING...'
              : 'SAVE'}
          </button>

        </div>
      </form>

    </div>
  </div>
)}
    </div>
  )
}

export default Film