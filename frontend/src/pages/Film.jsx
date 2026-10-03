import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './Film.css'
import Navbar from '../components/Navbar'

function Film() {
  const { id: tmdbId } = useParams()
  const [movie, setMovie] = useState(null)
  const [localMovieId, setLocalMovieId] = useState(null)
  const [interaction, setInteraction] = useState({ liked: false, watchlist: false, watched: false, rating: 0 })
  const [allReviews, setAllReviews] = useState([])
  const token = localStorage.getItem('token')

  const fetchReviews = () => {
    fetch(`http://localhost:5000/api/interactions/movie/${tmdbId}/reviews`)
      .then(res => res.json())
      .then(data => setAllReviews(Array.isArray(data) ? data : []))
      .catch(console.error)
  }

  useEffect(() => {
    // 1. Fetch TMDB data
    fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&append_to_response=credits`)
      .then(res => res.json())
      .then(data => {
        setMovie(data)
        
        // 2. Fetch existing interactions (Watchlist, Liked, etc.) using tmdbId directly!
        if (token) {
          fetch(`http://localhost:5000/api/interactions/${tmdbId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(r => r.json())
          .then(intData => {
            if (intData.userId) { // if interaction document exists
              setInteraction(intData)
            }
          })
          .catch(err => console.error("Error fetching interactions", err))
        }
        
        fetchReviews()
      })
  }, [tmdbId, token])

  const toggleInteraction = (field) => {
    if (!token) return alert("Please log in first to use this feature!");
    
    // Optimistic UI update
    const newValue = !interaction[field];
    setInteraction(prev => ({ ...prev, [field]: newValue }));

    // Send to backend using the tmdbId directly
    fetch('http://localhost:5000/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        movieId: tmdbId, // Using TMDB ID to save space!
        [field]: newValue
      })
    })
  }

  const handleReview = () => {
    if (!token) return alert("Please log in first!");
    const reviewText = prompt("Write your review for " + movie.title + ":");
    if (reviewText) {
      fetch('http://localhost:5000/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ movieId: tmdbId, review: reviewText })
      }).then(() => {
        alert("Review successfully saved to database!");
        fetchReviews();
      });
    }
  }

  const handleLikeReview = (reviewId) => {
    if (!token) return alert("Please log in to like reviews!");
    fetch(`http://localhost:5000/api/interactions/${reviewId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => fetchReviews());
  }

  const handleReplyReview = (reviewId) => {
    if (!token) return alert("Please log in to reply!");
    const text = prompt("Write a reply:");
    if (text) {
      fetch(`http://localhost:5000/api/interactions/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text })
      }).then(() => fetchReviews());
    }
  }

  if (!movie) {
    return (
      <div className="film-page">
        <Navbar />
        <div style={{ color: 'white', padding: '150px 20px', textAlign: 'center' }}>
          <h2>Loading film details...</h2>
        </div>
      </div>
    )
  }

  const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown'

  return (
    <div className="film-page">
      <Navbar />
      
      <div className="film-backdrop">
        {movie.backdrop_path && (
          <img 
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
            alt="Backdrop" 
            className="backdrop-image"
          />
        )}
        <div className="backdrop-gradient"></div>
      </div>
      
      <main className="film-content">
        <div className="film-sidebar">
          <div className="poster-container">
            {movie.poster_path ? (
              <img 
                className="film-poster" 
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                alt="Poster" 
              />
            ) : <div style={{width: '100%', aspectRatio: '2/3', background: '#222'}}></div>}
          </div>
          <div className="film-stats">
            <span className="stat-item"><span className="icon green">👁</span> {movie.popularity ? Math.round(movie.popularity) + 'K' : '10K'}</span>
            <span className="stat-item"><span className="icon orange">♥</span> 83K</span>
            <span className="stat-item"><span className="icon blue">◷</span> 153K</span>
          </div>
          
          <div className="where-to-watch">
            <button className="watch-btn">WHERE TO WATCH</button>
            <button className="trailer-btn">Trailer</button>
          </div>
        </div>

        <div className="film-main-info">
          <div className="film-header">
            <h1 className="film-title">{movie.title}</h1>
            <span className="film-year">{movie.release_date?.split('-')[0]}</span>
            <span className="film-director">Directed by <a href="#">{director}</a></span>
          </div>

          <p className="film-tagline">{movie.tagline}</p>
          <p className="film-description">
            {movie.overview}
          </p>

          <div className="film-reviews">
            <h3 className="section-title">POPULAR REVIEWS</h3>
            {allReviews.map(rev => (
              <div key={rev._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar"></div>
                  <span className="reviewer-name">Review by <strong style={{color: '#fff'}}>{rev.username || 'Anonymous'}</strong></span>
                  <div className="stars">★★★★★</div>
                </div>
                <p className="review-text">{rev.review}</p>
                
                <div className="review-actions">
                  <button className="like-review-btn" onClick={() => handleLikeReview(rev._id)}>
                    ♥ Like review {rev.reviewLikes?.length > 0 ? `${rev.reviewLikes.length} likes` : ''}
                  </button>
                  <button className="reply-review-btn" onClick={() => handleReplyReview(rev._id)}>
                    💬 Reply
                  </button>
                </div>
                
                {rev.replies && rev.replies.length > 0 && (
                  <div className="review-replies">
                    {rev.replies.map((reply, i) => (
                      <div key={i} className="reply-item">
                        <strong style={{color: '#8fa9b5'}}>{reply.username}:</strong> {reply.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {allReviews.length === 0 && <p style={{color: '#678', fontSize: '0.85rem'}}>No reviews yet. Be the first!</p>}
          </div>
        </div>

        <div className="film-actions-panel">
          <div className="action-icons">
            <button className="action-icon-btn" onClick={() => toggleInteraction('watched')}>
              <span className="icon" style={{ color: interaction.watched ? '#00e054' : '', transform: interaction.watched ? 'scale(1.1)' : '' }}>👁</span>
              <span className="label">Watched</span>
            </button>
            <button className="action-icon-btn" onClick={() => toggleInteraction('liked')}>
              <span className="icon" style={{ color: interaction.liked ? '#ff8000' : '', transform: interaction.liked ? 'scale(1.1)' : '' }}>♥</span>
              <span className="label">Liked</span>
            </button>
            <button className="action-icon-btn" onClick={() => toggleInteraction('watchlist')}>
              <span className="icon" style={{ color: interaction.watchlist ? '#40bcf4' : '', transform: interaction.watchlist ? 'scale(1.1)' : '' }}>◷</span>
              <span className="label">Watchlist</span>
            </button>
          </div>
          
          <div className="rating-section">
            <span className="rating-label">Rated</span>
            <div className="stars">
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
              <span className="star">★</span>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="panel-btn">Show your activity</button>
            <button className="panel-btn" onClick={handleReview}>Review or log...</button>
            <button className="panel-btn">Add to lists...</button>
            <button className="panel-btn">Share</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Film
