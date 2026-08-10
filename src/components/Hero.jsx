import './Hero.css'
import heroImage from '../assets/hero/hero.jpg'

function Hero() {
  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${heroImage})` }}
    >

      <div className="hero-overlay"></div>

      <div className="hero-content">

        <h1>Track films you've watched.</h1>
        <h2>Save those you want to see.</h2>
        <h2>Tell your friends what's good.</h2>

      </div>

    </section>
  )
}

export default Hero