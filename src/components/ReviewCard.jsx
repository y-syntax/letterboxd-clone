import './ReviewCard.css'

function ReviewCard({ review, movie }) {
  return (
    <article className="review-card">

      <img
        className="review-poster"
        src={movie.poster}
        alt={movie.title}
      />

      <div className="review-content">

        <div className="review-title">
          <h3>{movie.title}</h3>
          <span>{movie.year}</span>
        </div>

        <div className="review-user">
          <div className="user-avatar">
            {review.username.charAt(0).toUpperCase()}
          </div>

          <strong>{review.username}</strong>

          <div className="review-rating">
            {'★'.repeat(Math.floor(review.rating))}
            {review.rating % 1 !== 0 && '½'}
          </div>

          <span className="like-icon">♥</span>
        </div>

        <p>{review.review}</p>

        <div className="review-likes">
          ♥ {review.likes || '1.2K'} likes
        </div>

      </div>

    </article>
  )
}

export default ReviewCard