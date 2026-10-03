require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const movieSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  title: String,
  year: Number,
  genre: [String],
  director: String,
  description: String,
  poster: String,
  addedBy: String
}, { timestamps: true });

// Prevent model overwrite error if running multiple times
const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected! Fetching popular movies from TMDB...");

    // Fetch popular movies
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    const data = await res.json();
    
    if (!data.results) {
      console.error(data);
      throw new Error("Failed to fetch movies from TMDB");
    }

    let savedCount = 0;
    for (const tmdbMovie of data.results) {
      try {
        // Fetch credits to get the director (required by your schema)
        const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbMovie.id}/credits?api_key=${TMDB_API_KEY}`);
        const credits = await creditsRes.json();
        const directorObj = credits.crew ? credits.crew.find(c => c.job === 'Director') : null;
        const director = directorObj ? directorObj.name : 'Unknown';

        const genres = (tmdbMovie.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean);
        const year = tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split('-')[0]) : 2026;

        const movie = new Movie({
          _id: crypto.randomUUID(),
          title: tmdbMovie.title,
          year: year || 2026,
          genre: genres.length > 0 ? genres : ["Drama"],
          director: director,
          description: tmdbMovie.overview || 'No description available.',
          poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
          addedBy: 'tmdb_script'
        });

        await movie.save();
        console.log(`✅ Saved: ${movie.title} (${year}) - Dir: ${director}`);
        savedCount++;
      } catch (err) {
        console.error(`❌ Failed to save ${tmdbMovie.title}:`, err.message);
      }
    }

    console.log(`\n🎉 Successfully added ${savedCount} movies to your database!`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

seed();
