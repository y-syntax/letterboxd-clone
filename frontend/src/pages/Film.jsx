import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import './Film.css'
import Navbar from '../components/Navbar'

function Film() {
  const { id: tmdbId } = useParams()
  const navigate = useNavigate()
  const currentUserId = localStorage.getItem('userId') || localStorage.getItem('username')

  const [movie, setMovie] = useState(null)
  const [similarMovies, setSimilarMovies] = useState([])
  const [allReviews, setAllReviews] = useState([])
  const [tmdbReviews, setTmdbReviews] = useState([])
  const [popularLimit, setPopularLimit] = useState(3)
  const [recentLimit, setRecentLimit] = useState(3)
  const [showAllSimilar, setShowAllSimilar] = useState(false)
  const [expandedReviewIds, setExpandedReviewIds] = useState(new Set())
  const [tmdbLikedMap, setTmdbLikedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('letterboxd_tmdb_likes') || '{}')
    } catch {
      return {}
    }
  })

  const [showReviewComposer, setShowReviewComposer] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewLiked, setReviewLiked] = useState(false)
  const [reviewWatched, setReviewWatched] = useState(true)
  const [reviewDate, setReviewDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [reviewTags, setReviewTags] = useState('')
  const [reviewSpoiler, setReviewSpoiler] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  
  // Interactive User States
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [userWatched, setUserWatched] = useState(false)
  const [userLiked, setUserLiked] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [activeFilmTab, setActiveFilmTab] = useState('cast')
  
  // Site activity metrics
  const [activityData, setActivityData] = useState({
    watchedCount: 0,
    watchlistCount: 0,
    likedCount: 0,
    reviewsCount: 0
  })

  // Add to lists modal state
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [userLists, setUserLists] = useState([])
  const [loadingUserLists, setLoadingUserLists] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showActivityDetails, setShowActivityDetails] = useState(false)

  // Watch providers & Trailer states
  const [watchProviders, setWatchProviders] = useState([])
  const [showAllProviders, setShowAllProviders] = useState(false)
  const [trailerKey, setTrailerKey] = useState(null)
  const [trailerTitle, setTrailerTitle] = useState('')
  const [showTrailerModal, setShowTrailerModal] = useState(false)

  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username') || 'adhin1234'

  const copyShareLink = () => {
    const link = `https://boxd.it/${tmdbId}`
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const fetchUserInteraction = () => {
    if (!token || !tmdbId) return
    fetch(`http://localhost:5000/api/interactions/${tmdbId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setIsWatchlisted(Boolean(data.watchlist))
          setUserWatched(Boolean(data.watched))
          setUserLiked(Boolean(data.liked))
          setUserRating(data.rating || 0)
        }
      })
      .catch(console.error)
  }

  const fetchActivityStats = () => {
    if (!tmdbId) return
    fetch(`http://localhost:5000/api/interactions/movie/${tmdbId}/activity`)
      .then(res => res.json())
      .then(data => {
        if (data) setActivityData(data)
      })
      .catch(console.error)
  }

  const toggleWatched = async () => {
    if (!token) {
      alert('Please log in to track films you have watched!')
      return
    }
    const nextState = !userWatched
    setUserWatched(nextState)
    setActivityData(prev => ({
      ...prev,
      watchedCount: Math.max(0, (prev?.watchedCount || 0) + (nextState ? 1 : -1))
    }))
    try {
      await fetch('http://localhost:5000/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: tmdbId.toString(),
          watched: nextState
        })
      })
      fetchActivityStats()
    } catch (err) {
      console.error(err)
      setUserWatched(!nextState)
      setActivityData(prev => ({
        ...prev,
        watchedCount: Math.max(0, (prev?.watchedCount || 0) + (nextState ? -1 : 1))
      }))
    }
  }

  const toggleLiked = async () => {
    if (!token) {
      alert('Please log in to like this film!')
      return
    }
    const nextState = !userLiked
    setUserLiked(nextState)
    setActivityData(prev => ({
      ...prev,
      likedCount: Math.max(0, (prev?.likedCount || 0) + (nextState ? 1 : -1))
    }))
    try {
      await fetch('http://localhost:5000/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: tmdbId.toString(),
          liked: nextState
        })
      })
      fetchActivityStats()
    } catch (err) {
      console.error(err)
      setUserLiked(!nextState)
      setActivityData(prev => ({
        ...prev,
        likedCount: Math.max(0, (prev?.likedCount || 0) + (nextState ? -1 : 1))
      }))
    }
  }

  const toggleWatchlist = async () => {
    if (!token) {
      alert('Please sign in to add films to your watchlist!')
      return
    }
    const nextState = !isWatchlisted
    setIsWatchlisted(nextState)
    setActivityData(prev => ({
      ...prev,
      watchlistCount: Math.max(0, (prev?.watchlistCount || 0) + (nextState ? 1 : -1))
    }))
    try {
      await fetch('http://localhost:5000/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: tmdbId.toString(),
          watchlist: nextState
        })
      })
      fetchActivityStats()
    } catch (err) {
      console.error(err)
      setIsWatchlisted(!nextState)
      setActivityData(prev => ({
        ...prev,
        watchlistCount: Math.max(0, (prev?.watchlistCount || 0) + (nextState ? -1 : 1))
      }))
    }
  }

  const handleRate = async (stars) => {
    if (!token) {
      alert('Please log in to rate this film!')
      return
    }
    const newRating = userRating === stars ? 0 : stars
    setUserRating(newRating)
    if (newRating > 0 && !userWatched) {
      setUserWatched(true)
      setActivityData(prev => ({
        ...prev,
        watchedCount: (prev?.watchedCount || 0) + 1
      }))
    }
    try {
      await fetch('http://localhost:5000/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: tmdbId.toString(),
          rating: newRating,
          watched: newRating > 0 ? true : userWatched
        })
      })
      fetchActivityStats()
    } catch (err) {
      console.error(err)
    }
  }

  const openAddToListModal = async () => {
    if (!token) {
      alert('Please log in to add films to your lists!')
      return
    }
    setShowAddToListModal(true)
    setLoadingUserLists(true)
    try {
      const res = await fetch(`http://localhost:5000/api/lists/user/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUserLists(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUserLists(false)
    }
  }

  const toggleFilmInList = async (listId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/lists/${listId}/add-film`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          movieId: tmdbId.toString(),
          title: movie?.title || 'Film',
          posterPath: movie?.poster_path || '',
          releaseYear: movie?.release_date?.split('-')[0] || ''
        })
      })
      const data = await res.json()
      if (res.ok) {
        setUserLists(prev => prev.map(l => l._id === listId ? data.list : l))
      }
    } catch (err) {
      console.error(err)
    }
  }

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

  const handleOpenTrailer = () => {
    if (trailerKey) {
      setShowTrailerModal(true)
    } else if (movie?.title) {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' official trailer')}`,
        '_blank'
      )
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowTrailerModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&append_to_response=credits,release_dates,keywords,videos,watch/providers`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.status_message || 'Failed to fetch movie'
          )
        }

        setMovie(data)

        // 1. Extract Official Trailer / Teaser video
        const videos = data.videos?.results || []
        const officialTrailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
        const anyTrailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
        const teaser = videos.find(v => v.site === 'YouTube' && v.type === 'Teaser')
        const anyYouTube = videos.find(v => v.site === 'YouTube')
        const chosenVideo = officialTrailer || anyTrailer || teaser || anyYouTube
        if (chosenVideo) {
          setTrailerKey(chosenVideo.key)
          setTrailerTitle(chosenVideo.name || `${data.title} Trailer`)
        } else {
          setTrailerKey(null)
          setTrailerTitle(`${data.title} Trailer`)
        }

        // 2. Extract Watch Providers
        const wpResults = data['watch/providers']?.results || {}
        const extracted = []
        const seen = new Set()

        const addFromCountry = (code) => {
          const cData = wpResults[code]
          if (!cData) return
          const link = cData.link || `https://www.themoviedb.org/movie/${data.id}/watch?locale=${code}`

          // Flatrate (Streaming / Subscription)
          if (Array.isArray(cData.flatrate)) {
            cData.flatrate.forEach(p => {
              const key = `${p.provider_name}-${code}-PLAY`
              if (!seen.has(key)) {
                seen.add(key)
                extracted.push({
                  id: p.provider_id,
                  name: p.provider_name,
                  country: code,
                  badges: ['PLAY'],
                  icon: '●',
                  link
                })
              }
            })
          }

          // Rent & Buy
          const rentMap = new Map((cData.rent || []).map(p => [p.provider_name, p]))
          const buyMap = new Map((cData.buy || []).map(p => [p.provider_name, p]))
          const allNames = Array.from(new Set([...rentMap.keys(), ...buyMap.keys()]))

          allNames.forEach(name => {
            const hasRent = rentMap.has(name)
            const hasBuy = buyMap.has(name)
            const key = `${name}-${code}-RENTBUY`
            if (!seen.has(key)) {
              seen.add(key)
              extracted.push({
                id: (rentMap.get(name) || buyMap.get(name))?.provider_id,
                name,
                country: code,
                badges: [hasRent && 'RENT', hasBuy && 'BUY'].filter(Boolean),
                icon: '▶',
                link
              })
            }
          })
        }

        // Priority regions
        addFromCountry('IN')
        addFromCountry('US')
        if (extracted.length < 5) {
          ['GB', 'CA', 'AU'].forEach(addFromCountry)
        }

        // Fallback popular platforms if empty
        if (extracted.length === 0) {
          const searchTitle = encodeURIComponent(data.title || '')
          extracted.push(
            { name: 'Google Play', country: 'IN', badges: ['BUY'], icon: '▶', link: `https://play.google.com/store/search?q=${searchTitle}&c=movies` },
            { name: 'Google Play', country: 'US', badges: ['RENT', 'BUY'], icon: '▶', link: `https://play.google.com/store/search?q=${searchTitle}&c=movies` },
            { name: 'Amazon Video', country: 'US', badges: ['RENT', 'BUY'], icon: '●', link: `https://www.amazon.com/s?k=${searchTitle}&i=instant-video` },
            { name: 'Netflix', country: 'IN', badges: ['PLAY'], icon: '●', link: `https://www.netflix.com/search?q=${searchTitle}` },
            { name: 'Apple TV', country: 'US', badges: ['RENT', 'BUY'], icon: '▶', link: `https://tv.apple.com/search?term=${searchTitle}` },
            { name: 'YouTube Movies', country: 'IN', badges: ['BUY'], icon: '▶', link: `https://www.youtube.com/results?search_query=${searchTitle}+movie` },
            { name: 'Disney+ Hotstar', country: 'IN', badges: ['PLAY'], icon: '●', link: `https://www.hotstar.com/search?q=${searchTitle}` }
          )
        }

        setWatchProviders(extracted)
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
        let results = Array.isArray(data.results)
          ? data.results.filter(m => m.poster_path)
          : []

        // If recommendations has few results, supplement with similar movies
        if (results.length < 12) {
          try {
            const simRes = await fetch(
              `https://api.themoviedb.org/3/movie/${tmdbId}/similar?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
            )
            const simData = await simRes.json()
            if (Array.isArray(simData.results)) {
              const combined = [...results, ...simData.results.filter(m => m.poster_path)]
              const map = new Map()
              combined.forEach(m => {
                if (!map.has(m.id) && String(m.id) !== String(tmdbId)) {
                  map.set(m.id, m)
                }
              })
              results = Array.from(map.values())
            }
          } catch (simErr) {
            console.error('Similar fallback error:', simErr)
          }
        }

        setSimilarMovies(results)
      } catch (error) {
        console.error('Similar movies error:', error)
        setSimilarMovies([])
      }
    }

    const fetchTmdbReviews = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/reviews?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
        )
        const data = await response.json()
        if (Array.isArray(data.results)) {
          const formatted = data.results.map(r => ({
            _id: `tmdb_${r.id}`,
            username: r.author_details?.username || r.author || 'Critic',
            rating: r.author_details?.rating ? Math.max(1, Math.min(5, Math.round(r.author_details.rating / 2))) : 4,
            review: r.content,
            liked: (r.author_details?.rating || 8) >= 8,
            reviewLikes: [],
            replies: [],
            createdAt: r.created_at || new Date().toISOString(),
            isTmdb: true
          }))
          setTmdbReviews(formatted)
        }
      } catch (error) {
        console.error('TMDB reviews error:', error)
      }
    }

    // Reset pagination limits when film changes
    setPopularLimit(3)
    setRecentLimit(3)
    setShowAllSimilar(false)

    fetchMovie()
    fetchSimilarMovies()
    fetchTmdbReviews()
    fetchReviews()
    fetchUserInteraction()
    fetchActivityStats()
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

    if (String(reviewId).startsWith('tmdb_')) {
      setTmdbLikedMap(prev => {
        const next = { ...prev, [reviewId]: !prev[reviewId] }
        try {
          localStorage.setItem('letterboxd_tmdb_likes', JSON.stringify(next))
        } catch (e) {}
        return next
      })
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

  const handleReplyReview = (review) => {
    if (review.isTmdb) {
      openReviewComposer()
      return
    }
    navigate(`/${review.username || 'anonymous'}/film/${tmdbId}#comments`)
  }

  const toggleReviewExpand = (reviewId) => {
    setExpandedReviewIds(prev => {
      const next = new Set(prev)
      if (next.has(reviewId)) {
        next.delete(reviewId)
      } else {
        next.add(reviewId)
      }
      return next
    })
  }

  // Combine MongoDB reviews with TMDB critic reviews (MongoDB reviews prioritized)
  const combinedReviews = useMemo(() => {
    const list = [...allReviews]
    if (Array.isArray(tmdbReviews)) {
      tmdbReviews.forEach(tr => {
        if (!list.some(r => r._id === tr._id)) {
          list.push(tr)
        }
      })
    }
    return list
  }, [allReviews, tmdbReviews])

  // Popular reviews: sorted by likes, comments, then recency; local reviews prioritized
  const popularReviews = useMemo(() => {
    return [...combinedReviews]
      .filter(r => r.review && r.review.trim().length > 0)
      .sort((a, b) => {
        const likesA = (a.reviewLikes?.length || 0) + (tmdbLikedMap[a._id] ? 1 : 0)
        const likesB = (b.reviewLikes?.length || 0) + (tmdbLikedMap[b._id] ? 1 : 0)
        if (likesB !== likesA) return likesB - likesA
        const repliesA = a.replies?.length || 0
        const repliesB = b.replies?.length || 0
        if (repliesB !== repliesA) return repliesB - repliesA
        if (!a.isTmdb && b.isTmdb) return -1
        if (a.isTmdb && !b.isTmdb) return 1
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
  }, [combinedReviews, tmdbLikedMap])

  // Recent reviews: sorted strictly by recency (createdAt desc)
  const recentReviews = useMemo(() => {
    return [...combinedReviews]
      .filter(r => r.review && r.review.trim().length > 0)
      .sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
  }, [combinedReviews])

  const visibleSimilar = showAllSimilar ? similarMovies : similarMovies.slice(0, 6)

  const director =
    movie?.credits?.crew?.find(
      member => member.job === 'Director'
    )?.name || 'Unknown'

  const cast =
    movie?.credits?.cast?.slice(0, 30) || []

  const writers =
    movie?.credits?.crew
      ?.filter(
        member =>
          member.job === 'Writer' ||
          member.job === 'Screenplay' ||
          member.job === 'Story' ||
          member.job === 'Characters'
      )
      .slice(0, 10) || []

  const allCrew = movie?.credits?.crew || []

  // Group crew by specific jobs and departments
  const getCrewByJobs = (jobs, departments = []) => {
    const seen = new Set()
    return allCrew.filter(member => {
      const matchJob = jobs.some(j => (member.job || '').toLowerCase() === j.toLowerCase())
      const matchDept = departments.some(d => (member.department || '').toLowerCase() === d.toLowerCase())
      if ((matchJob || matchDept) && !seen.has(`${member.name}-${member.job}`)) {
        seen.add(`${member.name}-${member.job}`)
        return true
      }
      return false
    })
  }

  const directors = getCrewByJobs(['Director', 'Co-Director'])
  const producers = getCrewByJobs(['Producer', 'Executive Producer', 'Co-Producer', 'Line Producer'])
  const crewWriters = getCrewByJobs(['Screenplay', 'Writer', 'Story', 'Characters', 'Comic Book', 'Author', 'Novel'])
  const cinematographers = getCrewByJobs(['Director of Photography', 'Cinematographer', 'Camera Operator'])
  const editors = getCrewByJobs(['Editor', 'Film Editor', 'Supervising Editor', 'Additional Editor'])
  const composers = getCrewByJobs(['Original Music Composer', 'Music', 'Composer', 'Music Supervisor'])
  const productionDesigners = getCrewByJobs(['Production Design', 'Art Direction', 'Set Decoration', 'Supervising Art Director'])
  const costumeMakeup = getCrewByJobs(['Costume Design', 'Costume Designer', 'Makeup Department Head', 'Hair Designer', 'Key Makeup Artist'])
  const soundCrew = getCrewByJobs(['Sound Designer', 'Supervising Sound Editor', 'Sound Re-Recording Mixer', 'Original Sound Track', 'Sound Mixer'])
  const vfxCrew = getCrewByJobs(['Visual Effects Supervisor', 'VFX Supervisor', 'Visual Effects Producer', 'VFX Artist'])
  const stuntCrew = getCrewByJobs(['Stunt Coordinator', 'Fight Choreographer', 'Stunts'])

  const crewSections = [
    { title: 'DIRECTOR', members: directors },
    { title: 'PRODUCERS', members: producers },
    { title: 'WRITERS', members: crewWriters },
    { title: 'CINEMATOGRAPHY', members: cinematographers },
    { title: 'EDITING', members: editors },
    { title: 'ORIGINAL MUSIC', members: composers },
    { title: 'PRODUCTION DESIGN', members: productionDesigners },
    { title: 'COSTUME & MAKEUP', members: costumeMakeup },
    { title: 'SOUND', members: soundCrew },
    { title: 'VISUAL EFFECTS', members: vfxCrew },
    { title: 'STUNTS', members: stuntCrew }
  ]

  // Parse Release Dates from TMDB
  const releaseTypeNames = {
    1: 'Premiere',
    2: 'Theatrical (limited)',
    3: 'Theatrical',
    4: 'Digital',
    5: 'Physical',
    6: 'TV'
  }

  const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

  const releaseItems = []
  if (movie?.release_dates?.results) {
    movie.release_dates.results.forEach(country => {
      const countryCode = country.iso_3166_1
      let countryName = countryCode
      try {
        if (regionNames) countryName = regionNames.of(countryCode) || countryCode
      } catch (e) {
        countryName = countryCode
      }

      (country.release_dates || []).forEach(rd => {
        releaseItems.push({
          countryCode,
          countryName,
          date: rd.release_date,
          formattedDate: rd.release_date
            ? new Date(rd.release_date).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : '—',
          typeName: releaseTypeNames[rd.type] || 'Release',
          certification: rd.certification || '',
          note: rd.note || ''
        })
      })
    })

    releaseItems.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

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

  const getWatchedCount = () => {
    return activityData?.watchedCount || 0
  }

  const getWatchlistCount = () => {
    return activityData?.watchlistCount || 0
  }

  const getLikesCount = () => {
    return activityData?.likedCount || 0
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
            <span title={`${getWatchedCount().toLocaleString()} members watched this`}>
              <b className="stat-eye">👁</b>
              {formatCount(getWatchedCount())}
            </span>

            <span title={`${getWatchlistCount().toLocaleString()} members in watchlist`}>
              <b className="stat-fan">◷</b>
              {formatCount(getWatchlistCount())}
            </span>

            <span title={`${getLikesCount().toLocaleString()} members liked this`}>
              <b className="stat-like">♥</b>
              {formatCount(getLikesCount())}
            </span>
          </div>

          <div className="watch-panel">
            <div className="watch-header">
              <span>WHERE TO WATCH</span>

              <button 
                type="button" 
                className="trailer-watch-btn"
                onClick={handleOpenTrailer}
                title={trailerKey ? "Watch Official Trailer" : "Search Trailer on YouTube"}
              >
                ▶ Trailer
              </button>
            </div>

            <div className="watch-list-rows">
              {(showAllProviders ? watchProviders : watchProviders.slice(0, 4)).map((item, idx) => (
                <a
                  key={`${item.name}-${item.country}-${idx}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="watch-row"
                  title={`Watch on ${item.name} (${item.country})`}
                >
                  <span className="watch-provider-name">
                    <span className="provider-icon">{item.icon || '▶'}</span> {item.name}
                  </span>
                  <small className="watch-country-code">{item.country}</small>
                  {item.badges.map(b => (
                    <b key={b} className={`watch-badge ${b.toLowerCase()}`}>{b}</b>
                  ))}
                </a>
              ))}
            </div>

            {watchProviders.length > 4 && (
              <button 
                type="button"
                className="watch-more-btn"
                onClick={() => setShowAllProviders(!showAllProviders)}
              >
                {showAllProviders ? 'Show less ▴' : `Show ${watchProviders.length - 4} more ▾`}
              </button>
            )}
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
            <button
              type="button"
              className={activeFilmTab === 'cast' ? 'active' : ''}
              onClick={() => setActiveFilmTab('cast')}
            >
              CAST
            </button>

            <button
              type="button"
              className={activeFilmTab === 'crew' ? 'active' : ''}
              onClick={() => setActiveFilmTab('crew')}
            >
              CREW
            </button>

            <button
              type="button"
              className={activeFilmTab === 'details' ? 'active' : ''}
              onClick={() => setActiveFilmTab('details')}
            >
              DETAILS
            </button>

            <button
              type="button"
              className={activeFilmTab === 'genres' ? 'active' : ''}
              onClick={() => setActiveFilmTab('genres')}
            >
              GENRES
            </button>

            <button
              type="button"
              className={activeFilmTab === 'releases' ? 'active' : ''}
              onClick={() => setActiveFilmTab('releases')}
            >
              RELEASES
            </button>
          </div>

          {/* TAB: CAST */}
          {activeFilmTab === 'cast' && (
            <div className="tab-pane-cast">
              <div className="people-section">
                <div className="people-tags">
                  {cast.map(person => (
                    <span
                      key={person.id}
                      className="person-tag"
                      title={person.character ? `as ${person.character}` : person.name}
                    >
                      <span className="person-name">{person.name}</span>
                      {person.character && (
                        <span className="person-character"> as {person.character}</span>
                      )}
                    </span>
                  ))}
                  {cast.length === 0 && (
                    <p className="tab-empty-msg">No cast information available.</p>
                  )}
                </div>
              </div>

              {writers.length > 0 && (
                <div className="writers-section">
                  <h3>WRITING</h3>
                  <div className="people-tags">
                    {writers.map((writer, index) => (
                      <span key={`${writer.id}-${index}`} className="person-tag">
                        {writer.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: CREW */}
          {activeFilmTab === 'crew' && (
            <div className="tab-pane-crew">
              {crewSections
                .filter(section => section.members.length > 0)
                .map(section => (
                  <div key={section.title} className="crew-group-section">
                    <h3>{section.title}</h3>
                    <div className="people-tags">
                      {section.members.map((member, idx) => (
                        <span key={`${member.id}-${member.job}-${idx}`} className="person-tag">
                          <span className="person-name">{member.name}</span>
                          {member.job && <span className="person-job"> ({member.job})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              {allCrew.length === 0 && (
                <p className="tab-empty-msg">No crew information available.</p>
              )}
            </div>
          )}

          {/* TAB: DETAILS */}
          {activeFilmTab === 'details' && (
            <div className="tab-pane-details">
              {movie.production_companies && movie.production_companies.length > 0 && (
                <div className="details-section">
                  <h3>STUDIOS</h3>
                  <div className="people-tags">
                    {movie.production_companies.map(company => (
                      <span key={company.id} className="detail-tag">
                        {company.name}
                        {company.origin_country ? ` (${company.origin_country})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {movie.production_countries && movie.production_countries.length > 0 && (
                <div className="details-section">
                  <h3>COUNTRY</h3>
                  <div className="people-tags">
                    {movie.production_countries.map(country => (
                      <span key={country.iso_3166_1} className="detail-tag">
                        {country.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {movie.spoken_languages && movie.spoken_languages.length > 0 && (
                <div className="details-section">
                  <h3>PRIMARY LANGUAGE</h3>
                  <div className="people-tags">
                    {movie.spoken_languages.map(lang => (
                      <span key={lang.iso_639_1} className="detail-tag">
                        {lang.english_name || lang.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="details-section">
                <h3>ADDITIONAL DETAILS</h3>
                <div className="details-keyval-list">
                  {movie.original_title && (
                    <div className="keyval-row">
                      <span className="keyval-label">Original Title</span>
                      <span className="keyval-value">{movie.original_title}</span>
                    </div>
                  )}
                  {movie.tagline && (
                    <div className="keyval-row">
                      <span className="keyval-label">Tagline</span>
                      <span className="keyval-value">“{movie.tagline}”</span>
                    </div>
                  )}
                  {movie.status && (
                    <div className="keyval-row">
                      <span className="keyval-label">Status</span>
                      <span className="keyval-value">{movie.status}</span>
                    </div>
                  )}
                  {movie.release_date && (
                    <div className="keyval-row">
                      <span className="keyval-label">Release Date</span>
                      <span className="keyval-value">
                        {new Date(movie.release_date).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {movie.runtime > 0 && (
                    <div className="keyval-row">
                      <span className="keyval-label">Runtime</span>
                      <span className="keyval-value">{movie.runtime} mins</span>
                    </div>
                  )}
                  {movie.budget > 0 && (
                    <div className="keyval-row">
                      <span className="keyval-label">Budget</span>
                      <span className="keyval-value">${movie.budget.toLocaleString()}</span>
                    </div>
                  )}
                  {movie.revenue > 0 && (
                    <div className="keyval-row">
                      <span className="keyval-label">Box Office</span>
                      <span className="keyval-value">${movie.revenue.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: GENRES */}
          {activeFilmTab === 'genres' && (
            <div className="tab-pane-genres">
              {movie.genres && movie.genres.length > 0 && (
                <div className="genres-section">
                  <h3>GENRES</h3>
                  <div className="people-tags">
                    {movie.genres.map(genre => (
                      <span key={genre.id} className="genre-tag">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {movie.keywords?.keywords && movie.keywords.keywords.length > 0 && (
                <div className="keywords-section">
                  <h3>THEMES & TOPICS</h3>
                  <div className="people-tags">
                    {movie.keywords.keywords.map(kw => (
                      <span key={kw.id} className="keyword-tag">
                        {kw.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!movie.genres?.length && !movie.keywords?.keywords?.length && (
                <p className="tab-empty-msg">No genre or theme information available.</p>
              )}
            </div>
          )}

          {/* TAB: RELEASES */}
          {activeFilmTab === 'releases' && (
            <div className="tab-pane-releases">
              <div className="releases-section">
                <h3>RELEASES</h3>
                {releaseItems.length > 0 ? (
                  <div className="releases-table-wrap">
                    <table className="releases-table">
                      <thead>
                        <tr>
                          <th>COUNTRY</th>
                          <th>DATE</th>
                          <th>TYPE</th>
                          <th>RATING</th>
                          <th>NOTE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {releaseItems.map((rel, idx) => (
                          <tr key={`${rel.countryCode}-${rel.date}-${idx}`}>
                            <td className="release-country">
                              <strong>{rel.countryName}</strong>
                              <span className="country-code"> ({rel.countryCode})</span>
                            </td>
                            <td className="release-date">{rel.formattedDate}</td>
                            <td className="release-type">
                              <span className="type-badge">{rel.typeName}</span>
                            </td>
                            <td className="release-cert">
                              {rel.certification ? (
                                <span className="cert-badge">{rel.certification}</span>
                              ) : (
                                <span className="cert-none">—</span>
                              )}
                            </td>
                            <td className="release-note">{rel.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="tab-empty-msg">No release information available for this title.</p>
                )}
              </div>
            </div>
          )}

          <section className="reviews-section">
            <div className="section-heading">
              <h2>POPULAR REVIEWS</h2>
              {popularReviews.length > 3 ? (
                <button
                  type="button"
                  className="section-action-btn"
                  onClick={() => {
                    if (popularLimit >= popularReviews.length) {
                      setPopularLimit(3)
                    } else {
                      setPopularLimit(prev => Math.min(prev + 6, popularReviews.length))
                    }
                  }}
                  title={popularLimit >= popularReviews.length ? 'Show fewer reviews' : 'Show more popular reviews'}
                >
                  {popularLimit >= popularReviews.length ? 'LESS' : 'MORE'}
                </button>
              ) : (
                popularReviews.length > 0 && (
                  <button
                    type="button"
                    className="section-action-btn"
                    onClick={() => {
                      if (popularLimit >= popularReviews.length) {
                        setPopularLimit(3)
                      } else {
                        setPopularLimit(popularReviews.length)
                      }
                    }}
                  >
                    {popularLimit >= popularReviews.length ? 'LESS' : 'MORE'}
                  </button>
                )
              )}
            </div>

            {popularReviews.slice(0, popularLimit).map(review => {
              const isLiked = review.isTmdb
                ? Boolean(tmdbLikedMap[review._id])
                : review.reviewLikes?.includes(currentUserId)
              const likesCount = (review.reviewLikes?.length || 0) + (review.isTmdb && tmdbLikedMap[review._id] ? 1 : 0)

              return (
                <article
                  className="review-item"
                  key={review._id}
                >
                  {review.isTmdb ? (
                    <div className="review-avatar tmdb-avatar" title={`TMDB reviewer: ${review.username}`}>
                      {(review.username || 'C').charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <Link
                      to={`/${review.username || 'anonymous'}`}
                      className="review-avatar"
                      title={review.username}
                    >
                      {(review.username || 'A').charAt(0).toUpperCase()}
                    </Link>
                  )}

                  <div className="review-body">
                    <div className="review-top">
                      <span className="review-by-author">
                        Review by{' '}
                        {review.isTmdb ? (
                          <span className="review-author-name tmdb-author">
                            {review.username} <span className="tmdb-badge">TMDB</span>
                          </span>
                        ) : (
                          <Link to={`/${review.username || 'anonymous'}`} className="review-author-name">
                            {review.username || 'Anonymous'}
                          </Link>
                        )}
                      </span>

                      <span className="review-stars">
                        {review.rating
                          ? `${'★'.repeat(Math.floor(review.rating))}${review.rating % 1 ? '½' : ''}`
                          : '★★★★★'}
                      </span>

                      {review.liked && (
                        <span className="review-orange-heart" title="Liked this film">♥</span>
                      )}

                      <span
                        className="review-comments-badge"
                        onClick={() => handleReplyReview(review)}
                        title={review.isTmdb ? 'Write a review/comment' : 'View discussion & comments'}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="comment-icon">💬</span> {review.replies?.length || 0}
                      </span>
                    </div>

                    <p
                      className="review-text-clickable"
                      onClick={() => {
                        if (review.isTmdb) {
                          toggleReviewExpand(review._id)
                        } else {
                          navigate(`/${review.username || 'anonymous'}/film/${tmdbId}`)
                        }
                      }}
                      title={review.isTmdb ? 'Click to expand/collapse full review' : 'Click to view full review and comments'}
                    >
                      {review.review.length > 280 && !expandedReviewIds.has(review._id) ? (
                        <>
                          {review.review.slice(0, 280)}...{' '}
                          <span className="review-more-link">more</span>
                        </>
                      ) : (
                        <>
                          {review.review}
                          {review.review.length > 280 && (
                            <> <span className="review-more-link">less</span></>
                          )}
                        </>
                      )}
                    </p>

                    <div className="review-bottom-actions">
                      <button
                        type="button"
                        className={`review-like-action-btn ${isLiked ? 'liked' : ''}`}
                        onClick={() => handleLikeReview(review._id)}
                      >
                        <span className="heart-icon">♥</span>{' '}
                        {isLiked ? 'Liked' : 'Like review'}
                      </button>
                      <span className="review-likes-count">
                        {likesCount.toLocaleString()}{' '}
                        {likesCount === 1 ? 'like' : 'likes'}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}

            {popularReviews.length === 0 && (
              <p className="no-reviews">
                No reviews yet. Be the first to review this movie!
              </p>
            )}
          </section>

          <section className="reviews-section recent">
            <div className="section-heading">
              <h2>RECENT REVIEWS</h2>
              {recentReviews.length > 3 ? (
                <button
                  type="button"
                  className="section-action-btn"
                  onClick={() => {
                    if (recentLimit >= recentReviews.length) {
                      setRecentLimit(3)
                    } else {
                      setRecentLimit(prev => Math.min(prev + 6, recentReviews.length))
                    }
                  }}
                  title={recentLimit >= recentReviews.length ? 'Show fewer reviews' : 'Show more recent reviews'}
                >
                  {recentLimit >= recentReviews.length ? 'LESS' : 'MORE'}
                </button>
              ) : (
                recentReviews.length > 0 && (
                  <button
                    type="button"
                    className="section-action-btn"
                    onClick={() => {
                      if (recentLimit >= recentReviews.length) {
                        setRecentLimit(3)
                      } else {
                        setRecentLimit(recentReviews.length)
                      }
                    }}
                  >
                    {recentLimit >= recentReviews.length ? 'LESS' : 'MORE'}
                  </button>
                )
              )}
            </div>

            {recentReviews.slice(0, recentLimit).map(review => {
              const isLiked = review.isTmdb
                ? Boolean(tmdbLikedMap[review._id])
                : review.reviewLikes?.includes(currentUserId)
              const likesCount = (review.reviewLikes?.length || 0) + (review.isTmdb && tmdbLikedMap[review._id] ? 1 : 0)

              return (
                <article
                  className="review-item"
                  key={review._id}
                >
                  {review.isTmdb ? (
                    <div className="review-avatar tmdb-avatar" title={`TMDB reviewer: ${review.username}`}>
                      {(review.username || 'C').charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <Link
                      to={`/${review.username || 'anonymous'}`}
                      className="review-avatar"
                      title={review.username}
                    >
                      {(review.username || 'A').charAt(0).toUpperCase()}
                    </Link>
                  )}

                  <div className="review-body">
                    <div className="review-top">
                      <span className="review-by-author">
                        Review by{' '}
                        {review.isTmdb ? (
                          <span className="review-author-name tmdb-author">
                            {review.username} <span className="tmdb-badge">TMDB</span>
                          </span>
                        ) : (
                          <Link to={`/${review.username || 'anonymous'}`} className="review-author-name">
                            {review.username || 'Anonymous'}
                          </Link>
                        )}
                      </span>

                      <span className="review-stars">
                        {review.rating
                          ? `${'★'.repeat(Math.floor(review.rating))}${review.rating % 1 ? '½' : ''}`
                          : '★★★★★'}
                      </span>

                      {review.liked && (
                        <span className="review-orange-heart" title="Liked this film">♥</span>
                      )}

                      <span
                        className="review-comments-badge"
                        onClick={() => handleReplyReview(review)}
                        title={review.isTmdb ? 'Write a review/comment' : 'View discussion & comments'}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="comment-icon">💬</span> {review.replies?.length || 0}
                      </span>
                    </div>

                    <p
                      className="review-text-clickable"
                      onClick={() => {
                        if (review.isTmdb) {
                          toggleReviewExpand(review._id)
                        } else {
                          navigate(`/${review.username || 'anonymous'}/film/${tmdbId}`)
                        }
                      }}
                      title={review.isTmdb ? 'Click to expand/collapse full review' : 'Click to view full review and comments'}
                    >
                      {review.review.length > 280 && !expandedReviewIds.has(review._id) ? (
                        <>
                          {review.review.slice(0, 280)}...{' '}
                          <span className="review-more-link">more</span>
                        </>
                      ) : (
                        <>
                          {review.review}
                          {review.review.length > 280 && (
                            <> <span className="review-more-link">less</span></>
                          )}
                        </>
                      )}
                    </p>

                    <div className="review-bottom-actions">
                      <button
                        type="button"
                        className={`review-like-action-btn ${isLiked ? 'liked' : ''}`}
                        onClick={() => handleLikeReview(review._id)}
                      >
                        <span className="heart-icon">♥</span>{' '}
                        {isLiked ? 'Liked' : 'Like review'}
                      </button>
                      <span className="review-likes-count">
                        {likesCount.toLocaleString()}{' '}
                        {likesCount === 1 ? 'like' : 'likes'}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}

            {recentReviews.length === 0 && (
              <p className="no-reviews">
                No recent reviews yet.
              </p>
            )}
          </section>

          <section className="similar-section">
            <div className="section-heading">
              <h2>SIMILAR FILMS</h2>
              {similarMovies.length > 6 ? (
                <button
                  type="button"
                  className="section-action-btn"
                  onClick={() => setShowAllSimilar(prev => !prev)}
                  title={showAllSimilar ? 'Show fewer similar films' : `Show all ${similarMovies.length} similar films`}
                >
                  {showAllSimilar ? 'LESS' : 'ALL'}
                </button>
              ) : (
                similarMovies.length > 0 && (
                  <button
                    type="button"
                    className="section-action-btn"
                    onClick={() => setShowAllSimilar(prev => !prev)}
                  >
                    {showAllSimilar ? 'LESS' : 'ALL'}
                  </button>
                )
              )}
            </div>

            {visibleSimilar.length > 0 ? (
              <div className="similar-grid">
                {visibleSimilar.map(similar => (
                  <Link
                    key={similar.id}
                    className="similar-film"
                    to={`/film/${similar.id}`}
                    title={similar.title}
                  >
                    {similar.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${similar.poster_path}`}
                        alt={similar.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="similar-placeholder">
                        {similar.title}
                      </div>
                    )}
                  </Link>
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
          <div className="film-action-panel">
            {/* Row 1: 3-column action: Watch | Like | Watchlist */}
            <div className="action-quad-row">
              <button
                type="button"
                className={`action-quad-btn watch-btn ${userWatched ? 'active' : ''}`}
                onClick={token ? toggleWatched : handleSignIn}
                title={userWatched ? 'Marked as watched' : 'Mark as watched'}
              >
                <span className="action-quad-icon">👁</span>
                <span className="action-quad-label">{userWatched ? 'Watched' : 'Watch'}</span>
              </button>

              <button
                type="button"
                className={`action-quad-btn like-btn ${userLiked ? 'active' : ''}`}
                onClick={token ? toggleLiked : handleSignIn}
                title={userLiked ? 'You like this film' : 'Like'}
              >
                <span className="action-quad-icon">♥</span>
                <span className="action-quad-label">{userLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                type="button"
                className={`action-quad-btn watchlist-btn ${isWatchlisted ? 'active' : ''}`}
                onClick={token ? toggleWatchlist : handleSignIn}
                title={isWatchlisted ? 'In watchlist' : 'Add to watchlist'}
              >
                <span className="action-quad-icon">◷</span>
                <span className="action-quad-label">{isWatchlisted ? 'Watchlist' : 'Watchlist'}</span>
              </button>
            </div>

            {/* Row 2: Rate */}
            <div className="action-panel-rate">
              <div className="rate-heading">
                <span>Rate</span>
                {userRating > 0 && (
                  <button 
                    type="button" 
                    className="clear-rating-btn" 
                    onClick={() => handleRate(userRating)}
                    title="Clear rating"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div 
                className="interactive-stars-row"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map(star => {
                  const isFilled = (hoverRating || userRating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`action-star ${isFilled ? 'filled' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => handleRate(star)}
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Row 3: Show your activity */}
            <div className="action-panel-row">
              <button
                type="button"
                className={`panel-row-btn secondary-btn ${showActivityDetails ? 'expanded' : ''}`}
                onClick={() => {
                  if (!token) return handleSignIn()
                  setShowActivityDetails(!showActivityDetails)
                }}
              >
                <span>Show your activity</span>
                {(userWatched || userLiked || isWatchlisted || userRating > 0) && (
                  <span className="activity-indicator-badge">●</span>
                )}
              </button>
              {showActivityDetails && (
                <div className="activity-details-drawer">
                  <div className="activity-detail-item">
                    <span>Watched:</span>
                    <strong className={userWatched ? 'text-green' : 'text-muted'}>
                      {userWatched ? '✓ Logged' : 'No'}
                    </strong>
                  </div>
                  <div className="activity-detail-item">
                    <span>Liked:</span>
                    <strong className={userLiked ? 'text-orange' : 'text-muted'}>
                      {userLiked ? '♥ Liked' : 'No'}
                    </strong>
                  </div>
                  <div className="activity-detail-item">
                    <span>Watchlist:</span>
                    <strong className={isWatchlisted ? 'text-blue' : 'text-muted'}>
                      {isWatchlisted ? '◷ In Watchlist' : 'No'}
                    </strong>
                  </div>
                  <div className="activity-detail-item">
                    <span>Rating:</span>
                    <strong className={userRating > 0 ? 'text-green' : 'text-muted'}>
                      {userRating > 0 ? `${userRating} / 5 ★` : 'Not rated'}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Review or log... */}
            <div className="action-panel-row">
              <button
                type="button"
                className="panel-row-btn"
                onClick={token ? openReviewComposer : handleSignIn}
              >
                Review or log...
              </button>
            </div>

            {/* Row 5: Add to lists... */}
            <div className="action-panel-row">
              <button
                type="button"
                className="panel-row-btn"
                onClick={token ? openAddToListModal : handleSignIn}
              >
                Add to lists...
              </button>
            </div>

            {/* Row 6: Shortlink and share */}
            <div className="action-panel-share-row">
              <div className="shortlink-box" onClick={copyShareLink} title="Click to copy shortlink">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://boxd.it/${tmdbId}`} 
                />
                <button 
                  type="button" 
                  className="copy-link-btn" 
                  onClick={copyShareLink}
                  title="Copy link"
                >
                  {copiedLink ? '✓' : '⧉'}
                </button>
              </div>
              <div className="share-social-buttons">
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${movie.title} on Letterboxd!`)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-share-icon"
                  title="Share on X"
                >
                  𝕏
                </a>
              </div>
            </div>
          </div>

          <div className="rating-summary">
            <div className="rating-heading">
              <span>RATINGS</span>

              <span>
                {formatCount(movie.vote_count)} VOTES
              </span>
            </div>

            <div className="rating-content">
              <div className="rating-histogram">
                <span style={{ height: '18%' }}></span>
                <span style={{ height: '28%' }}></span>
                <span style={{ height: '42%' }}></span>
                <span style={{ height: '65%' }}></span>
                <span style={{ height: '88%' }}></span>
                <span style={{ height: '100%' }}></span>
                <span style={{ height: '74%' }}></span>
                <span style={{ height: '52%' }}></span>
                <span style={{ height: '30%' }}></span>
                <span style={{ height: '14%' }}></span>
              </div>

              <div className="rating-number">
                <strong>
                  {movie.vote_average
                    ? (movie.vote_average / 2).toFixed(1)
                    : '0.0'}
                </strong>

                <div className="rating-stars-green">★★★★★</div>
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

      {showAddToListModal && (
        <div
          className="review-modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowAddToListModal(false)
          }}
        >
          <div className="add-to-list-modal">
            <div className="review-modal-header">
              <h2>Add to Lists</h2>
              <button
                type="button"
                className="review-modal-close"
                onClick={() => setShowAddToListModal(false)}
              >
                ×
              </button>
            </div>

            <div className="add-to-list-body">
              <p className="add-to-list-subtitle">
                Select which of your lists contain <strong>{movie.title}</strong>:
              </p>

              {loadingUserLists ? (
                <div className="modal-loading-state">Loading your lists...</div>
              ) : userLists.length === 0 ? (
                <div className="modal-empty-state">
                  <p>You haven't created any custom lists yet.</p>
                  <a href="/lists" className="create-list-link">+ Create a new list</a>
                </div>
              ) : (
                <div className="user-lists-checklist">
                  {userLists.map(list => {
                    const isInList = list.films?.some(f => String(f.movieId) === String(tmdbId))
                    return (
                      <label key={list._id} className="list-check-item">
                        <input
                          type="checkbox"
                          checked={Boolean(isInList)}
                          onChange={() => toggleFilmInList(list._id)}
                        />
                        <div className="list-check-info">
                          <span className="list-name">{list.name || list.title}</span>
                          <span className="list-count">{list.films?.length || 0} films</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="review-modal-footer">
              <button
                type="button"
                className="review-submit"
                onClick={() => setShowAddToListModal(false)}
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Video Modal */}
      {showTrailerModal && trailerKey && (
        <div
          className="trailer-modal-backdrop"
          onClick={() => setShowTrailerModal(false)}
        >
          <div
            className="trailer-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="trailer-modal-header">
              <span className="trailer-modal-title">
                {movie.title} — {trailerTitle || 'Official Trailer'}
              </span>
              <button
                type="button"
                className="trailer-modal-close"
                onClick={() => setShowTrailerModal(false)}
                title="Close trailer"
              >
                ✕
              </button>
            </div>
            <div className="trailer-video-responsive">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title={`${movie.title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Film