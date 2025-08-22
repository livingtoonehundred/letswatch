import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { BBFC_RATINGS, LANGUAGES, GENRES } from '@/lib/types';
import type { FilterState } from '@/lib/types';

interface FilterSidebarProps {
  filters: FilterState;
  isOpen: boolean;
  onClose: () => void;
  onToggleFilter: (category: keyof FilterState, value: string) => void;
  onRemoveFilter: (category: keyof FilterState, value: string) => void;
  onClearAllFilters: () => void;
  onSetEnglishOnly: () => void;
  onUpdateSort: (sort: string) => void;
  activeFilters: Array<{ category: keyof FilterState; value: string; label: string }>;
  hasActiveFilters: boolean;
}

export default function FilterSidebar({
  filters,
  isOpen,
  onClose,
  onToggleFilter,
  onRemoveFilter,
  onClearAllFilters,
  onSetEnglishOnly,
  activeFilters,
  hasActiveFilters
}: FilterSidebarProps) {
  return (
    <>
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-80 bg-netflix-gray border-r border-netflix-border 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full">
          <ScrollArea className="h-full">
            {/* Filter Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Filters</h2>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAllFilters}
                  className="text-netflix-red hover:text-red-400 text-sm font-medium p-0"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Active Filters Badges */}
            {activeFilters.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge
                      key={`${filter.category}-${filter.value}`}
                      variant="destructive"
                      className="bg-netflix-red text-white hover:bg-red-700"
                    >
                      {filter.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFilter(filter.category, filter.value)}
                        className="ml-2 p-0 h-auto w-auto hover:bg-transparent"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* BBFC Age Rating Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-white">Age Rating (BBFC)</h3>
              <div className="space-y-3">
                {BBFC_RATINGS.map((rating) => (
                  <label
                    key={rating.value}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <Checkbox
                      checked={filters.bbfcRatings.includes(rating.value)}
                      onCheckedChange={() => onToggleFilter('bbfcRatings', rating.value)}
                      className="data-[state=checked]:bg-netflix-red data-[state=checked]:border-netflix-red"
                    />
                    <span className={`text-sm group-hover:text-white transition-colors ${
                      filters.bbfcRatings.includes(rating.value) ? 'text-white' : 'text-netflix-text'
                    }`}>
                      {rating.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-white">Language</h3>
              <div className="mb-3">
                <Button
                  variant="outline"
                  onClick={onSetEnglishOnly}
                  className="w-full bg-netflix-card hover:bg-netflix-border border-netflix-border text-white text-left justify-start"
                >
                  English Only
                </Button>
              </div>
              <ScrollArea className="max-h-60">
                <div className="space-y-3">
                  {LANGUAGES.map((language) => (
                    <label
                      key={language}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <Checkbox
                        checked={filters.languages.includes(language)}
                        onCheckedChange={() => onToggleFilter('languages', language)}
                        className="data-[state=checked]:bg-netflix-red data-[state=checked]:border-netflix-red"
                      />
                      <span className={`text-sm group-hover:text-white transition-colors ${
                        filters.languages.includes(language) ? 'text-white' : 'text-netflix-text'
                      }`}>
                        {language}
                      </span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Genre Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-white">Genres</h3>
              <ScrollArea className="max-h-60">
                <div className="space-y-3">
                  {GENRES.map((genre) => (
                    <label
                      key={genre}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <Checkbox
                        checked={filters.genres.includes(genre)}
                        onCheckedChange={() => onToggleFilter('genres', genre)}
                        className="data-[state=checked]:bg-netflix-red data-[state=checked]:border-netflix-red"
                      />
                      <span className={`text-sm group-hover:text-white transition-colors ${
                        filters.genres.includes(genre) ? 'text-white' : 'text-netflix-text'
                      }`}>
                        {genre}
                      </span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
