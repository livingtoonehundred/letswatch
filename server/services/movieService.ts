import { storage } from "../storage";
import type { InsertMovie } from "@shared/schema";

interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  genre_ids: number[];
  original_language: string;
  vote_average: number;
  popularity: number;
}

interface TMDbGenre {
  id: number;
  name: string;
}

interface WatchmodeTitle {
  id: number;
  title: string;
  type: string;
  imdb_id: string;
  tmdb_id: number;
  sources: Array<{
    source_id: number;
    name: string;
    type: string;
    region: string;
    web_url: string;
  }>;
}

class MovieService {
  private tmdbApiKey: string;
  private watchmodeApiKey: string;
  private isRefreshing = false;
  private genreMap: Map<number, string> = new Map();

  constructor() {
    this.tmdbApiKey = process.env.TMDB_API_KEY || "";
    this.watchmodeApiKey = process.env.WATCHMODE_API_KEY || "";
  }

  async refreshCatalog(): Promise<void> {
    if (this.isRefreshing) {
      console.log("Catalog refresh already in progress");
      return;
    }

    this.isRefreshing = true;

    try {
      console.log("Starting catalog refresh...");
      
      // Update cache status to 'updating'
      await storage.updateCacheStatus("UK", {
        status: "updating",
        region: "UK"
      });

      // Fetch movies from Streaming Availability API
      const movies = await this.fetchNetflixMovies();
      
      if (movies.length === 0) {
        throw new Error("No movies fetched from API");
      }

      // Clear existing movies
      await storage.deleteAllMovies();

      // Insert new movies
      let insertedCount = 0;
      let skippedCount = 0;
      for (const movie of movies) {
        try {
          await storage.createMovie(movie);
          insertedCount++;
        } catch (error: any) {
          if (error?.code === '23505') {
            // Duplicate key - skip silently
            skippedCount++;
          } else {
            console.error(`Failed to insert movie ${movie.title}:`, error);
          }
        }
      }

      // Update cache status to 'completed'
      await storage.updateCacheStatus("UK", {
        status: "completed",
        totalMovies: insertedCount,
        region: "UK"
      });

      console.log(`Catalog refresh completed. Inserted ${insertedCount} new movies, skipped ${skippedCount} duplicates.`);
    } catch (error) {
      console.error("Catalog refresh failed:", error);
      
      // Update cache status to 'failed'
      await storage.updateCacheStatus("UK", {
        status: "failed",
        region: "UK"
      });
    } finally {
      this.isRefreshing = false;
    }
  }

  private async fetchNetflixMovies(): Promise<InsertMovie[]> {
    if (!this.tmdbApiKey || !this.watchmodeApiKey) {
      console.warn("Missing API keys. TMDb or Watchmode API key not found.");
      return [];
    }

    try {
      // Step 1: Load TMDb genre mapping
      await this.loadGenreMapping();

      // Step 2: Get Netflix titles from Watchmode
      const netflixTitles = await this.fetchNetflixTitlesFromWatchmode();
      console.log(`Found ${netflixTitles.length} Netflix titles from Watchmode`);

      // Step 3: Get detailed movie data from TMDb for each title
      const movies: InsertMovie[] = [];
      let processedCount = 0;

      for (const title of netflixTitles) { // Process all Netflix titles
        try {
          if (title.tmdb_id) {
            const tmdbMovie = await this.fetchTMDbDetails(title.tmdb_id, title.type);
            if (tmdbMovie) {
              const movie = this.transformTMDbToInsertMovie(tmdbMovie, title);
              movies.push(movie);
              processedCount++;
            }
          }
          
          // Rate limiting - small delay between requests
          if (processedCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to process title ${title.title}:`, error);
        }
      }

      console.log(`Successfully processed ${movies.length} movies from TMDb + Watchmode`);
      return movies;
    } catch (error) {
      console.error("Failed to fetch from TMDb + Watchmode APIs:", error);
      throw error;
    }
  }

  private async loadGenreMapping(): Promise<void> {
    try {
      // Load both movie and TV genres
      const [movieResponse, tvResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${this.tmdbApiKey}`),
        fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${this.tmdbApiKey}`)
      ]);
      
      if (!movieResponse.ok || !tvResponse.ok) {
        throw new Error(`TMDb genres request failed`);
      }

      const [movieData, tvData] = await Promise.all([
        movieResponse.json(),
        tvResponse.json()
      ]);
      
      this.genreMap.clear();
      
      // Add movie genres
      for (const genre of movieData.genres) {
        this.genreMap.set(genre.id, genre.name);
      }
      
      // Add TV genres (avoiding duplicates)
      for (const genre of tvData.genres) {
        this.genreMap.set(genre.id, genre.name);
      }
      
      console.log(`Loaded ${this.genreMap.size} genre mappings from TMDb (movies + TV)`);
    } catch (error) {
      console.error("Failed to load genre mapping:", error);
    }
  }

  private async fetchNetflixTitlesFromWatchmode(): Promise<WatchmodeTitle[]> {
    try {
      const allTitles: WatchmodeTitle[] = [];
      let page = 1;
      const maxPages = 50; // Fetch up to 12,500 titles (250 * 50) - complete catalog
      
      while (page <= maxPages) {
        console.log(`Fetching Watchmode page ${page}/${maxPages}...`);
        
        const response = await fetch(
          `https://api.watchmode.com/v1/list-titles/?apiKey=${this.watchmodeApiKey}&source_ids=203&regions=GB&limit=250&page=${page}`
        );

        if (!response.ok) {
          console.error(`Watchmode page ${page} failed: ${response.status}`);
          break;
        }

        const data = await response.json();
        const titles = data.titles || [];
        
        if (titles.length === 0) {
          console.log(`No more titles found at page ${page}`);
          break;
        }
        
        allTitles.push(...titles);
        console.log(`Page ${page}: Added ${titles.length} titles (total: ${allTitles.length})`);
        
        // Rate limiting between pages
        await new Promise(resolve => setTimeout(resolve, 1000));
        page++;
      }
      
      console.log(`Fetched total of ${allTitles.length} Netflix titles from Watchmode`);
      return allTitles;
    } catch (error) {
      console.error("Failed to fetch from Watchmode:", error);
      return [];
    }
  }

  private async fetchTMDbDetails(tmdbId: number, contentType: string): Promise<TMDbMovie | null> {
    try {
      // Determine endpoint based on content type
      const isMovie = contentType === 'movie' || contentType === 'tv_movie';
      const endpoint = isMovie ? 'movie' : 'tv';
      
      // For movies: append release_dates, for TV: append content_ratings
      const appendParam = isMovie ? 'credits,release_dates' : 'credits,content_ratings';
      
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${this.tmdbApiKey}&append_to_response=${appendParam}`
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch TMDb details for ID ${tmdbId}:`, error);
      return null;
    }
  }

  private transformTMDbToInsertMovie(tmdbMovie: any, watchmodeTitle: WatchmodeTitle): InsertMovie {
    // Determine content type
    const isMovie = watchmodeTitle.type === 'movie' || watchmodeTitle.type === 'tv_movie';
    
    // Get BBFC rating using three-tier logic
    const bbfcRating = this.extractThreeTierBBFCRating(tmdbMovie, isMovie);
    
    // Get genres from genre mapping
    const genres = tmdbMovie.genres?.map((g: any) => g.name) || [];
    
    // Get cast from credits
    const cast = tmdbMovie.credits?.cast?.slice(0, 10).map((c: any) => c.name) || [];
    
    // Handle different content types
    const title = isMovie ? tmdbMovie.title : tmdbMovie.name;
    const releaseDate = isMovie ? tmdbMovie.release_date : tmdbMovie.first_air_date;
    
    return {
      netflixId: watchmodeTitle.id.toString(),
      title: title || watchmodeTitle.title,
      synopsis: tmdbMovie.overview || "",
      posterUrl: tmdbMovie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
        : "",
      releaseYear: releaseDate 
        ? parseInt(releaseDate.split('-')[0])
        : null,
      bbfcRating: bbfcRating,
      language: this.mapLanguage(tmdbMovie.original_language),
      contentType: watchmodeTitle.type || "movie",
      genres: genres,
      cast: cast,
    };
  }

  /**
   * Three-tier BBFC rating logic:
   * Tier 1: Use actual BBFC rating when available (from Watchmode or TMDb)
   * Tier 2: Cross-reference TMDb certification data (US, international)
   * Tier 3: Intelligent content-based defaults using genre and content analysis
   */
  private extractThreeTierBBFCRating(tmdbMovie: any, isMovie: boolean): string {
    // TIER 1: Try to get actual BBFC rating from TMDb
    const bbfcRating = this.getTMDbBBFCRating(tmdbMovie, isMovie);
    if (bbfcRating) {
      return bbfcRating;
    }
    
    // TIER 2: Use international rating as fallback
    const internationalRating = this.getInternationalRatingFallback(tmdbMovie, isMovie);
    if (internationalRating) {
      return internationalRating;
    }
    
    // TIER 3: Intelligent content-based defaults
    return this.getIntelligentRatingDefault(tmdbMovie);
  }

  private getTMDbBBFCRating(tmdbMovie: any, isMovie: boolean): string | null {
    if (isMovie) {
      // For movies: check release_dates
      const releaseDates = tmdbMovie.release_dates?.results;
      if (releaseDates) {
        const ukRelease = releaseDates.find((r: any) => r.iso_3166_1 === 'GB');
        if (ukRelease?.release_dates?.length > 0) {
          const certification = ukRelease.release_dates[0].certification;
          if (certification) {
            return this.mapToBBFCRating(certification);
          }
        }
      }
    } else {
      // For TV: check content_ratings
      const contentRatings = tmdbMovie.content_ratings?.results;
      if (contentRatings) {
        const ukRating = contentRatings.find((r: any) => r.iso_3166_1 === 'GB');
        if (ukRating?.rating) {
          return this.mapToBBFCRating(ukRating.rating);
        }
      }
    }
    return null;
  }

  private getInternationalRatingFallback(tmdbMovie: any, isMovie: boolean): string | null {
    if (isMovie) {
      // For movies: check US rating from release_dates
      const releaseDates = tmdbMovie.release_dates?.results;
      if (releaseDates) {
        const usRelease = releaseDates.find((r: any) => r.iso_3166_1 === 'US');
        if (usRelease?.release_dates?.length > 0) {
          const certification = usRelease.release_dates[0].certification;
          if (certification) {
            return this.mapToBBFCRating(certification);
          }
        }
      }
    } else {
      // For TV: check US rating from content_ratings
      const contentRatings = tmdbMovie.content_ratings?.results;
      if (contentRatings) {
        const usRating = contentRatings.find((r: any) => r.iso_3166_1 === 'US');
        if (usRating?.rating) {
          return this.mapToBBFCRating(usRating.rating);
        }
      }
    }
    return null;
  }

  private getIntelligentRatingDefault(tmdbMovie: any): string {
    const genres = tmdbMovie.genres?.map((g: any) => g.name.toLowerCase()) || [];
    const overview = (tmdbMovie.overview || "").toLowerCase();
    const voteAverage = tmdbMovie.vote_average || 0;
    
    // Family-friendly content indicators
    const familyGenres = ['animation', 'family', 'kids', 'children'];
    const familyKeywords = ['family', 'kids', 'children', 'disney', 'pixar', 'educational'];
    
    // Adult content indicators
    const adultGenres = ['horror', 'thriller', 'crime', 'war'];
    const adultKeywords = ['violence', 'blood', 'murder', 'killer', 'terror', 'death'];
    
    // Check for family content
    const hasFamilyGenre = genres.some((g: string) => familyGenres.includes(g));
    const hasFamilyKeywords = familyKeywords.some(keyword => overview.includes(keyword));
    
    // Check for adult content
    const hasAdultGenre = genres.some((g: string) => adultGenres.includes(g));
    const hasAdultKeywords = adultKeywords.some(keyword => overview.includes(keyword));
    
    if (hasFamilyGenre || hasFamilyKeywords) {
      // Family content with high ratings likely U or PG
      return voteAverage >= 7.0 ? "U" : "PG";
    }
    
    if (hasAdultGenre || hasAdultKeywords) {
      // Adult themes default to 15 or 18
      return genres.includes('horror') ? "18" : "15";
    }
    
    // General content analysis
    if (genres.includes('documentary')) {
      return "PG"; // Most documentaries are PG
    }
    
    if (genres.includes('comedy') && voteAverage >= 6.0) {
      return "12"; // Most comedies are 12
    }
    
    if (genres.includes('drama')) {
      return voteAverage >= 7.0 ? "12" : "15";
    }
    
    // Conservative default for unknown content (safeguarding balance)
    return "15";
  }



  private mapToBBFCRating(rating: string): string {
    const ratingMap: { [key: string]: string } = {
      // BBFC ratings (direct match)
      "U": "U",
      "PG": "PG", 
      "12": "12",
      "12A": "12",
      "15": "15",
      "18": "18",
      
      // US MPAA ratings
      "G": "U",           // General Audiences → U
      "PG-13": "12",      // Parents Strongly Cautioned → 12
      "R": "15",          // Restricted → 15
      "NC-17": "18",      // Adults Only → 18
      
      // TV content ratings
      "TV-Y": "U",        // Children → U
      "TV-Y7": "PG",      // Children 7+ → PG
      "TV-G": "U",        // General Audience → U
      "TV-PG": "PG",      // Parental Guidance → PG
      "TV-14": "12",      // Parents Strongly Cautioned → 12
      "TV-MA": "15",      // Mature Audience → 15
      
      // International ratings (common ones)
      "6": "PG",          // German FSK 6 → PG
      "16": "15",         // German FSK 16 → 15
      "M": "12",          // Australian M → 12
      "MA15+": "15",      // Australian MA15+ → 15
    };

    return ratingMap[rating] || "15"; // Safeguarding default
  }

  private mapLanguage(langCode: string): string {
    const languageMap: { [key: string]: string } = {
      "en": "English",
      "es": "Spanish",
      "fr": "French",
      "de": "German",
      "it": "Italian",
      "ja": "Japanese",
      "ko": "Korean",
      "hi": "Hindi",
      "zh": "Mandarin",
      "pt": "Portuguese",
      "nl": "Dutch",
      "ar": "Arabic",
      "kn": "Kannada",
      "te": "Telugu",
      "ta": "Tamil",
      "ml": "Malayalam",
      "bn": "Bengali",
      "mr": "Marathi",
      "gu": "Gujarati",
      "pa": "Punjabi",
      "th": "Thai",
      "vi": "Vietnamese",
      "id": "Indonesian",
      "ms": "Malay",
      "tl": "Filipino",
    };

    return languageMap[langCode] || "Unknown";
  }

  async schedulePeriodicRefresh(): Promise<void> {
    // Check if it's time to refresh (24 hours since last update)
    const cacheStatus = await storage.getCacheStatus("UK");
    
    if (!cacheStatus) {
      // First time setup
      await storage.createCacheStatus({
        region: "UK",
        status: "pending",
        totalMovies: 0,
        isActive: true
      });
      await this.refreshCatalog();
      return;
    }

    const now = new Date();
    const lastUpdate = cacheStatus.lastUpdated ? new Date(cacheStatus.lastUpdated) : new Date(0);
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate >= 24) {
      console.log("24 hours passed since last update. Starting refresh...");
      await this.refreshCatalog();
    }
  }

  async reRateMiscategorizedContent(): Promise<void> {
    console.log("Starting targeted re-rating of miscategorized content...");
    
    try {
      // Get all movies currently rated "18"
      const eighteenRatedMovies = await storage.getMoviesByRating("18");
      console.log(`Found ${eighteenRatedMovies.length} movies currently rated "18" for re-evaluation`);
      
      if (eighteenRatedMovies.length === 0) {
        console.log("No movies found with '18' rating to re-evaluate");
        return;
      }

      let updatedCount = 0;
      let unchangedCount = 0;

      for (const movie of eighteenRatedMovies) {
        try {
          // Extract TMDb ID from netflixId if possible
          const tmdbId = await this.extractTMDbIdFromMovie(movie);
          if (!tmdbId) {
            console.log(`Skipping ${movie.title}: No TMDb ID available`);
            continue;
          }

          // Fetch fresh TMDb data with new rating logic
          const tmdbMovie = await this.fetchTMDbDetails(tmdbId, movie.contentType);
          if (!tmdbMovie) {
            console.log(`Skipping ${movie.title}: Failed to fetch TMDb data`);
            continue;
          }

          // Apply new three-tier rating logic
          const isMovie = movie.contentType === 'movie' || movie.contentType === 'tv_movie';
          const newRating = this.extractThreeTierBBFCRating(tmdbMovie, isMovie);
          
          // Only update if rating actually changed
          if (newRating !== "18") {
            await storage.updateMovieRating(movie.id, newRating);
            console.log(`Updated ${movie.title}: 18 → ${newRating}`);
            updatedCount++;
          } else {
            unchangedCount++;
          }

          // Rate limiting
          if ((updatedCount + unchangedCount) % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`Failed to re-rate ${movie.title}:`, error);
        }
      }

      console.log(`Re-rating complete: ${updatedCount} updated, ${unchangedCount} confirmed as 18`);
    } catch (error) {
      console.error("Failed to re-rate miscategorized content:", error);
    }
  }

  private async extractTMDbIdFromMovie(movie: any): Promise<number | null> {
    // Try to get TMDb ID from Watchmode using netflixId
    try {
      const response = await fetch(
        `https://api.watchmode.com/v1/title/${movie.netflixId}/details/?apiKey=${this.watchmodeApiKey}`
      );
      
      if (response.ok) {
        const details = await response.json();
        return details.tmdb_id || null;
      }
    } catch (error) {
      console.error(`Failed to get TMDb ID for ${movie.title}:`, error);
    }
    
    return null;
  }
}

export const movieService = new MovieService();

// Start periodic refresh check
setInterval(() => {
  movieService.schedulePeriodicRefresh().catch(console.error);
}, 60000 * 60); // Check every hour
