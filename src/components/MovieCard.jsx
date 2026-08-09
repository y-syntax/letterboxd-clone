import './MovieCard.css'

function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <img
        src={movie.poster}
        alt={movie.title}
        className="movie-poster"
      />

      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p>{movie.year}</p>
        <span>★ {movie.rating}</span>
      </div>
    </div>
  )
}

export default MovieCard