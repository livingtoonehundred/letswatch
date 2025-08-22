import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import type { FilterState } from '@/lib/types';

export function useFilters() {
  const [location, setLocation] = useLocation();
  
  const [filters, setFilters] = useState<FilterState>({
    bbfcRatings: [],
    languages: [],
    genres: [],
    contentTypes: [],
    search: '',
    sort: 'relevance'
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    
    setFilters({
      bbfcRatings: params.getAll('bbfc') || [],
      languages: params.getAll('lang') || [],
      genres: params.getAll('genre') || [],
      contentTypes: params.getAll('type') || [],
      search: params.get('search') || '',
      sort: params.get('sort') || 'relevance'
    });
  }, []);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();
    
    newFilters.bbfcRatings.forEach(rating => params.append('bbfc', rating));
    newFilters.languages.forEach(lang => params.append('lang', lang));
    newFilters.genres.forEach(genre => params.append('genre', genre));
    newFilters.contentTypes.forEach(type => params.append('type', type));
    
    if (newFilters.search) {
      params.set('search', newFilters.search);
    }
    
    if (newFilters.sort && newFilters.sort !== 'relevance') {
      params.set('sort', newFilters.sort);
    }
    
    const queryString = params.toString();
    setLocation(queryString ? `/?${queryString}` : '/');
  }, [setLocation]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      updateURL(updated);
      return updated;
    });
  }, [updateURL]);

  const toggleFilter = useCallback((category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      const updated = { ...prev, [category]: newValues };
      updateURL(updated);
      return updated;
    });
  }, [updateURL]);

  const removeFilter = useCallback((category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.filter(v => v !== value);
      const updated = { ...prev, [category]: newValues };
      updateURL(updated);
      return updated;
    });
  }, [updateURL]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      bbfcRatings: [],
      languages: [],
      genres: [],
      contentTypes: [],
      search: '',
      sort: 'relevance'
    };
    setFilters(clearedFilters);
    updateURL(clearedFilters);
  }, [updateURL]);

  const setEnglishOnly = useCallback(() => {
    updateFilters({ languages: ['English'] });
  }, [updateFilters]);

  const hasActiveFilters = filters.bbfcRatings.length > 0 || 
                          filters.languages.length > 0 || 
                          filters.genres.length > 0 || 
                          filters.contentTypes.length > 0 ||
                          (filters.search && filters.search.length > 0);

  const getActiveFilters = useCallback(() => {
    const active: Array<{ category: keyof FilterState; value: string; label: string }> = [];
    
    filters.bbfcRatings.forEach(rating => {
      active.push({ category: 'bbfcRatings', value: rating, label: rating });
    });
    
    filters.languages.forEach(lang => {
      active.push({ category: 'languages', value: lang, label: lang });
    });
    
    filters.genres.forEach(genre => {
      active.push({ category: 'genres', value: genre, label: genre });
    });

    return active;
  }, [filters]);

  return {
    filters,
    updateFilters,
    toggleFilter,
    removeFilter,
    clearAllFilters,
    setEnglishOnly,
    hasActiveFilters,
    getActiveFilters
  };
}
