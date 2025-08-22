import { movies, cacheStatus, users, type Movie, type InsertMovie, type CacheStatus, type InsertCacheStatus, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, desc, asc, count, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Movie methods
  getMovies(filters: {
    bbfcRatings?: string[];
    languages?: string[];
    genres?: string[];
    contentTypes?: string[];
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ movies: Movie[]; total: number }>;
  getMovieById(id: string): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: string, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  deleteMovie(id: string): Promise<boolean>;
  deleteAllMovies(): Promise<void>;
  getMovieStats(): Promise<{
    bbfcRatings: { rating: string; count: number }[];
    languages: { language: string; count: number }[];
    genres: { genre: string; count: number }[];
  }>;
  getMoviesByRating(rating: string): Promise<Movie[]>;
  updateMovieRating(id: string, rating: string): Promise<Movie | undefined>;

  // Cache status methods
  getCacheStatus(region: string): Promise<CacheStatus | undefined>;
  createCacheStatus(status: InsertCacheStatus): Promise<CacheStatus>;
  updateCacheStatus(region: string, status: Partial<InsertCacheStatus>): Promise<CacheStatus | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Movie methods
  async getMovies(filters: {
    bbfcRatings?: string[];
    languages?: string[];
    genres?: string[];
    contentTypes?: string[];
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ movies: Movie[]; total: number }> {
    console.log("Storage getMovies called with filters:", filters);
    const conditions = [];

    if (filters.bbfcRatings?.length) {
      console.log("Adding BBFC rating filter:", filters.bbfcRatings);
      conditions.push(inArray(movies.bbfcRating, filters.bbfcRatings));
    }

    if (filters.languages?.length) {
      console.log("Adding language filter:", filters.languages);
      conditions.push(inArray(movies.language, filters.languages));
    }

    if (filters.genres?.length) {
      console.log("Adding genre filter:", filters.genres);
      // Use JSONB contains any operator for PostgreSQL with genre mapping
      const genreConditions = filters.genres.map(genre => {
        // Handle common genre variations for better matching
        const genreVariants = [genre];
        if (genre === 'Sci-Fi') {
          genreVariants.push('Sci-Fi & Fantasy', 'Science Fiction');
        }
        if (genre === 'Science Fiction') {
          genreVariants.push('Sci-Fi & Fantasy', 'Sci-Fi');
        }
        
        return sql`(${sql.join(
          genreVariants.map(variant => sql`${movies.genres} @> ${JSON.stringify([variant])}`),
          sql` OR `
        )})`;
      });
      conditions.push(sql`(${sql.join(genreConditions, sql` OR `)})`);
    }

    if (filters.contentTypes?.length) {
      console.log("Adding content type filter:", filters.contentTypes);
      conditions.push(inArray(movies.contentType, filters.contentTypes));
    }

    if (filters.search) {
      console.log("Adding search filter:", filters.search);
      conditions.push(ilike(movies.title, `%${filters.search}%`));
    }

    console.log("Total conditions:", conditions.length);

    let query = db.select().from(movies);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (filters.sort) {
      case 'year-desc':
        query = query.orderBy(desc(movies.releaseYear));
        break;
      case 'year-asc':
        query = query.orderBy(asc(movies.releaseYear));
        break;
      case 'title-asc':
        query = query.orderBy(asc(movies.title));
        break;
      case 'title-desc':
        query = query.orderBy(desc(movies.title));
        break;
      default:
        query = query.orderBy(desc(movies.releaseYear));
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    // Get count separately
    let countQuery = db.select({ count: count() }).from(movies);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [movieResults, totalResults] = await Promise.all([
      query,
      countQuery
    ]);

    return {
      movies: movieResults,
      total: totalResults[0]?.count || 0
    };
  }

  async getMovieById(id: string): Promise<Movie | undefined> {
    const [movie] = await db.select().from(movies).where(eq(movies.id, id));
    return movie || undefined;
  }

  async createMovie(movie: InsertMovie): Promise<Movie> {
    const [newMovie] = await db
      .insert(movies)
      .values(movie)
      .returning();
    return newMovie;
  }

  async updateMovie(id: string, movie: Partial<InsertMovie>): Promise<Movie | undefined> {
    const [updatedMovie] = await db
      .update(movies)
      .set({ ...movie, updatedAt: new Date() } as any)
      .where(eq(movies.id, id))
      .returning();
    return updatedMovie || undefined;
  }

  async deleteMovie(id: string): Promise<boolean> {
    const result = await db.delete(movies).where(eq(movies.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteAllMovies(): Promise<void> {
    await db.delete(movies);
  }

  async getMovieStats(): Promise<{
    bbfcRatings: { rating: string; count: number }[];
    languages: { language: string; count: number }[];
    genres: { genre: string; count: number }[];
  }> {
    // This would require more complex SQL queries, for now return empty arrays
    // In production, you'd want to use proper aggregation queries
    return {
      bbfcRatings: [],
      languages: [],
      genres: []
    };
  }

  async getMoviesByRating(rating: string): Promise<Movie[]> {
    return await db.select().from(movies).where(eq(movies.bbfcRating, rating));
  }

  async updateMovieRating(id: string, rating: string): Promise<Movie | undefined> {
    const [updatedMovie] = await db
      .update(movies)
      .set({ bbfcRating: rating, updatedAt: new Date() })
      .where(eq(movies.id, id))
      .returning();
    return updatedMovie || undefined;
  }

  // Cache status methods
  async getCacheStatus(region: string): Promise<CacheStatus | undefined> {
    const [status] = await db
      .select()
      .from(cacheStatus)
      .where(and(eq(cacheStatus.region, region), eq(cacheStatus.isActive, true)));
    return status || undefined;
  }

  async createCacheStatus(status: InsertCacheStatus): Promise<CacheStatus> {
    const [newStatus] = await db
      .insert(cacheStatus)
      .values(status)
      .returning();
    return newStatus;
  }

  async updateCacheStatus(region: string, status: Partial<InsertCacheStatus>): Promise<CacheStatus | undefined> {
    const [updatedStatus] = await db
      .update(cacheStatus)
      .set({ ...status, lastUpdated: new Date() })
      .where(and(eq(cacheStatus.region, region), eq(cacheStatus.isActive, true)))
      .returning();
    return updatedStatus || undefined;
  }
}

export const storage = new DatabaseStorage();
