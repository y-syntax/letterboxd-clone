import './FeatureGrid.css'

const features = [
  {
    icon: '◉',
    text: "Keep track of every film you've ever watched (or just start from the day you join)"
  },
  {
    icon: '♥',
    text: 'Show some love for your favorite films, lists and reviews with a “like”'
  },
  {
    icon: '☷',
    text: 'Write and share reviews, and follow friends and other members to read theirs'
  },
  {
    icon: '★',
    text: 'Rate each film on a five-star scale (with halves) to record and share your reaction'
  },
  {
    icon: '▣',
    text: 'Keep a diary of your film watching'
  },
  {
    icon: '▦',
    text: 'Compile and share lists of films on any topic and keep a watchlist of titles to see'
  }
]

function FeatureGrid() {
  return (
    <section className="feature-section">
      <h2>LETTERBOXD LETS YOU...</h2>

      <div className="feature-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <span className="feature-icon">{feature.icon}</span>
            <p>{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeatureGrid