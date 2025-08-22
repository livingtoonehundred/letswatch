import { Badge } from '@/components/ui/badge';
import type { Movie } from '@/lib/types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const handleClick = () => {
    // TODO: Implement movie details modal or navigation
    console.log('Movie clicked:', movie.title);
  };

  const posterUrl = movie.posterUrl || 'https://images.unsplash.com/photo-1489599797989-8b7d7a7a8db8?w=400&h=600&fit=crop';

  return (
    <div className="group cursor-pointer animate-fade-in" onClick={handleClick}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-netflix-card">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1489599797989-8b7d7a7a8db8?w=400&h=600&fit=crop';
          }}
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-end opacity-0 group-hover:opacity-100">
          <div className="p-3 w-full">
            <h3 className="font-semibold text-sm mb-1 text-white line-clamp-2">{movie.title}</h3>
            <div className="flex items-center space-x-2 text-xs text-netflix-text flex-wrap gap-1">
              {movie.bbfcRating && (
                <Badge variant="destructive" className="bg-netflix-red text-white text-xs px-2 py-1">
                  {movie.bbfcRating}
                </Badge>
              )}
              {movie.releaseYear && (
                <span>{movie.releaseYear}</span>
              )}
              {movie.genres?.[0] && (
                <span>{movie.genres[0]}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
