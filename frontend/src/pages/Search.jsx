import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './Search.css'

function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query) {
      setLoading(true)
      // Using TMDB API directly on the frontend for dynamic search
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || [])
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [query])

  return (
    <div className="search-page">
      <Navbar />
      <main className="search-content">
        <h2>Search results for "{query}"</h2>
        
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : (
          <div className="search-grid">
            {results.length > 0 ? results.map(movie => (
              <Link to={`/film/${movie.id}`} key={movie.id} style={{ textDecoration: 'none' }}>
                <div className="search-card">
                  <div className="search-poster">
                    {movie.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} />
                    ) : (
                      <div className="no-poster">No Image</div>
                    )}
                  </div>
                  <div className="search-info">
                    <h3>{movie.title}</h3>
                    <span className="search-year">
                      {movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'}
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <p className="loading-text">No movies found matching that search.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Search
