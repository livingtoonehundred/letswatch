export interface FilterState {
  bbfcRatings: string[];
  languages: string[];
  genres: string[];
  contentTypes: string[];
  search?: string;
  sort: string;
}

export interface MovieResponse {
  movies: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Movie {
  id: string;
  netflixId: string;
  title: string;
  synopsis?: string;
  posterUrl?: string;
  releaseYear?: number;
  bbfcRating?: string;
  language?: string;
  contentType: string;
  genres: string[];
  cast: string[];
  createdAt: string;
  updatedAt: string;
}

export const BBFC_RATINGS = [
  { value: 'U', label: 'U - Universal', description: 'Suitable for all ages' },
  { value: 'PG', label: 'PG - Parental Guidance', description: 'General viewing, but some scenes may be unsuitable for young children' },
  { value: '12', label: '12 - Suitable for 12+', description: 'Suitable for 12 years and over' },
  { value: '15', label: '15 - Suitable for 15+', description: 'Suitable for 15 years and over' },
  { value: '18', label: '18 - Adults Only', description: 'Suitable only for adults' },
];

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 
  'Japanese', 'Korean', 'Hindi', 'Mandarin', 'Portuguese', 
  'Dutch', 'Arabic', 'Kannada', 'Telugu', 'Tamil', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Thai', 'Vietnamese',
  'Indonesian', 'Malay', 'Filipino', 'Unknown'
];

export const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 
  'Science Fiction', 'Documentary', 'Animation', 'Thriller', 'Crime', 
  'Family', 'Adventure', 'Mystery', 'Fantasy', 'War', 'Music', 'TV Movie'
];

export const CONTENT_TYPES = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv_series', label: 'TV Series' },
  { value: 'tv_miniseries', label: 'Miniseries' },
  { value: 'tv_movie', label: 'TV Movies' },
  { value: 'tv_special', label: 'TV Specials' },
];

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Sort by Relevance' },
  { value: 'year-desc', label: 'Newest First' },
  { value: 'year-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
];
