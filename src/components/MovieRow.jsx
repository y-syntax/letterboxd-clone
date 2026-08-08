import MovieCard from './MovieCard'
import './MovieRow.css'

function MovieRow({ title, movies }) {
  return (
    <section className="movie-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <a href="#">MORE</a>
      </div>

      <div className="movie-row">
        {movies.map(movie => (
          <MovieCard
            key={movie.id}
            movie={movie}
          />
        ))}
      </div>
    </section>
  )
}

export default MovieRow