import { useQuery } from '@tanstack/react-query';
import type { MovieResponse, FilterState } from '@/lib/types';

interface UseMoviesOptions {
  filters: FilterState;
  page: number;
  limit?: number;
}

export function useMovies({ filters, page, limit = 24 }: UseMoviesOptions) {
  return useQuery<MovieResponse>({
    queryKey: ['/api/movies', { ...filters, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.bbfcRatings?.length) {
        filters.bbfcRatings.forEach(rating => params.append('bbfcRatings', rating));
      }
      if (filters.languages?.length) {
        filters.languages.forEach(lang => params.append('languages', lang));
      }
      if (filters.genres?.length) {
        filters.genres.forEach(genre => params.append('genres', genre));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sort) {
        params.append('sort', filters.sort);
      }
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const url = `/api/movies?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useMovieStats() {
  return useQuery({
    queryKey: ['/api/movies/stats'],
    queryFn: async () => {
      const response = await fetch('/api/movies/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch movie stats');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCacheStatus() {
  return useQuery({
    queryKey: ['/api/cache/status'],
    queryFn: async () => {
      const response = await fetch('/api/cache/status');
      if (!response.ok) {
        throw new Error('Failed to fetch cache status');
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
