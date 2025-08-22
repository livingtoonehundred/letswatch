import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MovieCard from './movie-card';
import Pagination from './pagination';
import { SORT_OPTIONS } from '@/lib/types';
import type { Movie } from '@/lib/types';

interface MovieGridProps {
  movies: Movie[];
  total: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  resultsTitle: string;
  sort: string;
  onSortChange: (sort: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function MovieGrid({
  movies,
  total,
  currentPage,
  totalPages,
  isLoading,
  error,
  resultsTitle,
  sort,
  onSortChange,
  onPageChange,
  onClearFilters,
  hasActiveFilters
}: MovieGridProps) {
  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-white">Error loading movies</h3>
          <p className="text-netflix-text mb-6">
            Failed to load movies. Please try again later.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-netflix-red hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const renderLoadingGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
      {Array.from({ length: 24 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <Skeleton className="aspect-[2/3] bg-netflix-card rounded-lg" />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎬</div>
      <h3 className="text-xl font-semibold mb-2 text-white">No movies found</h3>
      <p className="text-netflix-text mb-6">
        {hasActiveFilters 
          ? "Try adjusting your filters to see more results"
          : "No movies are currently available"
        }
      </p>
      {hasActiveFilters && (
        <Button 
          onClick={onClearFilters}
          className="bg-netflix-red hover:bg-red-700 text-white"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  const renderMovieGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">{resultsTitle}</h2>
          <div className="flex items-center space-x-2 text-sm text-netflix-text sm:hidden">
            <span>{total}</span>
            <span>results</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-48 bg-netflix-card border-netflix-border text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-netflix-card border-netflix-border">
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-netflix-border">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Movie Grid or Loading/Empty States */}
      {isLoading ? renderLoadingGrid() : movies.length === 0 ? renderEmptyState() : renderMovieGrid()}

      {/* Pagination */}
      {!isLoading && movies.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          limit={24}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
