import FeatureGrid from '../components/FeatureGrid'
import PopularReviews from '../components/PopularReviews'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import MovieRow from '../components/MovieRow'
import movies from '../data/movies'

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <MovieRow
          title="Popular films"
          movies={movies}
        />

        <MovieRow
          title="Films you might like"
          movies={[...movies].reverse()}
        />
        <PopularReviews />

        <MovieRow
          title="Recently reviewed"
          movies={movies.slice(1,5)}
        />

        <FeatureGrid />
      </main>
    </>
  )
}

export default Home