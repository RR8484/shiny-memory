import fetch from 'node-fetch';
import fs from 'fs/promises';
import readline from 'readline';

const API_KEY = 'd82ee9997f9e783aac9f5a88a5251b01'; // Replace with your actual TMDb API key/clear
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w300';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptDecade() {
  return new Promise((resolve) => {
    rl.question('Enter a decade (e.g., 1980 for the 1980s): ', (answer) => {
      resolve(parseInt(answer));
    });
  });
}

async function getRandomHorrorMovie(startYear, endYear) {
  try {
    const totalPagesResponse = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&vote_average.gte=5&vote_count.gte=50&page=1`);
    const totalPagesData = await totalPagesResponse.json();
    
    if (!totalPagesData.total_pages) {
      console.error('Error: Unable to get total pages. API response:', totalPagesData);
      return null;
    }
    
    const totalPages = Math.min(totalPagesData.total_pages, 500);
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    const moviesResponse = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&vote_average.gte=5&vote_count.gte=50&page=${randomPage}`);
    const moviesData = await moviesResponse.json();
    
    if (!moviesData.results || !moviesData.results.length) {
      console.error('Error: No movie results found. API response:', moviesData);
      return null;
    }

    const validMovies = moviesData.results.filter(movie => movie.vote_average > 5);
    return validMovies[Math.floor(Math.random() * validMovies.length)];
  } catch (error) {
    console.error('Error fetching movie:', error);
    return null;
  }
}

async function generateHorrorMovieRecommendations(count = 10, startYear, endYear) {
  const recommendations = [];
  while (recommendations.length < count) {
    const movie = await getRandomHorrorMovie(startYear, endYear);
    if (movie && !recommendations.some(m => m.id === movie.id)) {
      recommendations.push(movie);
    }
  }
  return recommendations;
}

function generateHTML(movies, decade) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Horror Movie Recommendations - ${decade}s</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        .movie { background: #f4f4f4; margin-bottom: 20px; padding: 20px; border-radius: 5px; display: flex; }
        .movie-info { margin-left: 20px; }
        .movie h2 { margin-top: 0; color: #444; }
        .movie p { margin: 10px 0; }
        .movie img { max-width: 300px; height: auto; }
    </style>
</head>
<body>
    <h1>Horror Movie Recommendations - ${decade}s</h1>
    ${movies.map(movie => `
    <div class="movie">
        <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/300x450.png?text=No+Poster+Available'}" alt="${movie.title} poster">
        <div class="movie-info">
            <h2>${movie.title}</h2>
            <p><strong>Release Date:</strong> ${movie.release_date}</p>
            <p><strong>Overview:</strong> ${movie.overview}</p>
            <p><strong>Rating:</strong> ${Math.round(movie.vote_average)}/10</p>
        </div>
    </div>
    `).join('')}
</body>
</html>
  `;
}

async function recommendHorrorMovies() {
  const decade = await promptDecade();
  const startYear = decade;
  const endYear = decade + 9;
  
  const movies = await generateHorrorMovieRecommendations(10, startYear, endYear);
  if (movies.length > 0) {
    const html = generateHTML(movies, decade);
    await fs.writeFile('horror_recommendations.html', html);
    console.log(`Recommendations for ${decade}s horror movies generated and saved to horror_recommendations.html`);
  } else {
    console.log(`Unable to fetch movie recommendations for the ${decade}s.`);
  }
  rl.close();
}

recommendHorrorMovies();
