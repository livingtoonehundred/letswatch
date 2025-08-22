import { useState, useEffect } from 'react';
import { useFilters } from '@/hooks/use-filters';
import { useMovies } from '@/hooks/use-movies';
import { useIsMobile } from '@/hooks/use-mobile';
import FilterSidebar from '@/components/filter-sidebar';
import MovieGrid from '@/components/movie-grid';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
<img src="/logo.png" alt="Let's Watch Logo" />

export default function Home() {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  
  const {
    filters,
    updateFilters,
    toggleFilter,
    removeFilter,
    clearAllFilters,
    setEnglishOnly,
    hasActiveFilters,
    getActiveFilters
  } = useFilters();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.bbfcRatings, filters.languages, filters.genres, filters.contentTypes, filters.search, filters.sort]);

  const { data, isLoading, error } = useMovies({
    filters,
    page: currentPage,
    limit: 24
  });

  const toggleMobileFilters = () => {
    setIsMobileFiltersOpen(!isMobileFiltersOpen);
  };

  const closeMobileFilters = () => {
    setIsMobileFiltersOpen(false);
  };

  const getResultsTitle = () => {
    const activeFilters = getActiveFilters();
    if (activeFilters.length === 0) {
      return 'All Movies';
    }
    
    const parts: string[] = [];
    const genres = activeFilters.filter(f => f.category === 'genres').map(f => f.label);
    const languages = activeFilters.filter(f => f.category === 'languages').map(f => f.label);
    const ratings = activeFilters.filter(f => f.category === 'bbfcRatings').map(f => f.label);
    
    if (genres.length > 0) {
      parts.push(genres.join(', '));
    }
    
    if (languages.length > 0) {
      parts.push(`in ${languages.join(', ')}`);
    }
    
    if (ratings.length > 0) {
      parts.push(`(${ratings.join(', ')})`);
    }
    
    return parts.join(' ') || 'Filtered Movies';
  };

  return (
    <div className="min-h-screen bg-netflix-dark text-white font-inter">
      {/* Header */}
      <header className="bg-netflix-dark border-b border-netflix-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="Let's Watch Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-netflix-red">Let's Watch</h1>
              <span className="text-netflix-text text-xs sm:text-sm hidden sm:block">Netflix Content Filter</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Movie count display */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-netflix-text">
              <span>{data?.total || 0}</span>
              <span>titles found</span>
            </div>
            
            {/* Mobile filter toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 bg-netflix-card hover:bg-netflix-border text-white"
              onClick={toggleMobileFilters}
            >
              {isMobileFiltersOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Filter Sidebar */}
        <FilterSidebar
          filters={filters}
          isOpen={isMobileFiltersOpen}
          onClose={closeMobileFilters}
          onToggleFilter={toggleFilter}
          onRemoveFilter={removeFilter}
          onClearAllFilters={clearAllFilters}
          onSetEnglishOnly={setEnglishOnly}
          onUpdateSort={(sort) => updateFilters({ sort })}
          activeFilters={getActiveFilters()}
          hasActiveFilters={!!hasActiveFilters}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <MovieGrid
            movies={data?.movies || []}
            total={data?.total || 0}
            currentPage={currentPage}
            totalPages={data?.totalPages || 1}
            isLoading={isLoading}
            error={error}
            resultsTitle={getResultsTitle()}
            sort={filters.sort}
            onSortChange={(sort) => updateFilters({ sort })}
            onPageChange={setCurrentPage}
            onClearFilters={clearAllFilters}
            hasActiveFilters={!!hasActiveFilters}
          />
        </main>
      </div>

      {/* Mobile Filter Overlay */}
      {isMobileFiltersOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={closeMobileFilters}
        />
      )}
    </div>
  );
}
