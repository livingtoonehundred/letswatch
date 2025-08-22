import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const movies = pgTable("movies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  netflixId: varchar("netflix_id").notNull().unique(),
  title: text("title").notNull(),
  synopsis: text("synopsis"),
  posterUrl: text("poster_url"),
  releaseYear: integer("release_year"),
  bbfcRating: varchar("bbfc_rating", { length: 5 }), // U, PG, 12, 15, 18
  language: varchar("language", { length: 50 }),
  contentType: varchar("content_type", { length: 20 }).notNull().default("movie"), // movie, tv_series, tv_miniseries, tv_movie, tv_special
  genres: jsonb("genres").$type<string[]>().default([]),
  cast: jsonb("cast").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cacheStatus = pgTable("cache_status", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  region: varchar("region", { length: 10 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  status: varchar("status", { length: 20 }).notNull(), // 'updating', 'completed', 'failed'
  totalMovies: integer("total_movies").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertMovieSchema = createInsertSchema(movies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCacheStatusSchema = createInsertSchema(cacheStatus).omit({
  id: true,
  lastUpdated: true,
});

export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;
export type InsertCacheStatus = z.infer<typeof insertCacheStatusSchema>;
export type CacheStatus = typeof cacheStatus.$inferSelect;

// Keep existing user schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
