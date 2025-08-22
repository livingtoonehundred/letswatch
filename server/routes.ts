import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { movieService } from "./services/movieService";
import { z } from "zod";

// Schema removed - handling query parameters manually

export async function registerRoutes(app: Express): Promise<Server> {
  // Get movies with filtering
  app.get("/api/movies", async (req, res) => {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1"));
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "24")));
      const offset = (page - 1) * limit;

      // Handle array parameters - Express URL encoding converts single values to strings
      // and multiple values to arrays, so we normalize them
      const parseArrayParam = (param: any): string[] | undefined => {
        if (!param) return undefined;
        return Array.isArray(param) ? param : [param];
      };

      const filters = {
        bbfcRatings: parseArrayParam(req.query.bbfcRatings),
        languages: parseArrayParam(req.query.languages),
        genres: parseArrayParam(req.query.genres),
        search: req.query.search as string | undefined,
        sort: req.query.sort as string | undefined,
        limit,
        offset,
      };

      const result = await storage.getMovies(filters);
      
      res.json({
        movies: result.movies,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      console.error("Error fetching movies:", error);
      res.status(500).json({ message: "Failed to fetch movies" });
    }
  });

  // Get movie statistics for filters (must come before /:id route)
  app.get("/api/movies/stats", async (req, res) => {
    try {
      const stats = await storage.getMovieStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching movie stats:", error);
      res.status(500).json({ message: "Failed to fetch movie statistics" });
    }
  });

  // Get movie by ID
  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movie = await storage.getMovieById(req.params.id);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      res.json(movie);
    } catch (error) {
      console.error("Error fetching movie:", error);
      res.status(500).json({ message: "Failed to fetch movie" });
    }
  });

  // Refresh movie catalog
  app.post("/api/movies/refresh", async (req, res) => {
    try {
      await movieService.refreshCatalog();
      res.json({ message: "Catalog refresh initiated" });
    } catch (error) {
      console.error("Error refreshing catalog:", error);
      res.status(500).json({ message: "Failed to refresh catalog" });
    }
  });

  // Re-rate miscategorized content (fix family content marked as 18)
  app.post("/api/movies/re-rate", async (req, res) => {
    try {
      await movieService.reRateMiscategorizedContent();
      res.json({ message: "Re-rating process initiated" });
    } catch (error) {
      console.error("Error re-rating content:", error);
      res.status(500).json({ message: "Failed to re-rate content" });
    }
  });

  // Get cache status
  app.get("/api/cache/status", async (req, res) => {
    try {
      const status = await storage.getCacheStatus("UK");
      res.json(status);
    } catch (error) {
      console.error("Error fetching cache status:", error);
      res.status(500).json({ message: "Failed to fetch cache status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
