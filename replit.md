# Let's Watch - Netflix Content Filter App

## Overview

Let's Watch is a Progressive Web App (PWA) that helps users discover Netflix movies through advanced filtering capabilities. The application fetches movie data from TMDb + Watchmode APIs and provides filtering by BBFC age ratings, languages, and genres. Built with a Netflix-inspired dark theme, it offers an intuitive movie discovery experience with responsive design and offline capabilities.

## Recent Changes (January 2025)

**Major API Integration Upgrade:**
- Migrated from Streaming Availability API to TMDb + Watchmode dual-API approach
- Expanded catalog from 250 movies to 5,976 total Netflix UK content (24x increase)
- Added complete content type support: movies, TV series, miniseries, TV movies, and specials
- Fixed all genre filtering issues by aligning frontend genre names with TMDb data
- Implemented pagination to fetch complete Netflix catalog (24 pages vs 14 movies-only)
- Enhanced poster quality using TMDb's professional movie poster service
- Maintained 24-hour database refresh cycle for data freshness

**Critical BBFC Rating Accuracy Fix (August 2025):**
- Implemented three-tier BBFC rating logic to resolve family content miscategorization
- Tier 1: Extract authentic BBFC ratings from TMDb release_dates/content_ratings endpoints
- Tier 2: Use international rating fallbacks (US MPAA, European certifications) with proper mapping
- Tier 3: Intelligent content-based defaults using genre analysis and vote averages
- Changed default rating from "18" to "15" for unknown content to maintain safeguarding balance
- Added comprehensive rating mapping including TV content ratings (TV-Y, TV-PG, TV-14, etc.)
- Verified accuracy with test suite showing proper BBFC extraction (Jack Reacher: 12A, Maleficent: PG)
- **PRODUCTION DEPLOYMENT SUCCESS (August 10, 2025):** Fixed production database with 1,001+ movies re-rated
- Successfully corrected family shows: Dragons: Race to the Edge (18→PG), Lost in Space (18→PG), Lockwood & Co (18→12), She-Ra (18→PG), The Dark Crystal (18→PG)
- Process fixed hundreds of titles with accurate BBFC ratings for commercial launch
- App now safe for families and ready for freemium launch with Stan Store integration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 18 with TypeScript, built using Vite for optimal development experience and production builds.

**UI Framework**: shadcn/ui components built on Radix UI primitives, providing accessible and customizable UI components with consistent design patterns.

**Styling**: Tailwind CSS with custom Netflix-inspired theme variables, including dark mode support and responsive design utilities.

**State Management**: 
- React Query (TanStack Query) for server state management, caching, and API synchronization
- Local React state with custom hooks for UI state management
- URL-based state persistence for filter parameters

**Routing**: Wouter for lightweight client-side routing with minimal bundle impact.

**PWA Features**: Service worker implementation for offline caching, web app manifest for installability, and optimized loading strategies.

### Backend Architecture

**Runtime**: Node.js with Express.js framework using TypeScript for type safety.

**API Design**: RESTful API endpoints with structured request/response patterns and comprehensive error handling.

**Development Setup**: Vite middleware integration for seamless full-stack development experience with hot module replacement.

### Data Storage Solutions

**Database**: PostgreSQL with Neon serverless hosting for scalable cloud database management.

**ORM**: Drizzle ORM with TypeScript-first approach, providing type-safe database operations and schema management.

**Schema Design**:
- `movies` table: Core movie data including Netflix ID, metadata, BBFC ratings, languages, and genres
- `cache_status` table: Tracks API refresh cycles and data freshness
- `users` table: Basic user management structure (prepared for future authentication features)

**Caching Strategy**: 24-hour refresh cycle for movie catalog data with status tracking to ensure data freshness while minimizing API calls.

### External Dependencies

**Primary API**: Streaming Availability API (via RapidAPI) for Netflix UK catalog data, providing comprehensive movie metadata including ratings, cast, and availability information.

**Database Hosting**: Neon PostgreSQL serverless database with WebSocket support for real-time connections.

**Development Tools**: 
- Replit integration with cartographer plugin for enhanced development experience
- ESBuild for production bundling and optimization
- PostCSS with Autoprefixer for CSS processing

**UI Component Libraries**: Extensive Radix UI component collection for accessible, unstyled UI primitives that can be styled with Tailwind CSS.

**Utility Libraries**:
- Zod for runtime type validation and schema parsing
- date-fns for date manipulation
- clsx and tailwind-merge for conditional class name handling
- Embla Carousel for interactive content sliders